'use client';

import { useCartStore } from '@/lib/store/cart';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/stripe-config';
import { useState } from 'react';
import Link from 'next/link';
import { CheckoutModal } from '@/components/checkout/CheckoutModal';

const fmt = (cents: number) => `CA$${(cents / 100).toFixed(2)}`;

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  const [showCheckout, setShowCheckout] = useState(false);

  const subtotal = getSubtotal();
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const freeShippingRemaining = FREE_SHIPPING_THRESHOLD - subtotal;

  // --- Empty cart ---
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
          <nav className="flex items-center justify-between mb-16">
            <Link href="/" className="font-display text-lg font-bold text-text-primary">
              ONSITE SHOP
            </Link>
            <Link href="/" className="text-sm text-text-secondary hover:text-text-primary">
              &larr; Continue shopping
            </Link>
          </nav>

          <div className="text-center py-20">
            <div className="mx-auto mb-6 w-16 h-16 text-warm-300">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-text-primary mb-4">
              Your cart is empty
            </h1>
            <p className="text-text-secondary mb-8">
              Add some products!
            </p>
            <Link href="/" className="btn-primary-new inline-block">
              Browse products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- Cart with items ---
  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-0">
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        <nav className="flex items-center justify-between mb-10">
          <Link href="/" className="font-display text-lg font-bold text-text-primary">
            ONSITE SHOP
          </Link>
          <Link href="/" className="text-sm text-text-secondary hover:text-text-primary">
            &larr; Continue shopping
          </Link>
        </nav>

        <h1 className="font-display text-2xl font-bold text-text-primary mb-8">
          Your Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, idx) => (
              <div
                key={`${item.product_key}-${item.size}-${item.color}-${idx}`}
                className="bg-white rounded-2xl p-4 flex gap-4 border border-warm-200"
              >
                <div className="w-24 h-24 bg-warm-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-8 h-8 text-warm-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-display font-medium text-text-primary">{item.name}</h3>
                  <p className="text-sm text-text-secondary">
                    {item.color}{item.size ? ` — ${item.size}` : ''}
                  </p>
                  {item.design && (
                    <p className="text-xs text-warm-400">{item.design}</p>
                  )}
                  <p className="text-amber-dark font-bold mt-1">{fmt(item.price)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.product_key, item.color, item.size, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg bg-warm-100 hover:bg-warm-200 flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product_key, item.color, item.size, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-warm-100 hover:bg-warm-200 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.product_key, item.color, item.size)}
                  className="text-warm-400 hover:text-red-500 transition-colors"
                  aria-label={`Remove ${item.name}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            ))}

            <button
              onClick={() => { if (window.confirm('Remove all items from your cart?')) clearCart(); }}
              className="text-sm text-warm-400 hover:text-text-secondary"
            >
              Clear cart
            </button>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 border border-warm-200 lg:sticky lg:top-6">
              <h2 className="font-display font-bold text-text-primary mb-4">Summary</h2>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
                  <span className="text-text-primary font-medium">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Shipping</span>
                  <span className="text-warm-400 text-xs">Calculated at checkout</span>
                </div>
              </div>

              {/* Free shipping progress */}
              {!isFreeShipping && subtotal > 0 && (
                <div className="mb-4">
                  <div className="w-full h-1.5 bg-warm-200 rounded-full overflow-hidden mb-1.5">
                    <div
                      className="h-full bg-amber rounded-full transition-all"
                      style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-secondary">
                    Add {fmt(freeShippingRemaining)} more for <span className="font-medium text-green-600">free shipping!</span>
                  </p>
                </div>
              )}

              {isFreeShipping && (
                <div className="mb-4 p-2 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-700 font-medium text-center">
                    You qualify for free shipping!
                  </p>
                </div>
              )}

              <div className="border-t border-warm-200 pt-4 mb-4">
                <div className="flex justify-between">
                  <span className="font-bold text-text-primary">Estimated Total</span>
                  <span className="font-bold text-lg text-text-primary">{fmt(subtotal)}</span>
                </div>
              </div>

              <button
                onClick={() => setShowCheckout(true)}
                className="btn-amber w-full py-3.5 text-base"
              >
                Checkout
              </button>

              <p className="text-xs text-warm-400 text-center mt-3">
                Secure checkout via Stripe
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile checkout bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.08)] border-t border-warm-200 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="font-bold text-text-primary">{fmt(subtotal)}</span>
            <span className="text-[10px] text-warm-400 block">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
          </div>
          <button
            onClick={() => setShowCheckout(true)}
            className="btn-amber flex-1 max-w-[240px] py-3"
          >
            Checkout
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutModal onClose={() => setShowCheckout(false)} />
      )}
    </div>
  );
}
