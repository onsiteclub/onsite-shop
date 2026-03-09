import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  STRIPE_PRODUCTS,
  SHIPPING_OPTIONS,
  FREE_SHIPPING_OPTION,
  FREE_SHIPPING_THRESHOLD,
  type ProductKey,
} from '@/lib/stripe-config';

// SKU prefix → STRIPE_PRODUCTS key (resolves price from any SKU)
const SKU_PREFIX_TO_PRODUCT: Record<string, ProductKey> = {
  'CTEE': 'cotton-tee',
  'STEE': 'sport-tee',
  'HOOD': 'hoodie',
  'CAP':  'cap',
  'STK':  'sticker-kit',
};

function resolvePriceId(productKey: string, cartPriceId?: string): string | null {
  // 1. price_id from cart (set by shop page from DB)
  if (cartPriceId && cartPriceId.startsWith('price_')) return cartPriceId;

  // 2. Direct match in STRIPE_PRODUCTS (legacy keys like 'cotton-tee')
  const direct = STRIPE_PRODUCTS[productKey as ProductKey];
  if (direct) return direct.priceId;

  // 3. SKU prefix match (e.g. 'STK-FR001' → prefix 'STK' → 'sticker-kit')
  const prefix = productKey.split('-')[0];
  const productType = SKU_PREFIX_TO_PRODUCT[prefix];
  if (productType) return STRIPE_PRODUCTS[productType].priceId;

  return null;
}

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

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const items_detail: Array<{ sku: string; name: string; design: string; color: string; size: string; qty: number }> = [];
    let subtotal = 0;

    for (const item of items) {
      const priceId = resolvePriceId(item.product_key, item.price_id);

      if (!priceId) {
        return NextResponse.json(
          { error: `Invalid product: ${item.product_key} — could not resolve Stripe price` },
          { status: 400 }
        );
      }

      line_items.push({
        price: priceId,
        quantity: item.quantity,
      });

      items_detail.push({
        sku: item.sku || item.product_key,
        name: item.name || 'Product',
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
