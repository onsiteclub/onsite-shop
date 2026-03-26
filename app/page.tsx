'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useCartStore } from '@/lib/store/cart';
import { createClient } from '@/lib/supabase/client';
import { STRIPE_PRODUCTS } from '@/lib/stripe-config';
import { ReviewsSection } from '@/components/ReviewsSection';
import { BackgroundSystem } from '@/components/shop/BackgroundSystem';
import { HeroCards } from '@/components/shop/HeroCards';
import { CategoryCarousel } from '@/components/shop/CategoryCarousel';
import { UniformProductCard } from '@/components/shop/ProductCard';
import type { Product } from '@/lib/types';

// Lazy-loaded components (not needed on initial render)
const CustomCursor = dynamic(() => import('@/components/shop/CustomCursor').then(m => ({ default: m.CustomCursor })), { ssr: false });
const ScrollDust = dynamic(() => import('@/components/shop/ScrollDust').then(m => ({ default: m.ScrollDust })), { ssr: false });
const ProductModal = dynamic(() => import('@/components/shop/ProductModal').then(m => ({ default: m.ProductModal })));

// ============================================================================
// LAYOUT SYSTEM - OnSite Shop (Uniform Grid)
// ============================================================================
//
// MOBILE: 1 col | TABLET: 2-3 cols | DESKTOP: 4 cols
// Cards: uniform size, floating effect (shadow + hover + press)
// Z-INDEX: z-[100] cursor > z-50 modals/banner > z-10 products > z-0 bg
// ============================================================================

const SHOP_CATEGORIES = [
  { key: 'cotton-tee', label: 'Cotton Tees' },
  { key: 'hoodie', label: 'Hoodies' },
  { key: 'sport-tee', label: 'Sport Tees' },
  { key: 'cap', label: 'Caps' },
  { key: 'sticker-kit', label: 'Stickers' },
];

// Members mockup products (coming soon placeholders)
const MEMBERS_MOCKUPS: Product[] = [
  { product_key: 'members-exclusive-tee', name: 'Members Exclusive Tee', price: 0, price_id: '', category: 'members', product_type: '', image: '', images: [], description: 'Exclusive tee for OnSite Club members', sizes: ['M', 'L', 'XL'], colors: [], color_images: {}, sku: '' },
  { product_key: 'members-premium-hoodie', name: 'Premium Hoodie', price: 0, price_id: '', category: 'members', product_type: '', image: '', images: [], description: 'Premium hoodie for members only', sizes: ['M', 'L', 'XL'], colors: [], color_images: {}, sku: '' },
  { product_key: 'members-limited-cap', name: 'Limited Edition Cap', price: 0, price_id: '', category: 'members', product_type: '', image: '', images: [], description: 'Limited run cap for club members', sizes: ['One Size'], colors: [], color_images: {}, sku: '' },
  { product_key: 'members-crew-jacket', name: 'Crew Jacket', price: 0, price_id: '', category: 'members', product_type: '', image: '', images: [], description: 'On-site crew jacket', sizes: ['M', 'L', 'XL'], colors: [], color_images: {}, sku: '' },
  { product_key: 'members-safety-vest', name: 'Safety Vest', price: 0, price_id: '', category: 'members', product_type: '', image: '', images: [], description: 'High-vis safety vest with OnSite branding', sizes: ['M', 'L', 'XL'], colors: [], color_images: {}, sku: '' },
  { product_key: 'members-work-pants', name: 'Work Pants', price: 0, price_id: '', category: 'members', product_type: '', image: '', images: [], description: 'Durable work pants for the job site', sizes: ['M', 'L', 'XL'], colors: [], color_images: {}, sku: '' },
];

// Fisher-Yates shuffle
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Load products from Supabase + match Stripe prices
async function loadProductsFromSupabase(): Promise<Product[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('app_shop_products')
      .select('*, category:categories(slug)')
      .eq('is_active', true)
      .order('sort_order');

    if (error || !data || data.length === 0) {
      console.error('[SHOP] Error or no products:', error);
      return [];
    }

    const SKU_PREFIX_MAP: Record<string, keyof typeof STRIPE_PRODUCTS> = {
      'CTEE': 'cotton-tee',
      'STEE': 'sport-tee',
      'HOOD': 'hoodie',
      'CPPRM': 'cap-premium',
      'CPCLS': 'cap-classic',
      'STK': 'sticker-kit',
    };

    return data.map((p: any) => {
      const typeMatch = p.product_type ? STRIPE_PRODUCTS[p.product_type as keyof typeof STRIPE_PRODUCTS] : null;
      const skuPrefix = (p.sku || '').split('-')[0];
      const skuType = SKU_PREFIX_MAP[skuPrefix];
      const skuPrefixMatch = skuType ? STRIPE_PRODUCTS[skuType] : null;
      const priceId = p.stripe_price_id || typeMatch?.priceId || skuPrefixMatch?.priceId || '';

      return {
        product_key: p.sku || p.id,
        name: p.name,
        price: p.base_price ?? (typeMatch?.price || skuPrefixMatch?.price || 0) / 100,
        price_id: priceId,
        category: p.category?.slug || 'mens',
        product_type: p.product_type || skuType || '',
        image: p.primary_image || p.images?.[0] || '',
        images: p.images || [],
        description: p.description || '',
        sizes: p.sizes || [],
        colors: p.colors || [],
        color_images: p.color_images || {},
        sku: p.sku || '',
      };
    });
  } catch {
    return [];
  }
}

