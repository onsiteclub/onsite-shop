'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Product } from '@/lib/types';

interface CategoryModalProps {
  category: string;
  label: string;
  products: Product[];
  onClose: () => void;
  onProductClick: (product: Product) => void;
}

type SortOption = 'default' | 'price-low' | 'price-high' | 'name';

export function CategoryModal({ category, label, products, onClose, onProductClick }: CategoryModalProps) {
  const [sort, setSort] = useState<SortOption>('default');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Collect all colors and sizes from products
  const allColors = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => p.colors?.forEach(c => set.add(c)));
    return Array.from(set).sort();
  }, [products]);

  const allSizes = useMemo(() => {
    const order = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'One Size'];
    const set = new Set<string>();
    products.forEach(p => p.sizes?.forEach(s => set.add(s)));
    return Array.from(set).sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [products]);

  // Filter + sort
  const filtered = useMemo(() => {
    let result = [...products];

    if (selectedColor) {
      result = result.filter(p => p.colors?.includes(selectedColor));
    }
    if (selectedSize) {
      result = result.filter(p => p.sizes?.includes(selectedSize));
    }

    switch (sort) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [products, selectedColor, selectedSize, sort]);

  const activeFilters = (selectedColor ? 1 : 0) + (selectedSize ? 1 : 0);

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[1100px] max-h-[90vh] mt-[5vh] mx-4 bg-[#F3F2EF] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-warm-200 bg-white flex-shrink-0">
          <div>
            <span className="font-display text-[10px] font-bold tracking-[0.15em] uppercase text-warm-400 block">
              Collection
            </span>
            <h2 className="font-display font-extrabold text-xl sm:text-2xl tracking-tight">
              {label}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-warm-400 text-sm font-display font-semibold hidden sm:block">
              {filtered.length} {filtered.length === 1 ? 'piece' : 'pieces'}
            </span>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-warm-100 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3 px-6 sm:px-8 py-4 bg-white/60 border-b border-warm-200/60 flex-shrink-0">
          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="font-display text-[12px] font-bold tracking-[0.05em] uppercase py-2 px-4 rounded-lg border border-warm-200 bg-white text-text-secondary cursor-pointer outline-none hover:border-warm-300 transition-colors"
          >
            <option value="default">Sort: Default</option>
            <option value="price-low">Price: Low → High</option>
            <option value="price-high">Price: High → Low</option>
            <option value="name">Name: A → Z</option>
          </select>

          {/* Color filter */}
          {allColors.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-display text-[11px] font-bold tracking-[0.05em] uppercase text-warm-400">Color:</span>
              <div className="flex gap-1.5">
                {allColors.slice(0, 8).map((color) => {
                  const isActive = selectedColor === color;
                  const sampleProduct = products.find(p => p.color_images?.[color]?.[0]);
                  const colorImg = sampleProduct?.color_images?.[color]?.[0];
                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(isActive ? null : color)}
                      title={color}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        isActive ? 'border-charcoal scale-110 ring-2 ring-amber/30' : 'border-warm-200 hover:border-warm-300'
                      }`}
                      style={{
                        backgroundImage: colorImg ? `url(${colorImg})` : undefined,
                        backgroundSize: 'cover',
                        backgroundColor: colorImg ? undefined : '#1A1A18',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Size filter */}
          {allSizes.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-display text-[11px] font-bold tracking-[0.05em] uppercase text-warm-400">Size:</span>
              <div className="flex gap-1">
                {allSizes.map((size) => {
                  const isActive = selectedSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(isActive ? null : size)}
                      className={`font-display text-[11px] font-bold py-1 px-2.5 rounded-md border transition-all ${
                        isActive
                          ? 'bg-charcoal text-white border-charcoal'
                          : 'border-warm-200 bg-white text-text-secondary hover:border-warm-300'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Clear filters */}
          {activeFilters > 0 && (
            <button
              onClick={() => { setSelectedColor(null); setSelectedSize(null); }}
              className="font-display text-[11px] font-bold text-amber-dark hover:text-charcoal transition-colors ml-auto"
            >
              Clear filters ({activeFilters})
            </button>
          )}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-warm-400 font-display text-sm">No products match your filters.</p>
              <button
                onClick={() => { setSelectedColor(null); setSelectedSize(null); }}
                className="mt-3 font-display text-[12px] font-bold text-amber-dark hover:text-charcoal transition-colors"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {filtered.map((product) => (
                <div
                  key={product.product_key}
                  className="cursor-pointer group rounded-2xl overflow-hidden bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-all duration-300"
                  onClick={() => onProductClick(product)}
                >
                  <div className="aspect-square overflow-hidden relative">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-warm-300 bg-warm-100">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-charcoal/90 backdrop-blur-sm text-white text-center py-3 font-display text-[11px] font-bold tracking-[0.12em] uppercase translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      View Details
                    </div>
                  </div>
                  <div className="p-3.5">
                    <div className="font-display font-semibold text-[13px] leading-snug truncate">{product.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[14px] font-bold text-amber-dark">
                        CA${product.price.toFixed(2)}
                      </span>
                    </div>
                    {product.colors?.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {product.colors.slice(0, 4).map((color) => {
                          const colorImg = product.color_images?.[color]?.[0];
                          return (
                            <span
                              key={color}
                              className="w-3 h-3 rounded-full border border-warm-200"
                              style={{
                                backgroundImage: colorImg ? `url(${colorImg})` : undefined,
                                backgroundSize: 'cover',
                                backgroundColor: colorImg ? undefined : '#1A1A18',
                              }}
                            />
                          );
                        })}
                        {product.colors.length > 4 && (
                          <span className="text-[10px] text-warm-400 font-semibold">+{product.colors.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
