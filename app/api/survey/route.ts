import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { sessionId, q1, q2, q3, q4, promoUsed, cartValue } = body

  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 16)

  const supabase = getServiceClient()
  const { error } = await supabase.from('pre_checkout_responses').insert({
    session_id: sessionId,
    q1_satisfaction: q1 ?? null,
    q2_design: q2 ?? null,
    q3_recommend: q3 ?? null,
    q4_comments: q4 ?? null,
    promo_used: promoUsed ?? false,
    cart_value: cartValue ?? null,
    ip_hash: ipHash,
  })

  if (error) {
    console.error('[survey] DB error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
