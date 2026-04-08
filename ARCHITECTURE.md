# OnSite Club — Centralized Identity & Authentication Architecture

> **Document Version:** 2.0
> **Date:** 2026-04-07
> **Author:** Auth Hub (HERMES)
> **Status:** Approved Architecture — Implementation Ready
> **Audience:** All OnSite app agents (Shop, Dashboard, Learn, Tech, Website)

---

## 1. Mission Statement

Auth Hub (`auth.onsiteclub.ca`) is the **single source of truth for user identity** across the entire OnSite Club ecosystem. It owns authentication, session management, and account lifecycle. It does NOT own business logic, payment processing, or application data.

This follows the industry-standard **Centralized Identity, Decentralized Payments** pattern used by Google (accounts.google.com), Microsoft (login.microsoft.com), and Apple (appleid.apple.com).

> *"In microservices, each service is designed to handle a single concern. This allows teams to develop, deploy, and scale services independently."*
> — [Microservices Authentication, Permify (2025)](https://permify.co/post/microservices-authentication/)

> *"Separation of concerns ensures that transaction processing, user authentication, and data storage are handled by distinct components, each with specific security measures, reducing the risk of data breaches."*
> — [SoC in Software Architecture for Security](https://codeist.pl/2024/06/23/the-importance-of-separation-of-concerns-in-software-architecture-for-security-and-safety/)

---

## 2. Ecosystem Map

```
                        ┌─────────────────────────────┐
                        │    auth.onsiteclub.ca        │
                        │    IDENTITY PROVIDER         │
                        │                              │
                        │  - Login / Signup / Logout   │
                        │  - Password Reset / MFA      │
                        │  - Google Sign-In            │
                        │  - Session (cookie)          │
                        │  - Account Deletion          │
                        │  - PIPEDA Compliance         │
                        │  - Subscription Gateway      │
                        └──────────────┬───────────────┘
                                       │
                  Cookie: .onsiteclub.ca (HttpOnly, Secure, SameSite=Lax)
                                       │
       ┌───────────────┬───────────────┼───────────────┬───────────────┐
       ▼               ▼               ▼               ▼               ▼
┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
│ dashboard  │  │   shop     │  │   learn    │  │   tech     │  │  website   │
│ .onsite    │  │ .onsite    │  │ .onsite    │  │ .onsite    │  │  .onsite   │
│ club.ca    │  │ club.ca    │  │ club.ca    │  │ club.ca    │  │  club.ca   │
│            │  │            │  │            │  │            │  │            │
│ Unified    │  │ E-commerce │  │ Courses &  │  │ Apps &     │  │ Marketing  │
│ Client     │  │ Store      │  │ Certs      │  │ Services   │  │ Hub        │
│ Area       │  │            │  │ Wallet     │  │ Landing    │  │            │
│            │  │ OWN Stripe │  │            │  │            │  │ No Auth    │
│ Reads all  │  │ checkout   │  │ OWN future │  │ No Auth    │  │            │
│ app data   │  │            │  │ payments   │  │            │  │            │
└────────────┘  └────────────┘  └────────────┘  └────────────┘  └────────────┘
```

### Domain Registry

| Domain | App | Auth Required | Has Own Payments | Status |
|--------|-----|---------------|------------------|--------|
| `onsiteclub.ca` | Website | No | No | Live |
| `auth.onsiteclub.ca` | Auth Hub | N/A (is the auth) | Subscription gateway | Reactivating |
| `dashboard.onsiteclub.ca` | Dashboard | Yes | No | Live |
| `shop.onsiteclub.ca` | Shop | Optional* | Yes (Stripe) | Live |
| `learn.onsiteclub.ca` | Learn | Wallet only | No (future) | Live |
| `tech.onsiteclub.ca` | Tech | No | No | Live |

*Shop: browsing is public, checkout requires account.

---

## 3. Single Supabase Project

### The Foundation

**ALL apps MUST use the same Supabase project.** Without this, there is no unified identity.

| Parameter | Value |
|-----------|-------|
| **Project URL** | `https://bjkhofdrzpczgnwxoauk.supabase.co` |
| **Auth Provider** | Supabase Auth (GoTrue) |
| **Session Storage** | HttpOnly cookies on `.onsiteclub.ca` |

### Current State & Migration Required

| App | Current Supabase Project | Target | Action |
|-----|-------------------------|--------|--------|
| **Shop** | `bjkhofdrzpczgnwxoauk` | `bjkhofdrzpczgnwxoauk` | Already correct |
| **Learn** | `bjkhofdrzpczgnwxoauk` | `bjkhofdrzpczgnwxoauk` | Already correct |
| **Dashboard** | `xmpckuiluwhcdzyadggh` | `bjkhofdrzpczgnwxoauk` | **MIGRATION REQUIRED** |
| **Auth Hub** | Not configured | `bjkhofdrzpczgnwxoauk` | **CONFIGURATION REQUIRED** |

> **Dashboard Migration Note:** The Dashboard currently uses a different Supabase project (`xmpckuiluwhcdzyadggh`). Its tables (`core_profiles`, `billing_subscriptions`, `core_devices`, `app_timekeeper_entries`, `app_timekeeper_geofences`, `blades_transactions`, `admin_users`) must be migrated to the shared project. This is a **prerequisite** before SSO can work.

---

## 4. Authentication Flow

### 4.1 Login Flow (redirect-based SSO)

This follows the standard OAuth 2.0 / OIDC `redirect_uri` pattern.

> *"The redirect_uri request parameter is used as a callback URL. Your application receives and processes the response from the authorization server after authentication is complete."*
> — [Auth0: Redirect Users After Login](https://auth0.com/docs/authenticate/login/redirect-users-after-login)

```
SCENARIO: User clicks "View My Orders" on Shop (not logged in)

  ┌─────────────────┐
  │  shop.onsite     │  1. Middleware detects: no valid cookie
  │  club.ca/orders  │  2. Redirects to:
  └────────┬─────────┘
           │
           │  GET auth.onsiteclub.ca/login?return_to=https://shop.onsiteclub.ca/orders
           ▼
  ┌─────────────────┐
  │  auth.onsite     │  3. Shows login form
  │  club.ca/login   │  4. User authenticates (email/password or Google)
  │                  │  5. Supabase creates session
  └────────┬─────────┘
           │
           │  6. Auth Hub validates return_to against whitelist
           │  7. Sets cookie on domain .onsiteclub.ca
           │  8. Redirects to: https://shop.onsiteclub.ca/orders
           ▼
  ┌─────────────────┐
  │  shop.onsite     │  9. Middleware reads cookie → user authenticated
  │  club.ca/orders  │  10. Page renders with user data
  └─────────────────┘
```

### 4.2 Already Authenticated Flow (cookie exists)

```
SCENARIO: User already logged in via Shop, now visits Learn

  ┌──────────────────┐
  │  learn.onsite     │  1. Middleware reads .onsiteclub.ca cookie
  │  club.ca/wallet   │  2. Cookie valid → supabase.auth.getUser() succeeds
  │                   │  3. Page renders — NO redirect to Auth Hub
  └──────────────────┘

  The user NEVER sees a login screen. Cookie is shared.
```

### 4.3 Logout Flow

```
  ┌──────────────────┐
  │  Any app          │  1. User clicks "Logout"
  │  Logout button    │  2. App calls supabase.auth.signOut()
  └────────┬──────────┘
           │
           │  3. Cookie on .onsiteclub.ca is cleared
           │  4. Redirect to auth.onsiteclub.ca/logout (optional cleanup)
           ▼
  ┌──────────────────┐
  │  auth.onsite      │  5. Confirms session destroyed
  │  club.ca/logout   │  6. Redirects to onsiteclub.ca (or return_to)
  └──────────────────┘

  All subdomains lose access simultaneously (cookie gone).
```

---

## 5. Cookie Configuration (CRITICAL)

### 5.1 Shared Cookie on `.onsiteclub.ca`

All apps MUST configure their Supabase browser client with the same cookie domain. This is what enables SSO without OAuth complexity.

> *"If Domain is specified, then subdomains are always included. Setting domain to .onsiteclub.ca allows all subdomains to read the session cookie."*
> — [Supabase: Share Sessions Across Subdomains](https://micheleong.com/blog/share-sessions-subdomains-supabase)

**Required configuration for ALL apps:**

```typescript
// Browser client (client.ts) — EVERY app must use this
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        domain: '.onsiteclub.ca',
        sameSite: 'lax',
        secure: true,
      },
    }
  )
}
```

### 5.2 Current Compliance Status

| App | Cookie Domain Set? | Action |
|-----|-------------------|--------|
| **Shop** | `.onsiteclub.ca` | Already compliant |
| **Learn** | Not set (default) | **Must add cookieOptions** |
| **Dashboard** | Not set (default) | **Must add cookieOptions** |
| **Auth Hub** | Not set (default) | **Must add cookieOptions** |

### 5.3 Cookie Security Properties

| Property | Value | Reason |
|----------|-------|--------|
| `domain` | `.onsiteclub.ca` | Shared across all subdomains |
| `secure` | `true` | HTTPS only — prevents interception |
| `sameSite` | `lax` | Allows top-level navigations (redirects) while blocking CSRF |
| `httpOnly` | `true` (Supabase default) | JavaScript cannot read the cookie — XSS protection |
| `path` | `/` (Supabase default) | Available on all routes |

> *"For web applications, store refresh tokens in HTTP-only cookies with proper security flags. Never store refresh tokens in browser local storage or session storage, as these are vulnerable to XSS attacks."*
> — [Session Security in 2025](https://www.techosquare.com/blog/session-security-in-2025-what-works-for-cookies-tokens-and-rotation)

### 5.4 Local Development

In local development (`localhost`), the `.onsiteclub.ca` cookie will not work. Each app must detect the environment:

```typescript
const isProduction = process.env.NODE_ENV === 'production';

const cookieOptions = isProduction
  ? { domain: '.onsiteclub.ca', sameSite: 'lax' as const, secure: true }
  : { sameSite: 'lax' as const, secure: false };
```

---

## 6. Redirect Validation & Security

### 6.1 Whitelist (OWASP Compliance)

Auth Hub MUST validate every `return_to` URL before redirecting. This prevents **Open Redirect attacks** (OWASP A01:2025 — Broken Access Control).

> *"Creating a whitelist of all allowed redirect locations is a good open redirect prevention methodology."*
> — [OWASP: Unvalidated Redirects and Forwards](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html)

```typescript
// Auth Hub — lib/redirect-validation.ts

const ALLOWED_HOSTS = new Set([
  'onsiteclub.ca',
  'www.onsiteclub.ca',
  'auth.onsiteclub.ca',
  'dashboard.onsiteclub.ca',
  'shop.onsiteclub.ca',
  'learn.onsiteclub.ca',
  'tech.onsiteclub.ca',
]);

export function isValidReturnTo(returnTo: string): boolean {
  try {
    const url = new URL(returnTo);

    // Protocol: HTTPS only in production
    if (url.protocol !== 'https:') return false;

    // Host: must be in whitelist
    if (!ALLOWED_HOSTS.has(url.hostname)) return false;

    // No credentials in URL
    if (url.username || url.password) return false;

    return true;
  } catch {
    return false; // Malformed URL
  }
}

export function getSafeReturnTo(returnTo: string | null): string {
  const DEFAULT = 'https://dashboard.onsiteclub.ca';
  if (!returnTo) return DEFAULT;
  return isValidReturnTo(returnTo) ? returnTo : DEFAULT;
}
```

### 6.2 How Apps Send `return_to`

Each app decides WHERE to redirect. Auth Hub only validates it.

| Scenario | return_to | Set By |
|----------|-----------|--------|
| Shop: user clicks "My Orders" | `shop.onsiteclub.ca/account/orders` | Shop middleware |
| Learn: user clicks "My Wallet" | `learn.onsiteclub.ca/wallet` | Learn middleware |
| Dashboard: user opens dashboard | `dashboard.onsiteclub.ca/account` | Dashboard middleware |
| Website: user clicks "Members" | `dashboard.onsiteclub.ca` | Website link |
| Direct login (no return_to) | `dashboard.onsiteclub.ca` | Auth Hub default |

---

## 7. Middleware Pattern (Required for ALL Apps)

Every app that requires authentication MUST implement this middleware pattern:

```typescript
// middleware.ts (root of each Next.js app)

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const AUTH_LOGIN_URL = 'https://auth.onsiteclub.ca/login';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              domain: '.onsiteclub.ca', // CRITICAL: maintain shared domain
            })
          );
        },
      },
    }
  );

  // ALWAYS call getUser() — this refreshes the session
  const { data: { user } } = await supabase.auth.getUser();

  // Check if route requires auth (app-specific logic)
  if (isProtectedRoute(request.nextUrl.pathname) && !user) {
    const returnTo = request.nextUrl.href;
    const loginUrl = new URL(AUTH_LOGIN_URL);
    loginUrl.searchParams.set('return_to', returnTo);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

// Each app defines its own protected routes
function isProtectedRoute(pathname: string): boolean {
  // Example for Shop:
  // return pathname.startsWith('/account');
  //
  // Example for Learn:
  // return pathname.startsWith('/wallet');
  //
  // Example for Dashboard:
  // return pathname.startsWith('/account') || pathname.startsWith('/admin');
  return false;
}
```

> **Key Detail:** The middleware calls `supabase.auth.getUser()` on every request. This is what refreshes the session cookie and keeps the user logged in across subdomains. Without this, cookies expire and cross-subdomain SSO breaks.

---

## 8. Session Security & Redundancy

### 8.1 Token Lifecycle

Supabase Auth uses a dual-token system:

| Token | Lifetime | Storage | Purpose |
|-------|----------|---------|---------|
| Access Token (JWT) | 1 hour | Cookie (HttpOnly) | Authorize API requests |
| Refresh Token | 7 days (default) | Cookie (HttpOnly) | Get new access token |

> *"Refresh token rotation guarantees that every time an application exchanges a refresh token, a new refresh token is also returned. The old one is invalidated, preventing replay attacks."*
> — [Auth0: Refresh Token Rotation](https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/)

### 8.2 Security Layers

| Layer | Protection | Implementation |
|-------|-----------|----------------|
| **Cookie flags** | XSS, CSRF, interception | HttpOnly, Secure, SameSite=Lax |
| **Token rotation** | Stolen refresh token | Supabase automatic rotation |
| **Session refresh** | Stale sessions | Middleware calls `getUser()` on every request |
| **Redirect whitelist** | Open redirect attacks | `isValidReturnTo()` validation |
| **Rate limiting** | Brute force on login | Supabase built-in + Vercel WAF |
| **PKCE** | Authorization code interception | Supabase uses PKCE by default for OAuth |
| **HTTPS only** | Man-in-the-middle | `secure: true` on cookies |
| **RLS** | Unauthorized data access | Supabase Row Level Security on all tables |

> *"RFC 9700 (January 2025) emphasizes mandatory PKCE for all OAuth flows."*
> — [Session Security in 2025](https://www.techosquare.com/blog/session-security-in-2025-what-works-for-cookies-tokens-and-rotation)

### 8.3 Rate Limiting on Login

Auth Hub MUST implement rate limiting on login endpoints:

| Endpoint | Limit | Action on Exceed |
|----------|-------|-----------------|
| `/login` (form submit) | 5 attempts / minute / IP | Show CAPTCHA |
| `/api/auth/signup` | 3 attempts / minute / IP | Block 60s |
| `/api/auth/reset-password` | 2 attempts / minute / email | Block 300s |

> *"Servers should reject requests after a threshold (e.g., 5 attempts per minute). This forces attackers to slow down so much that brute force becomes mathematically impossible."*
> — [OWASP: Blocking Brute Force Attacks](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)

### 8.4 Redundancy: What Happens When Auth Hub Is Down?

| Scenario | Impact | Mitigation |
|----------|--------|-----------|
| Auth Hub unreachable | New logins fail | Existing cookies still work (7-day lifetime). Users already logged in are unaffected. |
| Supabase outage | All apps affected | Supabase has 99.9% SLA. No mitigation needed at app level. |
| Cookie corrupted | Single user loses session | Middleware clears invalid cookie, redirects to login. |
| DNS failure on auth.onsiteclub.ca | Login redirect fails | Apps show "Service temporarily unavailable" with retry. |

**Key resilience property:** Because cookies are shared (not token-forwarding), existing sessions survive Auth Hub downtime. Only NEW logins require Auth Hub.

---

## 9. PIPEDA Compliance

### 9.1 Why Centralization Is Required

Canada's Personal Information Protection and Electronic Documents Act (PIPEDA) has 10 principles. Three mandate centralized identity:

| PIPEDA Principle | Requirement | Auth Hub Implementation |
|-----------------|-------------|------------------------|
| **Accountability** (Principle 1) | One entity responsible for all personal data | Auth Hub owns `auth.users` and `core_profiles` |
| **Limiting Collection** (Principle 4) | Collect only what's needed | Each app queries only its own tables. Shop never sees Learn data. |
| **Individual Access** (Principle 9) | User can request all their data | Single `user_id` across all tables makes this a single query |
| **Challenging Compliance** (Principle 10) | User can contest data practices | Single point of contact: Auth Hub account page |

> *"PIPEDA makes organizations responsible for all personal information under their control, including data processed by third-party service providers."*
> — [PIPEDA Compliance Guide for SaaS](https://complydog.com/blog/pipeda-compliance-guide-canadian-privacy-law-saas-companies)

### 9.2 Breach Notification

> *"Organizations must keep records of all data breaches for two years, regardless of whether reported."*
> — [Office of the Privacy Commissioner of Canada](https://www.priv.gc.ca/en/privacy-topics/business-privacy/breaches-and-safeguards/privacy-breaches-at-your-business/gd_pb_201810/)

Auth Hub MUST maintain an `auth_audit_log` table:

```sql
CREATE TABLE auth_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL, -- 'login', 'logout', 'password_reset', 'account_deleted', 'failed_login'
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,           -- Additional context
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Retention: 2 years (PIPEDA requirement)
-- Auto-cleanup via pg_cron or application-level job
```

### 9.3 Right to Deletion

When a user requests account deletion from Auth Hub:

1. Auth Hub deletes `auth.users` record (Supabase cascade)
2. Auth Hub deletes `core_profiles` record
3. Auth Hub notifies each app to clean up app-specific data:
   - Shop: anonymize order history (keep for tax records, remove PII)
   - Learn: delete `learn_credentials`, `learn_certificates`, `learn_badges`
   - Dashboard: delete `billing_subscriptions`, `core_devices`, etc.
4. Auth Hub logs the deletion in `auth_audit_log`

---

## 10. Database Schema — Shared Tables

### 10.1 Tables Owned by Auth Hub

These tables live in the shared Supabase project and are managed by Auth Hub:

```sql
-- auth.users (Supabase managed — DO NOT MODIFY)
-- Contains: id, email, encrypted_password, created_at, etc.

-- Core profile (owned by Auth Hub, readable by all apps)
CREATE TABLE core_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  preferred_name TEXT,
  avatar_url TEXT,
  trade TEXT,
  province TEXT,
  country TEXT DEFAULT 'CA',
  language_primary TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'America/Toronto',
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Audit log (owned by Auth Hub, write-only for Auth Hub)
CREATE TABLE auth_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 10.2 Tables Owned by Each App

Each app owns its own tables. Auth Hub does NOT read or write these.

**Shop tables (prefix: `app_shop_`):**
```
app_shop_orders, promo_codes
```

**Learn tables (prefix: `learn_`):**
```
learn_profiles, learn_credentials, learn_certificates, learn_badges
```

**Dashboard/Tech tables (prefix: `app_` or `billing_` or `core_`):**
```
billing_subscriptions, core_devices,
app_timekeeper_entries, app_timekeeper_geofences,
blades_transactions, admin_users
```

### 10.3 RLS Policies

```sql
-- core_profiles: users can read/update their own profile
ALTER TABLE core_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON core_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON core_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Service role (Auth Hub backend) can do everything
-- This is handled by using SUPABASE_SERVICE_ROLE_KEY on server-side
```

---

## 11. What Each App Must Do

### 11.1 Auth Hub (auth.onsiteclub.ca) — OWNER

| Task | Status | Priority |
|------|--------|----------|
| Configure Supabase to `bjkhofdrzpczgnwxoauk` | Pending | **P0** |
| Add `cookieOptions: { domain: '.onsiteclub.ca' }` to browser client | Pending | **P0** |
| Implement `return_to` parameter on `/login` | Pending | **P0** |
| Implement redirect whitelist validation | Pending | **P0** |
| Add Google Sign-In as OAuth provider | Pending | P1 |
| Create `auth_audit_log` table | Pending | P1 |
| Implement rate limiting on login endpoints | Pending | P1 |
| Maintain subscription gateway (existing) | Done | — |

### 11.2 Shop (shop.onsiteclub.ca)

**What Shop already has right:**
- Uses correct Supabase project (`bjkhofdrzpczgnwxoauk`)
- Has `cookieOptions: { domain: '.onsiteclub.ca' }` in browser client
- Has its own Stripe checkout (KEEP THIS — do not change)

**What Shop must change:**

| Task | Details |
|------|---------|
| **Remove local login page** | Delete `/app/login/page.tsx`. Replace with redirect to Auth Hub. |
| **Remove local signup logic** | Remove `signUp` calls from Shop code. |
| **Update middleware** | When unauthenticated user hits protected route, redirect to `auth.onsiteclub.ca/login?return_to={current_url}` instead of `/login`. |
| **Remove auth store signup** | Keep `auth.ts` Zustand store for user state, but remove signup/signin methods. Use cookie-based detection only. |
| **Keep checkout as-is** | Shop's Stripe checkout is independent. No changes needed. |
| **Keep all API routes** | `/api/checkout`, `/api/webhook`, `/api/shipping/*`, `/api/promo/*` remain unchanged. |

**Shop middleware pattern:**
```typescript
// shop middleware.ts — protected routes redirect to Auth Hub
if (pathname.startsWith('/account') && !user) {
  const loginUrl = new URL('https://auth.onsiteclub.ca/login');
  loginUrl.searchParams.set('return_to', request.nextUrl.href);
  return NextResponse.redirect(loginUrl);
}
```

**Shop does NOT change:**
- Product pages (public)
- Cart page (public, uses localStorage)
- Checkout API (Stripe, independent)
- Webhook handler (Stripe, independent)
- Admin routes (keep current `x-admin-secret` for now)

### 11.3 Learn (learn.onsiteclub.ca)

**What Learn already has right:**
- Uses correct Supabase project (`bjkhofdrzpczgnwxoauk`)
- Has middleware with session refresh and route protection

**What Learn must change:**

| Task | Details |
|------|---------|
| **Add `cookieOptions`** | Add `{ domain: '.onsiteclub.ca', sameSite: 'lax', secure: true }` to browser client in `src/lib/supabase/client.ts` |
| **Remove local login/signup pages** | Delete `/app/login/page.tsx` and `/app/signup/page.tsx`. |
| **Update middleware redirect** | Change `new URL('/login', request.url)` to `new URL('https://auth.onsiteclub.ca/login')` with `return_to` parameter. |
| **Update middleware cookie domain** | Add `domain: '.onsiteclub.ca'` to `setAll` cookie options in middleware. |
| **Remove AuthModal component** | Remove `AuthModal.tsx` and all references. |
| **Keep wallet and verify routes** | No changes to `/wallet` or `/verify/[id]`. |

**Learn middleware change (diff):**
```diff
  // Before (Learn's current middleware)
  if (pathname.startsWith('/wallet') && !user) {
-   const loginUrl = new URL('/login', request.url);
-   loginUrl.searchParams.set('redirect', pathname);
+   const loginUrl = new URL('https://auth.onsiteclub.ca/login');
+   loginUrl.searchParams.set('return_to', request.nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }

- if ((pathname === '/login' || pathname === '/signup') && user) {
-   return NextResponse.redirect(new URL('/wallet', request.url));
- }
```

### 11.4 Dashboard (dashboard.onsiteclub.ca)

**Dashboard has the most work** because it uses a different Supabase project.

| Task | Details | Priority |
|------|---------|----------|
| **Migrate Supabase project** | Change env vars from `xmpckuiluwhcdzyadggh` to `bjkhofdrzpczgnwxoauk` | **P0** |
| **Migrate database tables** | Export and import all tables to shared project | **P0** |
| **Add `cookieOptions`** | Add `{ domain: '.onsiteclub.ca' }` to browser client | **P0** |
| **Remove local auth pages** | Remove `AuthPage.tsx`, `/reset-password`. Redirect to Auth Hub. | P1 |
| **Update middleware** | Redirect to `auth.onsiteclub.ca/login?return_to={url}` | P1 |
| **Keep all dashboard features** | Timekeeper, Calculator, Blades, Profile — unchanged | — |

**Dashboard tables to migrate to shared project:**
```
core_profiles          (may need merge with Auth Hub version)
billing_subscriptions
core_devices
app_timekeeper_entries
app_timekeeper_geofences
blades_transactions
admin_users
payment_history
```

### 11.5 Website (onsiteclub.ca) & Tech (tech.onsiteclub.ca)

**No changes required.** These are static sites with no authentication.

Only change: the "Members" / "My Area" link should point to:
```
https://auth.onsiteclub.ca/login?return_to=https://dashboard.onsiteclub.ca
```

---

## 12. Dashboard: Unified Client Area with Empty States

The Dashboard shows ALL OnSite services in one place. Sections are NEVER hidden or blocked.

> *"Users churn not because a product is bad, but because they didn't discover what makes it good. Well-designed empty states reduce drop-off by up to 35%."*
> — [Empty State UX: Turn Blank Screens Into Revenue](https://www.saasfactor.co/blogs/empty-state-ux-turn-blank-screens-into-higher-activation-and-saas-revenue)

> *"Progressive disclosure defers advanced features to secondary UI, keeping essential content visible."*
> — [Nielsen Norman Group: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)

### Dashboard Data Fetching Pattern

```typescript
// Dashboard layout.tsx — fetches data from ALL areas
const [shopOrders, techSubs, learnCreds] = await Promise.all([
  supabase
    .from('app_shop_orders')
    .select('order_number, status, total, created_at')
    .eq('email', user.email)
    .order('created_at', { ascending: false })
    .limit(3),

  supabase
    .from('billing_subscriptions')
    .select('app_name, status, current_period_end')
    .eq('user_id', user.id),

  supabase
    .from('learn_credentials')
    .select('name, status, expiry_date')
    .eq('user_id', user.id)
    .limit(3),
]);
```

### Card States

| State | Condition | Display |
|-------|-----------|---------|
| **Active** | Data exists | Show latest items + "View all" link |
| **Empty** | No data, but service available | Show description + CTA: "Get started" |
| **Coming Soon** | Feature not yet released | Show teaser + "Notify me" |

---

## 13. Environment Variables

### Auth Hub `.env`

```bash
# Supabase (shared project)
NEXT_PUBLIC_SUPABASE_URL=https://bjkhofdrzpczgnwxoauk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>

# Stripe (subscription gateway only)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_CALCULATOR=price_...
STRIPE_PRICE_TIMEKEEPER=price_...

# Auth
CHECKOUT_JWT_SECRET=<jwt_secret>
NEXT_PUBLIC_AUTH_URL=https://auth.onsiteclub.ca

# Redirect security
ALLOWED_REDIRECT_DOMAINS=onsiteclub.ca,dashboard.onsiteclub.ca,shop.onsiteclub.ca,learn.onsiteclub.ca,tech.onsiteclub.ca

# URLs (for return redirects after payment)
NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.onsiteclub.ca
NEXT_PUBLIC_CALCULATOR_URL=https://calc.onsiteclub.ca
NEXT_PUBLIC_TIMEKEEPER_SCHEME=onsiteclub://timekeeper
```

### All Other Apps `.env` (required keys)

```bash
# Supabase (SAME project for ALL apps)
NEXT_PUBLIC_SUPABASE_URL=https://bjkhofdrzpczgnwxoauk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<same_anon_key>

# Auth Hub reference
NEXT_PUBLIC_AUTH_URL=https://auth.onsiteclub.ca
```

---

## 14. API Contract: Auth Hub Endpoints

### Public Endpoints (no auth required)

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| GET | `/login` | Login page | `return_to` (URL, validated) |
| GET | `/signup` | Signup page | `return_to` (URL, validated) |
| GET | `/reset-password` | Password reset | — |
| GET | `/logout` | Destroy session, redirect | `return_to` (URL, validated) |
| GET | `/auth/callback` | OAuth callback handler | `code`, `next` |

### Protected Endpoints (require valid session)

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| GET | `/checkout/{app}` | Subscription checkout | `token`, `prefilled_email`, `user_id`, `redirect` |
| GET | `/checkout/success` | Payment success | `app`, `session_id`, `redirect` |
| GET | `/manage` | Manage subscriptions | — |
| GET | `/delete-account` | Account deletion page | — |
| GET | `/r/{code}` | Short code redirect | code in URL |

### API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/checkout` | Create Stripe checkout session | Session cookie |
| POST | `/api/portal` | Stripe customer portal | Session cookie |
| GET | `/api/subscription/status` | Check subscription status | Session cookie |
| POST | `/api/webhooks/stripe` | Stripe webhook | Stripe signature |
| POST | `/api/delete-account` | Delete account | Session cookie |

---

## 15. Implementation Order

### Phase 0: Foundation (BLOCKING — must be done first)

1. Auth Hub: Configure Supabase project to `bjkhofdrzpczgnwxoauk`
2. Auth Hub: Add `cookieOptions: { domain: '.onsiteclub.ca' }` to all clients
3. Auth Hub: Implement `return_to` parameter on login/signup/logout
4. Auth Hub: Implement redirect whitelist validation
5. Auth Hub: Test cookie sharing with Shop (Shop already uses same Supabase + cookie domain)

### Phase 1: Connect Shop & Learn

6. Shop: Remove local login/signup, redirect to Auth Hub
7. Shop: Update middleware to use `return_to`
8. Learn: Add cookie domain, remove local login/signup, update middleware
9. Test: Verify SSO between Auth Hub, Shop, and Learn

### Phase 2: Dashboard Migration

10. Dashboard: Migrate tables to shared Supabase project
11. Dashboard: Change env vars to shared project
12. Dashboard: Add cookie domain, remove local auth pages
13. Dashboard: Update middleware
14. Test: Full SSO across all apps

### Phase 3: Hardening

15. Auth Hub: Add Google Sign-In
16. Auth Hub: Create `auth_audit_log` table
17. Auth Hub: Implement rate limiting
18. Auth Hub: Implement account deletion cascade
19. All apps: End-to-end security audit

---

## 16. Testing Checklist

### SSO Verification

- [ ] Login on Auth Hub → cookie visible on `.onsiteclub.ca`
- [ ] Navigate to Shop → automatically authenticated (no login prompt)
- [ ] Navigate to Learn → automatically authenticated
- [ ] Navigate to Dashboard → automatically authenticated
- [ ] Logout on any app → cookie cleared → all apps lose session
- [ ] Login from Shop redirect → returns to Shop page after auth
- [ ] Login from Learn redirect → returns to Learn wallet after auth
- [ ] Direct login (no return_to) → goes to Dashboard

### Security Verification

- [ ] `return_to=https://evil.com` → rejected, redirects to Dashboard
- [ ] `return_to=javascript:alert(1)` → rejected
- [ ] `return_to=https://onsiteclub.ca.evil.com` → rejected
- [ ] Cookie not readable via JavaScript (HttpOnly)
- [ ] Cookie not sent over HTTP (Secure flag)
- [ ] 6+ failed login attempts → rate limited
- [ ] Session survives Auth Hub restart (cookie-based, not server-side)

### PIPEDA Verification

- [ ] User can view all their data from Dashboard
- [ ] User can request account deletion
- [ ] Deletion cascades to all app tables
- [ ] Audit log records all auth events
- [ ] Breach records retained for 2 years minimum

---

## 17. References

### Architecture & Patterns
- [Microservices Authentication (Permify, 2025)](https://permify.co/post/microservices-authentication/)
- [Auth Architecture: Monolith to Microservices (Contentstack)](https://www.contentstack.com/blog/tech-talk/from-legacy-systems-to-microservices-transforming-auth-architecture)
- [Microservices Auth Part 1 — Introduction (microservices.io)](https://microservices.io/post/architecture/2025/04/25/microservices-authn-authz-part-1-introduction.html)
- [Separation of Concerns in Security (Codeist)](https://codeist.pl/2024/06/23/the-importance-of-separation-of-concerns-in-software-architecture-for-security-and-safety/)
- [Progressive Disclosure (Nielsen Norman Group)](https://www.nngroup.com/articles/progressive-disclosure/)

### Authentication & Session Security
- [Supabase: Share Sessions Across Subdomains](https://micheleong.com/blog/share-sessions-subdomains-supabase)
- [Supabase Auth Advanced Guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide)
- [Session Security in 2025 (Techosquare)](https://www.techosquare.com/blog/session-security-in-2025-what-works-for-cookies-tokens-and-rotation)
- [Auth0: Refresh Token Rotation](https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/)
- [Auth0: Redirect Users After Login](https://auth0.com/docs/authenticate/login/redirect-users-after-login)
- [Auth0: Universal Login Experience](https://auth0.com/blog/introducing-the-new-auth0-universal-login-experience/)

### OWASP & Security
- [OWASP: Open Redirect](https://owasp.org/www-community/attacks/open_redirect)
- [OWASP: Unvalidated Redirects and Forwards](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html)
- [OWASP: Blocking Brute Force Attacks](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)
- [Microsoft: Redirect URI Best Practices](https://learn.microsoft.com/en-us/entra/identity-platform/reply-url)

### PIPEDA Compliance
- [PIPEDA Compliance Guide for SaaS (ComplyDog)](https://complydog.com/blog/pipeda-compliance-guide-canadian-privacy-law-saas-companies)
- [PIPEDA Ultimate Guide (OneTrust)](https://www.onetrust.com/blog/the-ultimate-guide-to-pipeda-compliance/)
- [Office of the Privacy Commissioner: Breach Reporting](https://www.priv.gc.ca/en/privacy-topics/business-privacy/breaches-and-safeguards/privacy-breaches-at-your-business/gd_pb_201810/)

### UX & Empty States
- [Empty State UX: Turn Blank Screens Into Revenue (SaaS Factor)](https://www.saasfactor.co/blogs/empty-state-ux-turn-blank-screens-into-higher-activation-and-saas-revenue)
- [Empty State: Overlooked UX Pattern (Medium)](https://medium.com/@vioscott/%EF%B8%8F-empty-state-design-the-most-overlooked-ux-pattern-in-modern-frontend-5b2406255a14)
- [Stripe: Share Customers Across Accounts](https://docs.stripe.com/get-started/account/orgs/sharing/customers-payment-methods)

### Payments
- [Stripe: Share Customers and Payment Methods](https://docs.stripe.com/get-started/account/orgs/sharing/customers-payment-methods)
- [Payment System Architecture (System Design Handbook)](https://www.systemdesignhandbook.com/guides/design-a-payment-system/)

---

*This document is the single source of architectural truth for the OnSite Club ecosystem. All app agents should reference this document when implementing authentication-related changes. Auth Hub (HERMES) is the owner and maintainer of this specification.*
