# Guest-to-Member Conversion Flow

## Context: How the Shop Works

The shop (`shop.onsiteclub.ca`) allows **guest checkout** — customers buy without creating an account.

### What happens on purchase:

1. Customer fills in: name, email, shipping address on the cart page
2. Redirected to Stripe for payment
3. Stripe processes payment → sends webhook to `/api/webhook`
4. Webhook saves the order to Supabase table `app_shop_orders` with:
   - `email` (customer email)
   - `name` (customer name)
   - `order_number` (e.g. OS-MNPLDM10)
   - `items`, `total`, `shipping_address`, `status`, etc.
5. Customer receives order confirmation email

**At this point, the customer has NO account in Supabase Auth.** They are a guest — we only have their email and order data.

---

## What the Auth Hub Needs to Do

The Auth Hub (`auth.onsiteclub.ca`) should handle **guest-to-member conversion** — turning a guest buyer into a registered member.

### Two triggers for conversion:

#### Trigger 1: Post-Purchase Invitation (automatic)
After a successful purchase, the shop webhook should check if the customer's email already exists in Supabase Auth:

- **If YES** → do nothing (they're already a member)
- **If NO** → create a "pending" user and send an invitation email

**Implementation on the Shop side** (webhook enhancement):
```typescript
// In /api/webhook after saving the order:
const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
const userExists = existingUser.users.some(u => u.email === customerEmail);

if (!userExists) {
  // Create user without password — they'll set it later
  const { data: newUser } = await supabaseAdmin.auth.admin.createUser({
    email: customerEmail,
    email_confirm: true, // mark email as confirmed (they just paid with it)
    user_metadata: {
      full_name: customerName,
      source: 'guest_checkout',
      first_order: orderNumber,
    },
  });

  // Trigger invitation email (Auth Hub handles the email template)
  await supabaseAdmin.auth.admin.inviteUserByEmail(customerEmail, {
    redirectTo: 'https://auth.onsiteclub.ca/set-password',
  });
}
```

**Invitation email content** (configure in Supabase Dashboard > Auth > Email Templates):
```
Subject: Welcome to OnSite Club — Set Up Your Account

Hey {name},

Thanks for your order! You're now part of the crew.

Set up your OnSite Club account to:
- Track your orders anytime
- Get member-only deals and early access
- Earn your 10% welcome discount on your next order

👉 Set Your Password: {confirmation_url}

Your order {order_number} is being processed — you'll get a shipping notification soon.

— The OnSite Club Team
```

#### Trigger 2: Customer Self-Registration (manual)
Customer visits the shop later and clicks "Join" / account icon → redirected to Auth Hub login → signs up with the same email they used to buy.

The Auth Hub should:
1. Check if a user already exists with that email (created by Trigger 1)
2. If yes → let them set a password (or use magic link)
3. If no → normal registration flow

---

## Required Route on Auth Hub: `/set-password`

This is the page where invited users (from guest checkout) set their password for the first time.

### Flow:
1. User clicks link in invitation email
2. Supabase appends a token to the URL: `https://auth.onsiteclub.ca/set-password#access_token=...&type=invite`
3. Auth Hub extracts the token, verifies the session
4. Shows a "Set Your Password" form
5. Calls `supabase.auth.updateUser({ password: newPassword })`
6. Redirects to `https://shop.onsiteclub.ca` (or member dashboard)

### Implementation sketch for Auth Hub:
```typescript
// app/set-password/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Supabase auto-processes the hash token on page load
    // Check if we have a valid session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setLoading(false);
      } else {
        setError('Invalid or expired link. Request a new one.');
        setLoading(false);
      }
    });
  }, []);

  async function handleSubmit() {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setConfirmed(true);
      // Redirect to shop after 2 seconds
      setTimeout(() => {
        window.location.href = 'https://shop.onsiteclub.ca';
      }, 2000);
    }
  }

  // ... render form
}
```

---

## Alternative: Passwordless with Magic Link

Instead of passwords, you could use **magic link only**:

1. Guest buys → user created in Supabase Auth (no password)
2. When they want to log in → enter email → receive magic link → logged in
3. No `/set-password` route needed
4. Simpler, more secure, modern approach

**Trade-off:** Some users prefer passwords. You could offer both:
- Magic link as primary login method
- Optional "Set a password" in account settings for those who want it

---

## Summary: What Each System Does

| System | Responsibility |
|--------|---------------|
| **Shop** (`shop.onsiteclub.ca`) | Guest checkout, Stripe webhook, create Supabase user on purchase, send invite |
| **Auth Hub** (`auth.onsiteclub.ca`) | Login/signup forms, `/set-password` route, session management, magic links |
| **Supabase Auth** | User database, tokens, email templates, password hashing |
| **Stripe** | Payment processing, webhook events |

### Data flow:
```
Customer buys (guest)
  → Stripe payment
  → Webhook saves order to Supabase
  → Check if user exists in Auth
  → If not: create user + send invite email
  → Customer clicks email link
  → Auth Hub /set-password
  → Customer is now a full member
```
