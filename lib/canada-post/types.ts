/** Canada Post API types for Rating & Shipping */

export interface RateRequest {
  originPostal: string
  destinationPostal: string
  weight: number        // kg
  dimensions: {
    length: number      // cm
    width: number       // cm
    height: number      // cm
  }
}

export interface RateQuote {
  serviceCode: string
  serviceName: string
  priceTotal: number          // CAD dollars
  priceTotalCents: number     // CAD cents
  expectedTransitDays: number | null
  expectedDeliveryDate: string | null
  guaranteedDelivery: boolean
}

export interface RateResponse {
  quotes: RateQuote[]
  error?: string
}

/** Product weight/dimension config for shipping calculation */
export interface ProductShippingInfo {
  weight: number  // kg
  length: number  // cm
  width: number   // cm
  height: number  // cm
}

// ============================================
// SHIPMENT TYPES
// ============================================

export interface ShipmentAddress {
  name: string
  company?: string
  phone?: string
  addressLine1: string
  addressLine2?: string
  city: string
  province: string
  postalCode: string
  country?: string // defaults to CA
}

export interface CreateShipmentRequest {
  serviceCode: string          // e.g. DOM.EP, DOM.RP
  sender: ShipmentAddress
  destination: ShipmentAddress
  weight: number               // kg
  dimensions: { length: number; width: number; height: number } // cm
  customerEmail?: string       // for Canada Post email notifications
  orderNumber?: string         // reference stored with shipment
}

export interface CreateShipmentResponse {
  shipmentId: string
  trackingPin: string
  labelUrl: string             // URL to download PDF label
  groupId?: string             // group-id used for transmit (contract only)
  links: { rel: string; href: string; mediaType: string }[]
  error?: string
}
