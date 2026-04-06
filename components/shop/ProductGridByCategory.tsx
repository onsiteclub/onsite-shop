'use client';

import { useEffect, useRef } from 'react';
import type { Product } from '@/lib/types';

const CATEGORY_LABELS: Record<string, string> = {
  'cotton-tee': 'Cotton Tees',
  'hoodie': 'Hoodies',
  'sport-tee': 'Sport Tees',
  'cap': 'Caps',
  'cap-premium': 'Premium Caps',
  'cap-classic': 'Classic Caps',
  'sticker-kit': 'Stickers',
};

const CATEGORY_ORDER = ['cotton-tee', 'hoodie', 'sport-tee', 'cap-premium', 'cap-classic', 'cap', 'sticker-kit'];
const LARGE_CATEGORIES = new Set(['cotton-tee', 'hoodie', 'sport-tee']);

interface ProductGridByCategoryProps {
  products: Product[];
  loaded: boolean;
  onProductClick: (product: Product) => void;
  onViewAll?: (category: string, label: string, items: Product[]) => void;
}

export function ProductGridByCategory({ products, loaded, onProductClick, onViewAll }: ProductGridByCategoryProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.1 }
    );
    const elements = sectionRef.current.querySelectorAll('.fade-in');
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loaded]);

  // Group products by product_type (exclude members)
  const grouped: { key: string; label: string; items: Product[] }[] = [];
  const byType: Record<string, Product[]> = {};

  for (const p of products.filter(p => p.category !== 'members')) {
    const type = p.product_type || '';
    if (!type) continue;
    if (!byType[type]) byType[type] = [];
    byType[type].push(p);
  }

  for (const key of CATEGORY_ORDER) {
    if (byType[key]?.length) {
      grouped.push({ key, label: CATEGORY_LABELS[key] || key, items: byType[key] });
    }
  }
  for (const key of Object.keys(byType)) {
    if (!CATEGORY_ORDER.includes(key) && byType[key]?.length) {
      grouped.push({ key, label: CATEGORY_LABELS[key] || key, items: byType[key] });
    }
  }

  if (!loaded) {
    return (
      <section className="pb-20">
        {[1, 2].map((row) => (
          <div key={row} className="mb-20">
            <div className="h-5 w-40 bg-warm-200/40 rounded-lg animate-pulse mb-10" />
            <div className="animate-pulse mb-6">
              <div className="aspect-[5/4] lg:aspect-[2/1] rounded-2xl bg-warm-200/40" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square rounded-2xl bg-warm-200/40 mb-4" />
                  <div className="h-3 w-3/4 bg-warm-200/40 rounded mb-2" />
                  <div className="h-3 w-1/3 bg-warm-200/40 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    );
  }

  if (grouped.length === 0) return null;

  let largeIndex = 0;

  return (
    <div ref={sectionRef}>
      {grouped.map((group) => {
        const isLarge = LARGE_CATEGORIES.has(group.key);
        const currentIndex = isLarge ? largeIndex++ : 0;

        return (
          <section key={group.key} id={`products-${group.key}`} className="pb-28">
            <div className="flex justify-between items-end mb-10">
              <div>
                <span className="section-label block fade-in">Collection</span>
                <h2 className="section-title fade-in">{group.label}</h2>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-warm-400 text-sm font-display font-semibold hidden sm:block">
                  {group.items.length} {group.items.length === 1 ? 'piece' : 'pieces'}
                </span>
                {onViewAll && group.items.length > 2 && (
                  <button
                    onClick={() => onViewAll(group.key, group.label, group.items)}
                    className="font-display font-bold text-[13px] text-charcoal tracking-[0.05em] uppercase hover:text-amber-dark transition-colors"
                  >
                    View All &rarr;
                  </button>
                )}
              </div>
            </div>

            {/* Sticker lifestyle banner */}
            {group.key === 'sticker-kit' && (
              <div className="mb-8 rounded-2xl overflow-hidden relative fade-in">
                <div className="aspect-[3/1] sm:aspect-[4/1] bg-warm-100 relative">
                  {/* Replace src with your sticker lifestyle photo */}
                  <img
                    src="/images/stickers-banner.png"
                    alt="Sticker examples in use"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-charcoal/60 via-charcoal/20 to-transparent" />
                  <div className="absolute inset-0 flex items-center px-8 sm:px-12">
                    <div>
                      <span className="text-white/70 font-display text-[11px] font-bold tracking-[0.15em] uppercase">Stick it everywhere</span>
                      <h3 className="text-white font-display font-extrabold text-xl sm:text-2xl lg:text-3xl mt-1 tracking-tight">Made to last outdoors</h3>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isLarge ? (
              <EditorialBento items={group.items} onProductClick={onProductClick} patternIndex={currentIndex} categoryKey={group.key} />
            ) : (
              <CompactGrid items={group.items} onProductClick={onProductClick} />
            )}
          </section>
        );
      })}
    </div>
  );
}

// ============================================================================
// CATEGORY HERO VIDEOS — institutional video per category (replaces hero image)
// ============================================================================

const CATEGORY_HERO_VIDEO: Record<string, string> = {
  'cotton-tee': '/videos/My_Boy_Did_It.mp4',
  'sport-tee': '/videos/hero-card.mp4',
  'hoodie': '/videos/hero-card3.mp4',
};

// ============================================================================
// EDITORIAL BENTO — Asymmetric hero + side cards, alternating position
// ============================================================================

function EditorialBento({ items, onProductClick, patternIndex, categoryKey }: {
  items: Product[];
  onProductClick: (p: Product) => void;
  patternIndex: number;
  categoryKey: string;
}) {
  const heroVideo = CATEGORY_HERO_VIDEO[categoryKey] || null;

  if (items.length === 0) return null;

  if (items.length === 1) {
    return (
      <div className="max-w-[700px] fade-in">
        <EditorialCard product={items[0]} onClick={() => onProductClick(items[0])} variant="normal" videoUrl={heroVideo} />
      </div>
    );
  }

  const [hero, ...rest] = items;
  const sideItems = rest.slice(0, 2);
  const extraItems = rest.slice(2);
  const isReversed = patternIndex % 2 === 1;

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Hero — same width, spans 2 rows */}
        <div className="col-span-1 row-span-2 fade-in">
          <EditorialCard product={hero} onClick={() => onProductClick(hero)} variant="hero" videoUrl={heroVideo} />
        </div>
        {/* Remaining cards fill the other columns */}
        {rest.map((product, i) => (
          <div
            key={product.product_key}
              className={`fade-in ${i === 0 ? 'fade-in-delay-1' : i === 1 ? 'fade-in-delay-2' : 'fade-in-delay-3'}`}
            >
              <EditorialCard product={product} onClick={() => onProductClick(product)} variant="normal" />
            </div>
          ))}
      </div>
    </div>
  );
}

// ============================================================================
// COMPACT GRID — caps/stickers: clean 4-col grid
// ============================================================================

function CompactGrid({ items, onProductClick }: { items: Product[]; onProductClick: (p: Product) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
      {items.map((product, i) => (
        <div
          key={product.product_key}
          className={`fade-in ${i === 1 ? 'fade-in-delay-1' : i === 2 ? 'fade-in-delay-2' : i >= 3 ? 'fade-in-delay-3' : ''}`}
        >
          <EditorialCard product={product} onClick={() => onProductClick(product)} variant="compact" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// EDITORIAL CARD — High-end card with size variants
// ============================================================================

function EditorialCard({
  product,
  onClick,
  variant = 'normal',
  videoUrl,
}: {
  product: Product;
  onClick: () => void;
  variant?: 'hero' | 'side' | 'normal' | 'compact';
  videoUrl?: string | null;
}) {
  const isHero = variant === 'hero';
  const isCompact = variant === 'compact';

  // Hero cards: full-bleed video/image, no info section
  if (isHero) {
    return (
      <div
        className="relative group h-full rounded-2xl overflow-hidden bg-charcoal-deep shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
      >
        <div className="h-full overflow-hidden relative">
          {videoUrl ? (
            <video
              src={videoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : product.isVideo && product.image ? (
            <video
              src={product.image}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-warm-300 bg-warm-100">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
          )}
          {/* Product name overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-6 pt-16">
            <p className="font-display font-extrabold text-white text-lg lg:text-xl tracking-tight drop-shadow-sm">
              {product.name}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Regular / side / compact cards: image with overlay info
  return (
    <div
      className="relative cursor-pointer group h-full rounded-2xl overflow-hidden bg-charcoal-deep shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
      onClick={onClick}
    >
      <div className="aspect-square overflow-hidden relative">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-warm-300 bg-warm-100">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
        )}
        {/* Name + price overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 sm:p-4 pt-10">
          <p className="font-display font-bold text-white text-xs sm:text-[13px] leading-tight drop-shadow-sm truncate">{product.name}</p>
          <span className="text-amber text-xs sm:text-[13px] font-bold">CA${product.price.toFixed(2)}</span>
        </div>
        {/* Quick Add hover */}
        <div className="absolute bottom-0 left-0 right-0 bg-charcoal/90 backdrop-blur-sm text-white text-center py-3 font-display text-[11px] font-bold tracking-[0.12em] uppercase translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          Quick Add
        </div>
      </div>
    </div>
  );
}
