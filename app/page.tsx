'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useCartStore } from '@/lib/store/cart';
import { createClient } from '@/lib/supabase/client';

// ============================================================================
// LAYOUT SYSTEM - OnSite Shop (Static Grid)
// ============================================================================
//
// DESKTOP (>= 768px): 12 fixed product positions in 4x3 grid
// ┌──────────────────────────────────────────────────────┐
// │ HEADER (logo top-left)                          z-40 │
// │                                                      │
// │  [1]small    [2]LARGE    [3]LARGE    [4]small        │
// │  [5]small    [6]LARGE    [7]LARGE    [8]small        │
// │  [9]small   [10]LARGE   [11]LARGE   [12]small        │
// │                                                      │
// │ CATS(left)                         BAG/LOGIN(right)  │
// │ TAGLINE (bottom-center)                              │
// └──────────────────────────────────────────────────────┘
//
// MOBILE (< 768px): Scrollable column, centered cards
// ┌──────────────────────────────────────────────────────┐
// │ HEADER + MOBILE MENU (horizontal)                    │
// │ [product] [product] [product] ... (vertical scroll)  │
// │ TAGLINE                                              │
// └──────────────────────────────────────────────────────┘
//
// Z-INDEX: z-100 cursor > z-50 modals/sidebars > z-40 header > z-20/10 products > z-0 bg
// NO ANIMATION LOOPS - all positions are static, zero requestAnimationFrame
// ============================================================================

// ============================================================================
// VISUAL SYSTEM - Static, no animation loops
// Hover effects only (scale, shadow) - no RAF, no scroll-driven movement
// ============================================================================

// Static Particle positions - no animation, just visual texture
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

function useStaticParticles(count: number = 25): Particle[] {
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.15 + 0.05,
    }))
  );
  return particles;
}

