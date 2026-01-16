import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Use service role for webhook (no user context)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata;

    if (metadata?.type === 'shop_order') {
      const orderId = metadata.order_id;
      const orderNumber = metadata.order_number;

      try {
        // Update order status to paid
        if (orderId) {
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
              stripe_payment_intent_id: session.payment_intent as string,
              shipping_address: session.shipping_details?.address ? {
                name: session.shipping_details.name,
                street: session.shipping_details.address.line1,
                apartment: session.shipping_details.address.line2,
                city: session.shipping_details.address.city,
                province: session.shipping_details.address.state,
                postal_code: session.shipping_details.address.postal_code,
                country: session.shipping_details.address.country,
              } : null,
            })
            .eq('id', orderId);

          if (updateError) {
            console.error('Order update error:', updateError);
          }

          // Create order items from metadata
          if (metadata.items) {
            const items = JSON.parse(metadata.items);
            const orderItems = items.map((item: any) => ({
              order_id: orderId,
              product_id: item.product_id,
              variant_id: item.variant_id,
              product_name: item.name,
              quantity: item.quantity,
              unit_price: item.price,
              total_price: item.price * item.quantity,
            }));

            const { error: itemsError } = await supabase
              .from('order_items')
              .insert(orderItems);

            if (itemsError) {
              console.error('Order items error:', itemsError);
            }
          }
        }

        console.log(`Order ${orderNumber} marked as paid`);
      } catch (err) {
        console.error('Webhook processing error:', err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
