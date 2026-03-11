import Stripe from 'stripe';

// ============================================
// SINGLE SOURCE OF TRUTH — Products & Prices
// ============================================

export const STRIPE_PRODUCTS = {
  'cotton-tee': {
    name: 'OnSite Cotton Tee',
    priceId: 'price_1T6yaQGntiIt3xkawNdIb3ek',
    price: 2999,
    sku: 'OS-CTN-TEE',
    sizes: ['M', 'L', 'XL'],
    category: 'apparel',
  },
  'sport-tee': {
    name: 'OnSite Sport Tee',
    priceId: 'price_1T6ybPGntiIt3xkaA7NoCQ4e',
    price: 3499,
    sku: 'OS-SPT-TEE',
    sizes: ['M', 'L', 'XL'],
    category: 'apparel',
  },
  'hoodie': {
    name: 'OnSite Hoodie',
    priceId: 'price_1T6ydIGntiIt3xkaOI5uKbgH',
    price: 4999,
    sku: 'OS-HOODIE',
    sizes: ['M', 'L', 'XL'],
    category: 'apparel',
  },
  'cap': {
    name: 'OnSite Cap',
    priceId: 'price_1T6ylSGntiIt3xka7i5gMdhM',
    price: 3999,
    sku: 'OS-CP',
    sizes: ['One Size'],
    category: 'apparel',
  },
  'sticker-kit': {
    name: 'OnSite Sticker Kit',
    priceId: 'price_1T6yfRGntiIt3xkaNuMeFJSF',
    price: 999,
    sku: 'OS-STICKER',
    sizes: [],
    category: 'sticker',
  },
} as const;

export type ProductKey = keyof typeof STRIPE_PRODUCTS;

// ============================================
// SHIPPING OPTIONS
// ============================================

export const SHIPPING_OPTIONS: Stripe.Checkout.SessionCreateParams.ShippingOption[] = [
  {
    shipping_rate_data: {
      type: 'fixed_amount',
      fixed_amount: { amount: 999, currency: 'cad' },
      display_name: 'Ontario',
      delivery_estimate: {
        minimum: { unit: 'business_day', value: 3 },
        maximum: { unit: 'business_day', value: 5 },
      },
    },
  },
  {
    shipping_rate_data: {
      type: 'fixed_amount',
      fixed_amount: { amount: 1199, currency: 'cad' },
      display_name: 'Montreal / Quebec',
      delivery_estimate: {
        minimum: { unit: 'business_day', value: 3 },
        maximum: { unit: 'business_day', value: 7 },
      },
    },
  },
  {
    shipping_rate_data: {
      type: 'fixed_amount',
      fixed_amount: { amount: 1299, currency: 'cad' },
      display_name: 'Maritimes (NB/NS/PEI/NL)',
      delivery_estimate: {
        minimum: { unit: 'business_day', value: 5 },
        maximum: { unit: 'business_day', value: 10 },
      },
    },
  },
  {
    shipping_rate_data: {
      type: 'fixed_amount',
      fixed_amount: { amount: 1499, currency: 'cad' },
      display_name: 'Western Canada (MB/SK/AB/BC)',
      delivery_estimate: {
        minimum: { unit: 'business_day', value: 5 },
        maximum: { unit: 'business_day', value: 10 },
      },
    },
  },
  {
    shipping_rate_data: {
      type: 'fixed_amount',
      fixed_amount: { amount: 1999, currency: 'cad' },
      display_name: 'Northern Canada (YT/NT/NU)',
      delivery_estimate: {
        minimum: { unit: 'business_day', value: 7 },
        maximum: { unit: 'business_day', value: 14 },
      },
    },
  },
];

export const FREE_SHIPPING_OPTION: Stripe.Checkout.SessionCreateParams.ShippingOption = {
  shipping_rate_data: {
    type: 'fixed_amount',
    fixed_amount: { amount: 0, currency: 'cad' },
    display_name: 'Free Shipping (orders over $50)',
  },
};

export const FREE_SHIPPING_THRESHOLD = 5000; // $50 in cents

// ============================================
// PROVINCE → SHIPPING COST (auto-calculated)
// ============================================

export const PROVINCE_SHIPPING: Record<string, { cost: number; region: string }> = {
  ON: { cost: 999, region: 'Ontario' },
  QC: { cost: 1199, region: 'Quebec' },
  NB: { cost: 1299, region: 'Maritimes' },
  NS: { cost: 1299, region: 'Maritimes' },
  PE: { cost: 1299, region: 'Maritimes' },
  NL: { cost: 1299, region: 'Maritimes' },
  MB: { cost: 1499, region: 'Western Canada' },
  SK: { cost: 1499, region: 'Western Canada' },
  AB: { cost: 1499, region: 'Western Canada' },
  BC: { cost: 1499, region: 'Western Canada' },
  YT: { cost: 1999, region: 'Northern Canada' },
  NT: { cost: 1999, region: 'Northern Canada' },
  NU: { cost: 1999, region: 'Northern Canada' },
};

export const PROVINCES = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland & Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'YT', name: 'Yukon' },
] as const;

export function getShippingCost(province: string, subtotal: number): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return PROVINCE_SHIPPING[province]?.cost ?? 1499;
}
