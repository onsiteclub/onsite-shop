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

    try {
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
    } catch {
      setLoading(false)
      setStatus('invalid')
      setMessage('Network error')
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
    <div className="mb-4">
      <label className="font-mono text-xs text-[#1B2B27] mb-1.5 block uppercase tracking-wider">
        Promo Code
      </label>

      {status === 'valid' ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2.5 bg-green-50 border border-green-400 rounded-lg font-mono text-sm text-green-800 font-bold">
            {input.toUpperCase()} ✓
          </div>
          <button
            onClick={handleRemove}
            className="px-3 py-2.5 bg-transparent border border-gray-300 rounded-lg font-mono text-xs text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="ONSITE-XXXXXXXX"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            className={`input flex-1 font-mono tracking-wider ${
              status === 'invalid' ? 'border-red-400' : ''
            }`}
          />
          <button
            onClick={handleApply}
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 bg-[#1B2B27] text-[#B8860B] rounded-xl font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#2a3f39] transition-colors disabled:opacity-50"
          >
            {loading ? '...' : 'Apply'}
          </button>
        </div>
      )}

      {message && (
        <p className={`font-mono text-xs mt-1.5 ${
          status === 'valid' ? 'text-green-700' : 'text-red-500'
        }`}>
          {message}
        </p>
      )}
    </div>
  )
}
