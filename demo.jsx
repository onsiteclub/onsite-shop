import { useState, useEffect, useRef, useCallback } from 'react';

// Mock products
const PRODUCTS = [
  { id: '1', name: 'Camiseta Amber', price: 29.99, category: 'mens', emoji: '👕' },
  { id: '2', name: 'Boné Classic', price: 24.99, category: 'mens', emoji: '🧢' },
  { id: '3', name: 'Moletom Heavy', price: 59.99, category: 'mens', emoji: '🧥' },
  { id: '4', name: 'Kit Adesivos', price: 12.99, category: 'members', emoji: '🏷️' },
  { id: '5', name: 'Camiseta Black', price: 29.99, category: 'womens', emoji: '👚' },
  { id: '6', name: 'Caneca Builder', price: 19.99, category: 'members', emoji: '☕' },
  { id: '7', name: 'Calça Work', price: 49.99, category: 'mens', emoji: '👖' },
  { id: '8', name: 'Luvas Pro', price: 34.99, category: 'members', emoji: '🧤' },
];

// Floating product interface
interface FloatingProduct {
  id: string;
  name: string;
  price: number;
  emoji: string;
  x: number;
  y: number;
  zone: 'left' | 'center' | 'right';
  scale: number;
  speed: number;
  uniqueKey: string;
}

// Cart item interface
interface CartItem {
  id: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
}

