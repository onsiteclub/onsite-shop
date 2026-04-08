'use client';

import {
  Shield,
  Truck,
  RotateCcw,
  CreditCard,
  Headphones,
  Leaf,
} from 'lucide-react';

const BADGES = [
  {
    icon: Shield,
    title: 'Secure Checkout',
    description: '256-bit SSL encryption',
  },
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'On orders over $100',
  },
  {
    icon: RotateCcw,
    title: '14-Day Returns',
    description: 'No questions asked',
  },
  {
    icon: CreditCard,
    title: 'Secure Payment',
    description: 'Stripe powered',
  },
  {
    icon: Headphones,
    title: 'Real Support',
    description: 'Humans, not bots',
  },
  {
    icon: Leaf,
    title: 'Canadian Made',
    description: 'Ontario-based',
  },
];

export function TrustBadges() {
  return (
    <section className="bg-off-white py-14 border-y border-warm-200">
      <div className="max-w-[1200px] mx-auto px-6">
        <h3 className="font-display text-[clamp(18px,2.5vw,24px)] font-extrabold text-charcoal text-center mb-10 tracking-tight">
          Built Right, Shipped Right
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
          {BADGES.map((badge) => (
            <div key={badge.title} className="flex flex-col items-center text-center gap-2.5">
              <div className="w-12 h-12 rounded-full bg-charcoal flex items-center justify-center">
                <badge.icon className="w-5 h-5 text-amber" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-display text-[12px] font-bold tracking-[0.06em] uppercase text-text-primary">
                  {badge.title}
                </p>
                <p className="text-[12px] text-text-secondary mt-0.5">
                  {badge.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
