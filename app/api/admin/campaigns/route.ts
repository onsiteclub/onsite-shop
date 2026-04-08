import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Resend } from 'resend';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY not configured');
  return new Resend(key);
}

const FROM_EMAIL = 'OnSite Club <contact@onsiteclub.ca>';

/** Verify caller is an authenticated admin via session cookie */
async function verifyAdmin() {
  const cookieStore = cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await authClient.auth.getUser();
  if (!user?.email) return null;

  const { data: admin } = await authClient
    .from('admin_users')
    .select('email')
    .eq('email', user.email)
    .single();

  return admin ? user : null;
}

// GET — list all subscribers (auth users with emails)
export async function GET() {
  try {
    const user = await verifyAdmin();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = getServiceClient();
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const subscribers = (data.users || [])
      .filter((u) => u.email)
      .map((u) => ({
        id: u.id,
        email: u.email!,
        first_name: u.user_metadata?.first_name || '',
        last_name: u.user_metadata?.last_name || '',
        created_at: u.created_at,
      }));

    return NextResponse.json({ subscribers, total: subscribers.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — send a campaign email to selected subscribers
export async function POST(req: NextRequest) {
  try {
    const user = await verifyAdmin();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { subject, htmlContent, recipients } = body as {
      subject: string;
      htmlContent: string;
      recipients: string[];
    };

    if (!subject || !htmlContent || !recipients?.length) {
      return NextResponse.json(
        { error: 'Missing subject, htmlContent, or recipients' },
        { status: 400 }
      );
    }

    const resend = getResend();
    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const email of recipients) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject,
          html: wrapEmailHtml(subject, htmlContent),
        });
        results.push({ email, success: true });
      } catch (err: any) {
        results.push({ email, success: false, error: err.message });
      }
    }

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({ sent, failed, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function wrapEmailHtml(subject: string, content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #F5F3EF; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <img src="https://shop.onsiteclub.ca/assets/logo-onsite-club.png" alt="OnSite Club" style="height: 48px; width: auto; margin-bottom: 8px;" />
      <p style="color: #6B7280; font-size: 13px; margin: 0; letter-spacing: 2px; text-transform: uppercase;">Built For Those Who Build</p>
    </div>

    <!-- Content Card -->
    <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h1 style="color: #1B2B27; font-size: 22px; margin: 0 0 16px; font-weight: 700;">${subject}</h1>
      <div style="color: #374151; font-size: 15px; line-height: 1.7;">
        ${content}
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px;">
      <a href="https://shop.onsiteclub.ca" style="display: inline-block; background: #1B2B27; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;">
        Visit Store
      </a>
      <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px;">
        OnSite Club &mdash; Construction Community in Canada<br/>
        <a href="mailto:contact@onsiteclub.ca" style="color: #9CA3AF;">contact@onsiteclub.ca</a>
      </p>
    </div>

  </div>
</body>
</html>`;
}
