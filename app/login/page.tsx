'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const supabase = createClient();

    try {
      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password');
          } else {
            setError(error.message);
          }
          return;
        }

        if (data.user) {
          // Redirect to cart or home
          const returnUrl = new URLSearchParams(window.location.search).get('return') || '/';
          router.push(returnUrl);
        }
      } else {
        // Register
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
            },
          },
        });

        if (error) {
          if (error.message.includes('already registered')) {
            setError('This email is already registered. Please sign in.');
          } else {
            setError(error.message);
          }
          return;
        }

        if (data.user) {
          setSuccess('Account created! Check your email to confirm.');
          setIsLogin(true);
        }
      }
    } catch (err) {
      setError('Error processing. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-grain flex items-center justify-center px-4">
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <img
              src="/assets/logo-onsite-club.png"
              alt="OnSite Club"
              className="h-12 mx-auto mb-4"
            />
          </Link>
          <h1 className="font-mono text-2xl font-bold text-[#1B2B27]">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h1>
          <p className="font-mono text-sm text-[#1B2B27]/60 mt-2">
            {isLogin ? 'Access your OnSite account' : 'Join the OnSite community'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl" role="alert">
              <p className="font-mono text-sm text-red-600">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
              <p className="font-mono text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block font-mono text-sm text-[#1B2B27] mb-2">
                  Full name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="Your name"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block font-mono text-sm text-[#1B2B27] mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block font-mono text-sm text-[#1B2B27] mb-2">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {isLogin && (
              <div className="text-right">
                <Link
                  href="/forgot-password"
                  className="font-mono text-xs text-[#B8860B] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-accent w-full disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <p className="text-center font-mono text-sm text-[#1B2B27]/60 mt-6">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setSuccess(null);
              }}
              className="text-[#B8860B] font-bold hover:underline"
            >
              {isLogin ? 'Create account' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Back to shop */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="font-mono text-sm text-[#1B2B27]/60 hover:text-[#1B2B27]"
          >
            ← Back to shop
          </Link>
        </div>
      </div>
    </div>
  );
}
