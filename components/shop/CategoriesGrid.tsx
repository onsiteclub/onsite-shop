'use client';

import { useEffect, useRef, useState } from 'react';

const CATEGORY_ICONS: Record<string, string> = {
  'cotton-tee': 'M12 2L6 7v4h12V7l-6-5zM6 13v7a2 2 0 002 2h8a2 2 0 002-2v-7H6z',
  'hoodie': 'M12 2C9.8 2 8 3.8 8 6v1H4l1 13h14l1-13h-4V6c0-2.2-1.8-4-4-4zm-2 4c0-1.1.9-2 2-2s2 .9 2 2v1h-4V6z',
  'sport-tee': 'M20.38 3.46L16 2l-4 2-4-2-4.38 1.46A1 1 0 003 4.4V12a1 1 0 001 1h3v8h10v-8h3a1 1 0 001-1V4.4a1 1 0 00-.62-.94z',
  'cap': 'M2 12c0 3.3 4.5 6 10 6s10-2.7 10-6H2zm10-8C7.6 4 4 6.2 4 9h16c0-2.8-3.6-5-8-5z',
  'sticker-kit': 'M12 2a10 10 0 100 20 10 10 0 000-20zm-2 14l-4-4 1.4-1.4L10 13.2l6.6-6.6L18 8l-8 8z',
};

const CATEGORIES = [
  {
    name: 'Cotton Tees',
    key: 'cotton-tee',
    image: '/images/cotton-tee-hero.png',
  },
  {
    name: 'Hoodies',
    key: 'hoodie',
    image: '/images/hoddie-hero.png',
  },
  {
    name: 'Sport Tees',
    key: 'sport-tee',
    image: '/images/sport-tee-hero.png',
  },
  {
    name: 'Caps',
    key: 'cap',
    image: '/images/cap-hero.png',
  },
  {
    name: 'Stickers',
    key: 'sticker-kit',
    image: '/images/sticker-hero.png',
  },
];

interface CategoriesGridProps {
  onCategoryClick?: (key: string) => void;
  productImages?: Record<string, string>; // override images from DB
}

export function CategoriesGrid({ onCategoryClick, productImages }: CategoriesGridProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.15 }
    );

    const elements = sectionRef.current?.querySelectorAll('.fade-in');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-[100px]" id="shop">
      <div className="max-w-[1200px] mx-auto px-6">
        <span className="section-label fade-in block">Shop by Category</span>
        <h2 className="section-title fade-in">Find Your Gear</h2>
        <p className="section-desc fade-in">From cotton tees to stickers — built for the crew.</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
          {CATEGORIES.map((cat, i) => (
            <a
              key={cat.key}
              href={`#products-${cat.key}`}
              onClick={(e) => {
                if (onCategoryClick) {
                  e.preventDefault();
                  onCategoryClick(cat.key);
                }
              }}
              className={`fade-in ${i === 1 ? 'fade-in-delay-1' : i === 2 ? 'fade-in-delay-2' : i >= 3 ? 'fade-in-delay-3' : ''} relative rounded-[10px] overflow-hidden aspect-[3/4] bg-charcoal-deep cursor-pointer group`}
            >
              {!failedImages.has(cat.key) ? (
                <img
                  src={productImages?.[cat.key] || cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                  onError={() => setFailedImages(prev => new Set(prev).add(cat.key))}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-16 h-16 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={CATEGORY_ICONS[cat.key] || 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'} />
                  </svg>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-charcoal-deep/20 to-transparent" />
              <span className="absolute bottom-5 left-5 text-white font-display font-bold text-base tracking-[0.03em]">
                {cat.name}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
