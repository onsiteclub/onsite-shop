'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useCartStore } from '@/lib/store/cart';
import { createClient } from '@/lib/supabase/client';

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
const CARD_SIZES = {
  center: { width: 12, height: 18 }, // larger cards
  side: { width: 9, height: 14 },    // smaller cards
};

// Check if two products overlap
function checkOverlap(a: FloatingProduct, b: FloatingProduct): boolean {
  const buffer = 2; // % buffer between cards
  return !(
    a.x + a.width / 2 + buffer < b.x - b.width / 2 ||
    a.x - a.width / 2 - buffer > b.x + b.width / 2 ||
    a.y + a.height / 2 + buffer < b.y - b.height / 2 ||
    a.y - a.height / 2 - buffer > b.y + b.height / 2
  );
}

// Find valid position without overlap
function findValidPosition(
  zone: 'left' | 'center' | 'right',
  existingProducts: FloatingProduct[],
  yStart: number
): { x: number; y: number } {
  const xRange = zone === 'left' ? [8, 28] : zone === 'center' ? [38, 62] : [72, 92];
  const isCenter = zone === 'center';
  const cardSize = isCenter ? CARD_SIZES.center : CARD_SIZES.side;

  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    const x = xRange[0] + Math.random() * (xRange[1] - xRange[0]);
    const y = yStart + (Math.random() * 20 - 10); // vary Y slightly

    const testProduct = {
      x,
      y,
      width: cardSize.width,
      height: cardSize.height,
    } as FloatingProduct;

    // Check overlap with same-zone products only
    const zoneProducts = existingProducts.filter(p => p.zone === zone);
    const hasOverlap = zoneProducts.some(p => checkOverlap(testProduct, p));

    if (!hasOverlap) {
      return { x, y };
    }

    attempts++;
  }

  // Fallback: place at bottom with offset
  return {
    x: xRange[0] + Math.random() * (xRange[1] - xRange[0]),
    y: yStart + 25,
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

// Product Modal Component
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
  const addItem = useCartStore((state) => state.addItem);

  // Get all images for carousel
  const allImages = product ? (product.images && product.images.length > 0 ? product.images : [product.image]) : [];

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes[0] || '');
      setSelectedColor(product.colors[0] || '');
      setSelectedImage(0);
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
    onClose();
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
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal - wider on desktop for horizontal layout */}
      <div
        className="relative bg-[#F5F3EF] rounded-2xl w-full max-w-md md:max-w-4xl max-h-[90vh] overflow-y-auto md:overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
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

