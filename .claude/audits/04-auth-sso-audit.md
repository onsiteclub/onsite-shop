# AUDIT: Authentication & SSO Integration

You are auditing the authentication system and its integration with the centralized Auth Hub (auth.onsiteclub.ca). Verify that SSO works correctly and no local auth remnants create security gaps.

## Instructions

Read ALL auth-related files. Verify the SSO integration is complete and secure.

## Files to Read

1. `middleware.ts` — Route protection + auth hub redirect
2. `lib/supabase/client.ts` — Browser client + cookie config
3. `lib/supabase/server.ts` — Server client + cookie config
4. `lib/store/auth.ts` — Zustand auth store
5. `app/auth/callback/route.ts` — Auth callback handler
6. `app/login/page.tsx` — Login redirect page
7. `components/shop/MembershipModal.tsx` — Membership modal
8. `components/shop/Navbar.tsx` — User menu + logout
9. `components/shop/Newsletter.tsx` — Newsletter + auth
10. `app/page.tsx` — Homepage auth usage
11. `ARCHITECTURE.md` — Reference architecture document

Also search for:
- `signInWithPassword` (should NOT exist in shop — auth hub handles this)
- `signUp` (should NOT exist in shop)
- `resetPasswordForEmail` (should redirect to auth hub)
- `/login` hardcoded URLs (should use AUTH_URL)
- `supabase.auth.signIn` anywhere in the codebase

## Checks

### A. No Local Auth
- [ ] No signInWithPassword calls in the codebase
- [ ] No signUp calls in the codebase
- [ ] No local login form that accepts email/password
- [ ] No resetPasswordForEmail calls (auth hub handles this)
- [ ] /login page redirects to auth hub (not local form)
- [ ] MembershipModal redirects to auth hub (not local login)

### B. Cookie Configuration
- [ ] Client uses domain: '.onsiteclub.ca' in production
- [ ] Server uses domain: '.onsiteclub.ca' in production
- [ ] Middleware sets domain: '.onsiteclub.ca' on cookie refresh
- [ ] Auth callback sets domain: '.onsiteclub.ca' on code exchange
- [ ] Local dev (localhost) works without domain restriction
- [ ] sameSite: 'lax' on all cookie configs
- [ ] secure: true on all cookie configs (production only)

### C. Redirect Security
- [ ] All redirects to auth hub use NEXT_PUBLIC_AUTH_URL (not hardcoded)
- [ ] return_to parameter is properly URL-encoded
- [ ] Protected routes redirect to auth hub with return_to
- [ ] No open redirect vulnerabilities (user can't control redirect destination)
- [ ] Login redirect page validates return parameter

### D. Session Management
- [ ] Middleware calls getUser() to refresh session on every request
- [ ] Auth store initializes once (no duplicate subscriptions)
- [ ] onAuthStateChange listener is set up
- [ ] signOut clears local state AND redirects to auth hub /logout
- [ ] Session survives page refresh (cookie-based, not memory)

### E. Protected Routes
- [ ] /account/* requires authentication
- [ ] /admin/* requires authentication + admin role
- [ ] Admin verification checks database (not just auth)
- [ ] Public routes (/, /cart, products) work without auth
- [ ] API routes are NOT blocked by middleware (they handle own auth)

### F. Consistency with ARCHITECTURE.md
- [ ] Cookie config matches spec (section 5)
- [ ] Middleware pattern matches spec (section 7)
- [ ] Shop tasks from section 11.2 are all completed
- [ ] return_to parameter name matches spec (not redirect, not return)
- [ ] Auth Hub URL matches spec

## Output Format

```
## Auth & SSO Audit Report — [DATE]

### SSO Status: [READY / PARTIAL / BROKEN]

### Local Auth Remnants Found
1. [File:line] → [What it does] → [Should be removed/changed]

### Cookie Issues
1. [File:line] → [Issue] → [Fix]

### Integration Issues
1. [Mismatch with ARCHITECTURE.md] → [Fix]

### Passed Checks
1. [Brief list]
```
