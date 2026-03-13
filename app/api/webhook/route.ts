import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { sendOrderConfirmationToCustomer, sendNewOrderToAdmin } from '@/lib/email';

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Server config error' }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('[WEBHOOK] Signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`[WEBHOOK] ${event.type}`);

  if (event.type === 'checkout.session.completed') {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        event.data.object.id,
        { expand: ['line_items.data.price.product'] }
      );

      const itemsDetail = session.metadata?.items_detail
        ? JSON.parse(session.metadata.items_detail)
        : [];

      // Address: prefer metadata (new flow), fallback to Stripe-collected (old orders)
      let shippingAddress = null;
      if (session.metadata?.shipping_address) {
        shippingAddress = JSON.parse(session.metadata.shipping_address);
      } else {
        const shippingDetails = (session as any).collected_information?.shipping_details
          || (session as any).shipping_details;
        if (shippingDetails?.address) {
          shippingAddress = {
            name: shippingDetails.name,
            street: shippingDetails.address.line1,
            apartment: shippingDetails.address.line2 || null,
            city: shippingDetails.address.city,
            province: shippingDetails.address.state,
            postal_code: shippingDetails.address.postal_code,
            country: shippingDetails.address.country,
          };
        }
      }

      const customerEmail = session.customer_details?.email || null;
      const customerNotes = session.metadata?.customer_notes || null;
      const amountTotal = session.amount_total || 0;
      const shippingCost = (session as any).shipping_cost?.amount_total || 0;
      const orderNumber = `OS-${Date.now().toString(36).toUpperCase()}`;

      // A) Save order to Supabase
      // NOTE: subtotal/shipping/tax are legacy columns from the old schema
      // that have NOT NULL constraints. We populate them to avoid INSERT failures.
      const subtotalCents = amountTotal - shippingCost;
      const { error: orderError } = await supabase
        .from('app_shop_orders')
        .insert({
          order_number: orderNumber,
          status: 'paid',
          email: customerEmail,
          items: itemsDetail,
          shipping_address: shippingAddress,
          customer_notes: customerNotes,
          total: amountTotal,
          subtotal: subtotalCents,
          shipping: shippingCost,
          shipping_cost: shippingCost,
          stripe_session_id: session.id,
          created_at: new Date().toISOString(),
        });

      if (orderError) {
        console.error('[WEBHOOK] Order save error:', orderError);
      } else {
        console.log(`[WEBHOOK] Order ${orderNumber} saved`);
      }

      // B) Consume promo code if used
      const promoCode = session.metadata?.promo_code;
      if (promoCode) {
        try {
          const shopUrl = process.env.NEXT_PUBLIC_SHOP_URL || 'https://shop.onsiteclub.ca';
          await fetch(`${shopUrl}/api/promo/consume`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-secret': process.env.ADMIN_SECRET!,
            },
            body: JSON.stringify({
              code: promoCode,
              orderId: session.id,
              ip: req.headers.get('x-forwarded-for') ?? 'unknown',
            }),
          });
          console.log(`[WEBHOOK] Promo code ${promoCode} consumed for order ${orderNumber}`);
        } catch (promoErr) {
          console.error('[WEBHOOK] Promo consume error:', promoErr);
        }
      }

      // C) Send email notifications
      const lineItemNames = session.line_items?.data.map((li: any) => {
        const product = li.price?.product;
        return product?.name || li.description || 'Product';
      }) || [];

      const emailItems = itemsDetail.map((item: any, idx: number) => ({
        name: item.name || lineItemNames[idx] || 'Product',
        sku: item.sku || '',
        design: item.design || '',
        quantity: item.qty,
        price: (session.line_items?.data[idx]?.amount_total || 0) / 100 / (item.qty || 1),
        size: item.size,
        color: item.color,
      }));

      const emailData = {
        orderNumber,
        items: emailItems,
        subtotal: (amountTotal - shippingCost) / 100,
        shipping: shippingCost / 100,
        total: amountTotal / 100,
        shippingAddress,
        customerEmail: customerEmail || undefined,
        stripeSessionId: session.id,
      };

      try {
        const emailPromises: Promise<void>[] = [];
        if (customerEmail) {
          emailPromises.push(sendOrderConfirmationToCustomer(emailData, customerEmail));
        }
        emailPromises.push(sendNewOrderToAdmin(emailData));
        await Promise.allSettled(emailPromises);
      } catch (emailError) {
        console.error('[WEBHOOK] Email error:', emailError);
      }
    } catch (err) {
      console.error('[WEBHOOK] Processing error:', err);
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    console.error(`[WEBHOOK] Payment failed: ${paymentIntent.id}`);
  }

  return NextResponse.json({ received: true });
}
