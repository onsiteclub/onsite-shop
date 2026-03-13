'use client'

import { useState, useEffect, useRef } from 'react'

interface Review {
  id: string
  customer_name: string
  rating: number
  title: string | null
  comment: string | null
  product_names: string[]
  created_at: string
}

function Stars({ count }: { count: number }) {
  return (
    <span className="text-[#B8860B] text-sm tracking-wider">
      {'★'.repeat(count)}
      {'★'.repeat(5 - count).split('').map((_, i) => (
        <span key={i} className="text-[#D3D1C7]">★</span>
      ))}
    </span>
  )
}

export function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loaded, setLoaded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/reviews')
      .then((res) => res.json())
      .then((data) => {
        setReviews(data.reviews || [])
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  if (!loaded || reviews.length === 0) return null

  function scroll(dir: 'left' | 'right') {
    if (!scrollRef.current) return
    const amount = 320
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  return (
    <div className="my-12 md:my-16 px-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-mono text-sm md:text-base text-[#1B2B27] tracking-[3px] uppercase font-bold">
          Customer Reviews
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-[#1B2B27] shadow-sm transition-colors"
          >
            ‹
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-[#1B2B27] shadow-sm transition-colors"
          >
            ›
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {reviews.map((review) => (
          <div
            key={review.id}
            className="flex-shrink-0 w-[280px] md:w-[320px] bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm"
            style={{ scrollSnapAlign: 'start' }}
          >
            <Stars count={review.rating} />

            {review.title && (
              <h3 className="font-mono text-sm font-bold text-[#1B2B27] mt-3 mb-1">
                {review.title}
              </h3>
            )}

            {review.comment && (
              <p className="font-mono text-xs text-[#1B2B27]/70 leading-relaxed line-clamp-4">
                {review.comment}
              </p>
            )}

            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="font-mono text-xs font-semibold text-[#1B2B27]">
                {review.customer_name || 'Anonymous'}
              </p>
              <p className="font-mono text-[10px] text-[#6B7280]">
                {new Date(review.created_at).toLocaleDateString('en-CA', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
