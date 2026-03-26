import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  STRIPE_PRODUCTS,
  FREE_SHIPPING_THRESHOLD,
  PROVINCE_SHIPPING,
  type ProductKey,
} from '@/lib/stripe-config';

// SKU prefix → STRIPE_PRODUCTS key (resolves price from any SKU)
const SKU_PREFIX_TO_PRODUCT: Record<string, ProductKey> = {
  'CTEE': 'cotton-tee',
  'STEE': 'sport-tee',
  'HOOD': 'hoodie',
  'CPPRM': 'cap-premium',
  'CPCLS': 'cap-classic',
  'STK':  'sticker-kit',
};

function resolveProduct(productKey: string, cartPriceId?: string): { priceId: string; price: number } | null {
  // 1. Direct match in STRIPE_PRODUCTS (legacy keys like 'cotton-tee')
  const direct = STRIPE_PRODUCTS[productKey as ProductKey];
  if (direct) return { priceId: direct.priceId, price: direct.price };

  // 2. SKU prefix match (e.g. 'STK-FR001' → prefix 'STK' → 'sticker-kit')
  const prefix = productKey.split('-')[0];
  const productType = SKU_PREFIX_TO_PRODUCT[prefix];
  if (productType) {
    const p = STRIPE_PRODUCTS[productType];
    return { priceId: p.priceId, price: p.price };
  }

  // 3. price_id from cart (DB products) — price unknown, use 0 for shipping calc
  if (cartPriceId && cartPriceId.startsWith('price_')) {
    return { priceId: cartPriceId, price: 0 };
  }

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

    const { items, shipping_address, customer_notes, promo_code, promo_active, promo_discount_type } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    if (!shipping_address?.province || !shipping_address?.name || !shipping_address?.street || !shipping_address?.city || !shipping_address?.postal_code) {
      return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 });
    }

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const items_detail: Array<{ sku: string; name: string; design: string; color: string; size: string; qty: number; price: number; image: string | null }> = [];
    let subtotal = 0;

    const discountType = promo_discount_type || 'item_050';
    const isPercentDiscount = promo_active && discountType.startsWith('percent_');
    const percentOff = isPercentDiscount ? parseInt(discountType.replace('percent_', '')) : 0;

    // If promo active with item_050, find the cheapest item index
    let cheapestIndex = -1;
    if (promo_active && !isPercentDiscount && items.length > 0) {
      cheapestIndex = items.reduce(
        (minIdx: number, item: any, idx: number) =>
          (item.price < items[minIdx].price ? idx : minIdx),
        0
      );
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const resolved = resolveProduct(item.product_key, item.price_id);

      if (!resolved) {
        return NextResponse.json(
          { error: `Invalid product: ${item.product_key} — could not resolve Stripe price` },
          { status: 400 }
        );
      }

      if (isPercentDiscount) {
        // Percentage discount: apply to each item
        const originalAmount = item.price || resolved.price;
        const discounted = Math.round(originalAmount * (100 - percentOff) / 100);
        const safeAmount = Math.max(discounted, 1); // at least 1 cent per item
        line_items.push({
          price_data: {
            currency: 'cad',
            product_data: { name: `${item.name} (${percentOff}% OFF)` },
            unit_amount: safeAmount,
          },
          quantity: item.quantity,
        });
      } else if (promo_active && i === cheapestIndex) {
        // item_050: cheapest item goes to $0.50
        line_items.push({
          price_data: {
            currency: 'cad',
            product_data: { name: `${item.name} (PROMO)` },
            unit_amount: 50, // $0.50 in cents
          },
          quantity: item.quantity,
        });
      } else {
        line_items.push({
          price: resolved.priceId,
          quantity: item.quantity,
        });
      }

      items_detail.push({
        sku: item.sku || item.product_key,
        name: item.name || 'Product',
        design: item.design || '',
        color: item.color,
        size: item.size,
        qty: item.quantity,
        price: item.price || resolved.price,
        image: item.image || null,
      });

      subtotal += resolved.price * item.quantity;
    }

    // Calculate shipping from province (server-side, not user-selectable)
    const isFreeShipping = promo_active || subtotal >= FREE_SHIPPING_THRESHOLD;
    const provinceData = PROVINCE_SHIPPING[shipping_address.province];
    const shippingAmount = isFreeShipping ? 0 : (provinceData?.cost ?? 1499);
    const shippingRegion = provinceData?.region ?? 'Canada';
    const shippingLabel = promo_active
      ? 'Free Shipping (promo)'
      : isFreeShipping
        ? 'Free Shipping (orders over $50)'
        : `Shipping — ${shippingRegion}`;

    const shopUrl = process.env.NEXT_PUBLIC_SHOP_URL || 'http://localhost:3001';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      // Single pre-calculated shipping option (no user choice)
      shipping_options: [{
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: shippingAmount, currency: 'cad' },
          display_name: shippingLabel,
        },
      }],
      metadata: {
        items_detail: JSON.stringify(items_detail),
        shipping_address: JSON.stringify(shipping_address),
        ...(customer_notes ? { customer_notes } : {}),
        ...(promo_code ? { promo_code } : {}),
      },
      payment_intent_data: {
        shipping: {
          name: shipping_address.name,
          address: {
            line1: shipping_address.street,
            line2: shipping_address.apartment || undefined,
            city: shipping_address.city,
            state: shipping_address.province,
            postal_code: shipping_address.postal_code,
            country: shipping_address.country || 'CA',
          },
        },
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
