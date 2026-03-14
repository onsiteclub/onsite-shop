interface CartItemForDiscount {
  product_key: string
  name: string
  price: number   // cents (CAD)
  quantity: number
}

interface DiscountResult {
  subtotal: number        // cents, before discount
  discountAmount: number  // cents, amount saved
  total: number           // cents, after discount
  shipping: number        // 0 if promo active
  cheapestIndex: number   // which item got discounted (-1 for percent)
}

export function applyPromoDiscount(
  items: CartItemForDiscount[],
  promoActive: boolean,
  discountType: string = 'item_050'
): DiscountResult {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  if (!promoActive || items.length === 0) {
    return {
      subtotal,
      discountAmount: 0,
      total: subtotal,
      shipping: -1, // -1 means use normal shipping logic
      cheapestIndex: -1,
    }
  }

  // Percentage discount
  if (discountType.startsWith('percent_')) {
    const percent = parseInt(discountType.replace('percent_', ''))
    const discountAmount = Math.round(subtotal * percent / 100)
    const total = subtotal - discountAmount
    // Ensure total is at least 50 cents (Stripe minimum)
    const safeTotal = Math.max(50, total)
    const safeDiscount = subtotal - safeTotal

    return {
      subtotal,
      discountAmount: safeDiscount,
      total: safeTotal,
      shipping: 0,
      cheapestIndex: -1,
    }
  }

  // item_050: cheapest item goes to $0.50
  const cheapestIndex = items.reduce(
    (minIdx, item, idx) => (item.price < items[minIdx].price ? idx : minIdx),
    0
  )

  const discountAmount = items[cheapestIndex].price - 50 // 50 cents = $0.50

  return {
    subtotal,
    discountAmount: Math.max(0, discountAmount),
    total: subtotal - Math.max(0, discountAmount),
    shipping: 0, // always free shipping with promo
    cheapestIndex,
  }
}
