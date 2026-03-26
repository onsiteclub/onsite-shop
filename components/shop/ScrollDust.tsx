'use client';

import { useRef, useCallback, useEffect } from 'react';

export function ScrollDust() {
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
