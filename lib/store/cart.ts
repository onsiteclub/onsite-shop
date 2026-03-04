import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TYPES
// ============================================

export interface CartItem {
  product_key: string;   // key from STRIPE_PRODUCTS (e.g. 'cotton-tee')
  price_id: string;      // Stripe Price ID
  name: string;
  design: string;
  color: string;
  size: string;
  price: number;         // cents (CAD)
  quantity: number;
  image: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (product_key: string, color: string, size: string) => void;
  updateQuantity: (product_key: string, color: string, size: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

// ============================================
// STORE
// ============================================

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => set((state) => {
        const existing = state.items.find(
          i => i.product_key === newItem.product_key
            && i.color === newItem.color
            && i.size === newItem.size
        );
        if (existing) {
          return {
            items: state.items.map(i =>
              i === existing ? { ...i, quantity: i.quantity + 1 } : i
            ),
          };
        }
        return { items: [...state.items, { ...newItem, quantity: 1 }] };
      }),

      removeItem: (product_key, color, size) => set((state) => ({
        items: state.items.filter(
          i => !(i.product_key === product_key && i.color === color && i.size === size)
        ),
      })),

      updateQuantity: (product_key, color, size, quantity) => set((state) => ({
        items: quantity <= 0
          ? state.items.filter(
              i => !(i.product_key === product_key && i.color === color && i.size === size)
            )
          : state.items.map(i =>
              i.product_key === product_key && i.color === color && i.size === size
                ? { ...i, quantity }
                : i
            ),
      })),

      clearCart: () => set({ items: [] }),

      getSubtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'onsite-cart' }
  )
);
