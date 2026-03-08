import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  STRIPE_PRODUCTS,
  SHIPPING_OPTIONS,
  FREE_SHIPPING_OPTION,
  FREE_SHIPPING_THRESHOLD,
  type ProductKey,
} from '@/lib/stripe-config';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    });

    const { items } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Build line_items — use price_id from cart (set when product was loaded from DB)
    // Falls back to STRIPE_PRODUCTS lookup by product_key for legacy products
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const items_detail: Array<{ sku: string; name: string; design: string; color: string; size: string; qty: number }> = [];
    let subtotal = 0;

    for (const item of items) {
      // Try price_id from cart first (DB products), then fall back to STRIPE_PRODUCTS lookup (legacy)
      const legacyProduct = STRIPE_PRODUCTS[item.product_key as ProductKey];
      const priceId = item.price_id || legacyProduct?.priceId;

      if (!priceId || !priceId.startsWith('price_')) {
        return NextResponse.json(
          { error: `Invalid product: ${item.product_key} — missing Stripe price` },
          { status: 400 }
        );
      }

      line_items.push({
        price: priceId,
        quantity: item.quantity,
      });

      items_detail.push({
        sku: item.sku || legacyProduct?.sku || item.product_key,
        name: item.name || legacyProduct?.name || 'Product',
        design: item.design || '',
        color: item.color,
        size: item.size,
        qty: item.quantity,
      });

      subtotal += item.price * item.quantity;
    }

    // Shipping options (free shipping if above threshold)
    const shipping_options = subtotal >= FREE_SHIPPING_THRESHOLD
      ? [FREE_SHIPPING_OPTION, ...SHIPPING_OPTIONS]
      : [...SHIPPING_OPTIONS];

    const shopUrl = process.env.NEXT_PUBLIC_SHOP_URL || 'http://localhost:3001';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      shipping_address_collection: {
        allowed_countries: ['CA'],
      },
      shipping_options,
      metadata: {
        items_detail: JSON.stringify(items_detail),
      },
      success_url: `${shopUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${shopUrl}/cart`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Checkout failed' },
      { status: 500 }
    );
  }
}
