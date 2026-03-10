'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store/cart';

export default function CheckoutPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    async function proceedToStripe() {
      if (items.length === 0) {
        router.push('/cart');
        return;
      }

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
            })),
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
      }
    }

    proceedToStripe();
  }, [items, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-grain flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="font-mono text-xl font-bold text-[#1B2B27] mb-2">Checkout Error</h1>
          <p className="font-mono text-sm text-[#1B2B27]/60 mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/cart')}
              className="btn-primary"
            >
              Back to Cart
            </button>
            <button
              onClick={() => { clearCart(); router.push('/'); }}
              className="font-mono text-sm text-red-500 hover:text-red-700 underline"
            >
              Clear Cart & Start Over
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grain flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#1B2B27] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-mono text-[#1B2B27]/60">Redirecting to payment...</p>
      </div>
    </div>
  );
}
