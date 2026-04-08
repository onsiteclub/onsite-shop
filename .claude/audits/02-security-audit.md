# AUDIT: Security & Data Protection

You are auditing the security posture of this application. Check for OWASP Top 10 vulnerabilities, exposed secrets, and data protection issues.

## Instructions

Read and analyze ALL relevant files. For each check, report: PASS, FAIL, or WARN.

## Files to Read

1. `middleware.ts` — Route protection and security headers
2. `lib/supabase/client.ts` — Browser client config
3. `lib/supabase/server.ts` — Server client config
4. `app/auth/callback/route.ts` — Auth callback
5. `.env.example` — Check what env vars exist
6. `app/api/webhook/route.ts` — Webhook signature verification
7. `app/api/admin/` — All admin API routes
8. `app/admin/` — All admin pages
9. `app/api/promo/consume/route.ts` — Internal API security
10. `next.config.js` — Security headers, redirects

Also search for:
- `dangerouslySetInnerHTML` (XSS risk)
- `eval(` or `Function(` (code injection)
- `SUPABASE_SERVICE_ROLE_KEY` usage (should only be server-side)
- `console.log` with sensitive data
- Hardcoded secrets or API keys in source code

## Checks

### A. Authentication & Authorization
- [ ] Protected routes require authentication (middleware or page-level)
- [ ] Admin routes verify admin role (not just authentication)
- [ ] API routes that modify data check authentication
- [ ] No route bypasses auth check via direct API call
- [ ] Service role key is NEVER exposed to client (not in NEXT_PUBLIC_*)
- [ ] Auth callback validates the code before exchanging

### B. Input Validation
- [ ] All API routes validate input types and lengths
- [ ] Email inputs are validated format
- [ ] No SQL injection possible (using parameterized queries / Supabase SDK)
- [ ] No XSS possible (no dangerouslySetInnerHTML with user input)
- [ ] File uploads (if any) validate type and size
- [ ] URL parameters are sanitized before use

### C. Security Headers
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY (prevents clickjacking)
- [ ] Referrer-Policy: strict-origin-when-cross-origin
- [ ] Permissions-Policy restricts camera/microphone/geolocation
- [ ] HTTPS enforced (secure cookies, no mixed content)

### D. Cookie Security
- [ ] Cookies use HttpOnly flag (Supabase default)
- [ ] Cookies use Secure flag (HTTPS only)
- [ ] Cookies use SameSite=Lax or Strict
- [ ] Cookie domain is properly scoped (.onsiteclub.ca)
- [ ] No sensitive data stored in localStorage (tokens, passwords)

### E. API Security
- [ ] Webhook endpoint verifies Stripe signature
- [ ] Internal APIs (promo/consume) require secret header
- [ ] Admin APIs verify admin status
- [ ] Rate limiting exists on auth-related endpoints
- [ ] CORS is properly configured (not wildcard *)
- [ ] No API route exposes user list or sensitive data without auth

### F. Secrets Management
- [ ] No API keys hardcoded in source files
- [ ] .env.local is in .gitignore
- [ ] Service role key only used in server-side code
- [ ] Stripe secret key only used in server-side code
- [ ] Admin secret is sufficiently complex

### G. Open Redirect Prevention
- [ ] Login redirect URLs are validated against whitelist
- [ ] Auth callback redirect is validated
- [ ] No user-controlled URL used in `redirect()` without validation
- [ ] return_to parameter is validated before use

### H. Data Exposure
- [ ] Error messages don't leak stack traces to users
- [ ] API responses don't include unnecessary user data
- [ ] Console.log doesn't print sensitive data in production
- [ ] Source maps are disabled in production build

## Output Format

```
## Security Audit Report — [DATE]

### Risk Level: [CRITICAL / HIGH / MEDIUM / LOW]

### Critical Issues (immediate fix required)
1. [Description + file:line + OWASP category + fix]

### High Risk
1. [Description + file:line + fix]

### Medium Risk
1. [Description + file:line + recommendation]

### Low Risk / Informational
1. [Description]

### Passed Checks
1. [Brief list of what's OK]
```
