import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

/**
 * Stripe Webhook Handler
 *
 * Events handled:
 * - checkout.session.completed → Update order to 'paid', create order_items
 * - payment_intent.payment_failed → Update order to 'cancelled'
 *
 * Tables used (schema by Blue):
 * - orders
 * - order_items
 */

export async function POST(request: NextRequest) {
  // Validate environment
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Missing Stripe environment variables');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase environment variables');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  });

  // Use service role for webhook (no user context)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`Webhook received: ${event.type}`);

  // ============================================
  // checkout.session.completed
  // ============================================
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata;

    if (metadata?.type === 'shop_order') {
      const orderId = metadata.order_id;
      const orderNumber = metadata.order_number;
      const userId = metadata.user_id;

      try {
        // Get shipping details from Stripe session
        const shippingDetails = (session as any).collected_information?.shipping_details
          || (session as any).shipping_details;

        const shippingAddress = shippingDetails?.address ? {
          name: shippingDetails.name,
          street: shippingDetails.address.line1,
          apartment: shippingDetails.address.line2 || null,
          city: shippingDetails.address.city,
          province: shippingDetails.address.state,
          postal_code: shippingDetails.address.postal_code,
          country: shippingDetails.address.country,
        } : null;

        if (orderId) {
          // Update existing order
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
              stripe_session_id: session.id,
              stripe_payment_intent_id: session.payment_intent as string,
              shipping_address: shippingAddress,
            })
            .eq('id', orderId);

          if (updateError) {
            console.error('Order update error:', updateError);
          }
        } else {
          // Create order if it doesn't exist (fallback)
          const items = metadata.items ? JSON.parse(metadata.items) : [];
          const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
          const shipping = session.amount_total ? (session.amount_total / 100) - subtotal : 0;

          const { data: newOrder, error: createError } = await supabase
            .from('orders')
            .insert({
              user_id: userId || null,
              order_number: orderNumber,
              status: 'paid',
              subtotal: subtotal,
              shipping: shipping > 0 ? shipping : 0,
              tax: 0,
              total: session.amount_total ? session.amount_total / 100 : subtotal,
              paid_at: new Date().toISOString(),
              stripe_session_id: session.id,
              stripe_payment_intent_id: session.payment_intent as string,
              shipping_address: shippingAddress,
            })
            .select('id')
            .single();

          if (createError) {
            console.error('Order creation error:', createError);
          } else if (newOrder) {
            // Use the new order ID for items
            const finalOrderId = newOrder.id;

            // Create order items
            if (metadata.items) {
              const orderItems = items.map((item: any) => ({
                order_id: finalOrderId,
                product_id: item.product_id || null,
                variant_id: item.variant_id || null,
                product_name: item.name,
                quantity: item.quantity,
                unit_price: item.price,
                total_price: item.price * item.quantity,
                size: item.size || null,
                color: item.color || null,
              }));

              const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

              if (itemsError) {
                console.error('Order items error:', itemsError);
              }
            }

            console.log(`Order ${orderNumber} created and marked as paid`);
            return NextResponse.json({ received: true });
          }
        }

        // Create order items for existing order
        if (orderId && metadata.items) {
          const items = JSON.parse(metadata.items);
          const orderItems = items.map((item: any) => ({
            order_id: orderId,
            product_id: item.product_id || null,
            variant_id: item.variant_id || null,
            product_name: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity,
            size: item.size || null,
            color: item.color || null,
          }));

          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

          if (itemsError) {
            console.error('Order items error:', itemsError);
          }
        }

        console.log(`Order ${orderNumber} marked as paid`);
      } catch (err) {
        console.error('Webhook processing error:', err);
      }
    }
  }

  // ============================================
  // payment_intent.payment_failed
  // ============================================
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const metadata = paymentIntent.metadata;

    if (metadata?.type === 'shop_order' && metadata.order_id) {
      try {
        const { error } = await supabase
          .from('orders')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
          })
          .eq('id', metadata.order_id);

        if (error) {
          console.error('Order cancellation error:', error);
        } else {
          console.log(`Order ${metadata.order_number} cancelled due to payment failure`);
        }
      } catch (err) {
        console.error('Payment failed webhook error:', err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
