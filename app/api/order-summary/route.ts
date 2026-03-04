import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id');

  if (!sessionId || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price.product'],
    });

    const items = session.line_items?.data.map((li: any) => ({
      name: li.price?.product?.name || li.description || 'Product',
      quantity: li.quantity,
      amount: li.amount_total,
    })) || [];

    const shipping = (session as any).collected_information?.shipping_details
      || (session as any).shipping_details;

    return NextResponse.json({
      email: session.customer_details?.email || null,
      items,
      subtotal: (session.amount_total || 0) - ((session as any).shipping_cost?.amount_total || 0),
      shipping_cost: (session as any).shipping_cost?.amount_total || 0,
      total: session.amount_total || 0,
      shipping_name: shipping?.name || null,
      shipping_address: shipping?.address ? {
        line1: shipping.address.line1,
        line2: shipping.address.line2,
        city: shipping.address.city,
        state: shipping.address.state,
        postal_code: shipping.address.postal_code,
        country: shipping.address.country,
      } : null,
    });
  } catch (err: any) {
    console.error('Order summary error:', err);
    return NextResponse.json({ error: 'Failed to load order' }, { status: 500 });
  }
}
