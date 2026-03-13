'use client';

import { useCartStore } from '@/lib/store/cart';
import {
  FREE_SHIPPING_THRESHOLD,
  PROVINCES,
  getShippingCost,
  PROVINCE_SHIPPING,
} from '@/lib/stripe-config';
import { useState } from 'react';
import Link from 'next/link';
import { PromoCodeField } from '@/components/PromoCodeField';
import { PreCheckoutSurvey } from '@/components/PreCheckoutSurvey';

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSurvey, setShowSurvey] = useState(false);

  // Address form
  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  // Promo code
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discount: { oneItemPrice: number; freeShipping: boolean };
  } | null>(null);

  const subtotal = getSubtotal();

  // Calculate discount if promo active
  const promoActive = !!appliedPromo;
  let discountAmount = 0;
  let cheapestIndex = -1;
  if (promoActive && items.length > 0) {
    cheapestIndex = items.reduce(
      (minIdx, item, idx) => (item.price < items[minIdx].price ? idx : minIdx),
      0
    );
    discountAmount = Math.max(0, items[cheapestIndex].price - 10); // 10 cents = $0.10
  }

  const effectiveSubtotal = subtotal - discountAmount;
  const shippingCost = promoActive
    ? 0
    : province ? getShippingCost(province, subtotal) : null;
  const total = shippingCost !== null ? effectiveSubtotal + shippingCost : (promoActive ? effectiveSubtotal : null);
  const isFreeShipping = promoActive || subtotal >= FREE_SHIPPING_THRESHOLD;

  const fmt = (cents: number) => `CA$${(cents / 100).toFixed(2)}`;

  const isAddressValid = name.trim() && street.trim() && city.trim() && province && postalCode.trim();

  function handleProceedToPayment() {
    if (!isAddressValid) {
      setError('Please fill in all shipping fields.');
      return;
    }
    setError(null);
    setShowSurvey(true);
  }

  async function handleSurveyComplete() {
    setShowSurvey(false);
    await handleCheckout();
  }

  async function handleCheckout() {
    if (!isAddressValid) {
      setError('Please fill in all shipping fields.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
            product_key: i.product_key,
            price_id: i.price_id,
            price: i.price,
            name: i.name,
            sku: i.product_key,
            design: i.design,
            color: i.color,
            size: i.size,
            quantity: i.quantity,
            image: i.image || null,
          })),
          shipping_address: {
            name: name.trim(),
            street: street.trim(),
            apartment: apartment.trim() || null,
            city: city.trim(),
            province,
            postal_code: postalCode.trim().toUpperCase(),
            country: 'CA',
          },
          customer_notes: customerNotes.trim() || null,
          promo_code: appliedPromo?.code || null,
          promo_active: promoActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      window.location.href = data.url;
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Checkout failed');
      setIsLoading(false);
    }
  }

  // --- Empty cart ---
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

  // --- Cart with items ---
  return (
    <div className="min-h-screen bg-grain">
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10">
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

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Shipping Address + Summary — right 3 cols */}
          <div className="lg:col-span-3 lg:order-2 space-y-4">

            {/* Shipping Address Form */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6">
              <h2 className="font-mono font-bold text-stone-800 mb-4">Shipping Address</h2>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-stone-200 font-mono text-sm focus:outline-none focus:border-stone-400 bg-white"
                />
                <input
                  type="text"
                  placeholder="Street address"
                  value={street}
                  onChange={e => setStreet(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-stone-200 font-mono text-sm focus:outline-none focus:border-stone-400 bg-white"
                />
                <input
                  type="text"
                  placeholder="Apartment, unit (optional)"
                  value={apartment}
                  onChange={e => setApartment(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-stone-200 font-mono text-sm focus:outline-none focus:border-stone-400 bg-white"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="City"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-stone-200 font-mono text-sm focus:outline-none focus:border-stone-400 bg-white"
                  />
                  <select
                    value={province}
                    onChange={e => setProvince(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-stone-200 font-mono text-sm focus:outline-none focus:border-stone-400 bg-white"
                  >
                    <option value="">Province</option>
                    {PROVINCES.map(p => (
                      <option key={p.code} value={p.code}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Postal code"
                  value={postalCode}
                  onChange={e => setPostalCode(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-stone-200 font-mono text-sm focus:outline-none focus:border-stone-400 bg-white"
                />
              </div>

              {province && PROVINCE_SHIPPING[province] && (
                <p className="font-mono text-xs text-stone-400 mt-3">
                  Region: {PROVINCE_SHIPPING[province].region}
                  {isFreeShipping && ' — Free shipping!'}
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-stone-200">
                <label className="font-mono text-xs text-stone-500 block mb-2">
                  Special instructions (optional)
                </label>
                <textarea
                  placeholder="Gift wrapping, remove price tag, delivery instructions..."
                  value={customerNotes}
                  onChange={e => setCustomerNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg border border-stone-200 font-mono text-sm focus:outline-none focus:border-stone-400 bg-white resize-none"
                />
              </div>
            </div>

            {/* Promo Code */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6">
              <PromoCodeField
                onApply={(data) => {
                  if (data?.valid) {
                    setAppliedPromo({ code: data.code, discount: data.discount });
                  } else {
                    setAppliedPromo(null);
                  }
                }}
              />
            </div>

            {/* Order Summary */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6">
              <h2 className="font-mono font-bold text-stone-800 mb-4">Summary</h2>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between font-mono text-sm">
                  <span className="text-stone-500">Subtotal</span>
                  <span className="text-stone-800">{fmt(subtotal)}</span>
                </div>
                {promoActive && discountAmount > 0 && (
                  <div className="flex justify-between font-mono text-sm">
                    <span className="text-green-600">Promo discount</span>
                    <span className="text-green-600 font-bold">-{fmt(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-mono text-sm">
                  <span className="text-stone-500">Shipping</span>
                  {promoActive ? (
                    <span className="text-green-600 font-bold">FREE</span>
                  ) : shippingCost !== null ? (
                    <span className={shippingCost === 0 ? 'text-green-600 font-bold' : 'text-stone-800'}>
                      {shippingCost === 0 ? 'FREE' : fmt(shippingCost)}
                    </span>
                  ) : (
                    <span className="text-stone-400 text-xs">Select province</span>
                  )}
                </div>
              </div>

              <div className="border-t border-stone-200 pt-4 mb-4">
                <div className="flex justify-between font-mono">
                  <span className="font-bold text-stone-800">Total</span>
                  <span className="font-bold text-lg text-stone-800">
                    {total !== null ? fmt(total) : '—'}
                  </span>
                </div>
              </div>

              {!isFreeShipping && subtotal > 0 && (
                <p className="font-mono text-xs text-stone-500 mb-4">
                  Add {fmt(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping!
                </p>
              )}

              {error && (
                <p className="font-mono text-xs text-red-500 mb-3">{error}</p>
              )}

              <button
                onClick={handleProceedToPayment}
                disabled={isLoading || items.length === 0}
                className="btn-accent w-full disabled:opacity-50"
              >
                {isLoading ? 'Redirecting...' : 'Proceed to Payment →'}
              </button>

              <p className="font-mono text-xs text-stone-400 text-center mt-4">
                Secure payment via Stripe
              </p>
            </div>
          </div>

          {/* Cart items — left 2 cols */}
          <div className="lg:col-span-2 lg:order-1 space-y-4">
            {items.map((item, idx) => (
              <div
                key={`${item.product_key}-${item.size}-${item.color}-${idx}`}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 flex gap-4"
              >
                <div className="w-24 h-24 bg-stone-100 rounded-xl flex items-center justify-center text-4xl shrink-0 overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    '📦'
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-mono font-medium text-stone-800">{item.name}</h3>
                  <p className="font-mono text-sm text-stone-500">
                    {item.color}{item.size ? ` — ${item.size}` : ''}
                  </p>
                  {item.design && (
                    <p className="font-mono text-xs text-stone-400">{item.design}</p>
                  )}
                  <p className="font-mono text-amber-600 font-bold mt-1">{fmt(item.price)}</p>
                </div>

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
        </div>

        {/* Pre-checkout survey modal */}
        {showSurvey && (
          <PreCheckoutSurvey
            onComplete={handleSurveyComplete}
            promoUsed={promoActive}
            cartValue={subtotal / 100}
          />
        )}
      </div>
    </div>
  );
}
