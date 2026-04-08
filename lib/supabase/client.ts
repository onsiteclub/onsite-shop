import { createBrowserClient } from '@supabase/ssr'

const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Return null-safe client if env vars not configured
  if (!url || !key || url === 'sua_url_aqui') {
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Supabase not configured' } }),
        signUp: async () => ({ data: { user: null }, error: { message: 'Supabase not configured' } }),
        signInWithOAuth: async () => ({ data: { url: null }, error: { message: 'Supabase not configured' } }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: 'Supabase not configured' } }) }) }),
        update: () => ({ eq: async () => ({ error: { message: 'Supabase not configured' } }) }),
        select: () => ({ single: async () => ({ data: null, error: { message: 'Supabase not configured' } }) }),
      }),
    } as any;
  }

  if (!client) {
    client = createBrowserClient(url, key, {
      cookieOptions: isProduction
        ? { domain: '.onsiteclub.ca', sameSite: 'lax' as const, secure: true }
        : { sameSite: 'lax' as const, secure: false },
    });
  }

  return client;
}
