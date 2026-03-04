'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCartStore } from '@/lib/store/cart';

interface OrderSummary {
  email: string | null;
  items: Array<{ name: string; quantity: number; amount: number }>;
  subtotal: number;
  shipping_cost: number;
  total: number;
  shipping_name: string | null;
  shipping_address: {
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  } | null;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const clearCart = useCartStore((state) => state.clearCart);
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      clearCart();
      fetch(`/api/order-summary?session_id=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) setOrder(data);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [sessionId, clearCart]);

  const fmt = (cents: number) => `CA$${(cents / 100).toFixed(2)}`;

  return (
    <div className="min-h-screen bg-grain flex items-center justify-center px-4 py-12">
      <div className="relative z-10 w-full max-w-lg">

        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-mono text-2xl font-bold text-[#1B2B27] mb-2">
            Order Confirmed!
          </h1>
          <p className="font-mono text-sm text-[#1B2B27]/60">
            {order?.email
              ? `A confirmation email was sent to ${order.email}`
              : 'You will receive a confirmation email shortly'}
          </p>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden mb-6">

          {/* Delivery Banner */}
          <div className="bg-[#1B2B27] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#B8860B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                </svg>
              </div>
              <div>
                <p className="font-mono text-sm font-bold text-white">Shipping in 3-10 business days</p>
                <p className="font-mono text-xs text-white/60">We will notify you when it ships</p>
              </div>
            </div>
          </div>

          {/* Items */}
          {loading ? (
            <div className="p-6 text-center">
              <p className="font-mono text-sm text-[#1B2B27]/40">Loading order details...</p>
            </div>
          ) : order ? (
            <div className="p-6">
              <p className="font-mono text-xs text-[#1B2B27]/50 uppercase tracking-wider mb-3">Order Summary</p>
              <div className="space-y-3 mb-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div>
                      <p className="font-mono text-sm text-[#1B2B27]">{item.name}</p>
                      <p className="font-mono text-xs text-[#1B2B27]/50">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-mono text-sm font-medium text-[#1B2B27]">{fmt(item.amount)}</p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-stone-200 pt-3 space-y-1">
                <div className="flex justify-between font-mono text-xs text-[#1B2B27]/60">
                  <span>Subtotal</span>
                  <span>{fmt(order.subtotal)}</span>
                </div>
                <div className="flex justify-between font-mono text-xs text-[#1B2B27]/60">
                  <span>Shipping</span>
                  <span>{order.shipping_cost === 0 ? 'FREE' : fmt(order.shipping_cost)}</span>
                </div>
                <div className="flex justify-between font-mono text-sm font-bold text-[#1B2B27] pt-2 border-t border-stone-200">
                  <span>Total</span>
                  <span>{fmt(order.total)}</span>
                </div>
              </div>

              {/* Shipping Address */}
              {order.shipping_address && (
                <div className="mt-4 pt-4 border-t border-stone-200">
                  <p className="font-mono text-xs text-[#1B2B27]/50 uppercase tracking-wider mb-2">Shipping To</p>
                  <div className="font-mono text-sm text-[#1B2B27] leading-relaxed">
                    {order.shipping_name && <p className="font-medium">{order.shipping_name}</p>}
                    <p>{order.shipping_address.line1}</p>
                    {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
                    <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6">
              <p className="font-mono text-xs text-[#1B2B27]/50 mb-2">Reference:</p>
              <p className="font-mono text-xs text-[#1B2B27] break-all">{sessionId}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full text-center font-mono py-3 px-4 rounded-xl bg-[#1B2B27] text-white hover:bg-[#2a3f39] transition-colors uppercase tracking-wider text-sm font-bold"
          >
            Continue Shopping
          </Link>

          <a
            href="https://onsiteclub.ca"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center font-mono py-3 px-4 rounded-xl bg-[#B8860B] text-white hover:bg-[#9A7209] transition-colors text-sm font-bold"
          >
            Discover what OnSite Club can do for you
          </a>
        </div>

        {/* Footer */}
        <p className="text-center font-mono text-xs text-[#1B2B27]/40 mt-8">
          Questions? Contact us at dev@onsiteclub.ca
        </p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-grain flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1B2B27] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
