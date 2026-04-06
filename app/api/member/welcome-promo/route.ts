import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generatePromoCode } from '@/lib/promo/generateCode';

export async function POST() {
  // 1. Auth check via cookies
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = user.email.toLowerCase();

  // 2. Service-role client for promo_codes table (RLS: service_role only)
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 3. Check if welcome promo already exists for this email
  const { data: existing } = await supabaseAdmin
    .from('promo_codes')
    .select('code')
    .eq('email', email)
    .eq('notes', 'welcome_promo')
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ code: existing.code, alreadyExists: true });
  }

  // 4. Generate and insert
  const code = generatePromoCode();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error: dbError } = await supabaseAdmin.from('promo_codes').insert({
    code,
    email,
    notes: 'welcome_promo',
    discount_type: 'percent_10',
    expires_at: expiresAt,
    created_by: 'system',
  });

  if (dbError) {
    console.error('[welcome-promo] DB error:', dbError);
    return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 });
  }

  // 5. Send email via Resend (non-blocking — code is already created)
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const shopUrl = process.env.NEXT_PUBLIC_SHOP_URL || 'https://shop.onsiteclub.ca';

    await resend.emails.send({
      from: 'OnSite Club <contact@onsiteclub.ca>',
      to: email,
      subject: 'Welcome to OnSite Club — Your 10% Off Code',
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
              Welcome to the crew! Here is your personal code. Enter it at checkout to get <strong style="color: #B8860B;">10% off your order</strong> with free shipping.
            </p>
            <div style="background: #B8860B; border-radius: 8px; padding: 20px; text-align: center; margin: 32px 0;">
              <span style="font-size: 28px; font-weight: 700; color: #1B2B27; letter-spacing: 4px;">${code}</span>
            </div>
            <p style="color: #9FE1CB; font-size: 13px; margin-bottom: 24px;">
              Single use. Valid until ${new Date(expiresAt).toLocaleDateString('en-CA')}.
            </p>
            <a href="${shopUrl}" style="display: block; background: #B8860B; color: #1B2B27; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 8px; font-weight: 700; font-size: 16px;">
              Visit Store
            </a>
            <p style="color: #6B7280; font-size: 11px; margin-top: 32px; text-align: center;">
              OnSite Club &bull; onsiteclub.ca<br/>
              You received this because you joined OnSite Club.
            </p>
          </div>
        </body>
        </html>
      `,
    });
  } catch (emailErr) {
    console.error('[welcome-promo] Email error:', emailErr);
  }

  return NextResponse.json({ code, alreadyExists: false });
}
