'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

function StarRating({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  return (
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
  )
}

export default function ReviewPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>()
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)

  const [name, setName] = useState('')
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Verify order exists and check if already reviewed
    fetch(`/api/reviews/check?order_number=${encodeURIComponent(orderNumber)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.notFound) {
          setNotFound(true)
        } else if (data.alreadyReviewed) {
          setAlreadyReviewed(true)
        }
        setLoading(false)
      })
      .catch(() => {
        setNotFound(true)
        setLoading(false)
      })
  }, [orderNumber])

  async function handleSubmit() {
    if (rating === 0) return
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_number: orderNumber,
          customer_name: name || undefined,
          rating,
          title: title || undefined,
          comment: comment || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        setSubmitting(false)
        return
      }

      setSubmitted(true)
    } catch {
      setError('Network error')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f3ef]">
        <p className="font-mono text-sm text-[#6B7280]">Loading...</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f3ef]">
        <div className="text-center">
          <h1 className="font-mono text-xl font-bold text-[#1B2B27] mb-2">Order not found</h1>
          <p className="font-mono text-sm text-[#6B7280] mb-6">
            This order number doesn't exist or the link is invalid.
          </p>
          <Link
            href="/"
            className="font-mono text-sm text-[#B8860B] hover:underline"
          >
            Go to Shop
          </Link>
        </div>
      </div>
    )
  }

  if (alreadyReviewed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f3ef]">
        <div className="text-center">
          <h1 className="font-mono text-xl font-bold text-[#1B2B27] mb-2">Already reviewed</h1>
          <p className="font-mono text-sm text-[#6B7280] mb-6">
            A review has already been submitted for this order. Thank you!
          </p>
          <Link
            href="/"
            className="font-mono text-sm text-[#B8860B] hover:underline"
          >
            Go to Shop
          </Link>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f3ef]">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">★</div>
          <h1 className="font-mono text-xl font-bold text-[#1B2B27] mb-2">
            Thank you for your review!
          </h1>
          <p className="font-mono text-sm text-[#6B7280] mb-6">
            Your review will appear on our shop after moderation.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-[#1B2B27] text-[#B8860B] rounded-xl font-mono text-sm font-bold uppercase tracking-wider hover:bg-[#2a3f39] transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f3ef] py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-8 text-center">
          <Link href="/" className="font-mono text-2xl font-bold text-[#1B2B27] hover:text-[#B8860B] transition-colors">
            OnSite Club
          </Link>
          <p className="font-mono text-xs text-[#6B7280] mt-1">
            Order {orderNumber}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-gray-200">
          <h1 className="font-mono text-xl font-bold text-[#1B2B27] mb-1">
            Leave a Review
          </h1>
          <p className="font-mono text-xs text-[#6B7280] mb-6">
            How was your experience? Your feedback helps us improve.
          </p>

          {/* Rating */}
          <div className="mb-6">
            <label className="block font-mono text-xs text-[#1B2B27] mb-2 uppercase tracking-wider">
              Rating
            </label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="block font-mono text-xs text-[#1B2B27] mb-1.5 uppercase tracking-wider">
              Your Name <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="John"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
            />
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block font-mono text-xs text-[#1B2B27] mb-1.5 uppercase tracking-wider">
              Review Title <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="Great quality!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
            />
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block font-mono text-xs text-[#1B2B27] mb-1.5 uppercase tracking-wider">
              Your Review
            </label>
            <textarea
              placeholder="Tell us about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="input resize-none"
            />
          </div>

          {error && (
            <p className="font-mono text-xs text-red-500 mb-4">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className={`w-full py-3 rounded-xl font-mono font-bold text-sm uppercase tracking-wider transition-colors ${
              rating > 0
                ? 'bg-[#1B2B27] text-[#B8860B] hover:bg-[#2a3f39] cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  )
}
