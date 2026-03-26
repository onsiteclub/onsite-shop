/** Canada Post Rating API — fetches shipping quotes */

import { XMLParser } from 'fast-xml-parser'
import { cpFetch } from './client'
import type { RateRequest, RateQuote, RateResponse } from './types'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
})

/** Preferred services for small-business e-commerce */
const PREFERRED_SERVICES = [
  'DOM.RP',   // Regular Parcel
  'DOM.EP',   // Expedited Parcel
  'DOM.XP',   // Xpresspost
  'DOM.PC',   // Priority
]

/**
 * Get shipping rate quotes from Canada Post.
 * Uses contract pricing if CANADAPOST_CONTRACT_ID is set.
 */
export async function getRates(req: RateRequest): Promise<RateResponse> {
  const customerNumber = process.env.CANADAPOST_CUSTOMER_NUMBER!
  const contractId = process.env.CANADAPOST_CONTRACT_ID

  // Normalize postal codes: uppercase, no spaces
  const origin = req.originPostal.replace(/\s/g, '').toUpperCase()
  const dest = req.destinationPostal.replace(/\s/g, '').toUpperCase()

  // Clamp weight: minimum 0.01 kg for Canada Post
  const weight = Math.max(0.01, req.weight)
  const { length, width, height } = req.dimensions

  const contractXml = contractId
    ? `  <contract-id>${contractId}</contract-id>\n`
    : ''

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<mailing-scenario xmlns="http://www.canadapost.ca/ws/ship/rate-v4">
  <customer-number>${customerNumber}</customer-number>
${contractXml}  <parcel-characteristics>
    <weight>${weight.toFixed(3)}</weight>
    <dimensions>
      <length>${length.toFixed(1)}</length>
      <width>${width.toFixed(1)}</width>
      <height>${height.toFixed(1)}</height>
    </dimensions>
  </parcel-characteristics>
  <origin-postal-code>${origin}</origin-postal-code>
  <destination>
    <domestic>
      <postal-code>${dest}</postal-code>
    </domestic>
  </destination>
</mailing-scenario>`

  // Contract rates use /rs/{customer}/{customer}/ship/price
  // Non-contract uses /rs/ship/price
  const fetchRates = async (useContract: boolean) => {
    const body = useContract ? xml : xml.replace(/<contract-id>.*<\/contract-id>\n?\s*/, '')
    const path = useContract
      ? `/rs/${customerNumber}/${customerNumber}/ship/price`
      : '/rs/ship/price'
    return cpFetch(path, {
      method: 'POST',
      body,
      contentType: 'application/vnd.cpc.ship.rate-v4+xml',
      accept: 'application/vnd.cpc.ship.rate-v4+xml',
    })
  }

  let { status, text } = contractId
    ? await fetchRates(true)
    : await fetchRates(false)

  // Contract endpoint may return empty in sandbox — fall back to non-contract
  if (contractId && (status !== 200 || !text.trim())) {
    console.warn('[Canada Post] Contract endpoint empty, falling back to non-contract')
    ;({ status, text } = await fetchRates(false))
  }

  if (status !== 200) {
    console.error(`[Canada Post] Rating API ${status}:`, text)
    return { quotes: [], error: `Canada Post API error (${status})` }
  }

  if (!text.trim()) {
    return { quotes: [], error: 'Empty response from Canada Post' }
  }

  return parseRateResponse(text)
}

function parseRateResponse(xml: string): RateResponse {
  try {
    const parsed = parser.parse(xml)
    const priceQuotes = parsed['price-quotes']?.['price-quote']

    if (!priceQuotes) {
      return { quotes: [], error: 'No quotes returned' }
    }

    // Ensure array (single quote comes as object)
    const quotesArr = Array.isArray(priceQuotes) ? priceQuotes : [priceQuotes]

    const quotes: RateQuote[] = quotesArr
      .filter((q: any) => PREFERRED_SERVICES.includes(q['service-code']))
      .map((q: any) => {
        const priceDetails = q['price-details']
        const total = parseFloat(priceDetails?.due || '0')
        const transit = q['service-standard']?.['expected-transit-time']
        const deliveryDate = q['service-standard']?.['expected-delivery-date']

        return {
          serviceCode: q['service-code'],
          serviceName: q['service-name'],
          priceTotal: total,
          priceTotalCents: Math.round(total * 100),
          expectedTransitDays: transit ? parseInt(transit) : null,
          expectedDeliveryDate: deliveryDate || null,
          guaranteedDelivery: q['service-standard']?.['guaranteed-delivery'] === 'true',
        }
      })
      .sort((a: RateQuote, b: RateQuote) => a.priceTotal - b.priceTotal)

    return { quotes }
  } catch (err) {
    console.error('[Canada Post] XML parse error:', err)
    return { quotes: [], error: 'Failed to parse rating response' }
  }
}
