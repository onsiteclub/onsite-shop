'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { STRIPE_PRODUCTS } from '@/lib/stripe-config';
import { Navbar } from '@/components/shop/Navbar';
import { Footer } from '@/components/shop/Footer';
import { Hero } from '@/components/shop/Hero';
import { Marquee } from '@/components/shop/Marquee';
import { ProductGridByCategory } from '@/components/shop/ProductGridByCategory';
import { TrustBadges } from '@/components/trust-badges/TrustBadges';
import { ReviewsSection } from '@/components/ReviewsSection';
import { Newsletter } from '@/components/shop/Newsletter';
import { CategoryModal } from '@/components/shop/CategoryModal';
import { MembershipModal } from '@/components/shop/MembershipModal';
import { useAuthStore } from '@/lib/store/auth';
import type { Product } from '@/lib/types';

// Lazy-loaded (not needed on initial render, client-only)
const ProductModal = dynamic(
  () => import('@/components/shop/ProductModal').then(m => ({ default: m.ProductModal })),
  { ssr: false }
);

// ============================================================================
// PRODUCT LOADING — Same Supabase query as before, untouched logic
// ============================================================================

const MEMBERS_MOCKUPS: Product[] = [
  { product_key: 'members-exclusive-tee', name: 'Members Tee — Founders Edition', price: 0, price_id: '', category: 'members', product_type: '', image: 'https://www.onsiteclub.ca/_next/image?url=%2Fimages%2Fproduct-members.webp&w=640&q=80', images: [], description: 'Exclusive tee for OnSite Club members', sizes: ['M', 'L', 'XL'], colors: [], color_images: {}, sku: '' },
  { product_key: 'members-premium-hoodie', name: 'Members Hoodie — Built Different', price: 0, price_id: '', category: 'members', product_type: '', image: 'https://www.onsiteclub.ca/_next/image?url=%2Fimages%2Fvision3.png&w=640&q=80', images: [], description: 'Premium hoodie for members only', sizes: ['M', 'L', 'XL'], colors: [], color_images: {}, sku: '' },
  { product_key: 'members-limited-cap', name: 'Members Cap — OnSite Original', price: 0, price_id: '', category: 'members', product_type: '', image: 'https://www.onsiteclub.ca/_next/image?url=%2Fimages%2Fvision2.png&w=640&q=80', images: [], description: 'Limited run cap for club members', sizes: ['One Size'], colors: [], color_images: {}, sku: '' },
  { product_key: 'members-sticker-pack', name: 'Members Sticker Pack — Vol. 1', price: 0, price_id: '', category: 'members', product_type: '', image: 'https://www.onsiteclub.ca/_next/image?url=%2Fimages%2Fproduct-men.webp&w=640&q=80', images: [], description: 'Sticker pack for club members', sizes: [], colors: [], color_images: {}, sku: '' },
];

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

