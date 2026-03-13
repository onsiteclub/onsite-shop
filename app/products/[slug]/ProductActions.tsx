'use client'

import { useState } from 'react'
import { useCartStore } from '@/lib/store/cart'

interface ProductActionsProps {
  productKey: string
  priceId: string
  name: string
  price: number
  sizes: string[]
  colors: string[]
  images: string[]
  colorImages: Record<string, string[]>
  primaryImage: string
}

export function ProductActions({
  productKey,
  priceId,
  name,
  price,
  sizes,
  colors,
  images,
  colorImages,
  primaryImage,
}: ProductActionsProps) {
  const [selectedSize, setSelectedSize] = useState(sizes?.[0] || '')
  const [selectedColor, setSelectedColor] = useState(colors?.[0] || '')
  const [addedFeedback, setAddedFeedback] = useState(false)
  const [validationError, setValidationError] = useState('')
  const addItem = useCartStore((state) => state.addItem)

  // Resolve image based on selected color
  const currentImage = (() => {
    if (selectedColor && colorImages?.[selectedColor]?.length) {
      return colorImages[selectedColor][0]
    }
    return images?.[0] || primaryImage
  })()

  const handleAddToCart = () => {
    if (addedFeedback) return
    if (sizes?.length > 1 && !selectedSize) {
      setValidationError('Please select a size')
      return
    }
    if (colors?.length > 1 && !selectedColor) {
      setValidationError('Please select a color')
      return
    }
    setValidationError('')
    addItem({
      product_key: productKey,
      price_id: priceId,
      name,
      design: '',
      color: selectedColor || colors?.[0] || '',
      size: selectedSize || sizes?.[0] || '',
      price: Math.round(price * 100),
      image: currentImage,
    })
    setAddedFeedback(true)
    setTimeout(() => setAddedFeedback(false), 2000)
  }

  const handleCheckout = () => {
    if (sizes?.length > 1 && !selectedSize) {
      setValidationError('Please select a size')
      return
    }
    if (colors?.length > 1 && !selectedColor) {
      setValidationError('Please select a color')
      return
    }
    setValidationError('')
    addItem({
      product_key: productKey,
      price_id: priceId,
      name,
      design: '',
      color: selectedColor || colors?.[0] || '',
      size: selectedSize || sizes?.[0] || '',
      price: Math.round(price * 100),
      image: currentImage,
    })
    window.location.href = '/checkout'
  }

  if (!priceId) {
    return (
      <button
        disabled
        className="w-full font-mono py-3 px-6 rounded-xl bg-stone-300 text-stone-500 uppercase tracking-wider text-sm font-bold cursor-not-allowed"
      >
        Coming Soon
      </button>
    )
  }

  return (
    <div>
      {/* Size selector */}
      {sizes?.length > 1 && (
        <div className="mb-4">
          <p className="font-mono text-xs text-[#1B2B27] mb-2 uppercase tracking-wider">
            Size
          </p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all ${
                  selectedSize === size
                    ? 'bg-[#1B2B27] text-white'
                    : 'bg-white text-[#1B2B27] hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color selector */}
      {colors?.length > 1 && (
        <div className="mb-6">
          <p className="font-mono text-xs text-[#1B2B27] mb-2 uppercase tracking-wider">
            Color
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all ${
                  selectedColor === color
                    ? 'bg-[#1B2B27] text-white'
                    : 'bg-white text-[#1B2B27] hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Validation error */}
      {validationError && (
        <p className="font-mono text-xs text-red-500 mb-3 text-center">{validationError}</p>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          disabled={addedFeedback}
          onClick={handleAddToCart}
          className={`flex-1 font-mono py-3 px-4 rounded-xl transition-colors uppercase tracking-wider text-sm font-bold ${
            addedFeedback
              ? 'bg-green-600 text-white cursor-not-allowed'
              : 'bg-[#1B2B27] text-white hover:bg-[#2a3f39]'
          }`}
        >
          {addedFeedback ? 'Added!' : 'Add to Bag'}
        </button>
        <button
          onClick={handleCheckout}
          className="flex-1 font-mono py-3 px-4 rounded-xl bg-[#B8860B] text-white hover:bg-[#9A7209] transition-colors uppercase tracking-wider text-sm font-bold"
        >
          Checkout
        </button>
      </div>
    </div>
  )
}
