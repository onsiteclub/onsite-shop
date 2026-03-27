'use client';

import { useCartStore } from '@/lib/store/cart';
import {
  FREE_SHIPPING_THRESHOLD,
  PROVINCES,
  getShippingCost,
  PROVINCE_SHIPPING,
} from '@/lib/stripe-config';
import { useState, useEffect, useRef, useCallback } from 'react';
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

  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validateField(field: string, value: string) {
    setFieldErrors(prev => {
      const next = { ...prev };
      switch (field) {
        case 'name':
          if (!value.trim()) next.name = 'Name is required';
          else delete next.name;
          break;
        case 'street':
          if (!value.trim()) next.street = 'Street address is required';
          else delete next.street;
          break;
        case 'city':
          if (!value.trim()) next.city = 'City is required';
          else delete next.city;
          break;
        case 'province':
          if (!value) next.province = 'Select a province';
          else delete next.province;
          break;
        case 'postalCode':
          if (!value.trim()) next.postalCode = 'Postal code is required';
          else if (!/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(value.trim())) next.postalCode = 'Format: A1A 1A1';
          else delete next.postalCode;
          break;
      }
      return next;
    });
  }

  function validateAllFields(): boolean {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Name is required';
    if (!street.trim()) errors.street = 'Street address is required';
    if (!city.trim()) errors.city = 'City is required';
    if (!province) errors.province = 'Select a province';
    if (!postalCode.trim()) errors.postalCode = 'Postal code is required';
    else if (!/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(postalCode.trim())) errors.postalCode = 'Format: A1A 1A1';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // Shipping quotes (Canada Post)
  const [shippingQuotes, setShippingQuotes] = useState<any[]>([]);
  const [shippingSource, setShippingSource] = useState<'canada-post' | 'fallback' | null>(null);
  const [selectedService, setSelectedService] = useState<string>('');
  const [loadingRates, setLoadingRates] = useState(false);
  const ratesFetchRef = useRef<AbortController | null>(null);

  const fetchShippingRates = useCallback(async (postal: string, prov: string) => {
    const clean = postal.replace(/\s/g, '');
    if (!/^[A-Z]\d[A-Z]\d[A-Z]\d$/i.test(clean) || items.length === 0) return;

    // Abort previous request
    ratesFetchRef.current?.abort();
    const controller = new AbortController();
    ratesFetchRef.current = controller;

    setLoadingRates(true);
    try {
      const res = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ product_key: i.product_key, quantity: i.quantity, price: i.price })),
          postalCode: clean,
          province: prov,
        }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!controller.signal.aborted) {
        setShippingQuotes(data.quotes || []);
        setShippingSource(data.source || 'fallback');
        // Auto-select cheapest option
        if (data.quotes?.length > 0) {
          setSelectedService(data.quotes[0].serviceCode);
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Shipping rates error:', err);
        setShippingQuotes([]);
        setShippingSource(null);
      }
    } finally {
      if (!controller.signal.aborted) setLoadingRates(false);
    }
  }, [items]);

  // Fetch rates when postal code is valid
  useEffect(() => {
    const clean = postalCode.replace(/\s/g, '');
    if (/^[A-Z]\d[A-Z]\d[A-Z]\d$/i.test(clean) && province) {
      const timer = setTimeout(() => fetchShippingRates(postalCode, province), 400);
      return () => clearTimeout(timer);
    } else {
      setShippingQuotes([]);
      setShippingSource(null);
      setSelectedService('');
    }
  }, [postalCode, province, fetchShippingRates]);

  // Promo code
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountType?: string;
    discount: { type?: string; percent?: number; freeShipping: boolean };
  } | null>(null);

  const subtotal = getSubtotal();

  // Calculate discount if promo active
  const promoActive = !!appliedPromo;
  const promoDiscountType = appliedPromo?.discountType || 'item_050';
  let discountAmount = 0;
  let cheapestIndex = -1;
  if (promoActive && items.length > 0) {
    if (promoDiscountType.startsWith('percent_')) {
      const percent = parseInt(promoDiscountType.replace('percent_', ''));
      discountAmount = Math.round(subtotal * percent / 100);
      // Ensure at least 50 cents remains (Stripe minimum)
      if (subtotal - discountAmount < 50) discountAmount = subtotal - 50;
      discountAmount = Math.max(0, discountAmount);
    } else {
      cheapestIndex = items.reduce(
        (minIdx, item, idx) => (item.price < items[minIdx].price ? idx : minIdx),
        0
      );
      discountAmount = Math.max(0, items[cheapestIndex].price - 50);
    }
  }

  const effectiveSubtotal = subtotal - discountAmount;

  // Shipping cost: use selected Canada Post quote, fallback to province rates
  const selectedQuote = shippingQuotes.find((q: any) => q.serviceCode === selectedService);
  const shippingCost = promoActive
    ? 0
    : selectedQuote
      ? selectedQuote.priceTotalCents
      : province ? getShippingCost(province, subtotal) : null;
  const total = shippingCost !== null ? effectiveSubtotal + shippingCost : (promoActive ? effectiveSubtotal : null);
  const isFreeShipping = promoActive || subtotal >= FREE_SHIPPING_THRESHOLD;

  const fmt = (cents: number) => `CA$${(cents / 100).toFixed(2)}`;

  const isAddressValid = name.trim() && street.trim() && city.trim() && province && postalCode.trim() && /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(postalCode.trim());

  function handleProceedToPayment() {
    if (!validateAllFields()) {
      setError('Please fix the highlighted fields.');
      setTimeout(() => document.querySelector('[role="alert"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      return;
    }
    setError(null);
    if (promoActive) {
      setShowSurvey(true);
    } else {
      handleCheckout();
    }
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
          promo_discount_type: promoDiscountType,
          shipping_service: selectedService || null,
          shipping_cost_override: selectedQuote ? selectedQuote.priceTotalCents : null,
          shipping_source: shippingSource || 'fallback',
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
            <div className="mx-auto mb-6 w-16 h-16 text-stone-300">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
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
          {/* Cart items — first on mobile, left 2 cols on desktop */}
          <div className="lg:col-span-2 lg:order-1 space-y-4">
            {items.map((item, idx) => (
              <div
                key={`${item.product_key}-${item.size}-${item.color}-${idx}`}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 flex gap-4"
              >
                <div className="w-24 h-24 bg-stone-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-8 h-8 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
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
              className="font-mono text-sm text-stone-400 hover:text-stone-600"
            >
              Clear cart
            </button>
          </div>

          {/* Shipping Address + Summary — right 3 cols on desktop */}
          <div className="lg:col-span-3 lg:order-2 space-y-4">

            {/* Shipping Address Form */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6">
              <h2 className="font-mono font-bold text-stone-800 mb-4">Shipping Address</h2>

              <div className="space-y-3">
                <div>
                  <label htmlFor="ship-name" className="block font-mono text-xs text-stone-600 mb-1">Full name</label>
                  <input
                    id="ship-name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onBlur={() => validateField('name', name)}
                    className={`w-full px-3 py-2.5 rounded-lg border font-mono text-sm focus:outline-none focus:border-stone-400 bg-white ${fieldErrors.name ? 'border-red-400' : 'border-stone-200'}`}
                  />
                  {fieldErrors.name && <p className="font-mono text-xs text-red-500 mt-1" role="alert">{fieldErrors.name}</p>}
                </div>
                <div>
                  <label htmlFor="ship-street" className="block font-mono text-xs text-stone-600 mb-1">Street address</label>
                  <input
                    id="ship-street"
                    type="text"
                    placeholder="123 Main St"
                    value={street}
                    onChange={e => setStreet(e.target.value)}
                    onBlur={() => validateField('street', street)}
                    className={`w-full px-3 py-2.5 rounded-lg border font-mono text-sm focus:outline-none focus:border-stone-400 bg-white ${fieldErrors.street ? 'border-red-400' : 'border-stone-200'}`}
                  />
                  {fieldErrors.street && <p className="font-mono text-xs text-red-500 mt-1" role="alert">{fieldErrors.street}</p>}
                </div>
                <div>
                  <label htmlFor="ship-apt" className="block font-mono text-xs text-stone-600 mb-1">Apartment, unit <span className="text-stone-400">(optional)</span></label>
                  <input
                    id="ship-apt"
                    type="text"
                    placeholder="Apt 4B"
                    value={apartment}
                    onChange={e => setApartment(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-stone-200 font-mono text-sm focus:outline-none focus:border-stone-400 bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="ship-city" className="block font-mono text-xs text-stone-600 mb-1">City</label>
                    <input
                      id="ship-city"
                      type="text"
                      placeholder="Toronto"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      onBlur={() => validateField('city', city)}
                      className={`w-full px-3 py-2.5 rounded-lg border font-mono text-sm focus:outline-none focus:border-stone-400 bg-white ${fieldErrors.city ? 'border-red-400' : 'border-stone-200'}`}
                    />
                    {fieldErrors.city && <p className="font-mono text-xs text-red-500 mt-1" role="alert">{fieldErrors.city}</p>}
                  </div>
                  <div>
                    <label htmlFor="ship-province" className="block font-mono text-xs text-stone-600 mb-1">Province</label>
                    <select
                      id="ship-province"
                      value={province}
                      onChange={e => { setProvince(e.target.value); validateField('province', e.target.value); }}
                      onBlur={() => validateField('province', province)}
                      className={`w-full px-3 py-2.5 rounded-lg border font-mono text-sm focus:outline-none focus:border-stone-400 bg-white ${fieldErrors.province ? 'border-red-400' : 'border-stone-200'}`}
                    >
                      <option value="">Select</option>
                      {PROVINCES.map(p => (
                        <option key={p.code} value={p.code}>{p.name}</option>
                      ))}
                    </select>
                    {fieldErrors.province && <p className="font-mono text-xs text-red-500 mt-1" role="alert">{fieldErrors.province}</p>}
                  </div>
                </div>
                <div>
                  <label htmlFor="ship-postal" className="block font-mono text-xs text-stone-600 mb-1">Postal code</label>
                  <input
                    id="ship-postal"
                    type="text"
                    placeholder="A1A 1A1"
                    value={postalCode}
                    onChange={e => {
                      let val = e.target.value.toUpperCase();
                      // Auto-format: insert space after 3rd char
                      val = val.replace(/\s/g, '');
                      if (val.length > 3) val = val.slice(0, 3) + ' ' + val.slice(3);
                      if (val.length > 7) val = val.slice(0, 7);
                      setPostalCode(val);
                    }}
                    onBlur={() => validateField('postalCode', postalCode)}
                    maxLength={7}
                    className={`w-full px-3 py-2.5 rounded-lg border font-mono text-sm focus:outline-none focus:border-stone-400 bg-white ${fieldErrors.postalCode ? 'border-red-400' : 'border-stone-200'}`}
                  />
                  {fieldErrors.postalCode && <p className="font-mono text-xs text-red-500 mt-1" role="alert">{fieldErrors.postalCode}</p>}
                </div>
              </div>

              {province && PROVINCE_SHIPPING[province] && !shippingQuotes.length && (
                <p className="font-mono text-xs text-stone-400 mt-3">
                  Region: {PROVINCE_SHIPPING[province].region}
                  {isFreeShipping && ' — Free shipping!'}
                </p>
              )}

              {loadingRates && (
                <p className="font-mono text-xs text-stone-400 mt-3 animate-pulse">
                  Calculating shipping rates...
                </p>
              )}

              {!loadingRates && shippingQuotes.length > 1 && !promoActive && (
                <div className="mt-3">
                  <p className="font-mono text-xs text-stone-500 mb-2">Shipping options:</p>
                  <div className="space-y-1.5">
                    {shippingQuotes.map((q: any) => (
                      <label
                        key={q.serviceCode}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                          selectedService === q.serviceCode
                            ? 'border-stone-800 bg-stone-50'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shipping"
                          value={q.serviceCode}
                          checked={selectedService === q.serviceCode}
                          onChange={() => setSelectedService(q.serviceCode)}
                          className="accent-stone-800"
                        />
                        <span className="flex-1 font-mono text-xs text-stone-700">
                          {q.serviceName}
                          {q.expectedTransitDays && (
                            <span className="text-stone-400 ml-1">({q.expectedTransitDays} days)</span>
                          )}
                        </span>
                        <span className="font-mono text-xs font-bold text-stone-800">
                          {q.freeShipping ? 'FREE' : fmt(q.priceTotalCents)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
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
                  <span className="text-stone-500">
                    Shipping
                    {selectedQuote && !promoActive && (
                      <span className="text-stone-400 text-xs block">{selectedQuote.serviceName}</span>
                    )}
                  </span>
                  {loadingRates ? (
                    <span className="text-stone-400 text-xs animate-pulse">Calculating...</span>
                  ) : promoActive ? (
                    <span className="text-green-600 font-bold">FREE</span>
                  ) : shippingCost !== null ? (
                    <span className={shippingCost === 0 ? 'text-green-600 font-bold' : 'text-stone-800'}>
                      {shippingCost === 0 ? 'FREE' : fmt(shippingCost)}
                    </span>
                  ) : (
                    <span className="text-stone-400 text-xs">Enter postal code</span>
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
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl" role="alert" aria-live="assertive">
                  <p className="font-mono text-xs text-red-600">{error}</p>
                </div>
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
        </div>

        {/* Pre-checkout survey modal */}
        {showSurvey && (
          <PreCheckoutSurvey
            onComplete={handleSurveyComplete}
            onSkip={handleSurveyComplete}
            promoUsed={promoActive}
            cartValue={subtotal / 100}
          />
        )}
      </div>
    </div>
  );
}
