import type { Product } from './types';

// Strip technical codes from product names (e.g. "OnSite DryBlend Tee — Frase #016" → "OnSite DryBlend Tee")
export function cleanProductName(name: string): string {
  return name.replace(/\s*[—–-]\s*(Frase|Design|Style|Code|Ref|SKU)\s*#?\d+.*/i, '').trim();
}

// Short commercial tagline by product type
export function getProductTagline(product: Product): string {
  const type = product.product_type;
  if (type === 'cotton-tee') return 'Premium cotton. Job-site tough, street-ready style.';
  if (type === 'sport-tee') return 'Moisture-wicking performance for those who never stop.';
  if (type === 'hoodie') return 'Warm, durable, and built for the crew.';
  if (type === 'cap') return 'One size fits all. Rep the crew everywhere.';
  if (type === 'sticker-kit') return 'Stick it on your hardhat, toolbox, or truck.';
  return 'Built for those who build.';
}
