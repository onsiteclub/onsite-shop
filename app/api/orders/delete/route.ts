import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * DELETE /api/orders/delete
 * Body: { id: string } or { ids: string[] }
 *
 * Verifies caller is an admin via session cookie, then deletes
 * the order(s) using the service-role key (bypasses RLS).
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verify the caller is an authenticated admin
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
    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check admin_users table
    const { data: admin } = await authClient
      .from('admin_users')
      .select('email')
      .eq('email', user.email)
      .single();

    if (!admin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // 2. Parse request
    const body = await req.json();
    const ids: string[] = body.ids || (body.id ? [body.id] : []);

    if (ids.length === 0) {
      return NextResponse.json({ error: 'No order IDs provided' }, { status: 400 });
    }

    // 3. Delete using service-role (bypasses RLS)
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error, count } = await serviceClient
      .from('app_shop_orders')
      .delete({ count: 'exact' })
      .in('id', ids);

    if (error) {
      console.error('[DELETE-ORDER] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: count });
  } catch (error: any) {
    console.error('[DELETE-ORDER] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete' }, { status: 500 });
  }
}
