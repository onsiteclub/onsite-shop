import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-internal-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { code, orderId, ip } = await req.json()

  const supabase = getServiceClient()
  const { error } = await supabase
    .from('promo_codes')
    .update({
      used_at: new Date().toISOString(),
      order_id: orderId,
      used_by_ip: ip,
    })
    .eq('code', code)
    .is('used_at', null)

  if (error) {
    console.error('[promo/consume] Error:', error)
    return NextResponse.json({ error: 'Failed to consume code' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
