'use client'

import { useState } from 'react'

interface Props {
  onComplete: () => void
  onSkip: () => void
  promoUsed: boolean
  cartValue: number
}

function StarRating({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="mb-6">
      <p className="font-mono text-sm font-semibold text-[#1B2B27] mb-2">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="text-3xl transition-transform hover:scale-110"
            style={{ color: star <= value ? '#B8860B' : '#D3D1C7' }}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}

export function PreCheckoutSurvey({ onComplete, onSkip, promoUsed, cartValue }: Props) {
  const [q1, setQ1] = useState(0)
  const [q2, setQ2] = useState(0)
  const [q3, setQ3] = useState(0)
  const [q4, setQ4] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = q1 > 0 && q2 > 0 && q3 > 0

  async function handleSubmit() {
    setSubmitting(true)

    let sessionId = sessionStorage.getItem('onsite_session')
    if (!sessionId) {
      sessionId = Math.random().toString(36).slice(2)
      sessionStorage.setItem('onsite_session', sessionId)
    }

    try {
      await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          q1,
          q2,
          q3,
          q4: q4 || null,
          promoUsed,
          cartValue,
        }),
      })
    } catch (e) {
      console.error('[survey] Failed to save:', e)
    }

    setSubmitting(false)
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 text-[#6B7280] hover:text-[#1B2B27] transition-colors text-xl font-bold leading-none"
          aria-label="Close survey"
        >
          &times;
        </button>
        <h2 className="font-mono text-xl font-bold text-[#1B2B27] mb-1">
          Before you go...
        </h2>
        <p className="font-mono text-xs text-[#6B7280] mb-6">
          3 quick questions. 100% anonymous — helps us improve.
        </p>

        <StarRating
          label="How satisfied are you with the purchase process?"
          value={q1}
          onChange={setQ1}
        />

        <StarRating
          label="How do you rate our brand design?"
          value={q2}
          onChange={setQ2}
        />

        <StarRating
          label="Would you recommend us to someone?"
          value={q3}
          onChange={setQ3}
        />

        <div className="mb-6">
          <p className="font-mono text-sm font-semibold text-[#1B2B27] mb-2">
            Comments or suggestions{' '}
            <span className="font-normal text-[#6B7280]">(optional)</span>
          </p>
          <textarea
            placeholder="We're listening..."
            value={q4}
            onChange={(e) => setQ4(e.target.value)}
            rows={3}
            className="input resize-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className={`w-full font-mono py-3 px-6 rounded-xl uppercase tracking-widest text-sm font-bold transition-colors ${
            canSubmit
              ? 'bg-[#1B2B27] text-white hover:bg-[#2a3f39] cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {submitting ? 'Saving...' : 'Continue to payment →'}
        </button>

        <p className="font-mono text-[10px] text-[#6B7280] text-center mt-3">
          Responses are 100% anonymous. We don't collect names or emails here.
        </p>
      </div>
    </div>
  )
}
