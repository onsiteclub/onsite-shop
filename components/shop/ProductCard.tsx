'use client';

import { useState, useRef } from 'react';
import { cleanProductName } from '@/lib/utils';
import type { Product } from '@/lib/types';

export function UniformProductCard({
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

  const clickedRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => {
    setIsPressed(false);
    if (!clickedRef.current) {
      clickedRef.current = true;
      onClick();
      setTimeout(() => { clickedRef.current = false; }, 300);
    }
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
      onTouchStart={(e) => {
        const touch = e.touches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
        onHoverChange?.(true);
      }}
      onTouchEnd={(e) => {
        onHoverChange?.(false);
        const touch = e.changedTouches[0];
        const start = touchStartRef.current;
        if (!start) return;
        const dx = Math.abs(touch.clientX - start.x);
        const dy = Math.abs(touch.clientY - start.y);
        if (dx < 10 && dy < 10 && !clickedRef.current) {
          clickedRef.current = true;
          onClick();
          setTimeout(() => { clickedRef.current = false; }, 300);
        }
        touchStartRef.current = null;
      }}
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

      {/* Image */}
      <div className="relative aspect-square w-full flex items-center justify-center">
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden"
          style={{ maskImage: maskGradient, WebkitMaskImage: maskGradient }}
        >
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-200"
              style={{ filter: isHovered ? 'brightness(1.02)' : 'brightness(1)' }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <span className={`${product.image ? 'hidden' : ''} text-stone-300`}>
            <svg className="w-12 h-12 md:w-16 md:h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </span>
        </div>

        {/* Hover Preview */}
        {showPreview && (
          <div
            className="absolute inset-x-0 -bottom-2 bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg"
            style={{ animation: 'fadeIn 150ms ease-out forwards', opacity: 0 }}
          >
            <p className="font-mono text-[10px] text-[#1B2B27]/60 truncate">{product.sizes?.join(' / ')}</p>
          </div>
        )}
      </div>

      {/* Name + Price */}
      <div className="text-center mt-2">
        <p className="font-mono text-[11px] text-[#1B2B27]/70 truncate px-1">
          {cleanProductName(product.name)}
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
