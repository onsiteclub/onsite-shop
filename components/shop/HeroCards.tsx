'use client';

import { useMemo } from 'react';
import type { Product } from '@/lib/types';

const SHOP_CATEGORIES = [
  { key: 'cotton-tee', label: 'Cotton Tees' },
  { key: 'hoodie', label: 'Hoodies' },
  { key: 'sport-tee', label: 'Sport Tees' },
  { key: 'cap', label: 'Caps' },
  { key: 'sticker-kit', label: 'Stickers' },
];

export function HeroCards({
  productsByCategory,
}: {
  productsByCategory: Record<string, Product[]>;
}) {
  const heroItems = useMemo(() => {
    return SHOP_CATEGORIES.map(cat => {
      const catProducts = productsByCategory[cat.key] || [];
      const randomProduct = catProducts.length > 0
        ? catProducts[Math.floor(Math.random() * catProducts.length)]
        : null;
      return { ...cat, product: randomProduct };
    });
  }, [productsByCategory]);

  const handleClick = (key: string) => {
    const el = document.getElementById(`row-${key}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="flex justify-center gap-3 md:gap-5 px-4 mb-8 md:mb-12">
      {heroItems.map(item => (
        <button
          key={item.key}
          onClick={() => handleClick(item.key)}
          className="group flex flex-col items-center cursor-pointer transition-transform duration-200 hover:scale-105"
        >
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-white/80 shadow-md hover:shadow-lg transition-shadow duration-200"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)' }}
          >
            {item.product?.image ? (
              <img
                src={item.product.image}
                alt={item.label}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
            )}
          </div>
          <span className="font-mono text-[8px] sm:text-[9px] md:text-[10px] text-[#1B2B27]/50 group-hover:text-[#1B2B27]/80 tracking-wider uppercase mt-1.5 transition-colors">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}
