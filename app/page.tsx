'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useCartStore } from '@/lib/store/cart';
import { createClient } from '@/lib/supabase/client';
import { STRIPE_PRODUCTS } from '@/lib/stripe-config';

// ============================================================================
// LAYOUT SYSTEM - OnSite Shop (Uniform Grid)
// ============================================================================
//
// ┌─────────────────────────────────────────────────────────────┐
// │ BANNER: Logo | WEAR WHAT YOU DO | SHOP MEMBERS BAG(n)      │
// ├─────────────────────────────────────────────────────────────┤
// │                                                             │
// │  ┌────┐ ┌────┐ ┌────┐ ┌────┐   (lg: 4 cols)              │
// │  │    │ │    │ │    │ │    │                               │
// │  └────┘ └────┘ └────┘ └────┘                               │
// │  ┌────┐ ┌────┐ ┌────┐ ┌────┐                               │
// │  │    │ │    │ │    │ │    │                               │
// │  └────┘ └────┘ └────┘ └────┘                               │
// │  ┌────┐ ┌────┐ ┌────┐ ┌────┐                               │
// │  │    │ │    │ │    │ │    │                               │
// │  └────┘ └────┘ └────┘ └────┘                               │
// │                                                             │
// └─────────────────────────────────────────────────────────────┘
//
// MOBILE: 1 col | TABLET: 2-3 cols | DESKTOP: 4 cols
// Cards: uniform size, floating effect (shadow + hover + press)
// Z-INDEX: z-[100] cursor > z-50 modals/banner > z-10 products > z-0 bg
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

// Scroll Dust Effect - subtle sawdust particles on the sides triggered by scroll
function ScrollDust() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    life: number;
    maxLife: number;
    side: 'left' | 'right';
  }>>([]);
  const scrollVelocityRef = useRef(0);
  const lastScrollRef = useRef(0);
  const rafRef = useRef<number>(0);
  const isActiveRef = useRef(false);

  const spawnParticles = useCallback((scrollDelta: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const count = Math.min(Math.floor(Math.abs(scrollDelta) * 0.3), 6);
    const direction = scrollDelta > 0 ? 1 : -1;

    for (let i = 0; i < count; i++) {
      const side = Math.random() > 0.5 ? 'left' : 'right';
      const x = side === 'left'
        ? Math.random() * 80
        : canvas.width - Math.random() * 80;

      particlesRef.current.push({
        x,
        y: Math.random() * canvas.height,
        vx: side === 'left' ? Math.random() * 1.5 + 0.3 : -(Math.random() * 1.5 + 0.3),
        vy: direction * (Math.random() * 2 + 1),
        size: Math.random() * 2.5 + 0.5,
        opacity: Math.random() * 0.25 + 0.08,
        life: 0,
        maxLife: Math.random() * 60 + 40,
        side,
      });
    }

    // Cap particles
    if (particlesRef.current.length > 80) {
      particlesRef.current = particlesRef.current.slice(-80);
    }
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    const alive: typeof particles = [];

    for (const p of particles) {
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy *= 0.98; // friction
      p.vx *= 0.97;

      const lifeRatio = p.life / p.maxLife;
      const alpha = lifeRatio < 0.2
        ? (lifeRatio / 0.2) * p.opacity // fade in
        : p.opacity * (1 - (lifeRatio - 0.2) / 0.8); // fade out

      if (p.life < p.maxLife && alpha > 0.005) {
        // Sawdust color: warm brown tones
        const r = 139 + Math.floor(Math.random() * 20);
        const g = 119 + Math.floor(Math.random() * 15);
        const b = 90 + Math.floor(Math.random() * 10);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();
        alive.push(p);
      }
    }

    particlesRef.current = alive;

    if (alive.length > 0 || isActiveRef.current) {
      rafRef.current = requestAnimationFrame(animate);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let decayTimer: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      const now = performance.now();
      const dt = now - lastScrollRef.current;
      lastScrollRef.current = now;

      // Get scroll delta from wheel event or estimate from time
      scrollVelocityRef.current = Math.min(dt > 0 ? 1000 / dt : 0, 50);
    };

    const handleWheel = (e: WheelEvent) => {
      const delta = e.deltaY;
      spawnParticles(delta);

      if (!isActiveRef.current) {
        isActiveRef.current = true;
        rafRef.current = requestAnimationFrame(animate);
      }

      clearTimeout(decayTimer);
      decayTimer = setTimeout(() => {
        isActiveRef.current = false;
      }, 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
      clearTimeout(decayTimer);
    };
  }, [spawnParticles, animate]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-40"
      style={{ opacity: 0.7 }}
    />
  );
}

