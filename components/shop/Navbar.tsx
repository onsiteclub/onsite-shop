'use client';

import { useRef, useState } from 'react';
import { useCartStore } from '@/lib/store/cart';
import { BLOG_POSTS } from '@/lib/blog-data';
import { SearchOverlay } from '@/components/shop/SearchOverlay';
import type { Product } from '@/lib/types';

const NAV_LINK = 'font-display font-semibold text-[13px] tracking-[0.08em] uppercase text-text-primary hover:text-warm-500 transition-colors';

export function Navbar({ products = [], onProductClick }: { products?: Product[]; onProductClick?: (p: Product) => void }) {
  const cartItems = useCartStore((state) => state.items);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [blogOpen, setBlogOpen] = useState(false);
  const [mobileBlogOpen, setMobileBlogOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const blogTimeout = useRef<NodeJS.Timeout | null>(null);

  // 5-tap admin access
  const [tapCount, setTapCount] = useState(0);
  const tapTimer = useRef<NodeJS.Timeout | null>(null);

  const handleLogoClick = () => {
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
  };

  const handleBlogEnter = () => {
    if (blogTimeout.current) clearTimeout(blogTimeout.current);
    setBlogOpen(true);
  };

  const handleBlogLeave = () => {
    blogTimeout.current = setTimeout(() => setBlogOpen(false), 200);
  };

  const recentPosts = BLOG_POSTS.slice(0, 3);

  return (
    <>
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-[12px] border-b border-warm-200 transition-colors duration-300">
      <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-[72px]">
        {/* Logo */}
        <div className="cursor-pointer flex-shrink-0" onClick={handleLogoClick}>
          <img
            src="/assets/logo-onsite-club.png"
            alt="OnSite Club"
            className="h-10"
          />
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex gap-8 items-center">
          <a href="#shop" className={NAV_LINK}>Shop</a>
          <a href="/about" className={NAV_LINK}>About</a>
          <a href="#reviews" className={NAV_LINK}>Reviews</a>

          {/* Blog with dropdown */}
          <div
            className="relative"
            onMouseEnter={handleBlogEnter}
            onMouseLeave={handleBlogLeave}
          >
            <a href="/blog" className={`${NAV_LINK} flex items-center gap-1`}>
              Blog
              <svg className={`w-3 h-3 transition-transform duration-200 ${blogOpen ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 4.5l3 3 3-3" />
              </svg>
            </a>

            {/* Dropdown */}
            {blogOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3">
                <div className="bg-white rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-warm-200 w-[320px] overflow-hidden">
                  <div className="px-5 pt-4 pb-2">
                    <span className="font-display text-[10px] font-bold tracking-[0.15em] uppercase text-warm-400">
                      Recent Posts
                    </span>
                  </div>

                  <div className="flex flex-col">
                    {recentPosts.map((post) => (
                      <a
                        key={post.slug}
                        href="/blog"
                        className="flex gap-3.5 items-center px-5 py-3 hover:bg-off-white transition-colors group"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-warm-100">
                          <img src={post.image} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-display text-[13px] font-bold leading-snug truncate group-hover:text-charcoal-light transition-colors">
                            {post.title}
                          </div>
                          <div className="text-[11px] text-warm-400 mt-0.5">{post.date}</div>
                        </div>
                      </a>
                    ))}
                  </div>

                  <div className="border-t border-warm-200 px-5 py-3">
                    <a href="/blog" className="font-display text-[12px] font-bold tracking-[0.05em] uppercase text-charcoal hover:text-amber-dark transition-colors">
                      View All Posts &rarr;
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          <a href="https://www.instagram.com/onsite.club/" target="_blank" rel="noopener noreferrer" className={`${NAV_LINK} flex items-center gap-1.5`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
            Instagram
          </a>
          <a href="#contact" className={NAV_LINK}>Contact</a>
        </div>

        {/* Right: Search + Cart + Mobile Menu */}
        <div className="flex items-center gap-5">
          {/* Search */}
          <button onClick={() => setSearchOpen(true)} aria-label="Search" className="bg-transparent">
            <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>

          {/* Cart */}
          <a href="/cart" aria-label="Cart" className="relative">
            <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-amber text-charcoal-deep text-[10px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </a>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden bg-transparent"
            aria-label="Menu"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-warm-200 px-6 py-4 flex flex-col gap-4">
          <a href="#shop" onClick={() => setMobileOpen(false)} className="font-display font-semibold text-[13px] tracking-[0.08em] uppercase text-text-primary">Shop</a>
          <a href="/about" onClick={() => setMobileOpen(false)} className="font-display font-semibold text-[13px] tracking-[0.08em] uppercase text-text-primary">About</a>
          <a href="#reviews" onClick={() => setMobileOpen(false)} className="font-display font-semibold text-[13px] tracking-[0.08em] uppercase text-text-primary">Reviews</a>

          {/* Blog with expandable submenu */}
          <div>
            <button
              onClick={() => setMobileBlogOpen(!mobileBlogOpen)}
              className="font-display font-semibold text-[13px] tracking-[0.08em] uppercase text-text-primary flex items-center gap-1.5 w-full"
            >
              Blog
              <svg className={`w-3 h-3 transition-transform duration-200 ${mobileBlogOpen ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 4.5l3 3 3-3" />
              </svg>
            </button>
            {mobileBlogOpen && (
              <div className="mt-3 ml-2 flex flex-col gap-3 border-l-2 border-warm-200 pl-4">
                {recentPosts.map((post) => (
                  <a
                    key={post.slug}
                    href="/blog"
                    onClick={() => setMobileOpen(false)}
                    className="flex gap-3 items-center group"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-warm-100">
                      <img src={post.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-display text-[12px] font-bold leading-snug truncate">
                        {post.title}
                      </div>
                      <div className="text-[10px] text-warm-400">{post.date}</div>
                    </div>
                  </a>
                ))}
                <a
                  href="/blog"
                  onClick={() => setMobileOpen(false)}
                  className="font-display text-[11px] font-bold tracking-[0.05em] uppercase text-amber-dark"
                >
                  View All Posts &rarr;
                </a>
              </div>
            )}
          </div>

          <a href="https://www.instagram.com/onsite.club/" target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)} className="font-display font-semibold text-[13px] tracking-[0.08em] uppercase text-text-primary flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
            Instagram
          </a>
          <a href="#contact" onClick={() => setMobileOpen(false)} className="font-display font-semibold text-[13px] tracking-[0.08em] uppercase text-text-primary">Contact</a>
        </div>
      )}
    </nav>

    {/* Search Overlay */}
    <SearchOverlay
      products={products}
      isOpen={searchOpen}
      onClose={() => setSearchOpen(false)}
      onProductClick={(p) => {
        setSearchOpen(false);
        onProductClick?.(p);
      }}
    />
    </>
  );
}
