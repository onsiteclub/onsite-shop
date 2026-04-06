'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

type Step = 'email' | 'password' | 'signup' | 'welcome';

interface MembershipModalProps {
  onClose: () => void;
}

export function MembershipModal({ onClose }: MembershipModalProps) {
  const [step, setStep] = useState<Step>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const backdropRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

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

  // Autofocus on step change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (step === 'email') emailRef.current?.focus();
      else if (step === 'password') passwordRef.current?.focus();
      else if (step === 'signup') nameRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [step]);

  // Step 1: Check if email exists
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Please enter your email.');
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc('check_email_exists', {
        p_email: trimmed,
      });

      if (rpcError) {
        // If RPC doesn't exist yet, fall back to signup
        console.warn('check_email_exists RPC error:', rpcError.message);
        setStep('signup');
        return;
      }

      if (data === true) {
        setStep('password');
      } else {
        setStep('signup');
      }
    } catch {
      // Fallback: go to signup
      setStep('signup');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2A: Sign in (existing user)
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setError(
          error.message.includes('Invalid login credentials')
            ? 'Wrong password. Try again.'
            : error.message
        );
        return;
      }

      if (data.user) setStep('welcome');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2B: Sign up (new user)
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          },
        },
      });

      if (error) {
        setError(
          error.message.includes('already registered')
            ? 'This email is already registered. Try signing in.'
            : error.message
        );
        return;
      }

      if (data.user) setStep('welcome');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth
  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?return=${encodeURIComponent('/')}`,
      },
    });
  };

  // Go back to email step
  const handleBack = () => {
    setError(null);
    setPassword('');
    setStep('email');
  };

  const INPUT_CLASS =
    'w-full px-4 py-3 rounded-xl border border-warm-200 bg-white text-sm font-body text-charcoal placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-amber/40 focus:border-amber transition-colors';

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

        {/* ===== EMAIL STEP ===== */}
        {step === 'email' && (
          <div className="p-8 sm:p-10">
            <div className="text-center mb-8">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-amber" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.77l-6.18 3.25L7 13.14 2 8.27l6.91-1.01L12 1z" />
                </svg>
              </div>
              <h2 className="font-body font-light text-2xl text-charcoal-deep tracking-wide">
                Join the Crew
              </h2>
              <p className="text-text-secondary text-sm mt-2 font-body">
                Enter your email to get started
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600 font-body">{error}</p>
              </div>
            )}

            {/* Google */}
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-white border border-warm-200 rounded-xl py-3 px-4 text-sm font-body text-charcoal hover:bg-warm-50 transition-colors mb-5"
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
                <span className="px-3 bg-off-white text-warm-400 font-body tracking-wider">or</span>
              </div>
            </div>

            <form onSubmit={handleEmailSubmit}>
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={INPUT_CLASS}
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 bg-amber text-charcoal-deep py-3.5 rounded-xl font-body font-medium text-sm tracking-wide hover:bg-amber-light transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? 'Checking...' : 'Continue'}
              </button>
            </form>
          </div>
        )}

        {/* ===== PASSWORD STEP (existing user) ===== */}
        {step === 'password' && (
          <div className="p-8 sm:p-10">
            <div className="text-center mb-8">
              <h2 className="font-body font-light text-2xl text-charcoal-deep tracking-wide">
                Welcome Back
              </h2>
              <p className="text-text-secondary text-sm mt-2 font-body">
                {email}
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600 font-body">{error}</p>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-body font-medium text-charcoal/70 mb-1.5">
                  Password
                </label>
                <input
                  ref={passwordRef}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber text-charcoal-deep py-3.5 rounded-xl font-body font-medium text-sm tracking-wide hover:bg-amber-light transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <button
              onClick={handleBack}
              className="w-full mt-4 text-center text-sm text-warm-400 font-body hover:text-charcoal transition-colors"
            >
              &larr; Use a different email
            </button>
          </div>
        )}

        {/* ===== SIGNUP STEP (new user) ===== */}
        {step === 'signup' && (
          <div className="p-8 sm:p-10">
            <div className="text-center mb-8">
              <h2 className="font-body font-light text-2xl text-charcoal-deep tracking-wide">
                Create Account
              </h2>
              <p className="text-text-secondary text-sm mt-2 font-body">
                {email}
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600 font-body">{error}</p>
              </div>
            )}

            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-body font-medium text-charcoal/70 mb-1.5">
                    First name
                  </label>
                  <input
                    ref={nameRef}
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="First"
                    required
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-body font-medium text-charcoal/70 mb-1.5">
                    Last name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="Last"
                    required
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-body font-medium text-charcoal/70 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber text-charcoal-deep py-3.5 rounded-xl font-body font-medium text-sm tracking-wide hover:bg-amber-light transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? 'Creating account...' : 'Join the Crew'}
              </button>
            </form>

            <button
              onClick={handleBack}
              className="w-full mt-4 text-center text-sm text-warm-400 font-body hover:text-charcoal transition-colors"
            >
              &larr; Use a different email
            </button>
          </div>
        )}

        {/* ===== WELCOME STEP ===== */}
        {step === 'welcome' && (
          <div className="p-8 sm:p-10">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-amber/15 flex items-center justify-center">
                <svg className="w-8 h-8 text-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="font-body font-light text-2xl text-charcoal-deep tracking-wide">
                Welcome to the Crew
              </h2>
              <p className="text-text-secondary text-sm mt-3 font-body max-w-[300px] mx-auto leading-relaxed">
                You now have access to exclusive member pricing and early drops.
              </p>
            </div>

            <button
              onClick={() => {
                onClose();
                window.location.reload();
              }}
              className="w-full bg-amber text-charcoal-deep py-3.5 rounded-xl font-body font-medium text-sm tracking-wide hover:bg-amber-light transition-all duration-300"
            >
              Start Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