// ============================================================================
// HOMEPAGE
// ============================================================================

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [categoryModal, setCategoryModal] = useState<{ category: string; label: string; items: Product[] } | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const { user, initialize } = useAuthStore();

  // Initialize auth store
  useEffect(() => { initialize(); }, [initialize]);

  // Load products from Supabase
  useEffect(() => {
    loadProductsFromSupabase().then(p => {
      console.log('[SHOP] Products loaded:', p.length, p.map(x => x.product_key));
      setProducts(p);
      setLoaded(true);
    });
  }, []);

  // Featured products (first 4 non-members)
  const featuredProducts = useMemo(() => {
    return products.filter(p => p.category !== 'members').slice(0, 4);
  }, [products]);

  // Members products
  const membersFromDb = products.filter(p => p.category === 'members');
  const membersProducts = membersFromDb.length > 0 ? membersFromDb : MEMBERS_MOCKUPS;

  // Debug: log when selectedProduct changes
  useEffect(() => {
    console.log('[SHOP] selectedProduct changed:', selectedProduct?.product_key ?? 'null');
  }, [selectedProduct]);

  return (
    <div className="min-h-screen">
      <Navbar products={products} onProductClick={setSelectedProduct} />
      <Hero />
      <Marquee />

      {/* ===== MOBILE CATEGORY PILLS ===== */}
      <div className="lg:hidden sticky top-[72px] z-[90] bg-white/95 backdrop-blur-[12px] border-b border-warm-200">
        <div className="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
          {[
            { href: '#featured', label: 'Most Wanted' },
            { href: '#products-cotton-tee', label: 'Cotton Tees' },
            { href: '#products-hoodie', label: 'Hoodies' },
            { href: '#products-sport-tee', label: 'Sport Tees' },
            { href: '#products-cap-premium', label: 'Caps' },
            { href: '#products-sticker-kit', label: 'Stickers' },
            { href: '#members', label: 'Members' },
          ].map(pill => (
            <a
              key={pill.href}
              href={pill.href}
              className="flex-shrink-0 font-display text-[11px] font-bold tracking-[0.06em] uppercase px-4 py-2 rounded-full bg-off-white text-text-secondary hover:bg-warm-100 hover:text-text-primary transition-colors whitespace-nowrap"
            >
              {pill.label}
            </a>
          ))}
        </div>
      </div>

      {/* ===== PRODUCTS AREA WITH SIDEBAR ===== */}
      <div className="max-w-[1200px] mx-auto px-6 overflow-visible">
        <div className="flex gap-10 items-start overflow-visible">
          {/* Sidebar — sticky category nav (desktop only) */}
          <aside className="hidden lg:block w-[200px] flex-shrink-0 sticky top-[92px]">
            <h3 className="font-display text-[11px] font-bold tracking-[0.15em] uppercase text-warm-400 mb-5">
              Categories
            </h3>
            <nav className="flex flex-col gap-1">
              <SidebarLink href="#featured" label="Most Wanted" />
              <SidebarLink href="#products-cotton-tee" label="Cotton Tees" />
              <SidebarLink href="#products-hoodie" label="Hoodies" />
              <SidebarLink href="#products-sport-tee" label="Sport Tees" />
              <SidebarLink href="#products-cap-premium" label="Premium Caps" />
              <SidebarLink href="#products-cap-classic" label="Classic Caps" />
              <SidebarLink href="#products-sticker-kit" label="Stickers" />
              <SidebarLink href="#members" label="Members Exclusive" />
            </nav>

            <div className="mt-8 pt-6 border-t border-warm-200">
              <h3 className="font-display text-[11px] font-bold tracking-[0.15em] uppercase text-warm-400 mb-5">
                Quick Links
              </h3>
              <nav className="flex flex-col gap-1">
                <SidebarLink href="#reviews" label="Reviews" />
                <SidebarLink href="/blog" label="Blog" />
                <SidebarLink href="#contact" label="Contact" />
              </nav>
            </div>
          </aside>

          {/* Main product content */}
          <div className="flex-1 min-w-0">
            {/* ===== FEATURED PRODUCTS — Editorial Bento ===== */}
            <section className="pb-28" id="featured">
              <div className="flex justify-between items-end mb-12">
                <div>
                  <span className="section-label block">Featured</span>
                  <h2 className="section-title">Most Wanted</h2>
                </div>
                <button
                  onClick={() => setCategoryModal({ category: 'featured', label: 'Most Wanted', items: products.filter(p => p.category !== 'members') })}
                  className="font-display font-bold text-[13px] text-charcoal tracking-[0.05em] uppercase hover:text-amber-dark transition-colors"
                >
                  View All &rarr;
                </button>
              </div>

              {!loaded ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-[5/4] rounded-2xl bg-warm-200/40 mb-4" />
                      <div className="h-3 w-3/4 bg-warm-200/40 rounded mb-2" />
                      <div className="h-3 w-1/3 bg-warm-200/40 rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                  {/* Hero — same width, spans 2 rows */}
                  {featuredProducts[0] && (
                    <div className="col-span-1 row-span-2">
                      <ProductCard
                        product={featuredProducts[0]}
                        badge="New"
                        onClick={() => setSelectedProduct(featuredProducts[0])}
                        isHero
                        videoUrl="/videos/hero-favorite.mp4"
                      />
                    </div>
                  )}
                  {/* Remaining cards fill the other 2 columns */}
                  {featuredProducts.slice(1).map((product, i) => (
                    <div key={product.product_key} className="col-span-1">
                      <ProductCard
                        product={product}
                        badge={i === 0 ? undefined : 'Best Seller'}
                        onClick={() => setSelectedProduct(product)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ===== ALL PRODUCTS BY CATEGORY ===== */}
            <ProductGridByCategory
              products={products}
              loaded={loaded}
              onProductClick={setSelectedProduct}
              onViewAll={(category, label, items) => setCategoryModal({ category, label, items })}
            />

          </div>
        </div>
      </div>

      {/* ===== MEMBERS EXCLUSIVE — VIP ZONE (full-width, outside sidebar layout) ===== */}
      <section className="py-20" id="members">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="relative rounded-3xl overflow-hidden bg-[#1A1A18]">
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(ellipse at 30% 0%, rgba(212,175,55,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(212,175,55,0.05) 0%, transparent 40%)',
            }} />
            {/* Subtle top border accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber/40 to-transparent" />

            <div className="relative z-[1] px-8 sm:px-14 lg:px-20 py-16 sm:py-24">
              {/* Header */}
              <div className="text-center mb-14">
                <h2 className="font-body font-light text-2xl sm:text-3xl text-amber tracking-wide leading-[1.2] mb-3">
                  Exclusive Gear
                </h2>
                <p className="text-white/35 text-sm max-w-[360px] mx-auto font-body">
                  {user
                    ? `Welcome, ${user.user_metadata?.first_name || 'member'}. Exclusive gear is on the way.`
                    : "Sign up to see prices. It\u2019s free."}
                </p>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-14">
                {membersProducts.slice(0, 4).map((product) => (
                  <MembersCard key={product.product_key} product={product} onJoin={() => setShowMemberModal(true)} isMember={!!user} />
                ))}
              </div>

              {/* CTA */}
              <div className="text-center">
                {!user ? (
                  <button
                    onClick={() => setShowMemberModal(true)}
                    className="bg-amber text-charcoal-deep py-3.5 px-10 rounded-lg font-body font-light text-sm tracking-wide hover:bg-amber-light transition-all duration-300"
                  >
                    Become a Member
                  </button>
                ) : (
                  <p className="text-white/25 text-sm font-body">
                    Stay tuned for exclusive drops.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TRUST BADGES (components/trust-badges/ — remove import to disable) ===== */}
      <TrustBadges />

      {/* ===== REVIEWS (from Supabase via /api/reviews) ===== */}
      <ReviewsSection />

      {/* ===== NEWSLETTER ===== */}
      <Newsletter />

      <Footer />

      {/* Product Modal — same component, same logic */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onJoinMember={() => setShowMemberModal(true)}
        />
      )}

      {categoryModal && (
        <CategoryModal
          category={categoryModal.category}
          label={categoryModal.label}
          products={categoryModal.items}
          onClose={() => setCategoryModal(null)}
          onProductClick={(product) => {
            setCategoryModal(null);
            setSelectedProduct(product);
          }}
        />
      )}

      {showMemberModal && !user && (
        <MembershipModal
          onClose={() => setShowMemberModal(false)}
          onAuthSuccess={() => setShowMemberModal(false)}
        />
      )}
    </div>
  );
}

// ============================================================================
// PRODUCT CARD — New design matching homepage HTML
// ============================================================================

function ProductCard({
  product,
  badge,
  onClick,
  isHero = false,
  videoUrl,
}: {
  product: Product;
  badge?: string;
  onClick: () => void;
  isHero?: boolean;
  videoUrl?: string;
}) {
  // Hero cards: full-bleed video/image, no info section
  if (isHero) {
    return (
      <div
        className="relative group h-full rounded-2xl overflow-hidden bg-charcoal-deep shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
      >
        {badge && (
          <span className="absolute top-4 left-4 z-[2] bg-charcoal text-white font-display text-[11px] font-bold py-1.5 px-3.5 rounded-full">
            {badge}
          </span>
        )}
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

  // Regular cards: image + info section
  return (
    <div
      className="relative cursor-pointer group h-full rounded-2xl overflow-hidden bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
      onClick={() => { console.log('[SHOP] ProductCard clicked:', product.product_key); onClick(); }}
    >
      {badge && (
        <span className="absolute top-4 left-4 z-[2] bg-charcoal text-white font-display text-[11px] font-bold py-1.5 px-3.5 rounded-full">
          {badge}
        </span>
      )}
      <div className="aspect-[10/11] overflow-hidden relative">
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
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 pt-10">
          <p className="font-display font-bold text-white text-[13px] leading-tight drop-shadow-sm truncate">{product.name}</p>
          <span className="text-amber text-[13px] font-bold">CA${product.price.toFixed(2)}</span>
        </div>
        {/* Quick Add hover */}
        <div className="absolute bottom-0 left-0 right-0 bg-charcoal/90 backdrop-blur-sm text-white text-center py-3 font-display text-[11px] font-bold tracking-[0.12em] uppercase translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          Quick Add
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MEMBERS CARD — "Become a Member" CTA
// ============================================================================

function MembersCard({ product, onJoin, isMember }: { product: Product; onJoin?: () => void; isMember?: boolean }) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden bg-white/[0.04] group cursor-pointer"
      onClick={isMember ? undefined : onJoin}
    >
      <div className="aspect-[3/4] overflow-hidden relative">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] brightness-[0.85] group-hover:brightness-100"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/10 bg-white/[0.03]">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
        )}
        {/* Hover overlay — arrow + text */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
          <span className="text-white/80 text-xs font-body text-center px-4 leading-relaxed">
            {isMember ? 'Coming soon' : 'Join free to see prices'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SIDEBAR LINK
// ============================================================================

function SidebarLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="font-display text-[13px] font-semibold text-text-secondary py-2 px-3 rounded-lg hover:bg-warm-100 hover:text-text-primary transition-all duration-200"
    >
      {label}
    </a>
  );
}
