'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface MembershipModalProps {
  onClose: () => void;
}

export function MembershipModal({ onClose }: MembershipModalProps) {
  const [step, setStep] = useState<'form' | 'welcome'>('form');
  const [isLogin, setIsLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const backdropRef = useRef<HTMLDivElement>(null);

  // Escape to close
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError(error.message.includes('Invalid login credentials')
            ? 'Invalid email or password'
            : error.message);
          return;
        }
        if (data.user) setStep('welcome');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) {
          setError(error.message.includes('already registered')
            ? 'This email is already registered. Try signing in.'
            : error.message);
          return;
        }
        if (data.user) setStep('welcome');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?return=${encodeURIComponent('/')}`,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-[1] w-full max-w-[440px] rounded-2xl bg-off-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[2] w-8 h-8 flex items-center justify-center rounded-full bg-warm-100 hover:bg-warm-200 transition-colors"
        >
          <svg className="w-4 h-4 text-charcoal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {step === 'form' ? (
          /* ===== STEP 1: SIGNUP / LOGIN FORM ===== */
          <div className="p-8 sm:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-amber" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.77l-6.18 3.25L7 13.14 2 8.27l6.91-1.01L12 1z" />
                </svg>
              </div>
              <h2 className="font-display font-extrabold text-2xl text-charcoal-deep tracking-tight">
                {isLogin ? 'Welcome Back' : 'Join the Crew'}
              </h2>
              <p className="text-text-secondary text-sm mt-2 font-body">
                {isLogin ? 'Sign in to access member perks' : 'Unlock exclusive gear & member pricing'}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600 font-body">{error}</p>
              </div>
            )}

            {/* Google */}
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-white border border-warm-200 rounded-xl py-3 px-4 text-sm font-display font-semibold text-charcoal hover:bg-warm-50 transition-colors mb-5"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-warm-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-off-white text-warm-400 font-display font-semibold uppercase tracking-wider">or</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-xs font-display font-bold text-charcoal uppercase tracking-wider mb-1.5">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-warm-200 bg-white text-sm font-body text-charcoal placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-amber/40 focus:border-amber transition-colors"
                    placeholder="Your name"
                    required={!isLogin}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-display font-bold text-charcoal uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-warm-200 bg-white text-sm font-body text-charcoal placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-amber/40 focus:border-amber transition-colors"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-display font-bold text-charcoal uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-warm-200 bg-white text-sm font-body text-charcoal placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-amber/40 focus:border-amber transition-colors"
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber text-charcoal-deep py-3.5 rounded-xl font-display font-bold text-[13px] tracking-[0.06em] uppercase hover:bg-amber-light transition-all duration-300 shadow-[0_4px_20px_rgba(212,175,55,0.25)] disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : isLogin ? 'Sign In' : 'Join the Crew'}
              </button>
            </form>

            {/* Toggle */}
            <p className="text-center text-sm text-text-secondary mt-6 font-body">
              {isLogin ? "Don't have an account?" : 'Already a member?'}{' '}
              <button
                onClick={() => { setIsLogin(!isLogin); setError(null); }}
                className="text-amber-dark font-bold hover:underline"
              >
                {isLogin ? 'Create account' : 'Sign in'}
              </button>
            </p>
          </div>
        ) : (
          /* ===== STEP 2: WELCOME CONFIRMATION ===== */
          <div className="p-8 sm:p-10">
            {/* Success icon */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-amber/15 flex items-center justify-center">
                <svg className="w-8 h-8 text-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="font-display font-extrabold text-2xl sm:text-[28px] text-charcoal-deep tracking-tight">
                Welcome to the Crew
              </h2>
              <p className="text-text-secondary text-sm mt-2 font-body max-w-[320px] mx-auto">
                You're in. Here's everything your membership unlocks:
              </p>
            </div>

            {/* Benefits list */}
            <div className="space-y-3 mb-8">
              {[
                { icon: 'tag', text: 'Exclusive member pricing on all gear' },
                { icon: 'zap', text: 'Early access to new drops & limited editions' },
                { icon: 'truck', text: 'Free shipping on every order' },
                { icon: 'gift', text: 'Members-only sticker packs & surprises' },
                { icon: 'users', text: 'Access to the OnSite Club community' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-warm-100">
                  <div className="w-8 h-8 rounded-lg bg-amber/10 flex items-center justify-center flex-shrink-0">
                    <BenefitIcon type={item.icon} />
                  </div>
                  <span className="text-sm font-body text-charcoal font-medium">{item.text}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={onClose}
              className="w-full bg-amber text-charcoal-deep py-3.5 rounded-xl font-display font-bold text-[13px] tracking-[0.06em] uppercase hover:bg-amber-light transition-all duration-300 shadow-[0_4px_20px_rgba(212,175,55,0.25)]"
            >
              Start Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function BenefitIcon({ type }: { type: string }) {
  const cls = "w-4 h-4 text-amber";
  switch (type) {
    case 'tag':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
      );
    case 'zap':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      );
    case 'truck':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      );
    case 'gift':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      );
    case 'users':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      );
    default:
      return null;
  }
}
