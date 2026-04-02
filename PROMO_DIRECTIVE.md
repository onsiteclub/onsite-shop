# Promo Code System — Implementation Directive
**shop.onsiteclub.ca · Next.js + Supabase + Stripe + Resend · March 2026**

> Directive for the Claude Code agent. Implement everything marked **IMPLEMENT**. Run every **WEB-SEARCH** before coding. Do not skip research. Leave findings as inline comments in each file.

---

## SECTION 1 · Research Mandate (Run Before Any Code)

```
WEB-SEARCH: supabase row level security service role bypass next.js API route 2025
WEB-SEARCH: stripe checkout session metadata custom fields next.js 2025
WEB-SEARCH: stripe webhook signature verification next.js App Router 2025
WEB-SEARCH: resend email next.js App Router send transactional email 2025
WEB-SEARCH: next.js middleware password protect admin route without auth library
WEB-SEARCH: stripe discount coupon vs price override which is better one-time promo
WEB-SEARCH: supabase postgres unique code generation nanoid 2025
WEB-SEARCH: next.js modal before redirect prevent navigation pattern 2025
```

> Log at least one relevant finding per query as an inline comment in the relevant file.

---

## SECTION 2 · Database — Supabase Migrations

**IMPLEMENT:** Run these SQL migrations in Supabase dashboard → SQL Editor, in order.

### Migration 001 — promo_codes table

```sql
-- migration: 001_create_promo_codes.sql

CREATE TABLE IF NOT EXISTS promo_codes (
  id            uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  code          text          UNIQUE NOT NULL,
  email         text,
  phone         text,
  notes         text,                        -- admin note: who is this for
  created_at    timestamptz   DEFAULT now(),
  expires_at    timestamptz,                 -- null = never expires
  used_at       timestamptz,                 -- null = still valid
  used_by_ip    text,
  order_id      text,                        -- Stripe session ID after use
  created_by    text          DEFAULT 'admin'
);

-- Index for fast lookup by code at checkout
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);

-- RLS: only service role can read/write (admin API uses service role key)
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role only" ON promo_codes
  USING (auth.role() = 'service_role');
```

### Migration 002 — pre_checkout_responses table

```sql
-- migration: 002_create_survey_responses.sql

CREATE TABLE IF NOT EXISTS pre_checkout_responses (
  id            uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz   DEFAULT now(),
  session_id    text,                        -- anonymous browser session
  q1            text,                        -- "Como nos encontrou?"
  q2            text,                        -- "O que te fez querer essa peça?"
  q3            text,                        -- open text, optional
  promo_used    boolean       DEFAULT false,
  cart_value    numeric,                     -- total cart at time of survey
  ip_hash       text                         -- hashed IP, not raw
);

ALTER TABLE pre_checkout_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role only" ON pre_checkout_responses
  USING (auth.role() = 'service_role');
```

> ⚠ Both tables use service role only. The frontend never reads these directly — only via API routes that use `SUPABASE_SERVICE_ROLE_KEY`.

---

## SECTION 3 · Environment Variables

**IMPLEMENT:** Add to `.env.local`. Never commit these values to git.

```bash
# .env.local — add these if not already present

# Supabase (service role — used only in API routes, never in client)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Resend (email sending)
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=noreply@onsiteclub.ca

# Admin page protection (simple shared secret — no auth library needed)
ADMIN_SECRET=choose_a_strong_random_string_here

# Stripe (already exists — confirm these are set)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Shop URL
NEXT_PUBLIC_SHOP_URL=https://shop.onsiteclub.ca
```

> After adding, verify with: `echo $ADMIN_SECRET` in the terminal. On Vercel, add all vars in Project Settings → Environment Variables.

---

## SECTION 4 · Utility — Code Generator

**IMPLEMENT:** Create this utility first. All other files depend on it.

```ts
// lib/promo/generateCode.ts

import { customAlphabet } from 'nanoid'

// Install if not present: npm install nanoid
// Alphabet: uppercase letters + numbers, no ambiguous chars (0, O, I, 1)
const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8)

/**
 * Generates a human-readable promo code.
 * Format: ONSITE-XXXXXXXX
 * Example: ONSITE-K7M3PQ2R
 */
export function generatePromoCode(): string {
  return `ONSITE-${nanoid()}`
}
```

