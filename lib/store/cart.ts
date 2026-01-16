import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================
// TYPES - Share these with Auth Hub
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

export interface CartState {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
}

export interface CartActions {
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (variant_id: string) => void;
  updateQuantity: (variant_id: string, quantity: number) => void;
  clearCart: () => void;
  getCartForCheckout: () => CartState;
}

// ============================================
// CONSTANTS
// ============================================

const FREE_SHIPPING_THRESHOLD = 50;
const SHIPPING_COST = 9.99;

// ============================================
// STORE
// ============================================

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      // State
      items: [],
      subtotal: 0,
      shipping: 0,
      total: 0,

      // Actions
      addItem: (item) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.variant_id === item.variant_id
          );

          let newItems: CartItem[];

          if (existingIndex >= 0) {
            // Update quantity if item exists
            newItems = state.items.map((i, idx) =>
              idx === existingIndex
                ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                : i
            );
          } else {
            // Add new item
            newItems = [
              ...state.items,
              { ...item, quantity: item.quantity || 1 },
            ];
          }

          return calculateTotals(newItems);
        });
      },

      removeItem: (variant_id) => {
        set((state) => {
          const newItems = state.items.filter((i) => i.variant_id !== variant_id);
          return calculateTotals(newItems);
        });
      },

      updateQuantity: (variant_id, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            const newItems = state.items.filter((i) => i.variant_id !== variant_id);
            return calculateTotals(newItems);
          }

          const newItems = state.items.map((i) =>
            i.variant_id === variant_id ? { ...i, quantity } : i
          );
          return calculateTotals(newItems);
        });
      },

      clearCart: () => {
        set({
          items: [],
          subtotal: 0,
          shipping: 0,
          total: 0,
        });
      },

      getCartForCheckout: () => {
        const state = get();
        return {
          items: state.items,
          subtotal: state.subtotal,
          shipping: state.shipping,
          total: state.total,
        };
      },
    }),
    {
      name: 'onsite-cart', // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ============================================
// HELPERS
// ============================================

function calculateTotals(items: CartItem[]): CartState {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;

  return {
    items,
    subtotal: Math.round(subtotal * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

// ============================================
// CHECKOUT HELPER - Use this before redirect
// ============================================

import { createClient } from '@supabase/supabase-js';

// Lazy initialization to avoid build errors
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase environment variables not configured');
  }

  return createClient(url, key);
}

/**
 * Saves cart to temp_carts table and returns checkout URL
 *
 * Usage in Shop:
 * const checkoutUrl = await saveCartAndGetCheckoutUrl();
 * window.location.href = checkoutUrl;
 */
export async function saveCartAndGetCheckoutUrl(): Promise<string> {
  const supabase = getSupabaseClient();
  const cart = useCartStore.getState().getCartForCheckout();

  if (cart.items.length === 0) {
    throw new Error('Cart is empty');
  }

  // Get current user if logged in
  const { data: { user } } = await supabase.auth.getUser();

  // Save to temp_carts
  const { data, error } = await supabase
    .from('temp_carts')
    .insert({
      user_id: user?.id || null,
      items: cart.items,
      subtotal: cart.subtotal,
      shipping: cart.shipping,
      total: cart.total,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to save cart:', error);
    throw new Error('Failed to save cart');
  }

  // Build checkout URL
  const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'https://auth.onsiteclub.ca';
  const shopUrl = process.env.NEXT_PUBLIC_SHOP_URL || window.location.origin;

  const checkoutUrl = new URL(`${authUrl}/checkout/shop`);
  checkoutUrl.searchParams.set('cart_id', data.id);
  checkoutUrl.searchParams.set('return_url', shopUrl);

  return checkoutUrl.toString();
}

// ============================================
// EXPORT FOR AUTH HUB REFERENCE
// ============================================

/**
 * AUTH HUB INTEGRATION
 * 
 * 1. temp_carts table structure:
 * {
 *   id: UUID (auto-generated)
 *   user_id: UUID | null
 *   items: CartItem[] (JSONB)
 *   subtotal: number
 *   shipping: number  
 *   total: number
 *   created_at: timestamp
 *   expires_at: timestamp (24h from creation)
 * }
 * 
 * 2. Checkout URL format:
 * https://auth.onsiteclub.ca/checkout/shop?cart_id=xxx&return_url=https://shop.onsiteclub.ca
 * 
 * 3. Auth Hub should:
 *    - Fetch cart from temp_carts using cart_id
 *    - Verify/collect user address
 *    - Create Stripe Checkout Session with line_items from cart
 *    - Include metadata: { type: 'shop_order', order_id, cart_id }
 * 
 * 4. Webhook (checkout.session.completed):
 *    - Check if metadata.type === 'shop_order'
 *    - Update order status to 'paid'
 *    - Create order_items from cart.items
 *    - Delete temp_cart
 */
