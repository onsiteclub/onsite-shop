'use client'

import { useState } from 'react'

export default function AdminPromoPage() {
  const [authed, setAuthed] = useState(false)
  const [secret, setSecret] = useState('')
  const [authError, setAuthError] = useState('')

  const [email, setEmail] = useState('')
  const [discountType, setDiscountType] = useState('item_050')

  const [notes, setNotes] = useState('')
  const [expiresInDays, setExpiresInDays] = useState(30)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ code: string } | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  function handleAuth() {
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
      <div className="min-h-screen flex items-center justify-center bg-[#1B2B27]">
        <div className="bg-white rounded-2xl p-10 w-[340px]">
          <h1 className="font-mono text-xl font-bold text-[#1B2B27] mb-6">
            OnSite Admin
          </h1>
          <input
            type="password"
            placeholder="Admin password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
            className="input mb-3"
          />
          {authError && (
            <p className="font-mono text-xs text-red-500 mb-3">{authError}</p>
          )}
          <button
            onClick={handleAuth}
            className="w-full py-3 bg-[#1B2B27] text-[#B8860B] rounded-xl font-mono font-bold text-sm uppercase tracking-wider hover:bg-[#2a3f39] transition-colors"
          >
            Enter
          </button>
        </div>
      </div>
    )
  }

  // Admin panel
  return (
    <div className="min-h-screen bg-[#f4f3ef] p-8">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="font-mono text-2xl font-bold text-[#1B2B27]">
            Generate Promo Code
          </h1>
          <p className="font-mono text-xs text-[#6B7280] mt-1">
            Generate a single-use code with free shipping.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-gray-200">
          {/* Email */}
          <div className="mb-4">
            <label className="block font-mono text-xs text-[#1B2B27] mb-1.5 uppercase tracking-wider">
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
            <label className="block font-mono text-xs text-[#1B2B27] mb-1.5 uppercase tracking-wider">
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
            <label className="block font-mono text-xs text-[#1B2B27] mb-1.5 uppercase tracking-wider">
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
            <label className="block font-mono text-xs text-[#1B2B27] mb-1.5 uppercase tracking-wider">
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
            <p className="font-mono text-xs text-red-500 mb-4">{error}</p>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || !email}
            className={`w-full py-3 rounded-xl font-mono font-bold text-sm uppercase tracking-wider transition-colors ${
              loading || !email
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-[#1B2B27] text-[#B8860B] hover:bg-[#2a3f39] cursor-pointer'
            }`}
          >
            {loading ? 'Generating...' : 'Generate & Send Code'}
          </button>
        </div>

        {/* Success */}
        {result && (
          <div className="mt-6 bg-green-50 border border-green-400 rounded-2xl p-6">
            <p className="font-mono text-sm font-bold text-green-800 mb-3">
              Code generated and sent!
            </p>
            <div className="bg-[#1B2B27] rounded-xl p-4 text-center">
              <span className="font-mono text-2xl font-bold text-[#B8860B] tracking-[4px]">
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
                className="flex-1 font-mono text-xs font-bold py-2.5 rounded-xl bg-[#1B2B27] text-white hover:bg-[#2a3f39] transition-colors"
              >
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(result.code)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 font-mono text-xs font-bold py-2.5 rounded-xl bg-[#25D366] text-white text-center hover:bg-[#1da851] transition-colors"
              >
                WhatsApp
              </a>
            </div>
            {email && (
              <p className="font-mono text-xs text-green-700 mt-2">
                Email sent to {email}. Single use only.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
