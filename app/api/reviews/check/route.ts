import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get('order_number')

  if (!orderNumber) {
    return NextResponse.json({ notFound: true })
  }

  // Check order exists
  const { data: order } = await supabase
    .from('app_shop_orders')
    .select('order_number')
    .eq('order_number', orderNumber)
    .single()

  if (!order) {
    return NextResponse.json({ notFound: true })
  }

  // Check if already reviewed
  const { data: existing } = await supabase
    .from('app_shop_reviews')
    .select('id')
    .eq('order_number', orderNumber)
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json({ alreadyReviewed: true })
  }

  return NextResponse.json({ ok: true })
}
