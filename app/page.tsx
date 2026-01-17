'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useCartStore } from '@/lib/store/cart';
import { createClient } from '@/lib/supabase/client';

// ============================================================================
// MOTION SYSTEM - Premium, tactile, restrained
// All effects must be extremely subtle (low amplitude, low opacity, short durations)
// ============================================================================

// Ambient Particle System - tiny floating dust motes
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
}

function useAmbientParticles(count: number = 30) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Initialize particles
    const initialParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.015, // Very slow horizontal drift
      vy: (Math.random() - 0.5) * 0.01,  // Even slower vertical drift
      size: Math.random() * 2 + 1,       // 1-3px
      opacity: Math.random() * 0.15 + 0.05, // 5-20% opacity - extremely subtle
      life: Math.random() * 100,
    }));
    setParticles(initialParticles);

    const animate = () => {
      setParticles(prev => prev.map(p => {
        let newX = p.x + p.vx;
        let newY = p.y + p.vy;

        // Wrap around edges
        if (newX < -2) newX = 102;
        if (newX > 102) newX = -2;
        if (newY < -2) newY = 102;
        if (newY > 102) newY = -2;

        return { ...p, x: newX, y: newY };
      }));
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [count]);

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

// Background System Component
function BackgroundSystem({ scrollProgress }: { scrollProgress: number }) {
  const particles = useAmbientParticles(25);
  const parallaxOffset = useInertialValue(scrollProgress * 5, 0.05); // 5% parallax, very subtle

  return (
    <>
      {/* Blueprint Backplate - subtle technical grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(90deg, #1B2B27 1px, transparent 1px),
            linear-gradient(#1B2B27 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          transform: `translateY(${parallaxOffset}%)`,
        }}
      />

      {/* Dot Grid Overlay - construction measurement feel */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `radial-gradient(circle, #1B2B27 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          transform: `translateY(${parallaxOffset * 0.5}%)`,
        }}
      />

      {/* Ambient Particles */}
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
              transform: `translateY(${parallaxOffset * 0.3}%)`,
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

// Side Progress Indicator
function ProgressIndicator({ progress, totalProducts }: { progress: number; totalProducts: number }) {
  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col items-center gap-2">
      {/* Progress track */}
      <div className="w-[2px] h-24 bg-[#1B2B27]/10 rounded-full overflow-hidden">
        <div
          className="w-full bg-[#F6C343]/60 rounded-full transition-all duration-300"
          style={{ height: `${progress}%` }}
        />
      </div>
      {/* Product count */}
      <span className="font-mono text-[10px] text-[#1B2B27]/40 tracking-wider">
        {totalProducts}
      </span>
    </div>
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
  speed: number;
  id: string;
  uniqueKey: string;
  width: number;
  height: number;
}

// Card dimensions for collision detection (in viewport %)
// Must match visual sizes to prevent overlap
const CARD_SIZES = {
  center: { width: 24, height: 42 }, // larger cards for center (w-64 ~ 16rem ~ 20-25vh)
  side: { width: 14, height: 22 },   // smaller cards for sides
};

// Check if two products overlap
function checkOverlap(a: FloatingProduct, b: FloatingProduct): boolean {
  const buffer = 5; // % buffer between cards (increased from 2%)
  return !(
    a.x + a.width / 2 + buffer < b.x - b.width / 2 ||
    a.x - a.width / 2 - buffer > b.x + b.width / 2 ||
    a.y + a.height / 2 + buffer < b.y - b.height / 2 ||
    a.y - a.height / 2 - buffer > b.y + b.height / 2
  );
}

// Find valid position without overlap - checks ALL products, not just same zone
function findValidPosition(
  zone: 'left' | 'center' | 'right',
  existingProducts: FloatingProduct[],
  yStart: number
): { x: number; y: number } {
  // Separated zones with more gap between them
  const xRange = zone === 'left' ? [5, 22] : zone === 'center' ? [40, 60] : [78, 95];
  const isCenter = zone === 'center';
  const cardSize = isCenter ? CARD_SIZES.center : CARD_SIZES.side;

  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    const x = xRange[0] + Math.random() * (xRange[1] - xRange[0]);
    const y = yStart + (Math.random() * 15 - 7.5); // vary Y slightly (reduced from 20)

    const testProduct = {
      x,
      y,
      width: cardSize.width,
      height: cardSize.height,
    } as FloatingProduct;

    // Check overlap with ALL products, not just same-zone
    const hasOverlap = existingProducts.some(p => checkOverlap(testProduct, p));

    if (!hasOverlap) {
      return { x, y };
    }

    attempts++;
  }

  // Fallback: place at bottom with offset
  return {
    x: xRange[0] + Math.random() * (xRange[1] - xRange[0]),
    y: yStart + 30,
  };
}

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
      setSelectedSize(product.sizes[0] || '');
      setSelectedColor(product.colors[0] || '');
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

      {/* Modal - wider on desktop for horizontal layout */}
      <div
        className="relative bg-[#F5F3EF] rounded-2xl w-full max-w-md md:max-w-4xl max-h-[90vh] overflow-y-auto md:overflow-hidden shadow-2xl"
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

        {/* Desktop: Horizontal layout | Mobile: Vertical layout */}
        <div className="flex flex-col md:flex-row">
          {/* Image section with carousel */}
          <div className="md:w-1/2 p-6 md:p-8">
            {/* Main image with carousel controls */}
            <div className="relative aspect-square bg-white rounded-xl flex items-center justify-center overflow-hidden">
              {allImages[selectedImage] ? (
                <img
                  src={allImages[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
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
                        selectedImage === idx ? 'bg-[#F6C343]' : 'bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail strip - visible on mobile, hidden on desktop since we have carousel */}
            <div className="flex gap-2 mt-3 md:hidden">
              {allImages.slice(0, 3).map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`flex-1 aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === idx ? 'border-[#F6C343]' : 'border-transparent'
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

          {/* Product info section */}
          <div className="md:w-1/2 p-6 md:p-8 md:pl-0 flex flex-col">
            {/* Product info */}
            <h2 className="font-mono text-2xl font-bold text-[#1B2B27] mb-2">
              {product.name}
            </h2>
            <p className="font-mono text-xl text-[#F6C343] font-bold mb-4">
              CA${product.price.toFixed(2)}
            </p>
            <p className="text-[#6B7280] mb-6 leading-relaxed text-sm">
              {product.description}
            </p>

            {/* Size selector */}
            {product.sizes.length > 1 && (
              <div className="mb-4">
                <p className="font-mono text-sm text-[#1B2B27] mb-2 uppercase tracking-wider">
                  Tamanho
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1.5 rounded-lg font-mono text-sm transition-all ${
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

            {/* Color selector */}
            {product.colors.length > 1 && (
              <div className="mb-6">
                <p className="font-mono text-sm text-[#1B2B27] mb-2 uppercase tracking-wider">
                  Cor
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-1.5 rounded-lg font-mono text-sm transition-all ${
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

            {/* Spacer to push buttons to bottom on desktop */}
            <div className="flex-grow" />

            {/* Action buttons */}
            <div className="flex gap-3 mt-auto">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-[#1B2B27] text-white font-mono py-3 px-4 rounded-xl hover:bg-[#2a3d38] transition-colors uppercase tracking-wider text-sm"
              >
                Add to Bag
              </button>
              <button
                onClick={handleCheckout}
                className="flex-1 bg-[#F6C343] text-[#1B2B27] font-mono py-3 px-4 rounded-xl hover:bg-[#e5b43d] transition-colors uppercase tracking-wider text-sm font-bold"
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
  // Center images are bigger, sides are smaller
  const size = isCenter ? 'w-48 h-48 md:w-64 md:h-64' : 'w-32 h-32 md:w-44 md:h-44';

  // Center column: less blur (85% solid), sides: more blur (40% solid)
  const maskGradient = isCenter
    ? 'radial-gradient(ellipse 80% 80% at 50% 50%, black 60%, transparent 100%)'
    : 'radial-gradient(ellipse 70% 70% at 50% 50%, black 40%, transparent 100%)';

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

  return (
    <div
      className="absolute cursor-pointer"
      style={{
        left: `${product.x}%`,
        top: `${product.y}%`,
        transform: `translate(-50%, -50%) scale(${finalScale})`,
        zIndex: isHovered ? 50 : (isCenter ? 20 : 10),
        transition: 'transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1)', // Slight overshoot
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
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
            color: isHovered ? '#e5b43d' : '#F6C343',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          CA${product.price.toFixed(2)}
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
      .from('products')
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
      price: p.base_price,
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
  const animationRef = useRef<number | null>(null);
  const scrollDeltaRef = useRef(0); // Accumulated scroll delta to add to animation
  const cartItems = useCartStore((state) => state.items);

  // New motion system state
  const [isHoveringProduct, setIsHoveringProduct] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isModalOpening, setIsModalOpening] = useState(false);
  const accumulatedScrollRef = useRef(0); // Track total scroll for progress

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

  // Initialize floating products with no overlap
  const initializeProducts = useCallback(() => {
    const categoryProducts = products.filter(p => p.category === activeCategory);
    const floatingItems: FloatingProduct[] = [];

    // Mobile: only center zone, Desktop: all 3 zones
    const zones: Array<'left' | 'center' | 'right'> = isMobile
      ? ['center']
      : ['left', 'center', 'right'];

    zones.forEach((zone) => {
      const isCenter = zone === 'center';
      // Center: fewer but larger images, sides: more but smaller
      const count = isMobile ? 4 : (isCenter ? 2 : 4);
      const cardSize = isCenter ? CARD_SIZES.center : CARD_SIZES.side;

      // Center needs more vertical space between products
      const totalSpan = isCenter ? 140 : 130; // % of viewport height to distribute across
      const ySpacing = totalSpan / count;

      for (let i = 0; i < count; i++) {
        const product = categoryProducts[Math.floor(Math.random() * categoryProducts.length)];
        // Start from -20% for center (more buffer), -10% for sides
        const startY = isCenter ? -20 : -15;
        const baseY = startY + i * ySpacing + ySpacing / 2;

        // Mobile: use wider center range
        const mobileXRange = [25, 75];
        const pos = isMobile
          ? { x: mobileXRange[0] + Math.random() * (mobileXRange[1] - mobileXRange[0]), y: baseY + (Math.random() * 10 - 5) }
          : findValidPosition(zone, floatingItems, baseY);

        floatingItems.push({
          ...product,
          uniqueKey: `${zone}-${i}-${Date.now()}-${Math.random()}`,
          x: pos.x,
          y: pos.y,
          zone,
          scale: isMobile ? 1.0 : (isCenter ? 1.21 : 0.9), // Center images 10% larger (1.1 * 1.1 = 1.21)
          speed: isMobile ? 0.025 : (isCenter ? 0.02 : 0.03),
          width: cardSize.width,
          height: cardSize.height,
        });
      }
    });

    setFloatingProducts(floatingItems);
  }, [activeCategory, isMobile, products]);

  useEffect(() => {
    initializeProducts();
  }, [initializeProducts]);

  // Animation loop - ALWAYS runs, never stops
  useEffect(() => {
    const animate = () => {
      // Get scroll delta and reset it
      const scrollDelta = scrollDeltaRef.current;
      scrollDeltaRef.current = 0;

      setFloatingProducts(prev => {
        const updated = [...prev];

        for (let i = 0; i < updated.length; i++) {
          const product = updated[i];
          // Combine auto-scroll speed with user scroll delta
          let newY = product.y - product.speed + scrollDelta;

          // Loop: when product goes off top, reset to bottom with valid position
          if (newY < -25) {
            const pos = findValidPosition(product.zone, updated.filter((_, idx) => idx !== i), 110);
            updated[i] = {
              ...product,
              y: pos.y,
              x: pos.x,
            };
          } else if (newY > 120) {
            // If scrolling down and product goes off bottom, reset to top
            const pos = findValidPosition(product.zone, updated.filter((_, idx) => idx !== i), -15);
            updated[i] = {
              ...product,
              y: pos.y,
              x: pos.x,
            };
          } else {
            updated[i] = { ...product, y: newY };
          }
        }

        return updated;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Handle scroll/touch - add delta to animation with inertial smoothing
  useEffect(() => {
    let lastTouchY = 0;

    const handleWheel = (e: WheelEvent) => {
      // Accumulate scroll delta (will be applied in animation loop)
      scrollDeltaRef.current += e.deltaY * 0.03;

      // Track accumulated scroll for progress indicator
      accumulatedScrollRef.current += Math.abs(e.deltaY);
      // Reset progress every 10000 pixels of scroll
      const normalizedProgress = (accumulatedScrollRef.current % 10000) / 100;
      setScrollProgress(normalizedProgress);
    };

    const handleTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY;
      const deltaY = lastTouchY - touchY;
      lastTouchY = touchY;

      // Accumulate touch delta (will be applied in animation loop)
      scrollDeltaRef.current -= deltaY * 0.1;

      // Track accumulated scroll for progress
      accumulatedScrollRef.current += Math.abs(deltaY);
      const normalizedProgress = (accumulatedScrollRef.current % 10000) / 100;
      setScrollProgress(normalizedProgress);
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

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

  // Count products for progress indicator
  const categoryProductCount = products.filter(p => p.category === activeCategory).length;

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Custom Cursor - desktop only */}
      <CustomCursor isHovering={isHoveringProduct} label={isHoveringProduct ? 'VIEW' : ''} />

      {/* Progress Indicator */}
      <ProgressIndicator progress={scrollProgress} totalProducts={categoryProductCount} />

      {/* Grainy 3D Background */}
      <div
        className="absolute inset-0"
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

        {/* Enhanced Background System with blueprint grid, dots, and particles */}
        <BackgroundSystem scrollProgress={scrollProgress} />
      </div>

      {/* Floating Menu */}
      <nav className="absolute top-0 left-0 right-0 z-40 px-4 md:px-6 py-4 md:py-5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="https://onsiteclub.ca">
            <img
              src="/assets/logo-onsite-club.png"
              alt="OnSite Club"
              className="h-8 md:h-10 w-auto"
            />
          </a>

          {/* Categories - centered on mobile */}
          <div className="flex items-center gap-3 md:gap-6">
            {categories.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`font-mono text-xs md:text-sm tracking-wider transition-all ${
                  activeCategory === key
                    ? 'text-[#1B2B27] font-bold'
                    : 'text-[#1B2B27]/60 hover:text-[#1B2B27]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Right menu - simplified on mobile */}
          <div className="flex items-center gap-3 md:gap-6">
            <a
              href="/cart"
              className="font-mono text-xs md:text-sm text-[#1B2B27] tracking-wider hover:text-[#1B2B27]/70 transition-colors"
            >
              BAG{cartItems.length > 0 && `(${cartItems.length})`}
            </a>
            <a
              href="/login"
              className="hidden md:block font-mono text-sm text-[#1B2B27] tracking-wider hover:text-[#1B2B27]/70 transition-colors"
            >
              LOGIN
            </a>
            <a
              href="https://onsiteclub.ca"
              className="hidden md:block font-mono text-sm text-[#1B2B27]/60 tracking-wider hover:text-[#1B2B27] transition-colors"
            >
              ← SITE
            </a>
          </div>
        </div>
      </nav>

      {/* Floating Products */}
      <div
        className="absolute inset-0 transition-all duration-200"
        style={{
          // Subtle dimming when modal is opening (focus ritual)
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

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Bottom tagline */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2">
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
