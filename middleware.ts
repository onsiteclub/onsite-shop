import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const isProduction = process.env.NODE_ENV === 'production'
const cookieDomain = isProduction ? '.onsiteclub.ca' : undefined
const AUTH_LOGIN_URL = process.env.NEXT_PUBLIC_AUTH_URL
  ? `${process.env.NEXT_PUBLIC_AUTH_URL}/login`
  : 'https://auth.onsiteclub.ca/login'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              ...(cookieDomain && { domain: cookieDomain }),
            })
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname

  // Only call Supabase auth for protected/admin routes (saves API quota on public pages)
  if (isProtectedRoute(pathname)) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const loginUrl = new URL(AUTH_LOGIN_URL)
      loginUrl.searchParams.set('return_to', request.nextUrl.href)
      return NextResponse.redirect(loginUrl)
    }

    // Admin routes — verify admin status
    if (pathname.startsWith('/admin')) {
      const { data: admin } = await supabase
        .from('admin_users')
        .select('email')
        .eq('email', user.email!)
        .single()

      if (!admin) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    }
  }

  // Security headers
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
  supabaseResponse.headers.set('X-Frame-Options', 'DENY')
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  supabaseResponse.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )

  return supabaseResponse
}

function isProtectedRoute(pathname: string): boolean {
  return pathname.startsWith('/account') || pathname.startsWith('/admin')
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm)$).*)',
  ],
}
