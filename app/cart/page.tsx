'use client';

import { useCartStore } from '@/lib/store/cart';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/stripe-config';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const [isLoading, setIsLoading] = useState(false);

  const subtotal = getSubtotal();

  const handleCheckout = () => {
    if (items.length === 0) return;
    setIsLoading(true);
    router.push('/checkout');
  };

  const fmt = (cents: number) => `CA$${(cents / 100).toFixed(2)}`;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-grain">
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
          <nav className="flex items-center justify-between mb-16">
            <Link href="/" className="font-mono text-lg font-bold text-stone-800">
              ONSITE SHOP
            </Link>
            <Link href="/" className="font-mono text-sm text-stone-500 hover:text-stone-800">
              ← Continue shopping
            </Link>
          </nav>

          <div className="text-center py-20">
            <p className="text-6xl mb-6">🛒</p>
            <h1 className="font-mono text-2xl font-bold text-stone-800 mb-4">
              Your cart is empty
            </h1>
            <p className="text-stone-500 mb-8">
              Add some products!
            </p>
            <Link href="/" className="btn-primary inline-block">
              Browse products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grain">
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        <nav className="flex items-center justify-between mb-10">
          <Link href="/" className="font-mono text-lg font-bold text-stone-800">
            ONSITE SHOP
          </Link>
          <Link href="/" className="font-mono text-sm text-stone-500 hover:text-stone-800">
            ← Continue shopping
          </Link>
        </nav>

        <h1 className="font-mono text-2xl font-bold text-stone-800 mb-8">
          Your Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
        </h1>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="md:col-span-2 space-y-4">
            {items.map((item, idx) => (
              <div
                key={`${item.product_key}-${item.size}-${item.color}-${idx}`}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 flex gap-4"
              >
                {/* Image */}
                <div className="w-24 h-24 bg-stone-100 rounded-xl flex items-center justify-center text-4xl shrink-0 overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    '📦'
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="font-mono font-medium text-stone-800">
                    {item.name}
                  </h3>
                  <p className="font-mono text-sm text-stone-500">
                    {item.color}{item.size ? ` — ${item.size}` : ''}
                  </p>
                  {item.design && (
                    <p className="font-mono text-xs text-stone-400">{item.design}</p>
                  )}
                  <p className="font-mono text-amber-600 font-bold mt-1">
                    {fmt(item.price)}
                  </p>
                </div>

                {/* Quantity */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.product_key, item.color, item.size, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="font-mono w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product_key, item.color, item.size, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.product_key, item.color, item.size)}
                  className="text-stone-400 hover:text-red-500 transition-colors"
                >
                  🗑️
                </button>
              </div>
            ))}

            <button
              onClick={clearCart}
              className="font-mono text-sm text-stone-400 hover:text-stone-600"
            >
              Clear cart
            </button>
          </div>

          {/* Summary */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 h-fit">
            <h2 className="font-mono font-bold text-stone-800 mb-4">
              Summary
            </h2>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between font-mono text-sm">
                <span className="text-stone-500">Subtotal</span>
                <span className="text-stone-800">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between font-mono text-sm">
                <span className="text-stone-500">Shipping</span>
                <span className="text-stone-500 text-xs">Calculated at checkout</span>
              </div>
            </div>

            <div className="border-t border-stone-200 pt-4 mb-6">
              <div className="flex justify-between font-mono">
                <span className="font-bold text-stone-800">Subtotal</span>
                <span className="font-bold text-lg text-stone-800">
                  {fmt(subtotal)}
                </span>
              </div>
            </div>

            {subtotal < FREE_SHIPPING_THRESHOLD && (
              <p className="font-mono text-xs text-stone-500 mb-4">
                Add {fmt(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping!
              </p>
            )}

            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="btn-accent w-full disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Proceed to Checkout →'}
            </button>

            <p className="font-mono text-xs text-stone-400 text-center mt-4">
              Secure payment via Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
