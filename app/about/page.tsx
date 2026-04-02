'use client';

import { useEffect, useRef } from 'react';
import { Navbar } from '@/components/shop/Navbar';
import { Footer } from '@/components/shop/Footer';

export default function AboutPage() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.1 }
    );
    const elements = sectionRef.current.querySelectorAll('.fade-in');
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#F3F2EF]">
      <Navbar />

      {/* Hero Banner */}
      <section className="pt-[72px]">
        <div className="relative h-[340px] sm:h-[420px] overflow-hidden bg-charcoal">
          <img
            src="https://www.onsiteclub.ca/_next/image?url=%2Fimages%2Fvision3.png&w=1200&q=80"
            alt="Builder at sunrise"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/30 to-transparent" />
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-[1200px] mx-auto px-6 pb-12 w-full">
              <span className="font-display text-[11px] font-bold tracking-[0.15em] uppercase text-amber block mb-3">
                About the Gear
              </span>
              <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-[1.1]">
                This Didn&apos;t Start<br />in a Boardroom.
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div ref={sectionRef} className="max-w-[1200px] mx-auto px-6 py-20">
        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <div className="fade-in">
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight mb-6">
              Built by the People<br />Who Build Everything.
            </h2>
            <p className="text-text-secondary text-base leading-relaxed mb-5">
              OnSite Club started on the jobsite. Boots on, tool belt strapped, hands full of lumber.
              We know what it&apos;s like to build something from nothing and have nobody remember your name.
            </p>
            <p className="text-text-secondary text-base leading-relaxed mb-5">
              The gear exists because the people who build this country deserve a brand that&apos;s theirs.
              Not a fashion label playing dress-up. The real thing.
            </p>
            <p className="text-text-secondary text-base leading-relaxed">
              Every piece we make has a story. The Jump Tee was inspired by that first moment
              you step onto a frame for the first time — the adrenaline, the height, the pride.
            </p>
          </div>
          <div className="relative fade-in fade-in-delay-1">
            <div className="rounded-2xl overflow-hidden aspect-[4/5] bg-warm-100">
              <img
                src="https://www.onsiteclub.ca/_next/image?url=%2Fimages%2Fvision3.png&w=640&q=80"
                alt="Builder at sunrise"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -right-5 lg:-bottom-6 lg:-right-6 bg-charcoal rounded-xl p-6 max-w-[280px] shadow-xl">
              <p className="font-display font-extrabold text-[15px] text-white leading-snug">
                &ldquo;Buildings don&apos;t remember who built them. We do.&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Values Grid */}
        <div className="mb-24">
          <span className="section-label block fade-in">Our Values</span>
          <h2 className="section-title fade-in mb-12">What We Stand For</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Made for the Job',
                desc: 'Every piece is designed to handle the wear and tear of real work — from fabric weight to stitch count.',
                icon: (
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                  </svg>
                ),
              },
              {
                title: 'Canadian Made',
                desc: 'Designed in Canada, for Canadians who work with their hands every single day.',
                icon: (
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                ),
              },
              {
                title: 'Community First',
                desc: 'We reinvest in the trades. Sponsoring apprentices, supporting local unions, showing up on site.',
                icon: (
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                ),
              },
            ].map((value) => (
              <div key={value.title} className="bg-white rounded-2xl p-8 fade-in shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
                <div className="w-12 h-12 rounded-xl bg-amber/10 flex items-center justify-center text-amber-dark mb-5">
                  {value.icon}
                </div>
                <h3 className="font-display font-extrabold text-base tracking-tight mb-3">{value.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center fade-in">
          <a
            href="https://www.onsiteclub.ca"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary-new !bg-charcoal !text-white hover:!bg-charcoal-light inline-block"
          >
            Learn More at OnSiteClub.ca
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
