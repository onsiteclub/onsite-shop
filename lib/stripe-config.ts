import Stripe from 'stripe';

// ============================================
// SINGLE SOURCE OF TRUTH — Products & Prices
// ============================================

export const STRIPE_PRODUCTS = {
  'cotton-tee': {
    name: 'OnSite Cotton Tee',
    priceId: 'price_1TFH7oKGyu88MA3NhRqoTVon',
    price: 2999,
    sku: 'OS-CTN-TEE',
    sizes: ['M', 'L', 'XL'],
    category: 'apparel',
  },
  'sport-tee': {
    name: 'OnSite Sport Tee',
    priceId: 'price_1TFH9CKGyu88MA3N6PU78UN7',
    price: 3499,
    sku: 'OS-SPT-TEE',
    sizes: ['M', 'L', 'XL'],
    category: 'apparel',
  },
  'hoodie': {
    name: 'OnSite Hoodie',
    priceId: 'price_1TFHCgKGyu88MA3N3eBakq57',
    price: 4999,
    sku: 'OS-HOODIE',
    sizes: ['M', 'L', 'XL'],
    category: 'apparel',
  },
  'cap-premium': {
    name: 'OnSite Cap Premium',
    priceId: 'price_1TFHE9KGyu88MA3NUsJlC2ca',
    price: 3990,
    sku: 'OS-CP-PRM',
    sizes: ['One Size'],
    category: 'apparel',
  },
  'cap-classic': {
    name: 'OnSite Cap Classic',
    priceId: 'price_1TFHH7KGyu88MA3NXsrnCOkw',
    price: 2990,
    sku: 'OS-CP-CLS',
    sizes: ['One Size'],
    category: 'apparel',
  },
  'sticker-kit': {
    name: 'OnSite Sticker Kit',
    priceId: 'price_1TFHIoKGyu88MA3NJgLU8OyP',
    price: 990,
    sku: 'OS-STICKER',
    sizes: [],
    category: 'sticker',
  },
  'test-product': {
    name: 'OnSite Test Product',
    priceId: 'price_1TFdP0KGyu88MA3NqGk6mvxR',
    price: 10,
    sku: 'OS-TEST',
    sizes: ['One Size'],
    category: 'test',
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

// ============================================
// PRODUCT WEIGHTS & DIMENSIONS (for Canada Post)
// ============================================

export const PRODUCT_SHIPPING_INFO: Record<ProductKey, { weight: number; length: number; width: number; height: number }> = {
  'cotton-tee':   { weight: 0.25, length: 30, width: 22, height: 3 },
  'sport-tee':    { weight: 0.22, length: 30, width: 22, height: 3 },
  'hoodie':       { weight: 0.55, length: 35, width: 28, height: 5 },
  'cap-premium':  { weight: 0.15, length: 20, width: 18, height: 12 },
  'cap-classic':  { weight: 0.12, length: 20, width: 18, height: 12 },
  'sticker-kit':  { weight: 0.05, length: 25, width: 18, height: 1 },
  'test-product': { weight: 0.01, length: 1, width: 1, height: 1 },
};

/** Calculate total package weight & bounding box for a cart */
export function calculatePackage(items: { productKey: string; quantity: number }[]): {
  weight: number
  length: number
  width: number
  height: number
} {
  let totalWeight = 0;
  let maxLength = 0;
  let maxWidth = 0;
  let totalHeight = 0;

  for (const item of items) {
    const info = PRODUCT_SHIPPING_INFO[item.productKey as ProductKey];
    if (!info) continue;
    totalWeight += info.weight * item.quantity;
    maxLength = Math.max(maxLength, info.length);
    maxWidth = Math.max(maxWidth, info.width);
    totalHeight += info.height * item.quantity;
  }

  // Add packaging overhead for real products only
  const isMinimal = maxLength <= 1 && maxWidth <= 1;
  if (!isMinimal) {
    totalWeight += 0.10; // ~100g packaging
    totalHeight = Math.max(totalHeight + 2, 5); // +2cm for packaging, min 5cm
  } else {
    totalHeight = Math.max(totalHeight, 1);
  }

  return {
    weight: Math.max(0.01, totalWeight),
    length: Math.max(maxLength, isMinimal ? 10 : 15),
    width: Math.max(maxWidth, isMinimal ? 7 : 10),
    height: Math.min(totalHeight, 40),
  };
}