// Product Modal
function ProductModal({ product, onClose, onAddToCart }) {
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('Amber');
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const colors = ['Amber', 'Black', 'White'];

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div 
        className="relative bg-stone-100 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white transition-colors text-2xl"
        >
          ×
        </button>

        <div className="p-8">
          {/* Image gallery placeholder */}
          <div className="mb-6">
            <div className="aspect-square bg-white rounded-xl mb-3 flex items-center justify-center text-8xl shadow-inner">
              {product.emoji}
            </div>
            <div className="flex gap-2">
              {[0, 1, 2].map((idx) => (
                <button
                  key={idx}
                  className="flex-1 aspect-square rounded-lg bg-white flex items-center justify-center text-3xl shadow-sm hover:ring-2 ring-amber-400 transition-all"
                >
                  {product.emoji}
                </button>
              ))}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-stone-800 mb-2">{product.name}</h2>
          <p className="text-xl text-amber-500 font-bold mb-4">CA${product.price.toFixed(2)}</p>
          
          <p className="text-stone-500 text-sm mb-6 leading-relaxed">
            100% algodão ringspun premium. Estampa silk de alta durabilidade. Feito pra quem constrói.
          </p>

          {/* Size selector */}
          <div className="mb-4">
            <p className="text-xs text-stone-500 mb-2 uppercase tracking-widest">Tamanho</p>
            <div className="flex gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    selectedSize === size
                      ? 'bg-stone-800 text-white'
                      : 'bg-white text-stone-800 hover:bg-stone-200'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Color selector */}
          <div className="mb-6">
            <p className="text-xs text-stone-500 mb-2 uppercase tracking-widest">Cor</p>
            <div className="flex gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    selectedColor === color
                      ? 'bg-stone-800 text-white'
                      : 'bg-white text-stone-800 hover:bg-stone-200'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                onAddToCart({ ...product, size: selectedSize, color: selectedColor });
                onClose();
              }}
              className="flex-1 bg-stone-800 text-white py-4 px-6 rounded-xl hover:bg-stone-700 transition-colors uppercase tracking-widest text-xs font-bold"
            >
              Add to Bag
            </button>
            <button
              onClick={() => {
                onAddToCart({ ...product, size: selectedSize, color: selectedColor });
                alert('Redirecting to checkout...');
              }}
              className="flex-1 bg-amber-400 text-stone-800 py-4 px-6 rounded-xl hover:bg-amber-300 transition-colors uppercase tracking-widest text-xs font-bold"
            >
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Floating Product Card
function FloatingProductCard({ product, onClick }) {
  const isCenter = product.zone === 'center';
  
  return (
    <div
      className="absolute cursor-pointer transition-all duration-300 hover:scale-110 hover:z-30"
      style={{
        left: `${product.x}%`,
        top: `${product.y}%`,
        transform: `translate(-50%, -50%) scale(${product.scale})`,
        zIndex: isCenter ? 20 : 10,
      }}
      onClick={onClick}
    >
      <div className={`
        bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow
        ${isCenter ? 'w-44' : 'w-36'}
      `}>
        <div className={`aspect-square bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center ${isCenter ? 'text-6xl' : 'text-4xl'}`}>
          {product.emoji}
        </div>
        <div className="p-3">
          <p className="text-xs text-stone-700 truncate font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {product.name}
          </p>
          <p className="text-sm font-bold text-amber-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            CA${product.price.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

// Main App
export default function App() {
  const [activeCategory, setActiveCategory] = useState('mens');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [floatingProducts, setFloatingProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const animationRef = useRef(null);
  const scrollSpeed = useRef(1);
  const lastScrollTime = useRef(Date.now());

  // Initialize floating products
  const initializeProducts = useCallback(() => {
    const categoryProducts = PRODUCTS.filter(p => p.category === activeCategory);
    const products = [];
    const zones = ['left', 'center', 'right'];
    
    zones.forEach((zone) => {
      const count = zone === 'center' ? 3 : 4;
      for (let i = 0; i < count; i++) {
        const product = categoryProducts[Math.floor(Math.random() * categoryProducts.length)];
        if (!product) continue;
        
        const xRange = zone === 'left' ? [8, 28] : zone === 'center' ? [38, 62] : [72, 92];
        
        products.push({
          ...product,
          uniqueKey: `${zone}-${i}-${Date.now()}-${Math.random()}`,
          x: xRange[0] + Math.random() * (xRange[1] - xRange[0]),
          y: Math.random() * 120 - 10,
          zone,
          scale: zone === 'center' ? 1.15 : 0.9,
          speed: zone === 'center' ? 0.012 : 0.022,
        });
      }
    });
    
    setFloatingProducts(products);
  }, [activeCategory]);

  useEffect(() => {
    initializeProducts();
  }, [initializeProducts]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      setFloatingProducts(prev => 
        prev.map(product => {
          let newY = product.y - product.speed * scrollSpeed.current;
          
          if (newY < -15) {
            const xRange = product.zone === 'left' ? [8, 28] : product.zone === 'center' ? [38, 62] : [72, 92];
            return {
              ...product,
              y: 115,
              x: xRange[0] + Math.random() * (xRange[1] - xRange[0]),
            };
          }
          
          return { ...product, y: newY };
        })
      );
      
      if (scrollSpeed.current > 1) {
        scrollSpeed.current = Math.max(1, scrollSpeed.current - 0.015);
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Scroll handler
  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastScrollTime.current > 16) {
        scrollSpeed.current = Math.min(10, scrollSpeed.current + Math.abs(e.deltaY) * 0.008);
        lastScrollTime.current = now;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.size === product.size && item.color === product.color);
      if (existing) {
        return prev.map(item => 
          item === existing ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const categories = [
    { key: 'mens', label: 'MENS' },
    { key: 'womens', label: 'WOMENS' },
    { key: 'members', label: 'MEMBERS' },
  ];

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      {/* Grainy 3D Background */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, #D8D4C8 0%, #C9C4B5 40%, #B8B3A4 100%)' }}>
        {/* Noise texture */}
        <svg className="absolute inset-0 w-full h-full opacity-50">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)"/>
        </svg>
        
        {/* Depth gradient */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 40%, transparent 0%, rgba(0,0,0,0.12) 100%)' }} />
        
        {/* Subtle light source */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)' }} />
      </div>

      {/* Floating Menu - No background, just text */}
      <nav className="absolute top-0 left-0 right-0 z-40 px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <span className="text-lg font-bold text-stone-800 tracking-tight">
            ONSITE SHOP
          </span>

          {/* Categories */}
          <div className="flex items-center gap-8">
            {categories.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`text-sm tracking-widest transition-all ${
                  activeCategory === key
                    ? 'text-stone-800 font-bold'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Right menu */}
          <div className="flex items-center gap-8">
            <button className="text-sm text-stone-700 tracking-widest hover:text-stone-900 transition-colors">
              CART{cart.length > 0 && <span className="text-amber-500">({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>}
            </button>
            <span className="text-sm text-stone-700 tracking-widest hover:text-stone-900 transition-colors cursor-pointer">
              LOGIN
            </span>
            <span className="text-sm text-stone-400 tracking-widest hover:text-stone-600 transition-colors cursor-pointer">
              ← SITE
            </span>
          </div>
        </div>
      </nav>

      {/* Floating Products */}
      <div className="absolute inset-0 pt-20">
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
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />
      )}

      {/* Bottom tagline */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
        <p className="text-xs text-stone-400 tracking-[0.4em] uppercase">
          Wear What You Do
        </p>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 right-8 z-30 flex flex-col items-center gap-2 opacity-40">
        <div className="w-px h-12 bg-stone-500 animate-pulse" />
        <span className="text-xs text-stone-500 tracking-widest">SCROLL</span>
      </div>
    </div>
  );
}
