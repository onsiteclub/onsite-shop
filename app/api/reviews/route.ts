import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const ALLOWED_ORIGINS = [
  'https://onsiteclub.ca',
  'https://www.onsiteclub.ca',
]

function corsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}

// OPTIONS — CORS preflight
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin')
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) })
}

// GET — fetch approved reviews (public, CORS enabled for onsiteclub.ca)
export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin')

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('app_shop_reviews')
    .select('id, customer_name, rating, title, comment, product_names, created_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500, headers: corsHeaders(origin) })
  }

  return NextResponse.json({ reviews: data }, { headers: corsHeaders(origin) })
}

// POST — submit a new review (public)
export async function POST(req: NextRequest) {
  // Rate limit: 5 reviews per hour per IP
  const ip = getClientIp(req.headers)
  const rl = rateLimit(ip, 'review-submit', { limit: 5, windowSeconds: 3600 })
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many reviews. Try again later.' }, { status: 429 })
  }

  const body = await req.json()
  const { order_number, customer_name, email, rating, title, comment } = body

  if (!order_number || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Order number and rating (1-5) are required' }, { status: 400 })
  }

  // Verify order exists
  const supabase = getServiceClient()
  const { data: order, error: orderError } = await supabase
    .from('app_shop_orders')
    .select('order_number, items, email')
    .eq('order_number', order_number)
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Check if review already submitted for this order
  const { data: existing } = await supabase
    .from('app_shop_reviews')
    .select('id')
    .eq('order_number', order_number)
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'A review has already been submitted for this order' }, { status: 409 })
  }

  // Extract product names from order items
  const productNames = (order.items || []).map((item: any) => item.name || 'Product')

  const { error: insertError } = await supabase
    .from('app_shop_reviews')
    .insert({
      order_number,
      customer_name: customer_name || 'Anonymous',
      email: email || order.email || null,
      rating,
      title: title || null,
      comment: comment || null,
      product_names: productNames,
    })

  if (insertError) {
    console.error('[reviews] Insert error:', insertError)
    return NextResponse.json({ error: 'Failed to save review' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
