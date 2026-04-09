'use client';

interface FeaturedProduct {
  name: string;
  image: string;
  label: string;
}

interface HeroProps {
  featured?: FeaturedProduct[];
}

export function Hero({ featured = [] }: HeroProps) {
  // Fallback images if no featured products passed
  const heroImages = featured.length >= 2
    ? featured
    : [
        { name: 'The Jump', image: '/images/hero-man.png', label: 'The Jump' },
        { name: 'Mascot', image: '/images/hero-woman.png', label: 'Mascot' },
      ];

  return (
    <section className="mt-[72px] bg-charcoal relative overflow-hidden min-h-[85vh] flex items-center">
      {/* Blueprint background image */}
      <div className="absolute inset-0 z-[0]">
        <img
          src="/assets/background-parallax.png"
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: 'brightness(0.3) contrast(1.1) grayscale(1)' }}
        />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 z-[1]" style={{
        background: 'linear-gradient(135deg, rgba(26,26,26,0.75) 0%, rgba(26,26,26,0.5) 50%, rgba(26,26,24,0.65) 100%)',
      }} />

      {/* Subtle glow */}
      <div className="absolute inset-0 z-[2]" style={{
        backgroundImage: `
          radial-gradient(ellipse at 70% 50%, rgba(255,255,255,0.04) 0%, transparent 60%),
          radial-gradient(ellipse at 20% 80%, rgba(255,255,255,0.02) 0%, transparent 40%)
        `,
      }} />

      <div className="relative z-[3] max-w-[1200px] mx-auto px-6 py-[60px] grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-[40px] items-center">
        {/* Text */}
        <div className="text-white lg:text-left text-center">
          <span className="font-display text-xs font-bold tracking-[0.2em] uppercase text-amber mb-5 inline-block">
            OnSite Club Gear
          </span>
          <h1 className="font-display text-[clamp(40px,5vw,64px)] font-black leading-[1.05] mb-6 tracking-tight">
            Built for Those<br />Who <span className="text-amber">Build.</span>
          </h1>
          <p className="text-lg text-white/70 max-w-[440px] mb-10 leading-relaxed lg:mx-0 mx-auto">
            Jobsite essentials made for the crew that wakes up before the sun and builds something real.
          </p>
          <div className="flex gap-4 flex-wrap lg:justify-start justify-center">
            <a href="#shop" className="inline-flex items-center justify-center px-9 py-4 rounded-lg font-display font-bold text-sm uppercase tracking-wider transition-all duration-300 bg-amber text-charcoal-deep hover:bg-white hover:shadow-lg hover:-translate-y-0.5">
              Shop Collection
            </a>
          </div>
        </div>

        {/* Images */}
        <div className="grid grid-cols-2 gap-5 relative max-w-[560px] lg:max-w-none mx-auto">
          <a href="#products-cotton-tee" className="rounded-[10px] overflow-hidden relative aspect-[2/3] bg-charcoal-light mt-10 group cursor-pointer block">
            {heroImages[0]?.image && (
              <img
                src={heroImages[0].image}
                alt={heroImages[0].name}
                className="w-full h-full object-cover transition-transform duration-[600ms] group-hover:scale-105"
              />
            )}
          </a>
          <a href="#products-hoodie" className="rounded-[10px] overflow-hidden relative aspect-[2/3] bg-charcoal-light -mt-10 group cursor-pointer block">
            {heroImages[1]?.image && (
              <img
                src={heroImages[1].image}
                alt={heroImages[1].name}
                className="w-full h-full object-cover transition-transform duration-[600ms] group-hover:scale-105"
              />
            )}
          </a>
        </div>
      </div>
    </section>
  );
}
