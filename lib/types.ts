export interface Product {
  product_key: string;   // key from STRIPE_PRODUCTS (e.g. 'cotton-tee')
  name: string;
  price: number;         // dollars (for display)
  price_id: string;      // Stripe Price ID
  category: string;
  product_type: string;  // cotton-tee | sport-tee | hoodie | cap | sticker-kit
  image: string;
  images: string[];
  description: string;
  sizes: string[];
  colors: string[];
  color_images: Record<string, string[]>;
  sku: string;
  isVideo?: boolean;
}