// Main Page Component
export default function ShopPage() {
  const [activeView, setActiveView] = useState<'all' | 'members'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const cartItems = useCartStore((state) => state.items);
  const [isHoveringProduct, setIsHoveringProduct] = useState(false);
  const [isModalOpening, setIsModalOpening] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const tapTimer = useRef<NodeJS.Timeout | null>(null);

  // Load products from Supabase
  useEffect(() => {
    loadProductsFromSupabase().then(p => { setProducts(p); setLoaded(true); });
  }, []);

  // Group products by product_type and shuffle each group
  const shuffledByCategory = useMemo(() => {
    const grouped: Record<string, Product[]> = {};
    for (const p of products.filter(p => p.category !== 'members')) {
      const type = p.product_type || '';
      if (!type) continue;
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(p);
    }
    for (const key of Object.keys(grouped)) {
      grouped[key] = shuffleArray(grouped[key]);
    }
    return grouped;
  }, [products]);

  // Members view fallback
  const membersFromDb = products.filter(p => p.category === 'members');
  const membersProducts = membersFromDb.length > 0 ? membersFromDb : MEMBERS_MOCKUPS;

  // Active category row — scroll-based focus
  const [activeCategoryKey, setActiveCategoryKey] = useState<string>(SHOP_CATEGORIES[0]?.key || '');

  useEffect(() => {
    if (activeView !== 'all') return;
    const observers: IntersectionObserver[] = [];
    const timer = setTimeout(() => {
      SHOP_CATEGORIES.forEach(cat => {
        const el = document.getElementById(`row-${cat.key}`);
        if (!el) return;
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
                setActiveCategoryKey(cat.key);
              }
            });
          },
          { threshold: [0.4, 0.6], rootMargin: '-10% 0px -30% 0px' }
        );
        observer.observe(el);
        observers.push(observer);
      });
    }, 200);

    return () => {
      clearTimeout(timer);
      observers.forEach(obs => obs.disconnect());
    };
  }, [activeView, products]);

  // Modal opening handler
  const handleProductClick = (product: Product) => {
    setIsModalOpening(true);
    setTimeout(() => {
      setSelectedProduct(product);
      setIsModalOpening(false);
    }, 80);
  };

  return (
    <div className="relative w-full min-h-screen overflow-y-auto">
      {/* Custom Cursor - desktop only */}
      <CustomCursor isHovering={isHoveringProduct} label={isHoveringProduct ? 'VIEW' : ''} />

      {/* Grainy 3D Background */}
      <div
        className="fixed inset-0"
        style={{ background: 'linear-gradient(135deg, #D4CFC4 0%, #C9C4B8 50%, #BEB9AD 100%)' }}
      >
        <svg className="absolute inset-0 w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)"/>
        </svg>
        <BackgroundSystem />
      </div>

      {/* Scroll Dust */}
      <ScrollDust />

      {/* TOP BANNER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#D4CFC4]/70 backdrop-blur-md border-b border-[#1B2B27]/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 md:py-2.5 flex items-center justify-between">
          {/* Logo (5 rapid taps → /admin) */}
          <div
            className="flex-shrink-0 cursor-pointer"
            onClick={() => {
              const next = tapCount + 1;
              if (tapTimer.current) clearTimeout(tapTimer.current);
              if (next >= 5) {
                setTapCount(0);
                window.location.href = '/admin';
                return;
              }
              setTapCount(next);
              tapTimer.current = setTimeout(() => {
                setTapCount(0);
                window.location.href = 'https://onsiteclub.ca';
              }, 800);
            }}
          >
            <img src="/assets/logo-onsite-club.png" alt="OnSite Club" className="h-10 md:h-12 w-auto" />
          </div>

          {/* Tagline */}
          <p className="hidden md:block font-mono text-[11px] text-[#1B2B27]/50 tracking-[0.3em] uppercase absolute left-1/2 -translate-x-1/2">
            Built For Those Who Build
          </p>

          {/* Navigation */}
          <nav className="flex items-center gap-4 md:gap-6">
            <button
              onClick={() => setActiveView('all')}
              className={`group relative font-mono text-[10px] md:text-xs tracking-[0.2em] uppercase transition-all duration-300
                ${activeView === 'all' ? 'text-[#1B2B27] font-bold' : 'text-[#1B2B27]/50 hover:text-[#1B2B27]'}`}
            >
              SHOP
              <span className={`absolute -bottom-1 left-0 h-[2px] bg-[#B8860B] transition-all duration-300 origin-left rotate-[-4deg]
                ${activeView === 'all' ? 'w-full' : 'w-0 group-hover:w-full'}`} />
            </button>
            <button
              onClick={() => setActiveView('members')}
              className={`group relative font-mono text-[10px] md:text-xs tracking-[0.2em] uppercase transition-all duration-300
                ${activeView === 'members' ? 'text-[#1B2B27] font-bold' : 'text-[#1B2B27]/50 hover:text-[#1B2B27]'}`}
            >
              MEMBERS
              <span className={`absolute -bottom-1 left-0 h-[2px] bg-[#B8860B] transition-all duration-300 origin-left rotate-[-4deg]
                ${activeView === 'members' ? 'w-full' : 'w-0 group-hover:w-full'}`} />
            </button>
            <a
              href="/cart"
              className={`group relative font-mono text-[10px] md:text-xs tracking-[0.2em] uppercase transition-all duration-300
                ${cartItems.length > 0 ? 'text-[#1B2B27] font-bold' : 'text-[#1B2B27]/50 hover:text-[#1B2B27]'}`}
            >
              BAG{cartItems.length > 0 && <span className="text-[#B8860B] ml-1">({cartItems.length})</span>}
              <span className={`absolute -bottom-1 left-0 h-[2px] bg-[#B8860B] transition-all duration-300 origin-left rotate-[-4deg]
                ${cartItems.length > 0 ? 'w-full' : 'w-0 group-hover:w-full'}`} />
            </a>
          </nav>
        </div>
      </header>

      {/* Content */}
      <div
        className="relative z-10 max-w-7xl mx-auto pt-24 md:pt-28 px-4 md:px-6 pb-12"
        style={{
          opacity: isModalOpening ? 0.95 : 1,
          transform: isModalOpening ? 'scale(0.995)' : 'scale(1)',
          transition: 'all 200ms',
        }}
      >
        {activeView === 'members' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-6">
            {membersProducts.map((product, i) => (
              <UniformProductCard
                key={`member-${product.product_key}-${i}`}
                product={product}
                onClick={() => handleProductClick(product)}
                onHoverChange={setIsHoveringProduct}
              />
            ))}
          </div>
        ) : !loaded ? (
          /* Skeleton loading state */
          <>
            <div className="flex justify-center gap-3 md:gap-5 px-4 mb-8 md:mb-12">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl bg-white/40 animate-pulse" />
                  <div className="w-12 h-2 rounded bg-white/30 animate-pulse mt-2" />
                </div>
              ))}
            </div>
            {[1, 2, 3].map(row => (
              <div key={row} className="mb-10 md:mb-14">
                <div className="w-32 h-4 rounded bg-white/30 animate-pulse mb-4 md:mb-6 px-2" />
                <div className="flex gap-4 md:gap-6 overflow-hidden px-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-[75vw] sm:w-[200px] md:w-[220px] lg:w-[240px]">
                      <div className="aspect-square rounded-xl bg-white/30 animate-pulse" />
                      <div className="mt-2 flex flex-col items-center gap-1.5">
                        <div className="w-24 h-3 rounded bg-white/20 animate-pulse" />
                        <div className="w-16 h-3 rounded bg-white/20 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <HeroCards productsByCategory={shuffledByCategory} />
            {SHOP_CATEGORIES.map(cat => {
              const catProducts = shuffledByCategory[cat.key] || [];
              if (catProducts.length === 0) return null;
              return (
                <CategoryCarousel
                  key={cat.key}
                  id={`row-${cat.key}`}
                  title={cat.label}
                  products={catProducts}
                  onProductClick={handleProductClick}
                  onHoverChange={setIsHoveringProduct}
                  isActive={activeCategoryKey === cat.key}
                />
              );
            })}
          </>
        )}
      </div>

      {/* Reviews */}
      {activeView === 'all' && <ReviewsSection />}

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <div className="pb-6" />
    </div>
  );
}
