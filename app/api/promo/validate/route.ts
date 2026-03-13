import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { code } = await req.json()

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ valid: false, error: 'No code provided' })
  }

  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .single()

  if (error || !data) {
    return NextResponse.json({ valid: false, error: 'Code not found' })
  }

  if (data.used_at) {
    return NextResponse.json({ valid: false, error: 'Code already used' })
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: 'Code expired' })
  }

  return NextResponse.json({
    valid: true,
    code: data.code,
    discount: {
      oneItemPrice: 0.50,
      freeShipping: true,
    },
  })
}