---

## SECTION 5 · API Routes

### 5.1 `app/api/promo/generate/route.ts`

**IMPLEMENT:** Creates a code in Supabase and sends it via email (and optionally SMS).

```ts
// app/api/promo/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { generatePromoCode } from '@/lib/promo/generateCode'

// Service role client — bypasses RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  // ── Admin auth check ───────────────────────────────────────────────────────
  const adminSecret = req.headers.get('x-admin-secret')
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { email, phone, notes, expiresInDays } = body

  if (!email && !phone) {
    return NextResponse.json(
      { error: 'Email or phone required' },
      { status: 400 }
    )
  }

  // ── Generate unique code ───────────────────────────────────────────────────
  const code = generatePromoCode()

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null

  // ── Save to Supabase ───────────────────────────────────────────────────────
  const { error: dbError } = await supabase.from('promo_codes').insert({
    code,
    email: email ?? null,
    phone: phone ?? null,
    notes: notes ?? null,
    expires_at: expiresAt,
  })

  if (dbError) {
    console.error('[promo/generate] DB error:', dbError)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  // ── Send email via Resend ──────────────────────────────────────────────────
  if (email) {
    const shopUrl = process.env.NEXT_PUBLIC_SHOP_URL

    const { error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: 'Your OnSite Club promo code — grab anything for $0.10',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; background: #f4f3ef; padding: 40px;">
          <div style="max-width: 480px; margin: 0 auto; background: #1B2B27; border-radius: 12px; padding: 40px;">
            <h1 style="color: #F6C343; font-size: 28px; margin-bottom: 8px;">OnSite Club</h1>
            <p style="color: #9FE1CB; font-size: 14px; margin-bottom: 32px;">Built for those who build</p>

            <p style="color: #ffffff; font-size: 16px; line-height: 1.6;">
              Here's your exclusive promo code. Use it at checkout to get
              <strong style="color: #F6C343;">any one item for $0.10 CAD</strong> — plus free shipping on your entire order.
            </p>

            <div style="background: #F6C343; border-radius: 8px; padding: 20px; text-align: center; margin: 32px 0;">
              <span style="font-size: 28px; font-weight: 700; color: #1B2B27; letter-spacing: 4px;">${code}</span>
            </div>

            <p style="color: #9FE1CB; font-size: 13px; margin-bottom: 24px;">
              One-time use only. ${expiresAt ? `Expires ${new Date(expiresAt).toLocaleDateString('en-CA')}.` : 'No expiry.'}
              Free shipping applies to your entire cart.
            </p>

            <a href="${shopUrl}" style="display: block; background: #F6C343; color: #1B2B27; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 8px; font-weight: 700; font-size: 16px;">
              Shop Now →
            </a>
          </div>
        </body>
        </html>
      `,
    })

    if (emailError) {
      console.error('[promo/generate] Email error:', emailError)
      // Don't fail the request — code was created, just log
    }
  }

  return NextResponse.json({ success: true, code })
}
```

---

### 5.2 `app/api/promo/validate/route.ts`

**IMPLEMENT:** Called from checkout page when user types a code. Returns discount info.

```ts
// app/api/promo/validate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { code } = await req.json()

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ valid: false, error: 'No code provided' })
  }

  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .single()

  if (error || !data) {
    return NextResponse.json({ valid: false, error: 'Code not found' })
  }

  if (data.used_at) {
    return NextResponse.json({ valid: false, error: 'Code already used' })
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: 'Code expired' })
  }

  // Valid — return discount rules
  return NextResponse.json({
    valid: true,
    code: data.code,
    discount: {
      oneItemPrice: 0.10,   // CAD — cheapest item in cart goes to $0.10
      freeShipping: true,   // entire order, regardless of other items
    },
  })
}
```

---

### 5.3 `app/api/promo/consume/route.ts`

**IMPLEMENT:** Called by the Stripe webhook after successful payment to mark code as used.

```ts
// app/api/promo/consume/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  // Called internally by webhook — verify internal secret
  const secret = req.headers.get('x-internal-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { code, orderId, ip } = await req.json()

  const { error } = await supabase
    .from('promo_codes')
    .update({
      used_at: new Date().toISOString(),
      order_id: orderId,
      used_by_ip: ip,
    })
    .eq('code', code)
    .is('used_at', null) // safety: only update if not already used

  if (error) {
    console.error('[promo/consume] Error:', error)
    return NextResponse.json({ error: 'Failed to consume code' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

---

### 5.4 `app/api/survey/route.ts`

**IMPLEMENT:** Saves pre-checkout survey responses. Called before redirecting to Stripe.

```ts
// app/api/survey/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { sessionId, q1, q2, q3, promoUsed, cartValue } = body

  // Hash IP for anonymous storage
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 16)

  const { error } = await supabase.from('pre_checkout_responses').insert({
    session_id: sessionId,
    q1: q1 ?? null,
    q2: q2 ?? null,
    q3: q3 ?? null,
    promo_used: promoUsed ?? false,
    cart_value: cartValue ?? null,
    ip_hash: ipHash,
  })

  if (error) {
    console.error('[survey] DB error:', error)
    // Don't block checkout — log and continue
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

---

### 5.5 `app/api/stripe/webhook/route.ts`

**IMPLEMENT:** Update existing Stripe webhook (or create if missing) to consume promo code after successful payment.

```ts
// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.CheckoutSession

    // Check if a promo code was used — passed via metadata
    const promoCode = session.metadata?.promo_code
    if (promoCode) {
      const ip = req.headers.get('x-forwarded-for') ?? 'unknown'

      await fetch(`${process.env.NEXT_PUBLIC_SHOP_URL}/api/promo/consume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': process.env.ADMIN_SECRET!,
        },
        body: JSON.stringify({
          code: promoCode,
          orderId: session.id,
          ip,
        }),
      })
    }
  }

  return NextResponse.json({ received: true })
}

// CRITICAL: disable body parsing — Stripe needs raw body for signature verification
export const config = {
  api: { bodyParser: false },
}
```

---

## SECTION 6 · Admin Page

**IMPLEMENT:** Create the admin page at `/admin/promo`. No auth library — protected by `ADMIN_SECRET` via a client-side password prompt stored in `sessionStorage`.

### 6.1 `app/admin/promo/page.tsx`

```tsx
// app/admin/promo/page.tsx
'use client'

import { useState } from 'react'

const QUESTIONS = {
  q1: ['Instagram', 'WhatsApp', 'Indicação de amigo', 'Google', 'Outro'],
  q2: ['A marca', 'O design', 'Foi presente', 'Quero testar a qualidade', 'Outro'],
}

export default function AdminPromoPage() {
  const [authed, setAuthed] = useState(false)
  const [secret, setSecret] = useState('')
  const [authError, setAuthError] = useState('')

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [expiresInDays, setExpiresInDays] = useState(30)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ code: string } | null>(null)
  const [error, setError] = useState('')

  // Simple client-side auth gate
  function handleAuth() {
    // We can't verify the secret client-side without exposing it,
    // so we just store it and let the API reject if wrong.
    // The API route does the actual verification.
    if (secret.length < 4) {
      setAuthError('Enter the admin password')
      return
    }
    sessionStorage.setItem('admin_secret', secret)
    setAuthed(true)
  }

  async function handleGenerate() {
    setLoading(true)
    setResult(null)
    setError('')

    const storedSecret = sessionStorage.getItem('admin_secret') ?? secret

    try {
      const res = await fetch('/api/promo/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': storedSecret,
        },
        body: JSON.stringify({
          email: email || undefined,
          phone: phone || undefined,
          notes: notes || undefined,
          expiresInDays,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 401) {
          setAuthed(false)
          setAuthError('Wrong password')
          return
        }
        setError(data.error ?? 'Something went wrong')
        return
      }

      setResult(data)
      setEmail('')
      setPhone('')
      setNotes('')
    } catch (e) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  // ── Auth gate ─────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1B2B27' }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 40, width: 340 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, color: '#1B2B27' }}>
            OnSite Admin
          </h1>
          <input
            type="password"
            placeholder="Admin password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 16, marginBottom: 12 }}
          />
          {authError && <p style={{ color: '#A32D2D', fontSize: 14, marginBottom: 12 }}>{authError}</p>}
          <button
            onClick={handleAuth}
            style={{ width: '100%', padding: '12px', background: '#1B2B27', color: '#F6C343', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
          >
            Enter
          </button>
        </div>
      </div>
    )
  }

  // ── Admin panel ───────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f4f3ef', padding: 40 }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1B2B27' }}>Gerar código promocional</h1>
          <p style={{ color: '#5F5E5A', marginTop: 4 }}>
            O código gerado vale 1 item por $0.10 CAD + frete grátis. Uso único.
          </p>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 32, border: '0.5px solid #D3D1C7' }}>

          {/* Email */}
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1B2B27', marginBottom: 6 }}>
            Email do destinatário
          </label>
          <input
            type="email"
            placeholder="email@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #D3D1C7', borderRadius: 8, fontSize: 15, marginBottom: 16, boxSizing: 'border-box' }}
          />

          {/* Phone (optional) */}
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1B2B27', marginBottom: 6 }}>
            Telefone (opcional)
          </label>
          <input
            type="tel"
            placeholder="+1 613 000 0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #D3D1C7', borderRadius: 8, fontSize: 15, marginBottom: 16, boxSizing: 'border-box' }}
          />

          {/* Notes */}
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1B2B27', marginBottom: 6 }}>
            Nota interna (quem é essa pessoa?)
          </label>
          <input
            type="text"
            placeholder="Ex: João — indicação do Marcos"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #D3D1C7', borderRadius: 8, fontSize: 15, marginBottom: 16, boxSizing: 'border-box' }}
          />

          {/* Expiry */}
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1B2B27', marginBottom: 6 }}>
            Validade (dias)
          </label>
          <select
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(Number(e.target.value))}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #D3D1C7', borderRadius: 8, fontSize: 15, marginBottom: 24, boxSizing: 'border-box' }}
          >
            <option value={7}>7 dias</option>
            <option value={14}>14 dias</option>
            <option value={30}>30 dias</option>
            <option value={60}>60 dias</option>
            <option value={0}>Sem expiração</option>
          </select>

          {/* Error */}
          {error && (
            <p style={{ color: '#A32D2D', fontSize: 14, marginBottom: 16 }}>{error}</p>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading || (!email && !phone)}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#D3D1C7' : '#1B2B27',
              color: '#F6C343',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 16,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Gerando...' : 'Gerar e enviar código'}
          </button>
        </div>

        {/* Success */}
        {result && (
          <div style={{ marginTop: 24, background: '#E1F5EE', border: '1px solid #5DCAA5', borderRadius: 12, padding: 24 }}>
            <p style={{ color: '#085041', fontWeight: 600, marginBottom: 8 }}>Código gerado e enviado!</p>
            <div style={{ background: '#1B2B27', borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <span style={{ fontSize: 26, fontWeight: 700, color: '#F6C343', letterSpacing: 4 }}>
                {result.code}
              </span>
            </div>
            <p style={{ color: '#085041', fontSize: 13, marginTop: 8 }}>
              Email enviado para {email}. O código é de uso único.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
```

---

## SECTION 7 · Checkout Integration

### 7.1 Promo code field in checkout UI

**IMPLEMENT:** Add this component to the checkout page. Place it above the "Proceed to payment" button.

```tsx
// components/PromoCodeField.tsx
'use client'

import { useState } from 'react'

interface PromoDiscount {
  valid: boolean
  code: string
  discount: {
    oneItemPrice: number
    freeShipping: boolean
  }
}

interface Props {
  onApply: (discount: PromoDiscount | null) => void
}

export function PromoCodeField({ onApply }: Props) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [message, setMessage] = useState('')

  async function handleApply() {
    if (!input.trim()) return
    setLoading(true)
    setStatus('idle')

    const res = await fetch('/api/promo/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: input.trim().toUpperCase() }),
    })

    const data = await res.json()
    setLoading(false)

    if (data.valid) {
      setStatus('valid')
      setMessage('Code applied! Your cheapest item goes to $0.10 CAD + free shipping.')
      onApply(data)
    } else {
      setStatus('invalid')
      setMessage(data.error ?? 'Invalid code')
      onApply(null)
    }
  }

  function handleRemove() {
    setInput('')
    setStatus('idle')
    setMessage('')
    onApply(null)
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: '#1B2B27', display: 'block', marginBottom: 6 }}>
        Promo code
      </label>

      {status === 'valid' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, padding: '10px 12px', background: '#E1F5EE', border: '1px solid #5DCAA5', borderRadius: 8, fontSize: 14, color: '#085041', fontWeight: 600 }}>
            {input.toUpperCase()} ✓
          </div>
          <button
            onClick={handleRemove}
            style={{ padding: '10px 14px', background: 'transparent', border: '1px solid #D3D1C7', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#5F5E5A' }}
          >
            Remove
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="ONSITE-XXXXXXXX"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            style={{ flex: 1, padding: '10px 12px', border: `1px solid ${status === 'invalid' ? '#E24B4A' : '#D3D1C7'}`, borderRadius: 8, fontSize: 15 }}
          />
          <button
            onClick={handleApply}
            disabled={loading || !input.trim()}
            style={{ padding: '10px 18px', background: '#1B2B27', color: '#F6C343', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
          >
            {loading ? '...' : 'Apply'}
          </button>
        </div>
      )}

      {message && (
        <p style={{ fontSize: 13, marginTop: 6, color: status === 'valid' ? '#085041' : '#A32D2D' }}>
          {message}
        </p>
      )}
    </div>
  )
}
```

### 7.2 Discount calculation logic

**IMPLEMENT:** Add this utility to apply the promo discount to the cart total.

```ts
// lib/promo/applyDiscount.ts

interface CartItem {
  id: string
  name: string
  price: number   // CAD, in dollars
  quantity: number
}

interface DiscountResult {
  subtotal: number        // before discount
  discountAmount: number  // amount saved
  total: number           // after discount
  shipping: number        // 0 if promo valid
  itemsAfterDiscount: CartItem[]
}

export function applyPromoDiscount(
  items: CartItem[],
  promoActive: boolean
): DiscountResult {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  if (!promoActive) {
    return {
      subtotal,
      discountAmount: 0,
      total: subtotal,
      shipping: calculateShipping(subtotal), // your existing shipping logic
      itemsAfterDiscount: items,
    }
  }

  // Find cheapest item (by unit price) — that one goes to $0.10
  const cheapestIndex = items.reduce(
    (minIdx, item, idx) => (item.price < items[minIdx].price ? idx : minIdx),
    0
  )

  const discountAmount = items[cheapestIndex].price - 0.10

  return {
    subtotal,
    discountAmount: Math.max(0, discountAmount),
    total: subtotal - Math.max(0, discountAmount),
    shipping: 0,  // always free shipping with promo
    itemsAfterDiscount: items,
  }
}

// Placeholder — replace with your actual shipping tier logic
function calculateShipping(subtotal: number): number {
  if (subtotal >= 100) return 0
  return 15  // flat rate fallback
}
```

### 7.3 Stripe session — pass promo code as metadata

**IMPLEMENT:** In your existing Stripe checkout session creation, add metadata so the webhook knows which code to consume.

```ts
// In your existing checkout API route (wherever you call stripe.checkout.sessions.create):

const session = await stripe.checkout.sessions.create({
  // ... your existing config ...

  // Add this:
  metadata: {
    promo_code: appliedPromoCode ?? '',  // empty string if no promo
  },

  // If promo is active, override line items to reflect $0.10 price:
  line_items: cartItems.map((item, index) => ({
    price_data: {
      currency: 'cad',
      product_data: { name: item.name },
      unit_amount: index === cheapestItemIndex && promoActive
        ? 10           // $0.10 in cents
        : Math.round(item.price * 100),
    },
    quantity: item.quantity,
  })),

  // Force shipping to 0 if promo active:
  shipping_options: promoActive
    ? [{
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: 0, currency: 'cad' },
          display_name: 'Free shipping (promo)',
        },
      }]
    : undefined,  // use your normal shipping options
})
```

---

## SECTION 8 · Pre-Checkout Survey Modal

**IMPLEMENT:** This modal appears when user clicks "Proceed to payment". It is mandatory — the Stripe redirect only happens after the user submits or explicitly skips (but skipping is not easy — the button should say "Continue" not "Skip").

```tsx
// components/PreCheckoutSurvey.tsx
'use client'

import { useState } from 'react'

interface Props {
  onComplete: () => void   // called when user submits — then redirect to Stripe
  promoUsed: boolean
  cartValue: number
}

const Q1_OPTIONS = [
  'Instagram',
  'WhatsApp',
  'Indicação de amigo',
  'Google',
  'Outro',
]

const Q2_OPTIONS = [
  'A marca',
  'O design',
  'É um presente',
  'Quero testar a qualidade',
  'Outro',
]

export function PreCheckoutSurvey({ onComplete, promoUsed, cartValue }: Props) {
  const [q1, setQ1] = useState('')
  const [q2, setQ2] = useState('')
  const [q3, setQ3] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = q1 !== '' && q2 !== ''

  async function handleSubmit() {
    setSubmitting(true)

    // Generate anonymous session ID if not exists
    let sessionId = sessionStorage.getItem('onsite_session')
    if (!sessionId) {
      sessionId = Math.random().toString(36).slice(2)
      sessionStorage.setItem('onsite_session', sessionId)
    }

    // Save response — don't block on failure
    try {
      await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          q1,
          q2,
          q3: q3 || null,
          promoUsed,
          cartValue,
        }),
      })
    } catch (e) {
      // Silent fail — never block checkout for a survey error
      console.error('[survey] Failed to save:', e)
    }

    setSubmitting(false)
    onComplete()   // proceeds to Stripe
  }

  return (
    // Full-screen overlay
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(27, 43, 39, 0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
      padding: 24,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 36,
        maxWidth: 480,
        width: '100%',
        boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1B2B27', marginBottom: 6 }}>
          Antes de finalizar...
        </h2>
        <p style={{ fontSize: 14, color: '#5F5E5A', marginBottom: 28, lineHeight: 1.5 }}>
          2 perguntas rápidas. Anônimo de verdade — ajuda a melhorar o site.
        </p>

        {/* Q1 */}
        <p style={{ fontSize: 14, fontWeight: 600, color: '#1B2B27', marginBottom: 10 }}>
          Como você nos encontrou?
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {Q1_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setQ1(opt)}
              style={{
                padding: '8px 14px',
                borderRadius: 20,
                border: `1.5px solid ${q1 === opt ? '#1B2B27' : '#D3D1C7'}`,
                background: q1 === opt ? '#1B2B27' : '#fff',
                color: q1 === opt ? '#F6C343' : '#1B2B27',
                fontSize: 13,
                fontWeight: q1 === opt ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Q2 */}
        <p style={{ fontSize: 14, fontWeight: 600, color: '#1B2B27', marginBottom: 10 }}>
          O que te fez querer essa peça?
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {Q2_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setQ2(opt)}
              style={{
                padding: '8px 14px',
                borderRadius: 20,
                border: `1.5px solid ${q2 === opt ? '#1B2B27' : '#D3D1C7'}`,
                background: q2 === opt ? '#1B2B27' : '#fff',
                color: q2 === opt ? '#F6C343' : '#1B2B27',
                fontSize: 13,
                fontWeight: q2 === opt ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Q3 — optional open text */}
        <p style={{ fontSize: 14, fontWeight: 600, color: '#1B2B27', marginBottom: 8 }}>
          Tem algo que a gente poderia melhorar? <span style={{ fontWeight: 400, color: '#888780' }}>(opcional)</span>
        </p>
        <textarea
          placeholder="Pode ser honesto — ninguém vai ler com o seu nome"
          value={q3}
          onChange={(e) => setQ3(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #D3D1C7',
            borderRadius: 8,
            fontSize: 14,
            resize: 'none',
            marginBottom: 24,
            boxSizing: 'border-box',
            color: '#2C2C2A',
          }}
        />

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          style={{
            width: '100%',
            padding: '14px',
            background: canSubmit ? '#1B2B27' : '#D3D1C7',
            color: canSubmit ? '#F6C343' : '#888780',
            border: 'none',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 16,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          {submitting ? 'Salvando...' : 'Continuar para pagamento →'}
        </button>

        <p style={{ fontSize: 12, color: '#B4B2A9', textAlign: 'center', marginTop: 12 }}>
          Respostas 100% anônimas. Não coletamos nome nem email neste formulário.
        </p>
      </div>
    </div>
  )
}
```

### How to wire the modal in the checkout page

**IMPLEMENT:** In your checkout page, control the modal with a state flag:

```tsx
// In your checkout page component:
const [showSurvey, setShowSurvey] = useState(false)

// Replace your existing "proceed to payment" onClick:
function handleProceedToPayment() {
  setShowSurvey(true)   // show modal FIRST
}

async function handleSurveyComplete() {
  setShowSurvey(false)
  // Now actually redirect to Stripe
  await redirectToStripe()
}

// In JSX:
{showSurvey && (
  <PreCheckoutSurvey
    onComplete={handleSurveyComplete}
    promoUsed={!!appliedPromo}
    cartValue={cartTotal}
  />
)}
```

---

## SECTION 9 · File Structure Summary

After implementation, the new files should be:

```
app/
  admin/
    promo/
      page.tsx                         ← admin panel (Section 6)
  api/
    promo/
      generate/
        route.ts                       ← create + email code (Section 5.1)
      validate/
        route.ts                       ← check code at checkout (Section 5.2)
      consume/
        route.ts                       ← mark used after payment (Section 5.3)
    survey/
      route.ts                         ← save survey responses (Section 5.4)
    stripe/
      webhook/
        route.ts                       ← updated to consume promo (Section 5.5)

components/
  PromoCodeField.tsx                   ← checkout promo input (Section 7.1)
  PreCheckoutSurvey.tsx               ← pre-payment modal (Section 8)

lib/
  promo/
    generateCode.ts                    ← nanoid code generator (Section 4)
    applyDiscount.ts                   ← discount calculation (Section 7.2)
```

---

## SECTION 10 · Validation Checklist

After implementation, test each flow manually and log results in `PROMO_VALIDATION_REPORT.md`.

| Test | Steps | Expected result |
|---|---|---|
| Admin auth | Go to /admin/promo, enter wrong password | "Enter" hits API, returns 401, shows error |
| Admin auth | Enter correct ADMIN_SECRET | Panel unlocks |
| Generate code | Fill email, click generate | Code appears on screen, email arrives |
| Validate — valid | In checkout, type generated code | Green confirmation, discount applied |
| Validate — used | Use same code twice | "Code already used" error |
| Validate — fake | Type ONSITE-FAKECODE | "Code not found" error |
| Discount math | Cart: hoodie $55 + tee $35, promo active | Tee → $0.10, shipping → $0, total = $55.10 |
| Survey — required | Click "Proceed to payment" | Modal opens, button disabled until Q1+Q2 answered |
| Survey — submit | Answer Q1+Q2, click Continue | Redirects to Stripe, response saved in Supabase |
| Survey — fail safe | Simulate /api/survey 500 error | Checkout still proceeds, error logged not blocking |
| Webhook | Complete Stripe test payment with promo code | `used_at` field filled in Supabase |
| Double use | Try same code after webhook fires | API returns "already used" |

> ⚠ Test everything in Stripe test mode first (`sk_test_...`). Only switch to live keys after all tests pass.

---

## SECTION 11 · Dependencies to Install

```bash
npm install nanoid resend
```

> `nanoid` — unique code generation  
> `resend` — transactional email  
> Both are lightweight, no config files needed beyond the env vars in Section 3.

---

*OnSite Club Inc. · shop.onsiteclub.ca · Generated March 2026*
