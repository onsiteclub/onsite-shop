'use client';

import { useState } from 'react';
import { Navbar } from '@/components/shop/Navbar';
import { Footer } from '@/components/shop/Footer';

const FAQS = [
  {
    q: 'How do I place an order?',
    a: 'Browse our collections, select your size and color, and click "Add to Bag." When you\'re ready, go to your cart, enter your shipping address, and proceed to payment via Stripe. You\'ll receive an email confirmation once your order is placed.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit and debit cards (Visa, Mastercard, American Express) through Stripe. All payments are processed securely — we never store your card information.',
  },
  {
    q: 'How long does shipping take?',
    a: 'Orders are processed within 1–3 business days. Shipping via Canada Post typically takes 3–10 business days depending on your location and the service selected at checkout.',
  },
  {
    q: 'Do you ship outside of Canada?',
    a: 'Currently, we only ship within Canada to all provinces and territories. International shipping may be available in the future.',
  },
  {
    q: 'Can I track my order?',
    a: 'Yes. Once your order ships, you\'ll receive an email with a Canada Post tracking number. You can track your package at canadapost.ca.',
  },
  {
    q: 'What is your return policy?',
    a: 'We accept returns within 30 days of delivery for unused, unwashed items with original tags attached. Email contact@onsiteclub.ca with your order number to start a return. See our Shipping & Returns page for full details.',
  },
  {
    q: 'How do promo codes work?',
    a: 'Enter your promo code in the cart before checkout. Each code is single-use and may include discounts on items and/or free shipping. Promo codes cannot be combined with other offers.',
  },
  {
    q: 'What is OnSite Club membership?',
    a: 'OnSite Club members get access to exclusive gear, member-only pricing, and early access to new drops. Visit dashboard.onsiteclub.ca to learn more and sign up.',
  },
  {
    q: 'What sizes do you carry?',
    a: 'Most items are available from S to 3XL. Caps are one-size-fits-most with adjustable closures. Check our Size Guide for detailed measurements.',
  },
  {
    q: 'How do I contact you?',
    a: 'Email us at contact@onsiteclub.ca — we typically respond within 24 hours on business days. You can also reach us through Instagram @onsite.club.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-warm-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="font-display text-[15px] font-bold text-text-primary pr-4">{q}</span>
        <svg
          className={`w-5 h-5 text-warm-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="pb-5 pr-8">
          <p className="font-body text-sm text-text-secondary leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-[72px]">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <span className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-warm-400 block mb-3">Support</span>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary mb-4">
            Frequently Asked Questions
          </h1>
          <p className="font-body text-text-secondary mb-10 leading-relaxed">
            Can&apos;t find what you&apos;re looking for? Email us at{' '}
            <a href="mailto:contact@onsiteclub.ca" className="text-amber-dark hover:underline">contact@onsiteclub.ca</a>.
          </p>

          <div className="border-t border-warm-200">
            {FAQS.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
