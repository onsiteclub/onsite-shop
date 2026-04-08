import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const isProduction = process.env.NODE_ENV === 'production'
const cookieDomain = isProduction ? '.onsiteclub.ca' : undefined

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                ...(cookieDomain && { domain: cookieDomain }),
              })
            )
          } catch {
            // Called from a Server Component — middleware handles refresh
          }
        },
      },
    }
  )
}
