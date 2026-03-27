import { NextRequest, NextResponse } from 'next/server'
import { getRates } from '@/lib/canada-post/rating'
import { calculatePackage, FREE_SHIPPING_THRESHOLD } from '@/lib/stripe-config'

export async function POST(req: NextRequest) {
  try {
    const { items, postalCode, province } = await req.json()

    if (!postalCode || !items?.length) {
      return NextResponse.json({ error: 'Missing postal code or items' }, { status: 400 })
    }

    // Validate Canadian postal code format
    const cleanPostal = postalCode.replace(/\s/g, '').toUpperCase()
    if (!/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(cleanPostal)) {
      return NextResponse.json({ error: 'Invalid postal code' }, { status: 400 })
    }

    const originPostal = process.env.CANADAPOST_ORIGIN_POSTAL || 'K2B8J6'
    const pkg = calculatePackage(
      items.map((i: any) => ({ productKey: i.product_key, quantity: i.quantity }))
    )

    // Calculate subtotal for free-shipping check
    const subtotal = items.reduce((sum: number, i: any) => sum + (i.price || 0) * (i.quantity || 1), 0)

    // Try Canada Post API
    const cpResult = await getRates({
      originPostal,
      destinationPostal: cleanPostal,
      weight: pkg.weight,
      dimensions: { length: pkg.length, width: pkg.width, height: pkg.height },
    })

    if (cpResult.quotes.length > 0) {
      // Apply free-shipping threshold
      const isFree = subtotal >= FREE_SHIPPING_THRESHOLD
      const quotes = cpResult.quotes.map(q => ({
        ...q,
        priceTotalCents: isFree ? 0 : q.priceTotalCents,
        priceTotal: isFree ? 0 : q.priceTotal,
        freeShipping: isFree,
      }))

      return NextResponse.json({
        source: 'canada-post',
        quotes,
        package: pkg,
      })
    }

    // No fallback — return empty quotes so frontend shows retry
    return NextResponse.json({
      source: 'canada-post',
      quotes: [],
      package: pkg,
      error: cpResult.error || 'No quotes from Canada Post',
    })
  } catch (err: any) {
    console.error('[shipping/rates] Error:', err)
    return NextResponse.json({ error: 'Failed to fetch rates' }, { status: 500 })
  }
}
