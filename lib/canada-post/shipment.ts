/**
 * Canada Post Shipment API — create shipments & download labels
 * Error codes reference: docs/canada-post-errors.md
 */

import { XMLParser } from 'fast-xml-parser'
import { cpFetch } from './client'
import type { CreateShipmentRequest, CreateShipmentResponse } from './types'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
})

/**
 * Create a shipment and return tracking pin + label URL.
 * Uses contract API if CANADAPOST_CONTRACT_ID is set, otherwise non-contract.
 */
export async function createShipment(req: CreateShipmentRequest): Promise<CreateShipmentResponse> {
  const customerNumber = process.env.CANADAPOST_CUSTOMER_NUMBER!
  const contractId = process.env.CANADAPOST_CONTRACT_ID

  if (contractId) {
    return createContractShipment(req, customerNumber, contractId)
  }
  return createNonContractShipment(req, customerNumber)
}

// ============================================
// CONTRACT SHIPMENT (sandbox + accounts with contract)
// ============================================

async function createContractShipment(
  req: CreateShipmentRequest,
  customerNumber: string,
  contractId: string,
): Promise<CreateShipmentResponse> {
  const originPostal = req.sender.postalCode.replace(/\s/g, '').toUpperCase()
  const destPostal = req.destination.postalCode.replace(/\s/g, '').toUpperCase()
  const groupId = `order-${Date.now()}`

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<shipment xmlns="http://www.canadapost.ca/ws/shipment-v8">
  <group-id>${groupId}</group-id>
  <requested-shipping-point>${originPostal}</requested-shipping-point>
  <delivery-spec>
    <service-code>${req.serviceCode}</service-code>
    <sender>
      <name>${escapeXml(req.sender.name)}</name>
${req.sender.company ? `      <company>${escapeXml(req.sender.company)}</company>` : ''}
      <contact-phone>${escapeXml(req.sender.phone || '000-000-0000')}</contact-phone>
      <address-details>
        <address-line-1>${escapeXml(req.sender.addressLine1)}</address-line-1>
        <city>${escapeXml(req.sender.city)}</city>
        <prov-state>${req.sender.province}</prov-state>
        <country-code>CA</country-code>
        <postal-zip-code>${originPostal}</postal-zip-code>
      </address-details>
    </sender>
    <destination>
      <name>${escapeXml(req.destination.name)}</name>
${req.destination.company ? `      <company>${escapeXml(req.destination.company)}</company>` : ''}
      <address-details>
        <address-line-1>${escapeXml(req.destination.addressLine1)}</address-line-1>
${req.destination.addressLine2 ? `        <address-line-2>${escapeXml(req.destination.addressLine2)}</address-line-2>` : ''}
        <city>${escapeXml(req.destination.city)}</city>
        <prov-state>${req.destination.province}</prov-state>
        <country-code>${req.destination.country || 'CA'}</country-code>
        <postal-zip-code>${destPostal}</postal-zip-code>
      </address-details>
    </destination>
    <options>
      <option>
        <option-code>DC</option-code>
      </option>
    </options>
    <parcel-characteristics>
      <weight>${Math.max(0.01, req.weight).toFixed(3)}</weight>
      <dimensions>
        <length>${req.dimensions.length.toFixed(1)}</length>
        <width>${req.dimensions.width.toFixed(1)}</width>
        <height>${req.dimensions.height.toFixed(1)}</height>
      </dimensions>
    </parcel-characteristics>
${req.customerEmail ? `    <notification>
      <email>${escapeXml(req.customerEmail)}</email>
      <on-shipment>true</on-shipment>
      <on-exception>true</on-exception>
      <on-delivery>true</on-delivery>
    </notification>` : ''}
    <preferences>
      <show-packing-instructions>true</show-packing-instructions>
      <show-postage-rate>false</show-postage-rate>
      <show-insured-value>false</show-insured-value>
    </preferences>
${req.orderNumber ? `    <references>
      <customer-ref-1>${escapeXml(req.orderNumber)}</customer-ref-1>
    </references>` : ''}
    <settlement-info>
      <contract-id>${contractId}</contract-id>
      <intended-method-of-payment>CreditCard</intended-method-of-payment>
    </settlement-info>
  </delivery-spec>
</shipment>`

  const { status, text } = await cpFetch(
    `/rs/${customerNumber}/${customerNumber}/shipment`,
    {
      method: 'POST',
      body: xml,
      contentType: 'application/vnd.cpc.shipment-v8+xml',
      accept: 'application/vnd.cpc.shipment-v8+xml',
    }
  )

  if (status !== 200) {
    console.error(`[Canada Post] Contract Shipment API ${status}:`, text)
    const errorMsg = parseErrorMessage(text) || `Shipment creation failed (${status})`
    return { shipmentId: '', trackingPin: '', labelUrl: '', links: [], error: errorMsg }
  }

  const result = parseShipmentResponse(text, 'shipment-info')
  result.groupId = groupId
  return result
}

// ============================================
// NON-CONTRACT SHIPMENT (simpler, no manifest needed)
// ============================================

async function createNonContractShipment(
  req: CreateShipmentRequest,
  customerNumber: string,
): Promise<CreateShipmentResponse> {
  const originPostal = req.sender.postalCode.replace(/\s/g, '').toUpperCase()
  const destPostal = req.destination.postalCode.replace(/\s/g, '').toUpperCase()

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<non-contract-shipment xmlns="http://www.canadapost.ca/ws/ncshipment-v4">
  <requested-shipping-point>${originPostal}</requested-shipping-point>
  <delivery-spec>
    <service-code>${req.serviceCode}</service-code>
    <sender>
      <name>${escapeXml(req.sender.name)}</name>
${req.sender.company ? `      <company>${escapeXml(req.sender.company)}</company>` : ''}
      <contact-phone>${escapeXml(req.sender.phone || '000-000-0000')}</contact-phone>
      <address-details>
        <address-line-1>${escapeXml(req.sender.addressLine1)}</address-line-1>
        <city>${escapeXml(req.sender.city)}</city>
        <prov-state>${req.sender.province}</prov-state>
        <postal-zip-code>${originPostal}</postal-zip-code>
      </address-details>
    </sender>
    <destination>
      <name>${escapeXml(req.destination.name)}</name>
${req.destination.company ? `      <company>${escapeXml(req.destination.company)}</company>` : ''}
      <address-details>
        <address-line-1>${escapeXml(req.destination.addressLine1)}</address-line-1>
${req.destination.addressLine2 ? `        <address-line-2>${escapeXml(req.destination.addressLine2)}</address-line-2>` : ''}
        <city>${escapeXml(req.destination.city)}</city>
        <prov-state>${req.destination.province}</prov-state>
        <country-code>${req.destination.country || 'CA'}</country-code>
        <postal-zip-code>${destPostal}</postal-zip-code>
      </address-details>
    </destination>
    <options>
      <option>
        <option-code>DC</option-code>
      </option>
    </options>
    <parcel-characteristics>
      <weight>${Math.max(0.01, req.weight).toFixed(3)}</weight>
      <dimensions>
        <length>${req.dimensions.length.toFixed(1)}</length>
        <width>${req.dimensions.width.toFixed(1)}</width>
        <height>${req.dimensions.height.toFixed(1)}</height>
      </dimensions>
    </parcel-characteristics>
${req.customerEmail ? `    <notification>
      <email>${escapeXml(req.customerEmail)}</email>
      <on-shipment>true</on-shipment>
      <on-exception>true</on-exception>
      <on-delivery>true</on-delivery>
    </notification>` : ''}
    <preferences>
      <show-packing-instructions>true</show-packing-instructions>
      <show-postage-rate>false</show-postage-rate>
      <show-insured-value>false</show-insured-value>
    </preferences>
${req.orderNumber ? `    <references>
      <customer-ref-1>${escapeXml(req.orderNumber)}</customer-ref-1>
    </references>` : ''}
  </delivery-spec>
</non-contract-shipment>`

  const { status, text } = await cpFetch(`/rs/${customerNumber}/ncshipment`, {
    method: 'POST',
    body: xml,
    contentType: 'application/vnd.cpc.ncshipment-v4+xml',
    accept: 'application/vnd.cpc.ncshipment-v4+xml',
  })

  if (status !== 200) {
    console.error(`[Canada Post] NC Shipment API ${status}:`, text)
    const errorMsg = parseErrorMessage(text) || `Shipment creation failed (${status})`
    return { shipmentId: '', trackingPin: '', labelUrl: '', links: [], error: errorMsg }
  }

  return parseShipmentResponse(text, 'non-contract-shipment-info')
}

