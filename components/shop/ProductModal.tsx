'use client';

import { useState, useEffect, useRef } from 'react';
import { useCartStore } from '@/lib/store/cart';
import { cleanProductName, getProductTagline } from '@/lib/utils';
import type { Product } from '@/lib/types';

export function ProductModal({
  product,
  onClose
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [isEntering, setIsEntering] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [validationError, setValidationError] = useState('');
  const addItem = useCartStore((state) => state.addItem);
  const modalRef = useRef<HTMLDivElement>(null);

  // Image drag/pan state
  const [imgPos, setImgPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, imgX: 0, imgY: 0 });

  // Get images for carousel — switches based on selected color
  const allImages = (() => {
    if (!product) return [];
    if (selectedColor && product.color_images?.[selectedColor]?.length) {
      return product.color_images[selectedColor];
    }
    return product.images?.length ? product.images : [product.image];
  })();

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes?.[0] || '');
      setSelectedColor(product.colors?.[0] || '');
      setSelectedImage(0);
      setImgPos({ x: 0, y: 0 });
      setIsEntering(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsEntering(false));
      });
    }
  }, [product]);

  useEffect(() => {
    setSelectedImage(0);
    setImgPos({ x: 0, y: 0 });
  }, [selectedColor]);

  useEffect(() => {
    setImgPos({ x: 0, y: 0 });
  }, [selectedImage]);

  // Global mouse move/up for drag
  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setImgPos({ x: dragStartRef.current.imgX + dx, y: dragStartRef.current.imgY + dy });
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Touch drag support for mobile
  useEffect(() => {
    if (!isDragging) return;
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.x;
      const dy = touch.clientY - dragStartRef.current.y;
      setImgPos({ x: dragStartRef.current.imgX + dx, y: dragStartRef.current.imgY + dy });
    };
    const handleTouchEnd = () => setIsDragging(false);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  // Keyboard: Escape to close + focus trap
  useEffect(() => {
    if (!product) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    // Focus first focusable element on open
    requestAnimationFrame(() => {
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>('button');
      firstFocusable?.focus();
    });
    return () => document.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  if (!product) return null;

  const handleImgMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, imgX: imgPos.x, imgY: imgPos.y };
  };

  const handleImgTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = { x: touch.clientX, y: touch.clientY, imgX: imgPos.x, imgY: imgPos.y };
  };

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 200);
  };

  const handleJoinWaitlist = () => {
    window.location.href = '/login';
  };

  const handlePrevImage = () => {
    setSelectedImage(prev => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setSelectedImage(prev => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      style={{
        opacity: isEntering ? 0 : isExiting ? 0 : 1,
        transition: 'opacity 200ms ease-out',
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{
          background: isExiting
            ? 'rgba(0,0,0,0.3)'
            : 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.65) 100%)',
          transition: 'background 200ms ease-out',
        }}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative bg-[#F5F3EF] rounded-2xl overflow-hidden shadow-2xl
          w-[95vw] h-[85vh]
          md:w-[900px] md:h-[600px]
          lg:w-[1000px] lg:h-[650px]"
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: isEntering
            ? 'scale(0.96) translateY(10px)'
            : isExiting
            ? 'scale(0.98) translateY(5px)'
            : 'scale(1) translateY(0)',
          opacity: isEntering ? 0 : isExiting ? 0.5 : 1,
          transition: 'transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease-out',
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white transition-colors"
          aria-label="Close product details"
        >
          <span className="text-2xl leading-none">&times;</span>
        </button>

        <div className="flex flex-col md:flex-row h-full">
          {/* Image section */}
          <div className="md:w-3/5 p-3 md:p-6 flex-shrink-0 h-[50%] md:h-full">
            <div
              className="relative w-full h-full rounded-xl overflow-hidden select-none"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                cursor: isDragging ? 'grabbing' : 'grab',
                boxShadow: `
                  inset 0 2px 4px rgba(255,255,255,1),
                  inset 0 -1px 2px rgba(0,0,0,0.04),
                  0 0 0 1px rgba(255,255,255,0.6),
                  0 8px 32px rgba(0,0,0,0.12),
                  0 2px 8px rgba(0,0,0,0.08)
                `,
              }}
              onMouseDown={handleImgMouseDown}
              onTouchStart={handleImgTouchStart}
            >
              {/* Glass reflection */}
              <div
                className="absolute inset-0 pointer-events-none z-20"
                style={{
                  background: `linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.25) 20%, rgba(255,255,255,0.05) 40%, transparent 60%)`,
                  borderRadius: 'inherit',
                }}
              />
              <div
                className="absolute inset-0 pointer-events-none z-20"
                style={{
                  border: '1px solid rgba(255,255,255,0.9)',
                  borderRadius: 'inherit',
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,1), inset 1px 0 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.03)`,
                }}
              />

              {/* Image */}
              {allImages[selectedImage] ? (
                <img
                  src={allImages[selectedImage]}
                  alt={product.name}
                  className="absolute w-full h-full object-cover pointer-events-none"
                  draggable={false}
                  style={{
                    filter: 'contrast(1.08) brightness(1.02) saturate(1.05)',
                    imageRendering: '-webkit-optimize-contrast',
                    WebkitBackfaceVisibility: 'hidden',
                    backfaceVisibility: 'hidden',
                    transform: `translate(${imgPos.x}px, ${imgPos.y}px)`,
                    transition: isDragging ? 'none' : 'transform 200ms ease-out',
                  }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                </div>
              )}

              {/* Drag hint */}
              {allImages[selectedImage] && (
                <div className="absolute bottom-2 right-2 z-20 pointer-events-none opacity-40">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3"/>
                  </svg>
                </div>
              )}

              {/* Carousel arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white transition-colors shadow-md cursor-pointer"
                    aria-label="Previous image"
                  >
                    <span className="text-xl">&#8249;</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white transition-colors shadow-md cursor-pointer"
                    aria-label="Next image"
                  >
                    <span className="text-xl">&#8250;</span>
                  </button>
                </>
              )}

              {/* Image indicators */}
              {allImages.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                  {allImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); setSelectedImage(idx); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                        selectedImage === idx ? 'bg-[#B8860B]' : 'bg-white/60'
                      }`}
                      aria-label={`Image ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product info section */}
          <div className="md:w-2/5 p-3 md:p-6 md:pl-2 flex flex-col h-[50%] md:h-full overflow-y-auto">
            <div className="flex items-start justify-between md:block mb-1 md:mb-0">
              <h2 id="product-modal-title" className="font-mono text-base md:text-xl font-bold text-[#1B2B27] md:mb-1">
                {cleanProductName(product.name)}
              </h2>
              <p className="font-mono text-xs md:text-sm text-[#B8860B] font-bold tracking-wider uppercase md:mb-1">
                {product.category === 'members' ? 'COMING SOON' : `CA$${product.price.toFixed(2)}`}
              </p>
            </div>

            <p className="font-mono text-[11px] md:text-xs text-[#6B7280] mb-3 leading-snug">
              {getProductTagline(product)}
            </p>

            {product.description && (
              <details className="mb-3 group">
                <summary className="font-mono text-[10px] md:text-xs text-[#1B2B27]/60 uppercase tracking-wider cursor-pointer hover:text-[#1B2B27] transition-colors list-none flex items-center gap-1">
                  <span className="text-[8px] group-open:rotate-90 transition-transform">&#9654;</span>
                  Details
                </summary>
                <p className="text-[#6B7280] mt-1.5 leading-snug text-[10px] md:text-xs">
                  {product.description}
                </p>
              </details>
            )}

            <div className="flex gap-3 md:block mb-2 md:mb-0">
              {product.sizes?.length > 1 && (
                <div className="flex-1 md:mb-3">
                  <p className="font-mono text-[10px] md:text-xs text-[#1B2B27] mb-1 md:mb-1.5 uppercase tracking-wider">Size</p>
                  <div className="flex flex-wrap gap-1 md:gap-1.5">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-2 md:px-2.5 py-0.5 md:py-1 rounded-md font-mono text-[10px] md:text-xs transition-all ${
                          selectedSize === size
                            ? 'bg-[#1B2B27] text-white'
                            : 'bg-white text-[#1B2B27] hover:bg-gray-100'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.colors?.length > 1 && (
                <div className="flex-1 md:mb-4">
                  <p className="font-mono text-[10px] md:text-xs text-[#1B2B27] mb-1 md:mb-1.5 uppercase tracking-wider">Color</p>
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {product.colors.map((color) => {
                      const colorImg = product.color_images?.[color]?.[0];
                      return (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          title={color}
                          aria-label={`Color: ${color}`}
                          className={`rounded-lg overflow-hidden transition-all ${
                            selectedColor === color
                              ? 'ring-2 ring-[#1B2B27] ring-offset-1'
                              : 'ring-1 ring-gray-200 hover:ring-gray-400'
                          }`}
                          style={{ width: 36, height: 36 }}
                        >
                          {colorImg ? (
                            <img src={colorImg} alt={color} className="w-full h-full object-cover" />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center bg-white font-mono text-[8px] text-[#1B2B27]">
                              {color.slice(0, 3)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden md:block flex-grow" />

            <div className="mt-2 md:mt-auto">
              {validationError && (
                <p className="font-mono text-[10px] text-red-500 mb-1.5 text-center" role="alert">{validationError}</p>
              )}
              {product.category === 'members' ? (
                <button
                  onClick={handleJoinWaitlist}
                  className="w-full bg-[#B8860B] text-white font-mono py-2.5 md:py-3 px-3 rounded-lg hover:bg-[#9A7209] transition-colors uppercase tracking-wider text-xs md:text-sm font-bold"
                >
                  Join Waitlist
                </button>
              ) : !product.price_id ? (
                <button
                  disabled
                  className="w-full font-mono py-2.5 md:py-3 px-3 rounded-lg bg-stone-300 text-stone-500 uppercase tracking-wider text-xs md:text-sm font-bold cursor-not-allowed"
                >
                  Coming Soon
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    disabled={addedFeedback}
                    onClick={() => {
                      if (addedFeedback) return;
                      if (product.sizes?.length > 1 && !selectedSize) {
                        setValidationError('Please select a size');
                        return;
                      }
                      if (product.colors?.length > 1 && !selectedColor) {
                        setValidationError('Please select a color');
                        return;
                      }
                      setValidationError('');
                      addItem({
                        product_key: product.product_key,
                        price_id: product.price_id,
                        name: product.name,
                        design: '',
                        color: selectedColor || product.colors?.[0] || '',
                        size: selectedSize || product.sizes?.[0] || '',
                        price: Math.round(product.price * 100),
                        image: allImages[0] || product.image,
                      });
                      setAddedFeedback(true);
                      setTimeout(() => setAddedFeedback(false), 2000);
                    }}
                    className={`flex-1 font-mono py-2.5 md:py-3 px-3 rounded-lg transition-colors uppercase tracking-wider text-xs md:text-sm font-bold ${
                      addedFeedback
                        ? 'bg-green-600 text-white cursor-not-allowed'
                        : 'bg-[#1B2B27] text-white hover:bg-[#2a3f39]'
                    }`}
                  >
                    {addedFeedback ? 'Added!' : 'Add to Bag'}
                  </button>
                  <a
                    href="/checkout"
                    onClick={(e) => {
                      e.preventDefault();
                      if (product.sizes?.length > 1 && !selectedSize) {
                        setValidationError('Please select a size');
                        return;
                      }
                      if (product.colors?.length > 1 && !selectedColor) {
                        setValidationError('Please select a color');
                        return;
                      }
                      setValidationError('');
                      addItem({
                        product_key: product.product_key,
                        price_id: product.price_id,
                        name: product.name,
                        design: '',
                        color: selectedColor || product.colors?.[0] || '',
                        size: selectedSize || product.sizes?.[0] || '',
                        price: Math.round(product.price * 100),
                        image: allImages[0] || product.image,
                      });
                      window.location.href = '/checkout';
                    }}
                    className="flex-1 font-mono py-2.5 md:py-3 px-3 rounded-lg bg-[#B8860B] text-white hover:bg-[#9A7209] transition-colors uppercase tracking-wider text-xs md:text-sm font-bold text-center"
                  >
                    Checkout
                  </a>
                </div>
              )}

              <p className="font-mono text-[10px] text-stone-400 mt-3 text-center leading-relaxed">
                Colors may vary slightly from screen to product due to digital rendering.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
