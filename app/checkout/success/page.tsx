'use client';

import { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCartStore } from '@/lib/store/cart';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const clearCart = useCartStore((state) => state.clearCart);

  // Clear cart on success
  useEffect(() => {
    if (sessionId) {
      clearCart();
    }
  }, [sessionId, clearCart]);

  return (
    <div className="min-h-screen bg-grain flex items-center justify-center px-4">
      <div className="relative z-10 text-center max-w-md">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Message */}
        <h1 className="font-mono text-2xl font-bold text-[#1B2B27] mb-4">
          Pedido Confirmado!
        </h1>
        <p className="font-mono text-[#1B2B27]/70 mb-8">
          Obrigado pela sua compra! Você receberá um email de confirmação em breve
          com os detalhes do seu pedido.
        </p>

        {/* Order Info */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 mb-8">
          <p className="font-mono text-sm text-[#1B2B27]/60 mb-2">
            ID da transação:
          </p>
          <p className="font-mono text-xs text-[#1B2B27] break-all">
            {sessionId || 'N/A'}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <Link href="/" className="btn-accent block">
            Continuar Comprando
          </Link>
          <Link
            href="/orders"
            className="btn-secondary block"
          >
            Ver Meus Pedidos
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-grain flex items-center justify-center">
        <p className="font-mono text-[#1B2B27]/60">Carregando...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