// Floating Product Card - Transparent with floating elements
function FloatingProductCard({
  product,
  onClick
}: {
  product: FloatingProduct;
  onClick: () => void;
}) {
  const isCenter = product.zone === 'center';
  const size = isCenter ? 'w-32 h-32 md:w-44 md:h-44' : 'w-24 h-24 md:w-36 md:h-36';

  // Center column: less blur (85% solid), sides: more blur (40% solid)
  const maskGradient = isCenter
    ? 'radial-gradient(ellipse 80% 80% at 50% 50%, black 60%, transparent 100%)'
    : 'radial-gradient(ellipse 70% 70% at 50% 50%, black 40%, transparent 100%)';

  return (
    <div
      className="absolute cursor-pointer transition-transform duration-300 hover:scale-110"
      style={{
        left: `${product.x}%`,
        top: `${product.y}%`,
        transform: `translate(-50%, -50%) scale(${product.scale})`,
        zIndex: isCenter ? 20 : 10,
      }}
      onClick={onClick}
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
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <span className={`${product.image ? 'hidden' : ''} ${isCenter ? 'text-7xl md:text-8xl' : 'text-5xl md:text-6xl'}`}>📦</span>
        </div>
      </div>

      {/* Floating text - no background */}
      <div className="text-center mt-2">
        <p className="font-mono text-xs text-[#1B2B27]/80 drop-shadow-sm">{product.name}</p>
        <p className="font-mono text-sm font-bold text-[#F6C343] drop-shadow-sm">
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
  const [isManualScroll, setIsManualScroll] = useState(false); // Toggle between auto-loop and manual scroll
  const animationRef = useRef<number | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null); // Timer to return to auto-loop
  const lastScrollTime = useRef(Date.now());
  const cartItems = useCartStore((state) => state.items);

  const INACTIVITY_TIMEOUT = 3000; // Return to auto-loop after 3 seconds of inactivity

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
      // Mobile: more products in center column
      const count = isMobile ? 5 : (isCenter ? 3 : 4);
      const cardSize = isCenter ? CARD_SIZES.center : CARD_SIZES.side;

      // Distribute Y positions evenly with some variance
      const ySpacing = 100 / count;

      for (let i = 0; i < count; i++) {
        const product = categoryProducts[Math.floor(Math.random() * categoryProducts.length)];
        const baseY = i * ySpacing + ySpacing / 2;

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

  // Animation loop - only runs when NOT in manual scroll mode
  useEffect(() => {
    if (isManualScroll) {
      // Stop animation when in manual scroll mode
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = () => {
      setFloatingProducts(prev => {
        const updated = [...prev];

        for (let i = 0; i < updated.length; i++) {
          const product = updated[i];
          let newY = product.y - product.speed;

          // Loop: when product goes off top, reset to bottom with valid position
          if (newY < -20) {
            const pos = findValidPosition(product.zone, updated.filter((_, idx) => idx !== i), 115);
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
  }, [isManualScroll]);

  // Reset inactivity timer - returns to auto-loop after timeout
  const resetInactivityTimer = useCallback(() => {
    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    // Set new timer to return to auto-loop
    inactivityTimerRef.current = setTimeout(() => {
      setIsManualScroll(false);
    }, INACTIVITY_TIMEOUT);
  }, [INACTIVITY_TIMEOUT]);

  // Handle scroll/touch - switch to manual scroll mode on first interaction
  useEffect(() => {
    let lastTouchY = 0;

    const handleWheel = (e: WheelEvent) => {
      // Switch to manual mode
      if (!isManualScroll) {
        setIsManualScroll(true);
      }

      // Reset inactivity timer on each scroll
      resetInactivityTimer();

      // Apply scroll delta to all products
      const delta = e.deltaY * 0.05; // Convert wheel delta to % movement
      setFloatingProducts(prev => {
        return prev.map(product => ({
          ...product,
          y: product.y + delta,
        }));
      });
    };

    const handleTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0].clientY;
      // Switch to manual mode
      if (!isManualScroll) {
        setIsManualScroll(true);
      }
      // Reset inactivity timer
      resetInactivityTimer();
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY;
      const deltaY = lastTouchY - touchY;
      lastTouchY = touchY;

      // Reset inactivity timer on each move
      resetInactivityTimer();

      // Apply touch delta to all products (inverted for natural scroll feel)
      const delta = deltaY * 0.15; // Convert touch delta to % movement
      setFloatingProducts(prev => {
        return prev.map(product => ({
          ...product,
          y: product.y - delta,
        }));
      });
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      // Clear timer on cleanup
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isManualScroll, resetInactivityTimer]);

  const categories: Array<{ key: 'mens' | 'womens' | 'members'; label: string }> = [
    { key: 'mens', label: 'MENS' },
    { key: 'womens', label: 'WOMENS' },
    { key: 'members', label: 'MEMBERS' },
  ];

  return (
    <div className="relative w-full h-screen overflow-hidden">
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
        
        {/* 3D depth gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, transparent 0%, rgba(0,0,0,0.08) 100%)',
          }}
        />
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
      <div className="absolute inset-0">
        {floatingProducts.map((product) => (
          <FloatingProductCard
            key={product.uniqueKey}
            product={product}
            onClick={() => setSelectedProduct(product)}
          />
        ))}
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => {
            setSelectedProduct(null);
            // Restart auto-loop when closing modal
            setIsManualScroll(false);
            // Clear any pending inactivity timer
            if (inactivityTimerRef.current) {
              clearTimeout(inactivityTimerRef.current);
              inactivityTimerRef.current = null;
            }
          }}
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
