import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const isProduction = process.env.NODE_ENV === 'production';
const cookieDomain = isProduction ? '.onsiteclub.ca' : undefined;

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const returnUrl = searchParams.get('return') || '/';

  if (code) {
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, {
                  ...options,
                  ...(cookieDomain && { domain: cookieDomain }),
                })
              );
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${returnUrl}`);
    }
  }

  // Redirect to auth hub on failure
  const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'https://auth.onsiteclub.ca';
  return NextResponse.redirect(`${authUrl}/login?error=auth_failed`);
}
