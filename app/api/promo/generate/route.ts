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
  const { email, notes, expiresInDays, discountType } = body

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const code = generatePromoCode()

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null

  const { error: dbError } = await supabase.from('promo_codes').insert({
    code,
    email: email ?? null,
    notes: notes ?? null,
    discount_type: discountType || 'item_050',
    expires_at: expiresAt,
  })

  if (dbError) {
    console.error('[promo/generate] DB error:', dbError)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  const dt = discountType || 'item_050'
  const discountLabel = dt === 'item_050'
    ? 'any one item for $0.50 CAD'
    : `${dt.replace('percent_', '')}% off your order`

  if (email) {
    const shopUrl = process.env.NEXT_PUBLIC_SHOP_URL || 'https://shop.onsiteclub.ca'
    const { error: emailError } = await resend.emails.send({
      from: 'OnSite Club <contact@onsiteclub.ca>',
      to: email,
      subject: 'Your OnSite Club code is ready',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; background: #f4f3ef; padding: 40px; margin: 0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="https://shop.onsiteclub.ca/assets/logo-onsite-club.png" alt="OnSite Club" style="height: 48px; width: auto; margin-bottom: 8px;" />
            <p style="color: #6B7280; font-size: 13px; margin: 0; letter-spacing: 2px; text-transform: uppercase;">Built For Those Who Build</p>
          </div>
          <div style="max-width: 480px; margin: 0 auto; background: #1B2B27; border-radius: 12px; padding: 40px;">
            <p style="color: #ffffff; font-size: 16px; line-height: 1.6;">
              Here is your personal code. Enter it at checkout to get <strong style="color: #B8860B;">${discountLabel}</strong> with free shipping.
            </p>
            <div style="background: #B8860B; border-radius: 8px; padding: 20px; text-align: center; margin: 32px 0;">
              <span style="font-size: 28px; font-weight: 700; color: #1B2B27; letter-spacing: 4px;">${code}</span>
            </div>
            <p style="color: #9FE1CB; font-size: 13px; margin-bottom: 24px;">
              Single use. ${expiresAt ? `Valid until ${new Date(expiresAt).toLocaleDateString('en-CA')}.` : 'No expiry.'}
            </p>
            <a href="${shopUrl}" style="display: block; background: #B8860B; color: #1B2B27; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 8px; font-weight: 700; font-size: 16px;">
              Visit Store
            </a>
            <p style="color: #6B7280; font-size: 11px; margin-top: 32px; text-align: center;">
              OnSite Club &bull; onsiteclub.ca<br/>
              You received this because a code was created for you.
            </p>
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
