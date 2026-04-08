'use client';

import { useEffect, useRef } from 'react';

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://auth.onsiteclub.ca';

interface MembershipModalProps {
  onClose: () => void;
  onAuthSuccess?: () => void;
  source?: 'members' | 'newsletter';
}

/**
 * MembershipModal — Now redirects to the centralized Auth Hub.
 * Login/signup is handled by auth.onsiteclub.ca. This modal is a
 * branded transition screen before the redirect.
 */
export function MembershipModal({ onClose, source }: MembershipModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

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

  const handleContinue = () => {
    const returnTo = window.location.href;
    window.location.href = `${AUTH_URL}/login?return_to=${encodeURIComponent(returnTo)}`;
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
      <div className="relative z-[1] w-full max-w-[440px] rounded-2xl bg-off-white shadow-2xl overflow-hidden" style={{ animation: 'modalIn 0.2s ease-out' }}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[2] w-8 h-8 flex items-center justify-center rounded-full bg-warm-100 hover:bg-warm-200 transition-colors"
        >
          <svg className="w-4 h-4 text-charcoal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

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
            <p className="text-text-secondary text-sm mt-2 font-body max-w-[300px] mx-auto leading-relaxed">
              Sign in or create your OnSite Club account to access exclusive member pricing and early drops.
            </p>
          </div>

          <button
            onClick={handleContinue}
            className="w-full bg-amber text-charcoal-deep py-3.5 rounded-xl font-body font-medium text-sm tracking-wide hover:bg-amber-light transition-all duration-300"
          >
            Continue to Sign In
          </button>

          <p className="text-center text-text-secondary text-xs mt-4 font-body">
            You&apos;ll be redirected to our secure login page
          </p>
        </div>
      </div>
    </div>
  );
}
