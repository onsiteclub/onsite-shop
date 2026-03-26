'use client';

import { useState } from 'react';

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

export function BackgroundSystem() {
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
