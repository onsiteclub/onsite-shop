import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { STRIPE_PRODUCTS } from '@/lib/stripe-config';

const SKU_PREFIX_MAP: Record<string, keyof typeof STRIPE_PRODUCTS> = {
  'CTEE': 'cotton-tee',
  'STEE': 'sport-tee',
  'HOOD': 'hoodie',
  'CPPRM': 'cap-premium',
  'CPCLS': 'cap-classic',
  'STK': 'sticker-kit',
};

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('app_shop_products')
      .select('*, category:categories(slug)')
      .eq('is_active', true)
      .order('sort_order');

    if (error || !data || data.length === 0) {
      console.error('[api/products] Error:', error);
      return NextResponse.json({ products: [] }, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
      });
    }

    const products = data.map((p: any) => {
      const typeMatch = p.product_type ? STRIPE_PRODUCTS[p.product_type as keyof typeof STRIPE_PRODUCTS] : null;
      const skuPrefix = (p.sku || '').split('-')[0];
      const skuType = SKU_PREFIX_MAP[skuPrefix];
      const skuPrefixMatch = skuType ? STRIPE_PRODUCTS[skuType] : null;
      // Prefer known-good STRIPE_PRODUCTS priceId over DB stripe_price_id (may be stale/deleted)
      const priceId = typeMatch?.priceId || skuPrefixMatch?.priceId || p.stripe_price_id || '';

      return {
        product_key: p.sku || p.id,
        name: p.name,
        price: p.base_price ?? (typeMatch?.price || skuPrefixMatch?.price || 0) / 100,
        price_id: priceId,
        category: p.category?.slug || 'mens',
        product_type: p.product_type || skuType || '',
        image: p.primary_image || p.images?.[0] || '',
        images: p.images || [],
        description: p.description || '',
        sizes: p.sizes || [],
        colors: p.colors || [],
        color_images: p.color_images || {},
        sku: p.sku || '',
        is_featured: p.is_featured || false,
      };
    });

    return NextResponse.json({ products }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    console.error('[api/products] Error:', err);
    return NextResponse.json({ products: [] });
  }
}
