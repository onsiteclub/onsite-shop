# AUDIT: Checkout & Payments

You are auditing the checkout and payment flow of this e-commerce application. This is the most critical system — it handles real money.

## Instructions

Read and analyze ALL files in the checkout flow. Do NOT skip any file. For each check, report: PASS, FAIL, or WARN.

## Files to Read

1. `app/cart/page.tsx` — Cart page and checkout form
2. `app/api/checkout/route.ts` — Stripe session creation
3. `app/api/webhook/route.ts` — Stripe webhook handler
4. `app/checkout/success/page.tsx` — Post-purchase page
5. `app/api/order-summary/route.ts` — Order summary API
6. `lib/stripe-config.ts` — Product/price configuration
7. `lib/email.ts` — Order confirmation emails
8. `app/api/promo/validate/route.ts` — Promo code validation
9. `app/api/promo/consume/route.ts` — Promo code consumption

## Checks

### A. Price Integrity
- [ ] Prices are validated SERVER-SIDE (not trusting client prices)
- [ ] Stripe price IDs come from server config, not client input
- [ ] Promo discounts are calculated server-side
- [ ] Shipping costs are validated server-side
- [ ] Free shipping threshold is checked server-side
- [ ] No way for client to send arbitrary price to Stripe

### B. Webhook Security
- [ ] Webhook verifies Stripe signature (`stripe.webhooks.constructEvent`)
- [ ] Webhook uses `STRIPE_WEBHOOK_SECRET` from env
- [ ] Webhook is idempotent (same event twice doesn't create duplicate orders)
- [ ] Webhook handles `checkout.session.completed` event
- [ ] Webhook handles `payment_intent.payment_failed` event
- [ ] Order is only created AFTER payment confirmation (not on checkout start)

### C. Error Handling
- [ ] What happens if Stripe API is down? (user sees clear error, not blank page)
- [ ] What happens if webhook fails? (order still gets created eventually)
- [ ] What happens if email sending fails? (order is NOT rolled back)
- [ ] What happens if Canada Post API is down? (fallback shipping rate exists)
- [ ] What happens if Supabase is down during order save? (is there retry logic?)

### D. Promo Code Security
- [ ] Promo codes are validated server-side before applying discount
- [ ] Promo codes are consumed AFTER payment (not before)
- [ ] Promo codes can't be used twice (atomicity check)
- [ ] Expired promo codes are rejected
- [ ] Consume endpoint requires internal secret (not callable from browser)

### E. Data Completeness
- [ ] Order saves: items, quantities, prices, shipping address, email, total
- [ ] Order has unique order number
- [ ] Customer email is captured (from Stripe session or metadata)
- [ ] Shipping address is saved in order record
- [ ] Payment amount matches what customer was charged

### F. Edge Cases
- [ ] Empty cart → checkout blocked?
- [ ] Item out of stock → handled?
- [ ] User changes price in DevTools → server rejects?
- [ ] User submits checkout twice rapidly → only one order created?
- [ ] Very long customer notes → truncated or rejected?

## Output Format

```
## Checkout Audit Report — [DATE]

### Summary
- PASS: X checks
- FAIL: X checks
- WARN: X checks

### Critical Issues (FAIL)
1. [Description + file:line + fix recommendation]

### Warnings (WARN)
1. [Description + file:line + recommendation]

### All Clear (PASS)
1. [Brief list]
```
