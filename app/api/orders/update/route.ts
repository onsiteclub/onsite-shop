import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * PATCH /api/orders/update
 * Body: { id: string, data: Record<string, any> }
 *
 * Verifies caller is an admin via session cookie, then updates
 * the order using the service-role key (bypasses RLS).
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
          get(name: string) { return cookieStore.get(name)?.value; },
          set() {},
          remove() {},
        },
      }
    );

    const { data: { user } } = await authClient.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

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
    const { id, data } = body;

    if (!id || !data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Missing id or data' }, { status: 400 });
    }

    // Whitelist allowed fields to prevent arbitrary writes
    const ALLOWED_FIELDS = [
      'status', 'staff_notes', 'tracking_code',
      'shipped_at', 'delivered_at', 'cancelled_at',
      'processing_at', 'ready_at',
    ];

    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      if (ALLOWED_FIELDS.includes(key)) {
        sanitized[key] = data[key];
      }
    }

    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // 3. Update using service-role (bypasses RLS)
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Try full update first
    const { data: updated, error } = await serviceClient
      .from('app_shop_orders')
      .update(sanitized)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // If error is about missing columns (processing_at, ready_at),
      // retry without those columns
      if (error.code === '42703') {
        const fallback: Record<string, any> = {};
        for (const [k, v] of Object.entries(sanitized)) {
          if (k !== 'processing_at' && k !== 'ready_at') {
            fallback[k] = v;
          }
        }
        if (Object.keys(fallback).length > 0) {
          const { data: retryData, error: retryError } = await serviceClient
            .from('app_shop_orders')
            .update(fallback)
            .eq('id', id)
            .select()
            .single();

          if (retryError) {
            console.error('[UPDATE-ORDER] Retry error:', retryError);
            return NextResponse.json({ error: retryError.message }, { status: 500 });
          }
          return NextResponse.json({ success: true, order: retryData });
        }
      }

      console.error('[UPDATE-ORDER] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    console.error('[UPDATE-ORDER] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update' }, { status: 500 });
  }
}
