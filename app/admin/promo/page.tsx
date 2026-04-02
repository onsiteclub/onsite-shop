'use client'

import { useState } from 'react'

export default function AdminPromoPage() {
  const [authed, setAuthed] = useState(false)
  const [secret, setSecret] = useState('')
  const [authError, setAuthError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)

  const [email, setEmail] = useState('')
  const [discountType, setDiscountType] = useState('item_050')

  const [notes, setNotes] = useState('')
  const [expiresInDays, setExpiresInDays] = useState(30)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ code: string } | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleAuth() {
    if (secret.length < 4) {
      setAuthError('Enter the admin password')
      return
    }
    setAuthLoading(true)
    setAuthError('')
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'x-admin-secret': secret },
      })
      if (res.status === 401) {
        setAuthError('Wrong password')
        setAuthLoading(false)
        return
      }
      sessionStorage.setItem('admin_secret', secret)
      setAuthed(true)
    } catch {
      setAuthError('Connection error')
    }
    setAuthLoading(false)
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
          discountType,
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
      setNotes('')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  // Auth gate
  if (!authed) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="bg-white rounded-2xl p-8 w-[340px] shadow-sm border border-warm-200/60">
          <div className="text-center mb-6">
            <img src="/assets/logo-onsite-club.png" alt="OnSite Club" className="h-7 mx-auto mb-3 brightness-0" />
            <h1 className="font-display text-lg font-bold text-text-primary">Promo Access</h1>
          </div>
          <div className="relative mb-3">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Admin password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
              className="input w-full pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 font-display text-xs text-warm-400 hover:text-text-primary"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {authError && (
            <p className="font-display text-xs text-red-500 mb-3">{authError}</p>
          )}
          <button
            onClick={handleAuth}
            disabled={authLoading}
            className="w-full py-3 bg-amber hover:bg-amber-dark text-charcoal-deep rounded-xl font-display font-bold text-sm transition-colors disabled:opacity-50"
          >
            {authLoading ? 'Verifying...' : 'Enter'}
          </button>
        </div>
      </div>
    )
  }

  // Admin panel
  return (
    <div>
      <div className="max-w-lg">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-text-primary">
            Promo Codes
          </h1>
          <p className="font-body text-sm text-text-secondary mt-0.5">
            Generate a single-use code with free shipping.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-warm-200/60">
          {/* Email */}
          <div className="mb-4">
            <label className="block font-display text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide">
              Recipient Email
            </label>
            <input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </div>

          {/* Discount Type */}
          <div className="mb-4">
            <label className="block font-display text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide">
              Discount
            </label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="input"
            >
              <option value="item_050">1 item for $0.50</option>
              <option value="percent_10">10% off</option>
              <option value="percent_15">15% off</option>
              <option value="percent_20">20% off</option>
              <option value="percent_25">25% off</option>
              <option value="percent_50">50% off</option>
            </select>
          </div>

          {/* Notes */}
          <div className="mb-4">
            <label className="block font-display text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide">
              Internal Note <span className="text-gray-400">(who is this for?)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. John — referral from Marcus"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input"
            />
          </div>

          {/* Expiry */}
          <div className="mb-6">
            <label className="block font-display text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide">
              Validity (days)
            </label>
            <select
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
              className="input"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={0}>No expiration</option>
            </select>
          </div>

          {error && (
            <p className="font-display text-xs text-red-500 mb-4">{error}</p>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || !email}
            className={`w-full py-3 rounded-xl font-display font-bold text-sm transition-colors ${
              loading || !email
                ? 'bg-warm-200 text-warm-400 cursor-not-allowed'
                : 'bg-amber hover:bg-amber-dark text-charcoal-deep cursor-pointer'
            }`}
          >
            {loading ? 'Generating...' : 'Generate & Send Code'}
          </button>
        </div>

        {/* Success */}
        {result && (
          <div className="mt-6 bg-amber-light border border-amber rounded-2xl p-6">
            <p className="font-display text-sm font-bold text-text-primary mb-3">
              Code generated and sent!
            </p>
            <div className="bg-charcoal-deep rounded-xl p-4 text-center">
              <span className="font-display text-2xl font-bold text-amber tracking-[4px]">
                {result.code}
              </span>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result.code)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="flex-1 font-display text-xs font-bold py-2.5 rounded-xl bg-charcoal-deep text-white hover:bg-charcoal transition-colors"
              >
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `🎉 You got an *OnSite Club* code!\n\n` +
                  `Use code *${result.code}* at checkout` +
                  (discountType === 'item_050'
                    ? ' to get any item for just $0.50 CAD'
                    : ` for ${discountType.replace('percent_', '')}% off your order`) +
                  ` + free shipping.\n\n` +
                  `⏳ Limited time — don't miss out!\n\n` +
                  `🛒 shop.onsiteclub.ca\n` +
                  `_Built for those who build._`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 font-display text-xs font-bold py-2.5 rounded-xl bg-[#25D366] text-white text-center hover:bg-[#1da851] transition-colors"
              >
                WhatsApp
              </a>
            </div>
            {email && (
              <p className="font-display text-xs text-amber-dark mt-2">
                Email sent to {email}. Single use only.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
