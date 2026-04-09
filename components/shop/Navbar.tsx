'use client';

import { useRef, useState, useEffect } from 'react';
import { useCartStore } from '@/lib/store/cart';
import { useAuthStore } from '@/lib/store/auth';
import { BLOG_POSTS } from '@/lib/blog-data';
import { SearchOverlay } from '@/components/shop/SearchOverlay';
import { MembershipModal } from '@/components/shop/MembershipModal';
import type { Product } from '@/lib/types';

const NAV_LINK = 'font-display font-semibold text-[13px] tracking-[0.08em] uppercase text-text-primary hover:text-warm-500 transition-colors';
const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://auth.onsiteclub.ca';

export function Navbar({ products = [], onProductClick }: { products?: Product[]; onProductClick?: (p: Product) => void }) {
  const cartItems = useCartStore((state) => state.items);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const { user, initialize, signOut } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => { initialize(); }, [initialize]);

  // Close user menu on click outside
  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [userMenuOpen]);

  const firstName = user?.user_metadata?.first_name || '';
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

          <a href="#contact" className={NAV_LINK}>Contact</a>
        </div>

        {/* Right: Search + Cart + Mobile Menu */}
        <div className="flex items-center gap-5">
          {/* User */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => {
                if (user) {
                  setUserMenuOpen(!userMenuOpen);
                } else {
                  setShowMemberModal(true);
                }
              }}
              className="flex items-center gap-1.5 group bg-transparent"
              aria-label="Account"
            >
              <svg className="w-[20px] h-[20px] text-text-primary group-hover:text-amber-dark transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {firstName ? (
                <span className="hidden sm:inline font-display text-[12px] font-semibold text-text-primary group-hover:text-amber-dark transition-colors">
                  {firstName}
                </span>
              ) : null}
            </button>

            {/* User dropdown */}
            {userMenuOpen && user && (
              <div className="absolute top-full right-0 pt-3 z-50">
                <div className="bg-white rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-warm-200 w-[220px] overflow-hidden">
                  {/* User info */}
                  <div className="px-5 pt-4 pb-3 border-b border-warm-100">
                    <p className="font-display text-sm font-bold text-text-primary truncate">
                      {firstName || 'Member'}
                    </p>
                    <p className="font-body text-[11px] text-warm-400 truncate">
                      {user.email}
                    </p>
                  </div>

                  {/* Links */}
                  <div className="py-1.5">
                    <a
                      href="https://auth.onsiteclub.ca/login?return_to=https://member.onsiteclub.ca"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-5 py-2.5 hover:bg-off-white transition-colors"
                    >
                      <svg className="w-4 h-4 text-warm-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                      </svg>
                      <span className="font-display text-[13px] font-semibold text-text-primary">
                        My Dashboard
                      </span>
                    </a>
                  </div>

                  {/* Sign out */}
                  <div className="border-t border-warm-100 py-1.5">
                    <button
                      onClick={() => {
                        signOut();
                        setUserMenuOpen(false);
                        window.location.href = `${AUTH_URL}/logout?return_to=${encodeURIComponent(window.location.origin)}`;
                      }}
                      className="flex items-center gap-3 px-5 py-2.5 w-full hover:bg-off-white transition-colors"
                    >
                      <svg className="w-4 h-4 text-warm-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      <span className="font-display text-[13px] font-semibold text-text-secondary">
                        Sign Out
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

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

    {/* Membership Modal (triggered from user icon when not logged in) */}
    {showMemberModal && !user && (
      <MembershipModal
        onClose={() => setShowMemberModal(false)}
        onAuthSuccess={() => setShowMemberModal(false)}
      />
    )}
    </>
  );
}
