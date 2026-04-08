# Audit Prompts — OnSite Shop

Master prompts for systematic code auditing. Copy the content of any audit file and paste it as a prompt to Claude to run the audit.

## Available Audits

| # | Audit | What it checks | When to run |
|---|-------|---------------|-------------|
| 01 | **Checkout & Payments** | Price integrity, webhook security, promo codes, error handling | Before launch, after any checkout change |
| 02 | **Security & Data Protection** | OWASP Top 10, secrets, headers, input validation, XSS, open redirect | Monthly, after any auth/API change |
| 03 | **Resilience & Error Handling** | What happens when Supabase/Stripe/email/API is down | Before launch, after adding new dependencies |
| 04 | **Auth & SSO Integration** | Cookie config, auth hub integration, no local auth remnants | After any auth change, after ARCHITECTURE.md updates |
| 05 | **Performance & Bundle** | Bundle size, render patterns, images, caching | Monthly, after adding new libraries |

## How to Use

1. Open a new Claude Code session
2. Say: "Read the file `.claude/audits/01-checkout-audit.md` and run the audit"
3. Claude will read all files listed, run all checks, and produce a report
4. Fix any FAIL or CRITICAL issues
5. Re-run the audit to verify fixes

## Recommended Schedule

- **Pre-launch**: Run ALL 5 audits
- **Monthly**: Run 02 (Security) + 05 (Performance)
- **After checkout changes**: Run 01 (Checkout)
- **After auth changes**: Run 04 (Auth SSO)
- **After outage or bug**: Run 03 (Resilience)
