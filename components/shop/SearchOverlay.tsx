'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Product } from '@/lib/types';

interface SearchOverlayProps {
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
  onProductClick: (product: Product) => void;
}

export function SearchOverlay({ products, isOpen, onClose, onProductClick }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const results = useCallback(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    return products
      .filter(p =>
        p.category !== 'members' &&
        (p.name.toLowerCase().includes(q) ||
         p.description?.toLowerCase().includes(q) ||
         p.product_type?.toLowerCase().includes(q) ||
         p.sku?.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [query, products])();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Search Panel */}
      <div className="fixed top-0 left-0 right-0 z-[160] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.15)]">
        <div className="max-w-[700px] mx-auto px-6 py-5">
          {/* Input */}
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search tees, hoodies, caps..."
              className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-off-white border border-warm-200 font-body text-[15px] text-text-primary placeholder-warm-400 focus:outline-none focus:border-warm-400 transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-400 hover:text-text-primary transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Results */}
          {query.length >= 2 && (
            <div className="mt-4">
              {results.length === 0 ? (
                <p className="text-center py-6 font-body text-sm text-warm-400">
                  No products found for &ldquo;{query}&rdquo;
                </p>
              ) : (
                <div className="flex flex-col">
                  {results.map(product => (
                    <button
                      key={product.product_key}
                      onClick={() => {
                        onProductClick(product);
                        onClose();
                      }}
                      className="flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-off-white transition-colors text-left"
                    >
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-warm-100 flex-shrink-0">
                        {product.image ? (
                          <img src={product.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-warm-300">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-display text-[13px] font-bold text-text-primary truncate">
                          {product.name}
                        </div>
                        <div className="font-display text-[13px] font-bold text-amber-dark mt-0.5">
                          CA${product.price.toFixed(2)}
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-warm-300 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>
                  ))}
                  {products.filter(p => p.category !== 'members' && (p.name.toLowerCase().includes(query.toLowerCase()) || p.description?.toLowerCase().includes(query.toLowerCase()))).length > 6 && (
                    <p className="text-center py-3 font-display text-xs text-warm-400">
                      Showing first 6 results
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Hint when empty */}
          {query.length < 2 && (
            <p className="text-center py-4 font-body text-xs text-warm-400">
              Type at least 2 characters to search
            </p>
          )}
        </div>
      </div>
    </>
  );
}
