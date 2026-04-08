'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth';

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://auth.onsiteclub.ca';

export function Newsletter() {
  const { user, isLoading, initialize, signOut } = useAuthStore();

  useEffect(() => { initialize(); }, [initialize]);

  const handleSignOut = () => {
    signOut();
    window.location.href = `${AUTH_URL}/logout?return_to=${encodeURIComponent(window.location.origin)}`;
  };

  const handleJoin = () => {
    const returnTo = window.location.href;
    window.location.href = `${AUTH_URL}/login?return_to=${encodeURIComponent(returnTo)}`;
  };

  // Logged-in state
  if (!isLoading && user) {
    return (
      <section className="py-20 bg-charcoal" id="contact">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <svg className="w-6 h-6 text-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <h2 className="section-title !text-white !mb-0">You&apos;re Part of the Crew</h2>
          </div>
          <p className="text-white/60 text-[15px] font-body">
            Welcome back, {user.user_metadata?.first_name || 'member'}. You get exclusive deals and early drops.
          </p>
          <p className="text-white/30 text-[13px] font-body mt-3">
            Not {user.user_metadata?.first_name || 'you'}?{' '}
            <button onClick={handleSignOut} className="underline hover:text-amber transition-colors">
              Sign out
            </button>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-charcoal" id="contact">
      <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="max-w-[500px] md:text-left text-center">
          <h2 className="section-title !text-white !mb-2">Get 10% Off Your First Order</h2>
          <p className="text-white/60 text-[15px]">
            Join the crew. Get early drops, jobsite stories, and exclusive deals.
          </p>
        </div>

        <button
          onClick={handleJoin}
          className="btn-amber whitespace-nowrap !py-4 !px-8"
        >
          Join the Crew
        </button>
      </div>
    </section>
  );
}
