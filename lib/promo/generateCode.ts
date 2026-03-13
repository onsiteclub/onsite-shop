import { customAlphabet } from 'nanoid'

// Uppercase letters + numbers, no ambiguous chars (0, O, I, 1)
const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8)

/**
 * Generates a human-readable promo code.
 * Format: ONSITE-XXXXXXXX
 * Example: ONSITE-K7M3PQ2R
 */
export function generatePromoCode(): string {
  return `ONSITE-${nanoid()}`
}
