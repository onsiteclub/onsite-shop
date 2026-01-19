import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sua_sk_key_aqui') {
      return NextResponse.json(
        { error: 'Stripe não configurado. Adicione STRIPE_SECRET_KEY no .env.local' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    });

    const { items, subtotal, shipping, total } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Carrinho vazio' }, { status: 400 });
    }

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const isSupabaseConfigured = supabaseUrl && supabaseKey &&
      supabaseUrl !== 'sua_url_aqui' &&
      supabaseUrl.startsWith('http');

    let user = null;
    let order = null;
    let orderNumber = `OS-${Date.now().toString(36).toUpperCase()}`;

    if (isSupabaseConfigured) {
      // Get user from Supabase if logged in
      const cookieStore = cookies();
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Server Component
            }
          },
        },
      });

      const { data } = await supabase.auth.getUser();
      user = data.user;

      // Create order in Supabase (orders - schema by Blue)
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null,
          order_number: orderNumber,
          status: 'pending',
          subtotal,
          shipping,
          tax: 0,
          total,
        })
        .select('id')
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        // Continue without order - webhook will handle
      } else {
        order = orderData;
      }
    }

    // Create line items for Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item: any) => ({
      price_data: {
        currency: 'cad',
        product_data: {
          name: item.name,
          description: item.color && item.size ? `${item.color} - ${item.size}` : undefined,
          images: item.image && item.image.startsWith('http') ? [item.image] : undefined,
        },
        unit_amount: Math.round(item.price * 100), // Stripe uses cents
      },
      quantity: item.quantity,
    }));

    // Add shipping as line item if not free
    if (shipping > 0) {
      lineItems.push({
        price_data: {
          currency: 'cad',
          product_data: {
            name: 'Shipping',
            description: 'Standard delivery to Canada',
          },
          unit_amount: Math.round(shipping * 100),
        },
        quantity: 1,
      });
    }

    // Create Stripe checkout session
    const shopUrl = process.env.NEXT_PUBLIC_SHOP_URL || 'http://localhost:3003';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${shopUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${shopUrl}/cart`,
      customer_email: user?.email || undefined,
      shipping_address_collection: {
        allowed_countries: ['CA'],
      },
      metadata: {
        order_id: order?.id || '',
        order_number: orderNumber,
        user_id: user?.id || '',
        type: 'shop_order',
        items: JSON.stringify(items.map((i: any) => ({
          product_id: i.product_id,
          variant_id: i.variant_id,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          size: i.size,
          color: i.color,
        }))),
      },
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao criar checkout' },
      { status: 500 }
    );
  }
}
