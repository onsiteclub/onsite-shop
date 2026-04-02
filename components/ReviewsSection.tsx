'use client'

import { useState, useEffect } from 'react'

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
    <span className="text-amber text-base tracking-[2px] mb-4 block">
      {'★'.repeat(count)}
      {'★'.repeat(5 - count).split('').map((_, i) => (
        <span key={i} className="text-warm-200">★</span>
      ))}
    </span>
  )
}

export function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loaded, setLoaded] = useState(false)

  // Same API call — untouched
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

  return (
    <section className="py-[100px] bg-off-white" id="reviews">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="section-label block">Hear from the Crew</span>
          <h2 className="section-title">What Builders Are Saying</h2>
          <p className="section-desc mx-auto">Real people, real jobsites, real opinions.</p>
        </div>

        {/* Grid — 3 columns desktop, 1 mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1000px] mx-auto lg:max-w-none">
          {reviews.slice(0, 6).map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-[10px] p-8 border border-warm-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]"
            >
              <Stars count={review.rating} />

              {review.comment && (
                <p className="text-[15px] text-text-secondary leading-relaxed mb-5 italic line-clamp-4">
                  &ldquo;{review.comment}&rdquo;
                </p>
              )}

              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-warm-100 flex items-center justify-center font-display font-extrabold text-sm text-charcoal flex-shrink-0">
                  {(review.customer_name || 'A').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-sm">
                    {review.customer_name || 'Anonymous'}
                  </div>
                  <div className="text-xs text-warm-400">
                    {review.product_names?.length
                      ? review.product_names[0]
                      : new Date(review.created_at).toLocaleDateString('en-CA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                    }
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
