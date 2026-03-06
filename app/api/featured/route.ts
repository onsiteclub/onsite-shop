import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch active shop products (exclude members)
    const { data, error } = await supabase
      .from('app_shop_products')
      .select('*, category:categories(slug)')
      .eq('is_active', true)
      .order('sort_order')
      .limit(6);

    if (error || !data) {
      return NextResponse.json({ products: [] });
    }

    // Filter out members products, use base_price from DB
    const products = data
      .filter((p: any) => p.category?.slug !== 'members')
      .slice(0, 3)
      .map((p: any) => ({
        name: p.name,
        price: p.base_price ?? 0,
        image: p.primary_image || p.images?.[0] || null,
        url: 'https://shop.onsiteclub.ca',
      }));

    return NextResponse.json(
      { products },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch {
    return NextResponse.json({ products: [] });
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
