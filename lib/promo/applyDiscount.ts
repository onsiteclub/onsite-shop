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
  cheapestIndex: number   // which item got discounted
}

export function applyPromoDiscount(
  items: CartItemForDiscount[],
  promoActive: boolean
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

  // Find cheapest item (by unit price) — that one goes to $0.10 (10 cents)
  const cheapestIndex = items.reduce(
    (minIdx, item, idx) => (item.price < items[minIdx].price ? idx : minIdx),
    0
  )

  const discountAmount = items[cheapestIndex].price - 10 // 10 cents = $0.10

  return {
    subtotal,
    discountAmount: Math.max(0, discountAmount),
    total: subtotal - Math.max(0, discountAmount),
    shipping: 0, // always free shipping with promo
    cheapestIndex,
  }
}
