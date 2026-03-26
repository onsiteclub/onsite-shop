'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { UniformProductCard } from './ProductCard';
import type { Product } from '@/lib/types';

export function CategoryCarousel({
  title,
  products,
  onProductClick,
  onHoverChange,
  id,
  isActive = false,
}: {
  title: string;
  products: Product[];
  onProductClick: (product: Product) => void;
  onHoverChange: (isHovering: boolean) => void;
  id?: string;
  isActive?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [updateScrollButtons, products]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = window.innerWidth < 640 ? 200 : 240;
    const scrollAmount = cardWidth * 3;
    el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  };

  if (products.length === 0) return null;

  return (
    <div id={id} className="mb-10 md:mb-14">
      {/* Category header */}
      <h2
        className={`font-mono text-sm md:text-base tracking-[0.25em] uppercase mb-4 md:mb-6 px-2 transition-colors duration-300 ${
          isActive ? 'text-[#1B2B27] font-bold' : 'text-[#1B2B27]/40'
        }`}
      >
        {title}
      </h2>

      {/* Carousel wrapper */}
      <div className="relative group">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-lg transition-all cursor-pointer"
            style={{ transform: 'translate(-30%, -50%)' }}
            aria-label="Scroll left"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B2B27" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-lg transition-all cursor-pointer"
            style={{ transform: 'translate(30%, -50%)' }}
            aria-label="Scroll right"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B2B27" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide px-[12vw] sm:px-2 pb-4"
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
        >
          {products.map((product, i) => (
            <div
              key={`${product.product_key}-${i}`}
              className="flex-shrink-0 w-[75vw] sm:w-[200px] md:w-[220px] lg:w-[240px]"
              style={{ scrollSnapAlign: 'center' }}
            >
              <UniformProductCard
                product={product}
                onClick={() => onProductClick(product)}
                onHoverChange={onHoverChange}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
