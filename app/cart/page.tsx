'use client';

import { useCartStore } from '@/lib/store/cart';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const router = useRouter();
  const { items, subtotal, shipping, total, updateQuantity, removeItem, clearCart } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = () => {
    if (items.length === 0) return;

    setIsLoading(true);
    // Redirect to /checkout - auth check happens there
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-grain">
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
          {/* Header */}
          <nav className="flex items-center justify-between mb-16">
            <Link href="/" className="font-mono text-lg font-bold text-stone-800">
              ONSITE SHOP
            </Link>
            <Link href="/" className="font-mono text-sm text-stone-500 hover:text-stone-800">
              ← Continuar comprando
            </Link>
          </nav>

          {/* Empty cart */}
          <div className="text-center py-20">
            <p className="text-6xl mb-6">🛒</p>
            <h1 className="font-mono text-2xl font-bold text-stone-800 mb-4">
              Seu carrinho está vazio
            </h1>
            <p className="text-stone-500 mb-8">
              Adicione alguns produtos incríveis!
            </p>
            <Link href="/" className="btn-primary inline-block">
              Ver produtos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grain">
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <nav className="flex items-center justify-between mb-10">
          <Link href="/" className="font-mono text-lg font-bold text-stone-800">
            ONSITE SHOP
          </Link>
          <Link href="/" className="font-mono text-sm text-stone-500 hover:text-stone-800">
            ← Continuar comprando
          </Link>
        </nav>

        <h1 className="font-mono text-2xl font-bold text-stone-800 mb-8">
          Seu Carrinho ({items.length} {items.length === 1 ? 'item' : 'itens'})
        </h1>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="md:col-span-2 space-y-4">
            {items.map((item) => (
              <div 
                key={item.variant_id} 
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 flex gap-4"
              >
                {/* Image placeholder */}
                <div className="w-24 h-24 bg-stone-100 rounded-xl flex items-center justify-center text-4xl shrink-0">
                  📦
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="font-mono font-medium text-stone-800">
                    {item.name}
                  </h3>
                  <p className="font-mono text-sm text-stone-500">
                    {item.color} - {item.size}
                  </p>
                  <p className="font-mono text-amber-500 font-bold mt-1">
                    CA${item.price.toFixed(2)}
                  </p>
                </div>

                {/* Quantity */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="font-mono w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.variant_id)}
                  className="text-stone-400 hover:text-red-500 transition-colors"
                >
                  🗑️
                </button>
              </div>
            ))}

            {/* Clear cart */}
            <button
              onClick={clearCart}
              className="font-mono text-sm text-stone-400 hover:text-stone-600"
            >
              Limpar carrinho
            </button>
          </div>

          {/* Summary */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 h-fit">
            <h2 className="font-mono font-bold text-stone-800 mb-4">
              Resumo
            </h2>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between font-mono text-sm">
                <span className="text-stone-500">Subtotal</span>
                <span className="text-stone-800">CA${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-mono text-sm">
                <span className="text-stone-500">Frete</span>
                <span className={shipping === 0 ? 'text-green-600' : 'text-stone-800'}>
                  {shipping === 0 ? 'GRÁTIS' : `CA$${shipping.toFixed(2)}`}
                </span>
              </div>
            </div>

            <div className="border-t border-stone-200 pt-4 mb-6">
              <div className="flex justify-between font-mono">
                <span className="font-bold text-stone-800">Total</span>
                <span className="font-bold text-lg text-stone-800">
                  CA${total.toFixed(2)}
                </span>
              </div>
            </div>

            {subtotal < 50 && (
              <p className="font-mono text-xs text-stone-500 mb-4">
                Adicione mais CA${(50 - subtotal).toFixed(2)} para frete grátis!
              </p>
            )}

            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="btn-accent w-full disabled:opacity-50"
            >
              {isLoading ? 'Carregando...' : 'Finalizar Compra →'}
            </button>

            <p className="font-mono text-xs text-stone-400 text-center mt-4">
              Pagamento seguro via Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
