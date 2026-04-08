import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sendShippedNotification } from '@/lib/email';

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

export async function POST(req: NextRequest) {
  try {
    const adminUser = await verifyAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderNumber, trackingCode, customerEmail } = await req.json();

    if (!orderNumber || !trackingCode || !customerEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await sendShippedNotification(orderNumber, trackingCode, customerEmail);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[NOTIFY-SHIPPED] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