/**
 * Download the shipping label PDF as a Buffer.
 */
export async function downloadLabel(labelUrl: string): Promise<{ pdf: Buffer; error?: string }> {
  const auth = 'Basic ' + Buffer.from(
    `${process.env.CANADAPOST_API_USER}:${process.env.CANADAPOST_API_PASSWORD}`
  ).toString('base64')

  const res = await fetch(labelUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/pdf',
      Authorization: auth,
      'Accept-language': 'en-CA',
    },
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error(`[Canada Post] Label download ${res.status}:`, errText)
    return { pdf: Buffer.alloc(0), error: `Label download failed (${res.status})` }
  }

  const arrayBuffer = await res.arrayBuffer()
  return { pdf: Buffer.from(arrayBuffer) }
}

/**
 * Transmit shipments to finalize them and generate a manifest.
 * Required for contract shipments — without this, tracking won't activate
 * and labels show "MANIFEST REQ". See docs/canada-post-use-cases.md
 */
export async function transmitShipments(groupIds: string[]): Promise<{ manifestUrl: string; error?: string }> {
  const customerNumber = process.env.CANADAPOST_CUSTOMER_NUMBER!

  const groupElements = groupIds.map(id => `    <group-id>${escapeXml(id)}</group-id>`).join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<transmit-set xmlns="http://www.canadapost.ca/ws/manifest-v8">
  <group-ids>
${groupElements}
  </group-ids>
  <requested-shipping-point>${(process.env.CANADAPOST_ORIGIN_POSTAL || '').replace(/\s/g, '').toUpperCase()}</requested-shipping-point>
  <cpc-pickup-indicator>true</cpc-pickup-indicator>
  <detailed-manifests>true</detailed-manifests>
  <method-of-payment>CreditCard</method-of-payment>
  <manifest-address>
    <manifest-company>${escapeXml(process.env.CANADAPOST_SENDER_COMPANY || 'Onsite Club')}</manifest-company>
    <phone-number>${escapeXml(process.env.CANADAPOST_SENDER_PHONE || '000-000-0000')}</phone-number>
    <address-details>
      <address-line-1>${escapeXml(process.env.CANADAPOST_SENDER_ADDRESS || '')}</address-line-1>
      <city>${escapeXml(process.env.CANADAPOST_SENDER_CITY || '')}</city>
      <prov-state>${process.env.CANADAPOST_SENDER_PROVINCE || 'ON'}</prov-state>
      <postal-zip-code>${(process.env.CANADAPOST_ORIGIN_POSTAL || '').replace(/\s/g, '').toUpperCase()}</postal-zip-code>
    </address-details>
  </manifest-address>
</transmit-set>`

  const { status, text } = await cpFetch(
    `/rs/${customerNumber}/${customerNumber}/manifest`,
    {
      method: 'POST',
      body: xml,
      contentType: 'application/vnd.cpc.manifest-v8+xml',
      accept: 'application/vnd.cpc.manifest-v8+xml',
    }
  )

  if (status !== 200) {
    console.error(`[Canada Post] Transmit API ${status}:`, text)
    const errorMsg = parseErrorMessage(text) || `Transmit failed (${status})`
    return { manifestUrl: '', error: errorMsg }
  }

  try {
    const parsed = parser.parse(text)
    const manifests = parsed.manifests
    if (!manifests) {
      console.log('[Canada Post] Transmit response:', text)
      return { manifestUrl: '', error: 'Unexpected transmit response format' }
    }

    // Extract manifest links
    const rawLinks = manifests.link || manifests.links?.link
    const linksArr = Array.isArray(rawLinks) ? rawLinks : rawLinks ? [rawLinks] : []
    const manifestLink = linksArr.find((l: any) => l['@_rel'] === 'manifest')

    return {
      manifestUrl: manifestLink?.['@_href'] || '',
    }
  } catch (err) {
    console.error('[Canada Post] Transmit parse error:', err)
    return { manifestUrl: '', error: 'Failed to parse transmit response' }
  }
}

// ---- Helpers ----

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function parseShipmentResponse(xml: string, rootElement: string): CreateShipmentResponse {
  try {
    const parsed = parser.parse(xml)
    const info = parsed[rootElement]

    if (!info) {
      return { shipmentId: '', trackingPin: '', labelUrl: '', links: [], error: 'Unexpected response format' }
    }

    const links: { rel: string; href: string; mediaType: string }[] = []
    const rawLinks = info.links?.link
    const linksArr = Array.isArray(rawLinks) ? rawLinks : rawLinks ? [rawLinks] : []

    for (const l of linksArr) {
      links.push({
        rel: l['@_rel'] || '',
        href: l['@_href'] || '',
        mediaType: l['@_media-type'] || '',
      })
    }

    const labelLink = links.find(l => l.rel === 'label')

    return {
      shipmentId: String(info['shipment-id'] || ''),
      trackingPin: String(info['tracking-pin'] || ''),
      labelUrl: labelLink?.href || '',
      links,
    }
  } catch (err) {
    console.error('[Canada Post] Shipment parse error:', err)
    return { shipmentId: '', trackingPin: '', labelUrl: '', links: [], error: 'Failed to parse shipment response' }
  }
}

function parseErrorMessage(xml: string): string | null {
  try {
    const parsed = parser.parse(xml)
    const messages = parsed.messages?.message
    if (!messages) return null
    const arr = Array.isArray(messages) ? messages : [messages]
    return arr.map((m: any) => m.description || m.code || 'Unknown error').join('; ')
  } catch {
    return null
  }
}
