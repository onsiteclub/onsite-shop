# AUDIT: Resilience & Error Handling

You are auditing how well this application handles failures. Every external dependency WILL fail at some point. The question is: does the app degrade gracefully or crash?

## Instructions

For each external dependency, trace the failure path. Report what the USER sees when each service fails.

## External Dependencies to Check

1. **Supabase** (database + auth)
2. **Stripe** (payments)
3. **Canada Post API** (shipping rates)
4. **Resend** (email)
5. **Vercel** (hosting/deployment)

## Files to Read

1. `app/page.tsx` — Homepage product loading
2. `app/cart/page.tsx` — Checkout flow
3. `app/api/checkout/route.ts` — Payment creation
4. `app/api/webhook/route.ts` — Payment processing
5. `app/api/shipping/rates/route.ts` — Shipping calculation
6. `lib/email.ts` — Email sending
7. `lib/supabase/client.ts` — Client initialization
8. `lib/store/auth.ts` — Auth state management
9. `middleware.ts` — Session refresh
10. `components/shop/Navbar.tsx` — Auth-dependent UI

## Checks

### A. Supabase Down
- [ ] Homepage: products fail to load → what does user see? Loading spinner forever? Error message? Cached fallback?
- [ ] Auth: getUser() fails → user shown as logged out? App crashes?
- [ ] Checkout: order save fails → payment taken but no order record? (CRITICAL)
- [ ] Middleware: session refresh fails → user kicked out? 500 error?

### B. Stripe Down
- [ ] Checkout button → clear error message? Or generic "something went wrong"?
- [ ] Webhook endpoint → Stripe retries automatically (good), but does your handler handle retries idempotently?
- [ ] Success page: session retrieval fails → what shows?

### C. Canada Post API Down
- [ ] Shipping rates → fallback rate used? Or checkout blocked?
- [ ] Timeout handling → request hangs forever? Or timeout with fallback?
- [ ] Retry logic → tries once and fails? Or retries with backoff?

### D. Resend (Email) Down
- [ ] Order confirmation fails → order is still saved? Or rolled back? (CRITICAL)
- [ ] Welcome promo email fails → user still gets promo code? Or lost?
- [ ] Admin notification fails → silently fails? Or blocks order?

### E. Network / Browser Issues
- [ ] Slow 3G connection → images have loading states? Skeleton screens?
- [ ] JavaScript disabled → any SSR content visible?
- [ ] User closes browser during checkout → Stripe handles this (webhook), but is it tested?
- [ ] Double-click on "Place Order" → two orders? Or debounced?

### F. Data Corruption
- [ ] Invalid product_key in cart → checkout gracefully rejects?
- [ ] Malformed cookie → auth initializes cleanly? Or infinite loop?
- [ ] Product deleted from Supabase but still in cart → handled?

### G. Recovery
- [ ] After Supabase recovers → user can refresh and continue? Or stuck?
- [ ] After failed webhook → Stripe retries, order eventually created?
- [ ] After failed email → is there a way to resend? (admin action?)

## Output Format

```
## Resilience Audit Report — [DATE]

### Overall Grade: [A / B / C / D / F]

### Single Points of Failure (CRITICAL)
1. [Service] → [What breaks] → [User impact] → [Fix]

### Missing Error Handling
1. [File:line] → [What happens] → [What should happen]

### Working Fallbacks (good)
1. [Service] → [Fallback behavior]

### Recommendations (priority order)
1. [Most impactful fix first]
```
