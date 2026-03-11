'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Checkout now happens directly from the cart page
    router.replace('/cart');
  }, [router]);

  return (
    <div className="min-h-screen bg-grain flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#1B2B27] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-mono text-[#1B2B27]/60">Redirecting to cart...</p>
      </div>
    </div>
  );
}
