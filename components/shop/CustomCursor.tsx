'use client';

import { useState, useEffect, useRef } from 'react';

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

export function CustomCursor({ isHovering, label }: { isHovering: boolean; label: string }) {
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
