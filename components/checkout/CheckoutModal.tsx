'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCartStore } from '@/lib/store/cart';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/stripe-config';
import { formatPostalCode, isValidCanadianPostal, detectProvinceFromPostal } from '@/lib/checkout/postal-utils';
import { useShippingRates, type ShippingQuote } from '@/lib/checkout/useShippingRates';
import { PromoCodeField } from '@/components/PromoCodeField';
import { PreCheckoutSurvey } from '@/components/PreCheckoutSurvey';

interface CheckoutModalProps {
  onClose: () => void;
}

const fmt = (cents: number) => `CA$${(cents / 100).toFixed(2)}`;

export function CheckoutModal({ onClose }: CheckoutModalProps) {
  const items = useCartStore((s) => s.items);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const subtotal = getSubtotal();

  const [step, setStep] = useState(1);
  const [postalCode, setPostalCode] = useState('');
  const [province, setProvince] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSurvey, setShowSurvey] = useState(false);

  // Promo
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountType?: string;
    discount: { type?: string; percent?: number; freeShipping: boolean };
  } | null>(null);

  const promoActive = !!appliedPromo;
  const promoDiscountType = appliedPromo?.discountType || 'item_050';

  // Shipping
  const shipping = useShippingRates();

  // Escape to close + lock body scroll
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // Auto-detect province + fetch rates when postal is valid
  const handlePostalChange = useCallback((value: string) => {
    const formatted = formatPostalCode(value);
    setPostalCode(formatted);

    const raw = formatted.replace(/\s/g, '');
    if (raw.length >= 1) {
      const detected = detectProvinceFromPostal(raw);
      if (detected) setProvince(detected);
    }

    if (isValidCanadianPostal(formatted)) {
      const detected = detectProvinceFromPostal(formatted) || province;
      if (detected) {
        shipping.fetchRates(
          formatted,
          detected,
          items.map(i => ({ product_key: i.product_key, quantity: i.quantity, price: i.price })),
        );
      }
    } else {
      shipping.reset();
    }
  }, [items, province, shipping]);

  // Discount calculation
  let discountAmount = 0;
  let cheapestIndex = -1;
  if (promoActive && items.length > 0) {
    if (promoDiscountType.startsWith('percent_')) {
      const percent = parseInt(promoDiscountType.replace('percent_', ''));
      discountAmount = Math.round(subtotal * percent / 100);
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
  const isFreeShipping = promoActive || subtotal >= FREE_SHIPPING_THRESHOLD;

  const selectedQuote = shipping.quotes.find((q: ShippingQuote) => q.serviceCode === shipping.selectedService);
  const shippingCost = promoActive
    ? 0
    : selectedQuote
      ? selectedQuote.priceTotalCents
      : null;
  const total = shippingCost !== null ? effectiveSubtotal + shippingCost : null;

  // Step navigation
  const canGoToStep2 = isValidCanadianPostal(postalCode) && province && (shipping.quotes.length > 0 || shipping.loading);
  const canGoToStep3 = shipping.selectedService && !shipping.loading;

  function goToStep2() {
    if (!isValidCanadianPostal(postalCode)) return;
    if (shipping.quotes.length === 0 && !shipping.loading) {
      const detected = detectProvinceFromPostal(postalCode) || province;
      shipping.fetchRates(
        postalCode,
        detected,
        items.map(i => ({ product_key: i.product_key, quantity: i.quantity, price: i.price })),
      );
    }
    setStep(2);
  }

  async function handleCheckout() {
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
          postal_code: postalCode.trim().toUpperCase().replace(/\s/g, ''),
          province,
          customer_notes: customerNotes.trim() || null,
          promo_code: appliedPromo?.code || null,
          promo_active: promoActive,
          promo_discount_type: promoDiscountType,
          shipping_service: shipping.selectedService || null,
          shipping_cost_override: selectedQuote ? selectedQuote.priceTotalCents : null,
          shipping_source: shipping.source || 'fallback',
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Checkout failed');
      window.location.href = data.url;
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Checkout failed');
      setIsLoading(false);
    }
  }

  function handlePayNow() {
    setError(null);
    if (promoActive) {
      setShowSurvey(true);
    } else {
      handleCheckout();
    }
  }

  // ── RENDER ──

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative z-[1] w-full sm:max-w-[480px] max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl"
        style={{ animation: 'modalIn 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-6 pt-5 pb-3 border-b border-warm-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-text-primary text-lg">Checkout</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-warm-100 hover:bg-warm-200 transition-colors"
            >
              <svg className="w-4 h-4 text-charcoal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  s <= step ? 'bg-amber' : 'bg-warm-200'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            <span className={`text-[10px] ${step >= 1 ? 'text-amber-dark font-medium' : 'text-warm-400'}`}>Location</span>
            <span className={`text-[10px] ${step >= 2 ? 'text-amber-dark font-medium' : 'text-warm-400'}`}>Shipping</span>
            <span className={`text-[10px] ${step >= 3 ? 'text-amber-dark font-medium' : 'text-warm-400'}`}>Review</span>
          </div>
        </div>

        <div className="p-6">
          {/* ═══ STEP 1: Postal Code ═══ */}
          {step === 1 && (
            <div>
              <p className="text-sm text-text-secondary mb-4">
                Enter your postal code to see shipping options.
              </p>

              <div className="mb-4">
                <label htmlFor="checkout-postal" className="block font-display text-xs text-text-secondary mb-1">
                  Postal Code
                </label>
                <input
                  id="checkout-postal"
                  type="text"
                  inputMode="text"
                  autoComplete="postal-code"
                  placeholder="A1A 1A1"
                  value={postalCode}
                  onChange={(e) => handlePostalChange(e.target.value)}
                  maxLength={7}
                  className="w-full px-4 py-3.5 rounded-xl border border-warm-200 text-base focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/30 bg-white"
                  autoFocus
                />
                {province && isValidCanadianPostal(postalCode) && (
                  <p className="text-xs text-green-600 mt-1.5">
                    Shipping to {province}
                  </p>
                )}
              </div>

              {shipping.loading && (
                <p className="text-xs text-warm-400 animate-pulse mb-4">
                  Calculating shipping rates...
                </p>
              )}

              <button
                onClick={goToStep2}
                disabled={!canGoToStep2}
                className="btn-amber w-full py-3.5 disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          )}

          {/* ═══ STEP 2: Shipping + Promo ═══ */}
          {step === 2 && (
            <div>
              <button
                onClick={() => setStep(1)}
                className="text-xs text-warm-400 hover:text-text-secondary mb-3 flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Change postal code ({postalCode})
              </button>

              {/* Shipping options */}
              <div className="mb-5">
                <h3 className="font-display text-sm font-medium text-text-primary mb-2">
                  Shipping Method
                </h3>

                {shipping.loading ? (
                  <p className="text-xs text-warm-400 animate-pulse py-4">
                    Loading shipping options...
                  </p>
                ) : isFreeShipping ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-sm text-green-700 font-medium">
                      Free Shipping {promoActive ? '(promo)' : '(orders over $50)'}
                    </p>
                  </div>
                ) : shipping.quotes.length > 0 ? (
                  <div className="space-y-2">
                    {shipping.quotes.map((q: ShippingQuote) => (
                      <label
                        key={q.serviceCode}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          shipping.selectedService === q.serviceCode
                            ? 'border-amber bg-amber/5'
                            : 'border-warm-200 hover:border-warm-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shipping-method"
                          value={q.serviceCode}
                          checked={shipping.selectedService === q.serviceCode}
                          onChange={() => shipping.setSelectedService(q.serviceCode)}
                          className="accent-amber"
                        />
                        <span className="flex-1">
                          <span className="text-sm text-text-primary block">{q.serviceName}</span>
                          {q.expectedTransitDays && (
                            <span className="text-xs text-warm-400">{q.expectedTransitDays} business days</span>
                          )}
                        </span>
                        <span className="text-sm font-bold text-text-primary">
                          {q.freeShipping ? 'FREE' : fmt(q.priceTotalCents)}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-light border border-amber/30 rounded-xl">
                    <p className="text-xs text-amber-dark mb-2">
                      Could not load shipping rates.
                    </p>
                    <button
                      onClick={() => shipping.fetchRates(
                        postalCode,
                        province,
                        items.map(i => ({ product_key: i.product_key, quantity: i.quantity, price: i.price })),
                      )}
                      className="text-xs font-bold text-amber-dark underline hover:text-charcoal"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {shipping.source === 'fallback' && shipping.quotes.length > 0 && !promoActive && (
                  <p className="text-xs text-warm-400 mt-2">
                    Shipping estimated — final cost confirmed by email.
                  </p>
                )}
              </div>

              {/* Promo code */}
              <div className="mb-5 border-t border-warm-200 pt-4">
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

              <button
                onClick={() => setStep(3)}
                disabled={!canGoToStep3}
                className="btn-amber w-full py-3.5 disabled:opacity-40"
              >
                Review Order
              </button>
            </div>
          )}

          {/* ═══ STEP 3: Review + Pay ═══ */}
          {step === 3 && (
            <div>
              <button
                onClick={() => setStep(2)}
                className="text-xs text-warm-400 hover:text-text-secondary mb-3 flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back to shipping
              </button>

              {/* Items summary */}
              <div className="mb-4">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer text-sm text-text-primary font-medium mb-2">
                    <span>{items.length} {items.length === 1 ? 'item' : 'items'} in cart</span>
                    <svg className="w-4 h-4 text-warm-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="space-y-2 mb-3">
                    {items.map((item, idx) => (
                      <div key={`${item.product_key}-${item.size}-${item.color}-${idx}`} className="flex items-center gap-3 text-xs">
                        <div className="w-10 h-10 bg-warm-100 rounded-lg flex-shrink-0 overflow-hidden">
                          {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-text-primary truncate">{item.name}</p>
                          <p className="text-warm-400">{item.color}{item.size ? ` / ${item.size}` : ''} x{item.quantity}</p>
                        </div>
                        <span className="text-text-primary font-medium">{fmt(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>

              {/* Totals */}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="text-text-primary">{fmt(subtotal)}</span>
                </div>
                {promoActive && discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-green-600">Promo discount</span>
                    <span className="text-green-600 font-bold">-{fmt(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-secondary">
                    Shipping
                    {selectedQuote && !promoActive && (
                      <span className="text-warm-400 text-xs block">{selectedQuote.serviceName}</span>
                    )}
                  </span>
                  {promoActive ? (
                    <span className="text-green-600 font-bold">FREE</span>
                  ) : shippingCost !== null ? (
                    <span className="text-text-primary">{fmt(shippingCost)}</span>
                  ) : (
                    <span className="text-warm-400 text-xs">—</span>
                  )}
                </div>
                <div className="border-t border-warm-200 pt-2 flex justify-between">
                  <span className="font-bold text-text-primary">Total</span>
                  <span className="font-bold text-lg text-text-primary">
                    {total !== null ? fmt(total) : '—'}
                  </span>
                </div>
              </div>

              {/* Customer notes */}
              <div className="mb-4">
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className="text-xs text-warm-400 hover:text-text-secondary flex items-center gap-1"
                >
                  <svg className={`w-3 h-3 transition-transform ${showNotes ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  Add special instructions
                </button>
                {showNotes && (
                  <textarea
                    placeholder="Gift wrapping, delivery instructions..."
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    rows={2}
                    className="w-full mt-2 px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:border-warm-400 bg-white resize-none"
                  />
                )}
              </div>

              {/* Trust + payment info */}
              <div className="mb-4 p-3 bg-warm-100 rounded-xl">
                <p className="text-xs text-text-secondary text-center mb-2">
                  Shipping address and payment collected securely on the next screen
                </p>
                <div className="flex items-center justify-center gap-3">
                  {/* Payment method icons */}
                  <span className="text-[10px] text-warm-400 bg-white px-2 py-0.5 rounded">Apple Pay</span>
                  <span className="text-[10px] text-warm-400 bg-white px-2 py-0.5 rounded">Google Pay</span>
                  <span className="text-[10px] text-warm-400 bg-white px-2 py-0.5 rounded">Visa</span>
                  <span className="text-[10px] text-warm-400 bg-white px-2 py-0.5 rounded">MC</span>
                </div>
              </div>

              {error && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              <button
                onClick={handlePayNow}
                disabled={isLoading || !total}
                className="btn-amber w-full py-3.5 text-base disabled:opacity-40"
              >
                {isLoading ? 'Redirecting to payment...' : `Pay ${total !== null ? fmt(total) : ''}`}
              </button>

              <p className="text-[10px] text-warm-400 text-center mt-3">
                Secure checkout powered by Stripe
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pre-checkout survey */}
      {showSurvey && (
        <PreCheckoutSurvey
          onComplete={() => { setShowSurvey(false); handleCheckout(); }}
          onSkip={() => { setShowSurvey(false); handleCheckout(); }}
          promoUsed={promoActive}
          cartValue={subtotal / 100}
        />
      )}
    </div>
  );
}