// Inertial Smoothing Hook - 80-150ms lag for premium feel
function useInertialValue(targetValue: number, smoothing: number = 0.08) {
  const currentRef = useRef(targetValue);
  const [smoothedValue, setSmoothedValue] = useState(targetValue);

  useEffect(() => {
    let animationId: number;

    const animate = () => {
      const diff = targetValue - currentRef.current;
      currentRef.current += diff * smoothing;
      setSmoothedValue(currentRef.current);

      if (Math.abs(diff) > 0.001) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [targetValue, smoothing]);

  return smoothedValue;
}

// Custom Cursor Component with contextual labels
function CustomCursor({ isHovering, label }: { isHovering: boolean; label: string }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const smoothX = useInertialValue(position.x, 0.15);
  const smoothY = useInertialValue(position.y, 0.15);

  useEffect(() => {
    // Check if touch device
    if ('ontouchstart' in window) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    document.body.addEventListener('mouseleave', handleMouseLeave);
    document.body.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
      document.body.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="pointer-events-none fixed z-[100] transition-transform duration-150"
      style={{
        left: smoothX,
        top: smoothY,
        transform: `translate(-50%, -50%) scale(${isHovering ? 1.5 : 1})`,
      }}
    >
      {/* Cursor dot */}
      <div
        className={`rounded-full transition-all duration-200 ${
          isHovering
            ? 'w-3 h-3 bg-[#1B2B27]/20 backdrop-blur-sm'
            : 'w-2 h-2 bg-[#1B2B27]/40'
        }`}
      />
      {/* Label */}
      {isHovering && label && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 font-mono text-[10px] text-[#1B2B27]/60 tracking-wider whitespace-nowrap">
          {label}
        </div>
      )}
    </div>
  );
}

// Background System Component - static, no parallax
function BackgroundSystem() {
  const particles = useStaticParticles(25);

  return (
    <>
      {/* Blueprint Background Image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url('/assets/background-parallax.png')`,
          backgroundSize: 'auto 100vh',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
          opacity: 0.25,
          filter: 'blur(0.5px)',
        }}
      />
      {/* Blueprint grid */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `
            linear-gradient(90deg, #1B2B27 1px, transparent 1px),
            linear-gradient(#1B2B27 1px, transparent 1px)
          `,
          backgroundSize: '360px 360px',
        }}
      />

      {/* Vignette mask */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, rgba(212, 207, 196, 0.6) 100%)`,
        }}
      />

      {/* Dot Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `radial-gradient(circle, #1B2B27 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Static Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full bg-[#1B2B27]"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
            }}
          />
        ))}
      </div>

      {/* Depth gradient vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 0%, rgba(0,0,0,0.04) 100%)',
        }}
      />
    </>
  );
}

// Types
interface Product {
  id: string;
  name: string;
  price: number;
  category: 'mens' | 'womens' | 'members';
  image: string;
  images: string[];
  description: string;
  sizes: string[];
  colors: string[];
  isVideo?: boolean;
}

interface FloatingProduct extends Product {
  x: number;
  y: number;
  zone: 'left' | 'center' | 'right';
  scale: number;
  id: string;
  uniqueKey: string;
}

// 12 fixed grid positions for desktop layout
// 4 columns x 3 rows, with slight organic offsets
// Columns 1,4 = side (smaller), Columns 2,3 = center (larger)
const GRID_POSITIONS: Array<{ x: number; y: number; scale: number; zone: 'left' | 'center' | 'right' }> = [
  // Row 1
  { x: 15, y: 18, scale: 0.85, zone: 'left' },
  { x: 37, y: 14, scale: 1.2,  zone: 'center' },
  { x: 59, y: 11, scale: 1.2,  zone: 'center' },
  { x: 80, y: 17, scale: 0.85, zone: 'right' },
  // Row 2
  { x: 18, y: 44, scale: 0.85, zone: 'left' },
  { x: 40, y: 40, scale: 1.2,  zone: 'center' },
  { x: 62, y: 43, scale: 1.2,  zone: 'center' },
  { x: 83, y: 39, scale: 0.85, zone: 'right' },
  // Row 3
  { x: 14, y: 70, scale: 0.85, zone: 'left' },
  { x: 38, y: 66, scale: 1.2,  zone: 'center' },
  { x: 57, y: 71, scale: 1.2,  zone: 'center' },
  { x: 78, y: 67, scale: 0.85, zone: 'right' },
];

// Mock products
const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'Camiseta OnSite Amber',
    price: 29.99,
    category: 'mens',
    image: '/products/camiseta-amber.webp',
    images: ['/products/camiseta-amber-1.webp', '/products/camiseta-amber-2.webp', '/products/camiseta-amber-3.webp'],
    description: 'Camiseta 100% algodão ringspun, pré-encolhida. Estampa em silk de alta durabilidade. Feita pra aguentar o trabalho pesado.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Amber', 'Black', 'White'],
  },
  {
    id: 'prod-002',
    name: 'Boné OnSite Classic',
    price: 24.99,
    category: 'mens',
    image: '/products/bone-classic.webp',
    images: ['/products/bone-1.webp', '/products/bone-2.webp', '/products/bone-3.webp'],
    description: 'Boné estruturado com aba curva. Ajuste snapback. Logo bordado em alta definição.',
    sizes: ['Único'],
    colors: ['Black', 'Navy', 'Amber'],
  },
  {
    id: 'prod-003',
    name: 'Moletom OnSite Heavy',
    price: 59.99,
    category: 'mens',
    image: '/products/moletom-heavy.webp',
    images: ['/products/moletom-1.webp', '/products/moletom-2.webp', '/products/moletom-3.webp'],
    description: 'Moletom pesado 400g/m². Capuz forrado. Bolso canguru. Punhos e barra em ribana.',
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'Gray', 'Navy'],
  },
  {
    id: 'prod-004',
    name: 'Kit Adesivos OnSite',
    price: 12.99,
    category: 'members',
    image: '/products/adesivos-kit.webp',
    images: ['/products/adesivos-1.webp', '/products/adesivos-2.webp', '/products/adesivos-3.webp'],
    description: 'Kit com 5 adesivos vinil premium. Resistente a água e sol. Perfeito pro capacete ou caixa de ferramentas.',
    sizes: ['Único'],
    colors: ['Mix'],
  },
  {
    id: 'prod-005',
    name: 'Camiseta OnSite Black',
    price: 29.99,
    category: 'womens',
    image: '/products/camiseta-black.webp',
    images: ['/products/camiseta-black-1.webp', '/products/camiseta-black-2.webp', '/products/camiseta-black-3.webp'],
    description: 'Camiseta 100% algodão ringspun. Corte feminino. Estampa em silk de alta durabilidade.',
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
    colors: ['Black', 'White', 'Amber'],
  },
  {
    id: 'prod-006',
    name: 'Caneca OnSite Builder',
    price: 19.99,
    category: 'members',
    image: '/products/caneca.webp',
    images: ['/products/caneca-1.webp', '/products/caneca-2.webp', '/products/caneca-3.webp'],
    description: 'Caneca cerâmica 350ml. Impressão de alta qualidade. Vai bem no microondas e lava-louças.',
    sizes: ['Único'],
    colors: ['White', 'Black'],
  },
];

// Product Modal Component with focus ritual transitions
function ProductModal({
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
  const addItem = useCartStore((state) => state.addItem);

  // Get all images for carousel
  const allImages = product ? (product.images && product.images.length > 0 ? product.images : [product.image]) : [];

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes?.[0] || '');
      setSelectedColor(product.colors?.[0] || '');
      setSelectedImage(0);
      // Trigger enter animation
      setIsEntering(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsEntering(false));
      });
    }
  }, [product]);

  if (!product) return null;

  const handleAddToCart = () => {
    addItem({
      product_id: product.id,
      variant_id: `${product.id}-${selectedSize}-${selectedColor}`,
      name: product.name,
      color: selectedColor,
      size: selectedSize,
      price: product.price,
      quantity: 1,
      image: product.image,
    });
    handleClose();
  };

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 200); // Match exit animation duration
  };

  const handleCheckout = () => {
    handleAddToCart();
    window.location.href = '/cart';
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
      style={{
        // Focus ritual: backdrop fade
        opacity: isEntering ? 0 : isExiting ? 0 : 1,
        transition: 'opacity 200ms ease-out',
      }}
    >
      {/* Backdrop with gradient overlay */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{
          background: isExiting
            ? 'rgba(0,0,0,0.3)'
            : 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.65) 100%)',
          transition: 'background 200ms ease-out',
        }}
      />

      {/* Modal - taller for bigger image, glass effect */}
      {/* Mobile: fit everything without scroll, Desktop: larger with image focus */}
      <div
        className="relative bg-[#F5F3EF] rounded-2xl w-[95vw] md:w-full max-w-md md:max-w-5xl max-h-[90vh] md:max-h-[95vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          // Focus ritual: micro-compression and scale animation
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
        >
          <span className="text-2xl leading-none">&times;</span>
        </button>

        {/* Desktop: Horizontal layout | Mobile: Compact vertical layout */}
        <div className="flex flex-col md:flex-row md:min-h-[70vh] h-full">
          {/* Image section with carousel - Mobile: smaller, Desktop: larger */}
          <div className="md:w-3/5 p-3 md:p-6 flex-shrink-0">
            {/* Main image with ultra-realistic crystal glass effect */}
            {/* Mobile: square aspect, limited height */}
            <div
              className="relative aspect-square md:aspect-auto md:h-full rounded-xl overflow-hidden max-h-[40vh] md:max-h-none"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                boxShadow: `
                  inset 0 2px 4px rgba(255,255,255,1),
                  inset 0 -1px 2px rgba(0,0,0,0.04),
                  0 0 0 1px rgba(255,255,255,0.6),
                  0 8px 32px rgba(0,0,0,0.12),
                  0 2px 8px rgba(0,0,0,0.08)
                `,
              }}
            >
              {/* Top-left glass reflection highlight - premium specular */}
              <div
                className="absolute inset-0 pointer-events-none z-20"
                style={{
                  background: `linear-gradient(
                    135deg,
                    rgba(255,255,255,0.7) 0%,
                    rgba(255,255,255,0.25) 20%,
                    rgba(255,255,255,0.05) 40%,
                    transparent 60%
                  )`,
                  borderRadius: 'inherit',
                }}
              />

              {/* Edge highlight - glass rim lighting */}
              <div
                className="absolute inset-0 pointer-events-none z-20"
                style={{
                  border: '1px solid rgba(255,255,255,0.9)',
                  borderRadius: 'inherit',
                  boxShadow: `
                    inset 0 1px 0 rgba(255,255,255,1),
                    inset 1px 0 0 rgba(255,255,255,0.5),
                    inset 0 -1px 0 rgba(0,0,0,0.03)
                  `,
                }}
              />

              {/* Image with maximum sharpness and clarity */}
              {allImages[selectedImage] ? (
                <img
                  src={allImages[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  style={{
                    filter: 'contrast(1.08) brightness(1.02) saturate(1.05)',
                    imageRendering: '-webkit-optimize-contrast',
                    WebkitBackfaceVisibility: 'hidden',
                    backfaceVisibility: 'hidden',
                    transform: 'translateZ(0)',
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400">
                  <span className="text-6xl">📦</span>
                </div>
              )}

              {/* Carousel navigation arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white transition-colors shadow-md"
                  >
                    <span className="text-xl">&#8249;</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white transition-colors shadow-md"
                  >
                    <span className="text-xl">&#8250;</span>
                  </button>
                </>
              )}

              {/* Image indicators */}
              {allImages.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                  {allImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); setSelectedImage(idx); }}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        selectedImage === idx ? 'bg-[#B8860B]' : 'bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail strip - hidden on mobile to save space, visible on desktop */}
            <div className="hidden md:flex gap-2 mt-2">
              {allImages.slice(0, 3).map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`flex-1 aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === idx ? 'border-[#B8860B]' : 'border-transparent'
                  }`}
                >
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-300">
                      <span className="text-2xl">📦</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Product info section - Mobile: ultra compact, Desktop: normal */}
          <div className="md:w-2/5 p-3 md:p-6 md:pl-2 flex flex-col flex-1">
            {/* Mobile: horizontal layout for name/price, Desktop: vertical */}
            <div className="flex items-start justify-between md:block mb-2 md:mb-0">
              <h2 className="font-mono text-base md:text-xl font-bold text-[#1B2B27] md:mb-1">
                {product.name}
              </h2>
              <p className="font-mono text-base md:text-lg text-[#B8860B] font-bold md:mb-2">
                CA${(product.price ?? 0).toFixed(2)}
              </p>
            </div>

            {/* Description - hidden on mobile to save space */}
            <p className="hidden md:block text-[#6B7280] mb-4 leading-snug text-xs">
              {product.description}
            </p>

            {/* Size and Color selectors in a row on mobile */}
            <div className="flex gap-3 md:block mb-2 md:mb-0">
              {/* Size selector - compact */}
              {product.sizes?.length > 1 && (
                <div className="flex-1 md:mb-3">
                  <p className="font-mono text-[10px] md:text-xs text-[#1B2B27] mb-1 md:mb-1.5 uppercase tracking-wider">
                    Tamanho
                  </p>
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

              {/* Color selector - compact */}
              {product.colors?.length > 1 && (
                <div className="flex-1 md:mb-4">
                  <p className="font-mono text-[10px] md:text-xs text-[#1B2B27] mb-1 md:mb-1.5 uppercase tracking-wider">
                    Cor
                  </p>
                  <div className="flex flex-wrap gap-1 md:gap-1.5">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-2 md:px-2.5 py-0.5 md:py-1 rounded-md font-mono text-[10px] md:text-xs transition-all ${
                          selectedColor === color
                            ? 'bg-[#1B2B27] text-white'
                            : 'bg-white text-[#1B2B27] hover:bg-gray-100'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Spacer to push buttons to bottom on desktop */}
            <div className="hidden md:block flex-grow" />

            {/* Action buttons - always visible, fixed at bottom on mobile */}
            <div className="flex gap-2 mt-2 md:mt-auto">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-[#1B2B27] text-white font-mono py-2 md:py-2.5 px-3 rounded-lg hover:bg-[#2a3d38] transition-colors uppercase tracking-wider text-[10px] md:text-xs"
              >
                Add to Bag
              </button>
              <button
                onClick={handleCheckout}
                className="flex-1 bg-[#B8860B] text-[#1B2B27] font-mono py-2 md:py-2.5 px-3 rounded-lg hover:bg-[#9A7209] transition-colors uppercase tracking-wider text-[10px] md:text-xs font-bold"
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Floating Product Card - Enhanced with hover preview and micro-interactions
function FloatingProductCard({
  product,
  onClick,
  onHoverChange,
}: {
  product: FloatingProduct;
  onClick: () => void;
  onHoverChange?: (isHovering: boolean) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isCenter = product.zone === 'center';
  // Center images are bigger, sides are smaller - SMALLER on mobile to reduce overlap
  const size = isCenter ? 'w-36 h-36 md:w-64 md:h-64' : 'w-28 h-28 md:w-44 md:h-44';

  // Center column: less blur (85% solid), sides: more blur (40% solid)
  // Mobile: less aggressive fade to keep product visible
  const maskGradient = isCenter
    ? 'radial-gradient(ellipse 85% 85% at 50% 50%, black 70%, transparent 100%)'
    : 'radial-gradient(ellipse 75% 75% at 50% 50%, black 50%, transparent 100%)';

  // Handle hover with delay for preview
  const handleMouseEnter = () => {
    setIsHovered(true);
    onHoverChange?.(true);
    // Show preview after 200ms hover - subtle delay
    hoverTimeoutRef.current = setTimeout(() => setShowPreview(true), 200);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowPreview(false);
    onHoverChange?.(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  // Micro-compression on click (scale 0.98 for 80-120ms)
  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => {
    setIsPressed(false);
    onClick();
  };

  // Calculate transform with hover and press states
  const baseScale = product.scale;
  const hoverScale = isHovered ? 1.05 : 1; // Subtle 5% scale on hover
  const pressScale = isPressed ? 0.98 : 1; // Micro-compression
  const finalScale = baseScale * hoverScale * pressScale;

  // Floating shadow - larger offset and blur = appears far from background
  const floatingShadow = isCenter
    ? '0 40px 60px -20px rgba(0,0,0,0.15), 0 25px 35px -15px rgba(0,0,0,0.1)'
    : '0 30px 45px -15px rgba(0,0,0,0.12), 0 20px 25px -10px rgba(0,0,0,0.08)';

  return (
    <div
      className="absolute cursor-pointer"
      style={{
        left: `${product.x}%`,
        top: `${product.y}%`,
        transform: `translate(-50%, -50%) scale(${finalScale})`,
        zIndex: isHovered ? 50 : (isCenter ? 20 : 10),
        transition: 'transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1), filter 200ms ease-out',
        filter: `drop-shadow(${isHovered ? '0 50px 70px rgba(0,0,0,0.2)' : floatingShadow.split(',')[0].replace('box-shadow:', '').trim()})`,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {/* Floating shadow layer - distant soft shadow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          transform: 'translateY(30px) scale(0.85)',
          background: 'radial-gradient(ellipse 100% 60% at 50% 50%, rgba(0,0,0,0.12) 0%, transparent 70%)',
          filter: 'blur(15px)',
          opacity: isHovered ? 0.8 : 0.5,
          transition: 'opacity 200ms ease-out',
        }}
      />

      {/* Image with gradient fade border */}
      <div className={`relative ${size} flex items-center justify-center`}>
        {/* Gradient mask for soft edges - less blur on center */}
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden"
          style={{
            maskImage: maskGradient,
            WebkitMaskImage: maskGradient,
          }}
        >
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-200"
              style={{
                filter: isHovered ? 'brightness(1.02)' : 'brightness(1)',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <span className={`${product.image ? 'hidden' : ''} ${isCenter ? 'text-7xl md:text-8xl' : 'text-5xl md:text-6xl'}`}>📦</span>
        </div>

        {/* Hover Preview Overlay - shows additional product info */}
        {showPreview && (
          <div
            className="absolute inset-x-0 -bottom-2 bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg opacity-0 animate-fadeIn"
            style={{
              animation: 'fadeIn 150ms ease-out forwards',
            }}
          >
            <p className="font-mono text-[10px] text-[#1B2B27]/60 truncate">{product.category}</p>
            <p className="font-mono text-xs text-[#1B2B27]/80 truncate">{product.sizes?.join(' / ')}</p>
          </div>
        )}
      </div>

      {/* Floating text - with hover enhancement */}
      <div className="text-center mt-2">
        <p
          className="font-mono text-xs drop-shadow-sm transition-colors duration-200"
          style={{ color: isHovered ? 'rgba(27, 43, 39, 1)' : 'rgba(27, 43, 39, 0.8)' }}
        >
          {product.name}
        </p>
        <p
          className="font-mono text-sm font-bold drop-shadow-sm transition-all duration-200"
          style={{
            color: isHovered ? '#9A7209' : '#B8860B',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          CA${(product.price ?? 0).toFixed(2)}
        </p>
      </div>
    </div>
  );
}

// Mobile Product Card - column layout, same visual style
function MobileProductCard({
  product,
  onClick,
  onHoverChange,
}: {
  product: Product;
  onClick: () => void;
  onHoverChange?: (isHovering: boolean) => void;
}) {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    setIsPressed(true);
    setTimeout(() => {
      setIsPressed(false);
      onClick();
    }, 80);
  };

  const maskGradient = 'radial-gradient(ellipse 85% 85% at 50% 50%, black 70%, transparent 100%)';

  return (
    <div
      className="relative cursor-pointer w-44 h-44 flex-shrink-0"
      style={{
        transform: `scale(${isPressed ? 0.96 : 1})`,
        transition: 'transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      onTouchStart={() => onHoverChange?.(true)}
      onTouchEnd={() => onHoverChange?.(false)}
      onClick={handlePress}
    >
      {/* Floating shadow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          transform: 'translateY(20px) scale(0.85)',
          background: 'radial-gradient(ellipse 100% 60% at 50% 50%, rgba(0,0,0,0.1) 0%, transparent 70%)',
          filter: 'blur(12px)',
          opacity: 0.5,
        }}
      />

      {/* Image */}
      <div className="relative w-44 h-44 flex items-center justify-center">
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden"
          style={{ maskImage: maskGradient, WebkitMaskImage: maskGradient }}
        >
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <span className={`${product.image ? 'hidden' : ''} text-6xl`}>📦</span>
        </div>
      </div>

      {/* Text */}
      <div className="text-center mt-2">
        <p className="font-mono text-xs drop-shadow-sm" style={{ color: 'rgba(27, 43, 39, 0.8)' }}>
          {product.name}
        </p>
        <p className="font-mono text-sm font-bold drop-shadow-sm" style={{ color: '#B8860B' }}>
          CA${(product.price ?? 0).toFixed(2)}
        </p>
      </div>
    </div>
  );
}

// Load products from Supabase (only published and active)
async function loadProductsFromSupabase(): Promise<Product[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('app_shop_products')
      .select('*, category:categories(slug)')
      .eq('is_active', true)
      .eq('is_published', true)
      .order('sort_order');

    if (error || !data) {
      console.error('Error loading products:', error);
      return MOCK_PRODUCTS;
    }

    return data.map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.base_price ?? 0,
      category: p.category?.slug || 'mens',
      image: p.images?.[0] || '/products/placeholder.webp',
      images: p.images || [],
      description: p.description || '',
      sizes: p.sizes || [],
      colors: p.colors || [],
    }));
  } catch {
    return MOCK_PRODUCTS;
  }
}

// Main Page Component
export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState<'mens' | 'womens' | 'members'>('mens');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [floatingProducts, setFloatingProducts] = useState<FloatingProduct[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const cartItems = useCartStore((state) => state.items);

  const [isHoveringProduct, setIsHoveringProduct] = useState(false);
  const [isModalOpening, setIsModalOpening] = useState(false);

  // Load products from Supabase
  useEffect(() => {
    loadProductsFromSupabase().then(setProducts);
  }, []);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize products in fixed grid positions (no animation)
  const initializeProducts = useCallback(() => {
    const categoryProducts = products.filter(p => p.category === activeCategory);
    if (categoryProducts.length === 0) return;

    const positions = GRID_POSITIONS;
    const floatingItems: FloatingProduct[] = positions.map((pos, i) => {
      const product = categoryProducts[i % categoryProducts.length];
      // Add small random jitter (+/- 2%) for organic feel
      const jitterX = (Math.random() - 0.5) * 4;
      const jitterY = (Math.random() - 0.5) * 4;

      return {
        ...product,
        uniqueKey: `grid-${i}-${activeCategory}-${Date.now()}`,
        x: pos.x + jitterX,
        y: pos.y + jitterY,
        zone: pos.zone,
        scale: pos.scale,
      };
    });

    setFloatingProducts(floatingItems);
  }, [activeCategory, products]);

  useEffect(() => {
    initializeProducts();
  }, [initializeProducts]);

  const categories: Array<{ key: 'mens' | 'womens' | 'members'; label: string }> = [
    { key: 'mens', label: 'MENS' },
    { key: 'womens', label: 'WOMENS' },
    { key: 'members', label: 'MEMBERS' },
  ];

  // Modal opening handler with focus ritual
  const handleProductClick = (product: Product) => {
    setIsModalOpening(true);
    // Micro-delay for focus ritual effect
    setTimeout(() => {
      setSelectedProduct(product);
      setIsModalOpening(false);
    }, 80);
  };

  return (
    <div className={`relative w-full ${isMobile ? 'min-h-screen overflow-y-auto' : 'h-screen overflow-hidden'}`}>
      {/* Custom Cursor - desktop only */}
      <CustomCursor isHovering={isHoveringProduct} label={isHoveringProduct ? 'VIEW' : ''} />

      {/* Grainy 3D Background */}
      <div
        className={`${isMobile ? 'fixed' : 'absolute'} inset-0`}
        style={{
          background: 'linear-gradient(135deg, #D4CFC4 0%, #C9C4B8 50%, #BEB9AD 100%)',
        }}
      >
        {/* Noise overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)"/>
        </svg>

        {/* Background System - static grid, dots, particles */}
        <BackgroundSystem />
      </div>

      {/* Top Header - Logo left */}
      <header className="absolute top-0 left-0 right-0 z-40 px-4 md:px-6 py-4 md:py-5">
        <div className="flex items-center justify-start">
          {/* Logo - left aligned */}
          <a href="https://onsiteclub.ca">
            <img
              src="/assets/logo-onsite-club.png"
              alt="OnSite Club"
              className="h-8 md:h-10 w-auto"
            />
          </a>
        </div>
      </header>

      {/* ================================================================
          LEFT SIDEBAR - Categories Navigation
          DESKTOP ONLY: visible on screens >= 640px (sm:)
          Position: Bottom-left corner
          z-index: 50 (above floating products)
          ================================================================ */}
      <nav className="fixed left-6 lg:left-10 bottom-10 z-50 hidden sm:flex flex-col gap-4">
        {categories.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`group relative font-mono text-xs tracking-[0.2em] transition-all duration-300 text-left
              ${activeCategory === key
                ? 'text-[#1B2B27] font-bold scale-110 translate-x-2'
                : 'text-[#1B2B27]/50 hover:text-[#1B2B27] hover:scale-110 hover:translate-x-2'
              }`}
          >
            {label}
            {/* Diagonal underline on hover/active */}
            <span
              className={`absolute -bottom-1 left-0 h-[2px] bg-[#B8860B] transition-all duration-300 origin-left
                ${activeCategory === key
                  ? 'w-full rotate-[-8deg]'
                  : 'w-0 group-hover:w-full rotate-[-8deg]'
                }`}
              style={{ transformOrigin: 'left center' }}
            />
          </button>
        ))}
      </nav>

      {/* ================================================================
          RIGHT SIDEBAR - BAG / LOGIN / SITE
          DESKTOP ONLY: visible on screens >= 640px (sm:)
          Position: Bottom-right corner
          z-index: 50 (above floating products)
          ================================================================ */}
      <nav className="fixed right-6 lg:right-10 bottom-10 z-50 hidden sm:flex flex-col gap-4 items-end">
        <a
          href="/cart"
          className={`group relative font-mono text-xs tracking-[0.2em] transition-all duration-300
            ${cartItems.length > 0
              ? 'text-[#1B2B27] font-bold scale-110 -translate-x-2'
              : 'text-[#1B2B27]/50 hover:text-[#1B2B27] hover:scale-110 hover:-translate-x-2'
            }`}
        >
          BAG{cartItems.length > 0 && <span className="text-[#B8860B] ml-1">({cartItems.length})</span>}
          {/* Always show underline when cart has items, hover for empty */}
          <span
            className={`absolute -bottom-1 right-0 h-[2px] bg-[#B8860B] rotate-[8deg] transition-all duration-300 origin-right
              ${cartItems.length > 0 ? 'w-full' : 'w-0 group-hover:w-full'}`}
          />
        </a>
        <a
          href="/login"
          className="group relative font-mono text-xs tracking-[0.2em] text-[#1B2B27]/50 hover:text-[#1B2B27] hover:scale-110 hover:-translate-x-2 transition-all duration-300"
        >
          LOGIN
          <span className="absolute -bottom-1 right-0 h-[2px] w-0 bg-[#B8860B] group-hover:w-full rotate-[8deg] transition-all duration-300 origin-right" />
        </a>
        <a
          href="https://onsiteclub.ca"
          className="group relative font-mono text-xs tracking-[0.2em] text-[#1B2B27]/50 hover:text-[#1B2B27] hover:scale-110 hover:-translate-x-2 transition-all duration-300"
        >
          SITE
          <span className="absolute -bottom-1 right-0 h-[2px] w-0 bg-[#B8860B] group-hover:w-full rotate-[8deg] transition-all duration-300 origin-right" />
        </a>
      </nav>

      {/* ================================================================
          MOBILE MENU - Horizontal navigation bar
          MOBILE ONLY: visible on screens < 640px (hidden on sm:)
          Position: Top of screen, below header
          z-index: 40
          ================================================================ */}
      <nav className="sm:hidden fixed top-16 left-0 right-0 z-40 px-4 py-2 flex justify-center gap-4 bg-[#D4CFC4]/80 backdrop-blur-sm">
        {categories.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`font-mono text-[10px] tracking-wider transition-all ${
              activeCategory === key
                ? 'text-[#1B2B27] font-bold'
                : 'text-[#1B2B27]/50'
            }`}
          >
            {label}
          </button>
        ))}
        <a
          href="/cart"
          className={`font-mono text-[10px] tracking-wider transition-all ${
            cartItems.length > 0
              ? 'text-[#1B2B27] font-bold'
              : 'text-[#1B2B27]/50'
          }`}
        >
          BAG{cartItems.length > 0 && <span className="text-[#B8860B]">({cartItems.length})</span>}
        </a>
      </nav>

      {/* Products - Desktop: Fixed positions / Mobile: Scrollable column */}
      {isMobile ? (
        /* MOBILE: Scrollable column layout */
        <div
          className="relative z-10 flex flex-col items-center gap-6 pt-28 pb-20 px-4"
          style={{
            opacity: isModalOpening ? 0.95 : 1,
            transform: isModalOpening ? 'scale(0.995)' : 'scale(1)',
            transition: 'all 200ms',
          }}
        >
          {products
            .filter(p => p.category === activeCategory)
            .map((product, i) => (
              <MobileProductCard
                key={`mobile-${product.id}-${i}`}
                product={product}
                onClick={() => handleProductClick(product)}
                onHoverChange={setIsHoveringProduct}
              />
            ))}
        </div>
      ) : (
        /* DESKTOP: 12 Fixed grid positions */
        <div
          className="absolute inset-0 transition-all duration-200"
          style={{
            opacity: isModalOpening ? 0.95 : 1,
            transform: isModalOpening ? 'scale(0.995)' : 'scale(1)',
          }}
        >
          {floatingProducts.map((product) => (
            <FloatingProductCard
              key={product.uniqueKey}
              product={product}
              onClick={() => handleProductClick(product)}
              onHoverChange={setIsHoveringProduct}
            />
          ))}
        </div>
      )}

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Bottom tagline */}
      <div className={`${isMobile ? 'relative mt-4 mb-6' : 'absolute bottom-6'} left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2`}>
        <p className="font-mono text-xs text-[#1B2B27]/50 tracking-[0.3em] uppercase">
          Wear What You Do
        </p>
        <a
          href="/admin"
          className="font-mono text-[10px] text-[#1B2B27]/30 hover:text-[#1B2B27]/60 transition-colors"
        >
          Admin
        </a>
      </div>
    </div>
  );
}