// Types
interface Product {
  product_key: string;   // key from STRIPE_PRODUCTS (e.g. 'cotton-tee')
  name: string;
  price: number;         // dollars (for display)
  price_id: string;      // Stripe Price ID
  category: string;
  image: string;
  images: string[];
  description: string;
  sizes: string[];
  colors: string[];
  color_images: Record<string, string[]>;
  sku: string;
  isVideo?: boolean;
}

// Product Modal Component with focus ritual transitions + draggable image
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
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [validationError, setValidationError] = useState('');
  const addItem = useCartStore((state) => state.addItem);

  // Image drag/pan state
  const [imgPos, setImgPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, imgX: 0, imgY: 0 });

  // Get images for carousel — switches based on selected color
  const allImages = (() => {
    if (!product) return [];
    // If a color is selected and has color-specific images, use those
    if (selectedColor && product.color_images?.[selectedColor]?.length) {
      return product.color_images[selectedColor];
    }
    // Fallback to general images
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

  // Reset carousel when color changes
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
      setImgPos({
        x: dragStartRef.current.imgX + dx,
        y: dragStartRef.current.imgY + dy,
      });
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
      setImgPos({
        x: dragStartRef.current.imgX + dx,
        y: dragStartRef.current.imgY + dy,
      });
    };

    const handleTouchEnd = () => setIsDragging(false);

    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

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
      style={{
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

      {/* Modal - FIXED SIZE */}
      <div
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
        >
          <span className="text-2xl leading-none">&times;</span>
        </button>

        {/* Desktop: Horizontal layout | Mobile: Compact vertical layout */}
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
              {/* Top-left glass reflection highlight */}
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

              {/* Image - pannable via drag */}
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
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400">
                  <span className="text-6xl">📦</span>
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

              {/* Carousel navigation arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white transition-colors shadow-md cursor-pointer"
                  >
                    <span className="text-xl">&#8249;</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white transition-colors shadow-md cursor-pointer"
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
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product info section */}
          <div className="md:w-2/5 p-3 md:p-6 md:pl-2 flex flex-col h-[50%] md:h-full overflow-y-auto">
            <div className="flex items-start justify-between md:block mb-2 md:mb-0">
              <h2 className="font-mono text-base md:text-xl font-bold text-[#1B2B27] md:mb-1">
                {product.name}
              </h2>
              <p className="font-mono text-xs md:text-sm text-[#B8860B] font-bold tracking-wider uppercase md:mb-2">
                {product.category === 'members' ? 'COMING SOON' : `CA$${product.price.toFixed(2)}`}
              </p>
            </div>

            {/* Description - hidden on mobile to save space */}
            <p className="hidden md:block text-[#6B7280] mb-4 leading-snug text-xs">
              {product.description}
            </p>

            {/* Size and Color selectors in a row on mobile */}
            <div className="flex gap-3 md:block mb-2 md:mb-0">
              {product.sizes?.length > 1 && (
                <div className="flex-1 md:mb-3">
                  <p className="font-mono text-[10px] md:text-xs text-[#1B2B27] mb-1 md:mb-1.5 uppercase tracking-wider">
                    Size
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

              {product.colors?.length > 1 && (
                <div className="flex-1 md:mb-4">
                  <p className="font-mono text-[10px] md:text-xs text-[#1B2B27] mb-1 md:mb-1.5 uppercase tracking-wider">
                    Color
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

            {/* Spacer to push button to bottom on desktop */}
            <div className="hidden md:block flex-grow" />

            {/* Action button */}
            <div className="mt-2 md:mt-auto">
              {validationError && (
                <p className="font-mono text-[10px] text-red-500 mb-1.5 text-center">{validationError}</p>
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
                    onClick={() => {
                      // Validate selections
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
                        ? 'bg-green-600 text-white'
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Uniform Product Card - same size for all, with floating effect
function UniformProductCard({
  product,
  onClick,
  onHoverChange,
}: {
  product: Product;
  onClick: () => void;
  onHoverChange?: (isHovering: boolean) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const maskGradient = 'radial-gradient(ellipse 85% 85% at 50% 50%, black 70%, transparent 100%)';

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHoverChange?.(true);
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

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => {
    setIsPressed(false);
    onClick();
  };

  const hoverScale = isHovered ? 1.05 : 1;
  const pressScale = isPressed ? 0.98 : 1;
  const finalScale = hoverScale * pressScale;

  return (
    <div
      className="relative cursor-pointer"
      style={{
        transform: `scale(${finalScale})`,
        zIndex: isHovered ? 30 : 10,
        transition: 'transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={() => onHoverChange?.(true)}
      onTouchEnd={() => { onHoverChange?.(false); onClick(); }}
    >
      {/* Floating shadow layer */}
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
      <div className="relative aspect-square w-full flex items-center justify-center">
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
          <span className={`${product.image ? 'hidden' : ''} text-6xl md:text-7xl`}>📦</span>
        </div>

        {/* Hover Preview Overlay */}
        {showPreview && (
          <div
            className="absolute inset-x-0 -bottom-2 bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg"
            style={{
              animation: 'fadeIn 150ms ease-out forwards',
              opacity: 0,
            }}
          >
            <p className="font-mono text-[10px] text-[#1B2B27]/60 truncate">{product.sizes?.join(' / ')}</p>
          </div>
        )}
      </div>

      {/* Floating text */}
      <div className="text-center mt-2">
        <p
          className="font-mono text-xs drop-shadow-sm transition-colors duration-200"
          style={{ color: isHovered ? 'rgba(27, 43, 39, 1)' : 'rgba(27, 43, 39, 0.8)' }}
        >
          {product.name}
        </p>
        <p
          className="font-mono text-xs font-bold drop-shadow-sm tracking-wider uppercase transition-all duration-200"
          style={{
            color: isHovered ? '#9A7209' : '#B8860B',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          {product.category === 'members' ? 'COMING SOON' : `CA$${product.price.toFixed(2)}`}
        </p>
      </div>
    </div>
  );
}

// Load products from Supabase (images/display) + match prices from STRIPE_PRODUCTS
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

    // Match each Supabase product to STRIPE_PRODUCTS by SKU
    return data.map((p: any) => {
      const stripeMatch = Object.entries(STRIPE_PRODUCTS).find(
        ([, sp]) => sp.sku === p.sku
      );

      return {
        product_key: stripeMatch?.[0] || p.sku || p.id,
        name: p.name,
        price: stripeMatch ? stripeMatch[1].price / 100 : p.base_price ?? 0,
        price_id: stripeMatch?.[1].priceId || '',
        category: p.category?.slug || 'mens',
        image: p.primary_image || p.images?.[0] || '/products/placeholder.webp',
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

// Members mockup products (coming soon placeholders)
const MEMBERS_MOCKUPS: Product[] = [
  { product_key: 'members-exclusive-tee', name: 'Members Exclusive Tee', price: 0, price_id: '', category: 'members', image: '', images: [], description: 'Exclusive tee for OnSite Club members', sizes: ['M', 'L', 'XL'], colors: [], color_images: {}, sku: '' },
  { product_key: 'members-premium-hoodie', name: 'Premium Hoodie', price: 0, price_id: '', category: 'members', image: '', images: [], description: 'Premium hoodie for members only', sizes: ['M', 'L', 'XL'], colors: [], color_images: {}, sku: '' },
  { product_key: 'members-limited-cap', name: 'Limited Edition Cap', price: 0, price_id: '', category: 'members', image: '', images: [], description: 'Limited run cap for club members', sizes: ['One Size'], colors: [], color_images: {}, sku: '' },
  { product_key: 'members-crew-jacket', name: 'Crew Jacket', price: 0, price_id: '', category: 'members', image: '', images: [], description: 'On-site crew jacket', sizes: ['M', 'L', 'XL'], colors: [], color_images: {}, sku: '' },
  { product_key: 'members-safety-vest', name: 'Safety Vest', price: 0, price_id: '', category: 'members', image: '', images: [], description: 'High-vis safety vest with OnSite branding', sizes: ['M', 'L', 'XL'], colors: [], color_images: {}, sku: '' },
  { product_key: 'members-work-pants', name: 'Work Pants', price: 0, price_id: '', category: 'members', image: '', images: [], description: 'Durable work pants for the job site', sizes: ['M', 'L', 'XL'], colors: [], color_images: {}, sku: '' },
];

// Main Page Component
export default function ShopPage() {
  const [activeView, setActiveView] = useState<'all' | 'members'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const cartItems = useCartStore((state) => state.items);
  const [isHoveringProduct, setIsHoveringProduct] = useState(false);
  const [isModalOpening, setIsModalOpening] = useState(false);

  // Load products from Supabase
  useEffect(() => {
    loadProductsFromSupabase().then(setProducts);
  }, []);

  // Get display products: filter by view, then repeat to fill 12 slots
  const filteredProducts = activeView === 'members'
    ? MEMBERS_MOCKUPS
    : products;

  const displayProducts: Product[] = [];
  if (filteredProducts.length > 0) {
    for (let i = 0; i < 12; i++) {
      displayProducts.push(filteredProducts[i % filteredProducts.length]);
    }
  }

  // Modal opening handler with focus ritual
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

      {/* Scroll Dust - sawdust particles on edges when scrolling */}
      <ScrollDust />

      {/* ================================================================
          TOP BANNER - Full width, semi-transparent
          Logo | WEAR WHAT YOU DO | SHOP MEMBERS BAG
          ================================================================ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#D4CFC4]/70 backdrop-blur-md border-b border-[#1B2B27]/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 md:py-2.5 flex items-center justify-between">
          {/* Logo - left */}
          <a href="https://onsiteclub.ca" className="flex-shrink-0">
            <img
              src="/assets/logo-onsite-club.png"
              alt="OnSite Club"
              className="h-10 md:h-12 w-auto"
            />
          </a>

          {/* Tagline - center (hidden on mobile) */}
          <p className="hidden md:block font-mono text-[11px] text-[#1B2B27]/50 tracking-[0.3em] uppercase absolute left-1/2 -translate-x-1/2">
            Built For Those Who Build
          </p>

          {/* Navigation - right */}
          <nav className="flex items-center gap-4 md:gap-6">
            <button
              onClick={() => setActiveView('all')}
              className={`group relative font-mono text-[10px] md:text-xs tracking-[0.2em] uppercase transition-all duration-300
                ${activeView === 'all'
                  ? 'text-[#1B2B27] font-bold'
                  : 'text-[#1B2B27]/50 hover:text-[#1B2B27]'
                }`}
            >
              SHOP
              <span
                className={`absolute -bottom-1 left-0 h-[2px] bg-[#B8860B] transition-all duration-300 origin-left rotate-[-4deg]
                  ${activeView === 'all' ? 'w-full' : 'w-0 group-hover:w-full'}`}
              />
            </button>
            <button
              onClick={() => setActiveView('members')}
              className={`group relative font-mono text-[10px] md:text-xs tracking-[0.2em] uppercase transition-all duration-300
                ${activeView === 'members'
                  ? 'text-[#1B2B27] font-bold'
                  : 'text-[#1B2B27]/50 hover:text-[#1B2B27]'
                }`}
            >
              MEMBERS
              <span
                className={`absolute -bottom-1 left-0 h-[2px] bg-[#B8860B] transition-all duration-300 origin-left rotate-[-4deg]
                  ${activeView === 'members' ? 'w-full' : 'w-0 group-hover:w-full'}`}
              />
            </button>
            <a
              href="/cart"
              className={`group relative font-mono text-[10px] md:text-xs tracking-[0.2em] uppercase transition-all duration-300
                ${cartItems.length > 0
                  ? 'text-[#1B2B27] font-bold'
                  : 'text-[#1B2B27]/50 hover:text-[#1B2B27]'
                }`}
            >
              BAG{cartItems.length > 0 && <span className="text-[#B8860B] ml-1">({cartItems.length})</span>}
              <span
                className={`absolute -bottom-1 left-0 h-[2px] bg-[#B8860B] transition-all duration-300 origin-left rotate-[-4deg]
                  ${cartItems.length > 0 ? 'w-full' : 'w-0 group-hover:w-full'}`}
              />
            </a>
          </nav>
        </div>
      </header>

      {/* Product Grid - Uniform cards */}
      <div
        className="relative z-10 max-w-6xl mx-auto pt-24 md:pt-28 px-6 pb-12"
        style={{
          opacity: isModalOpening ? 0.95 : 1,
          transform: isModalOpening ? 'scale(0.995)' : 'scale(1)',
          transition: 'all 200ms',
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-6">
          {displayProducts.map((product, i) => (
            <UniformProductCard
              key={`product-${product.product_key}-${i}`}
              product={product}
              onClick={() => handleProductClick(product)}
              onHoverChange={setIsHoveringProduct}
            />
          ))}
        </div>
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Admin link - discrete */}
      <div className="relative z-10 text-center pb-6">
        <a
          href="/admin"
          className="font-mono text-[10px] text-[#1B2B27]/20 hover:text-[#1B2B27]/50 transition-colors"
        >
          Admin
        </a>
      </div>
    </div>
  );
}
