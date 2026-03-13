import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { generatePromoCode } from '@/lib/promo/generateCode'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get('x-admin-secret')
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { email, phone, notes, expiresInDays } = body

  if (!email && !phone) {
    return NextResponse.json({ error: 'Email or phone required' }, { status: 400 })
  }

  const code = generatePromoCode()

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null

  const { error: dbError } = await supabase.from('promo_codes').insert({
    code,
    email: email ?? null,
    phone: phone ?? null,
    notes: notes ?? null,
    expires_at: expiresAt,
  })

  if (dbError) {
    console.error('[promo/generate] DB error:', dbError)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (email) {
    const shopUrl = process.env.NEXT_PUBLIC_SHOP_URL || 'https://shop.onsiteclub.ca'
    const fromEmail = process.env.SHOP_ADMIN_EMAIL || 'dev@onsiteclub.ca'

    const { error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Your OnSite Club promo code — grab anything for $0.10',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; background: #f4f3ef; padding: 40px;">
          <div style="max-width: 480px; margin: 0 auto; background: #1B2B27; border-radius: 12px; padding: 40px;">
            <h1 style="color: #B8860B; font-size: 28px; margin-bottom: 8px;">OnSite Club</h1>
            <p style="color: #9FE1CB; font-size: 14px; margin-bottom: 32px;">Built for those who build</p>
            <p style="color: #ffffff; font-size: 16px; line-height: 1.6;">
              Here's your exclusive promo code. Use it at checkout to get
              <strong style="color: #B8860B;">any one item for $0.10 CAD</strong> — plus free shipping on your entire order.
            </p>
            <div style="background: #B8860B; border-radius: 8px; padding: 20px; text-align: center; margin: 32px 0;">
              <span style="font-size: 28px; font-weight: 700; color: #1B2B27; letter-spacing: 4px;">${code}</span>
            </div>
            <p style="color: #9FE1CB; font-size: 13px; margin-bottom: 24px;">
              One-time use only. ${expiresAt ? `Expires ${new Date(expiresAt).toLocaleDateString('en-CA')}.` : 'No expiry.'}
              Free shipping applies to your entire cart.
            </p>
            <a href="${shopUrl}" style="display: block; background: #B8860B; color: #1B2B27; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 8px; font-weight: 700; font-size: 16px;">
              Shop Now
            </a>
          </div>
        </body>
        </html>
      `,
    })

    if (emailError) {
      console.error('[promo/generate] Email error:', emailError)
    }
  }

  return NextResponse.json({ success: true, code })
}
