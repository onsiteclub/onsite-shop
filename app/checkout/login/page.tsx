'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useCartStore } from '@/lib/store/cart';

/**
 * /checkout/login - Login before checkout
 *
 * Fluxo:
 * 1. Usuário chegou aqui porque não estava logado
 * 2. Faz login ou cria conta
 * 3. Após sucesso → redireciona para /checkout
 */
export default function CheckoutLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { items, subtotal, total } = useCartStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
          },
        });
        if (error) throw error;
      }

      // Sucesso → redirecionar para /checkout
      router.push('/checkout');
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Erro ao processar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/checkout`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google auth error:', err);
      setError(err.message || 'Erro ao conectar com Google');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-grain">
      <div className="relative z-10 max-w-md mx-auto px-6 py-10">
        {/* Header */}
        <nav className="flex items-center justify-between mb-10">
          <Link href="/" className="font-mono text-lg font-bold text-[#1B2B27]">
            ONSITE SHOP
          </Link>
          <Link href="/cart" className="font-mono text-sm text-[#1B2B27]/60 hover:text-[#1B2B27]">
            ← Voltar ao carrinho
          </Link>
        </nav>

        {/* Cart Summary Mini */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-mono text-sm text-[#1B2B27]/60">
                {items.length} {items.length === 1 ? 'item' : 'itens'} no carrinho
              </p>
              <p className="font-mono font-bold text-[#1B2B27]">
                Total: CA${total.toFixed(2)}
              </p>
            </div>
            <div className="text-3xl">🛒</div>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6">
          <h1 className="font-mono text-xl font-bold text-[#1B2B27] mb-2">
            {mode === 'login' ? 'Entrar para continuar' : 'Criar conta'}
          </h1>
          <p className="font-mono text-sm text-[#1B2B27]/60 mb-6">
            {mode === 'login'
              ? 'Entre na sua conta para finalizar a compra'
              : 'Crie uma conta para acompanhar seus pedidos'
            }
          </p>

          {/* Google Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-stone-200 rounded-xl py-3 px-4 font-mono text-sm hover:bg-stone-50 transition-colors disabled:opacity-50 mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar com Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="font-mono text-xs text-[#1B2B27]/40">ou</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="font-mono text-xs text-[#1B2B27]/60 block mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="input w-full"
                  required={mode === 'signup'}
                />
              </div>
            )}

            <div>
              <label className="font-mono text-xs text-[#1B2B27]/60 block mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="font-mono text-xs text-[#1B2B27]/60 block mb-1">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input w-full"
                required
                minLength={6}
              />
            </div>

            {error && (
              <p className="font-mono text-xs text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-accent w-full disabled:opacity-50"
            >
              {isLoading
                ? 'Carregando...'
                : mode === 'login'
                  ? 'Entrar e Continuar'
                  : 'Criar Conta e Continuar'
              }
            </button>
          </form>

          {/* Toggle Mode */}
          <p className="font-mono text-xs text-center text-[#1B2B27]/60 mt-6">
            {mode === 'login' ? (
              <>
                Não tem conta?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-[#B8860B] hover:underline"
                >
                  Criar conta
                </button>
              </>
            ) : (
              <>
                Já tem conta?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-[#B8860B] hover:underline"
                >
                  Entrar
                </button>
              </>
            )}
          </p>
        </div>

        {/* Security note */}
        <p className="font-mono text-xs text-center text-[#1B2B27]/40 mt-6">
          🔒 Seus dados estão seguros. Pagamento processado via Stripe.
        </p>
      </div>
    </div>
  );
}
