'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useCartStore } from '@/lib/store/cart';

/**
 * /checkout - Auth Gate
 *
 * Fluxo:
 * 1. Usuário clica "Checkout" no /cart
 * 2. Redireciona para /checkout
 * 3. Se não logado → /checkout/login
 * 4. Se logado → cria Stripe session e redireciona
 */
export default function CheckoutPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { items, subtotal, shipping, total } = useCartStore();

  useEffect(() => {
    async function checkAuthAndProceed() {
      // Verificar se carrinho tem itens
      if (items.length === 0) {
        router.push('/cart');
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Não logado → redirecionar para login
        router.push('/checkout/login');
        return;
      }

      // Usuário logado → criar sessão Stripe
      try {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items,
            subtotal,
            shipping,
            total,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao criar checkout');
        }

        // Redirecionar para Stripe
        window.location.href = data.url;
      } catch (err: any) {
        console.error('Checkout error:', err);
        setError(err.message || 'Erro ao processar checkout');
        setIsLoading(false);
      }
    }

    checkAuthAndProceed();
  }, [items, subtotal, shipping, total, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-grain flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="font-mono text-xl font-bold text-[#1B2B27] mb-2">Erro no Checkout</h1>
          <p className="font-mono text-sm text-[#1B2B27]/60 mb-6">{error}</p>
          <button
            onClick={() => router.push('/cart')}
            className="btn-primary"
          >
            Voltar ao Carrinho
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grain flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#1B2B27] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-mono text-[#1B2B27]/60">Preparando checkout...</p>
      </div>
    </div>
  );
}
