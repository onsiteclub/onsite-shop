// ============================================
// DATABASE TYPES
// ============================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Relations
  category?: Category;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string | null;
  size: string | null;
  color: string | null;
  price_override: number | null;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  street_address: string;
  apartment: string | null;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shipping_address_id: string | null;
  shipping_address: Address | null;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  notes: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  items?: OrderItem[];
}

export type OrderStatus = 
  | 'pending' 
  | 'paid' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  product_image: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

// ============================================
// CART TYPES (shared with Auth Hub)
// ============================================

export interface CartItem {
  product_id: string;
  variant_id: string;
  name: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
}

export interface TempCart {
  id: string;
  user_id: string | null;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  created_at: string;
  expires_at: string;
}

// ============================================
// UI TYPES
// ============================================

export interface FloatingProduct extends Product {
  x: number;
  y: number;
  zone: 'left' | 'center' | 'right';
  scale: number;
  speed: number;
  uniqueKey: string;
}

export type CategorySlug = 'mens' | 'womens' | 'members';

// ============================================
// API TYPES
// ============================================

export interface CheckoutRequest {
  cart_id: string;
  address_id: string;
}

export interface CheckoutResponse {
  url: string;
  order_id: string;
  order_number: string;
}

export interface ApiError {
  error: string;
  message?: string;
}
