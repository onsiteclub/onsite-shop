'use client';

const SOCIAL_IMAGES = [
  'https://www.onsiteclub.ca/_next/image?url=%2Fimages%2Fvision1.png&w=400&q=80',
  'https://www.onsiteclub.ca/_next/image?url=%2Fimages%2Fvision2.png&w=400&q=80',
  'https://www.onsiteclub.ca/_next/image?url=%2Fimages%2Fvision3.png&w=400&q=80',
  'https://www.onsiteclub.ca/_next/image?url=%2Fimages%2Fproduct-men.webp&w=400&q=80',
  'https://www.onsiteclub.ca/_next/image?url=%2Fimages%2Fproduct-members.webp&w=400&q=80',
];

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

export function SocialBanner() {
  return (
    <section className="py-[100px] bg-charcoal relative overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 100%, rgba(255,255,255,0.04) 0%, transparent 60%)',
      }} />

      <div className="relative z-[2] max-w-[1200px] mx-auto px-6 text-center">
        <span className="section-label block !text-warm-300">Follow the Movement</span>
        <h2 className="section-title !text-white">Join the Crew on Instagram</h2>
        <p className="text-white/60 max-w-[500px] mx-auto mb-10">
          Tag us @onsite.club and get featured.
        </p>

        {/* Image Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-10">
          {SOCIAL_IMAGES.map((src, i) => (
            <div key={i} className="aspect-square rounded-md overflow-hidden bg-charcoal-light relative group">
              <img
                src={src}
                alt="OnSite Community"
                className="w-full h-full object-cover transition-all duration-400 group-hover:scale-[1.08] group-hover:brightness-110"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <InstagramIcon />
              </div>
            </div>
          ))}
        </div>

        <a
          href="https://www.instagram.com/onsite.club/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 border-2 border-white/30 text-white py-3.5 px-8 rounded-lg font-display font-bold text-[13px] tracking-[0.08em] uppercase hover:border-white transition-all duration-300"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
          @onsite.club
        </a>
      </div>
    </section>
  );
}
