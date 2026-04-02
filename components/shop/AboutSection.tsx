'use client';

import { useEffect, useRef } from 'react';

export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.15 }
    );
    const elements = sectionRef.current.querySelectorAll('.fade-in');
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-[100px] bg-white" id="about">
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-[60px] items-center">
        {/* Text */}
        <div>
          <span className="section-label fade-in block">About the Gear</span>
          <h2 className="section-title fade-in">
            This Didn&apos;t Start<br />in a Boardroom.
          </h2>
          <p className="text-text-secondary text-base leading-relaxed mb-5 fade-in">
            OnSite Club started on the jobsite. Boots on, tool belt strapped, hands full of lumber.
            We know what it&apos;s like to build something from nothing and have nobody remember your name.
          </p>
          <p className="text-text-secondary text-base leading-relaxed mb-8 fade-in">
            The gear exists because the people who build this country deserve a brand that&apos;s theirs.
            Not a fashion label playing dress-up. The real thing.
          </p>
          <a
            href="https://www.onsiteclub.ca"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary-new fade-in !bg-charcoal !text-white hover:!bg-charcoal-light"
          >
            Learn More at OnSiteClub.ca
          </a>
        </div>

        {/* Image + Quote */}
        <div className="relative">
          <div className="rounded-[10px] overflow-hidden aspect-[4/5] bg-warm-100 fade-in">
            <img
              src="https://www.onsiteclub.ca/_next/image?url=%2Fimages%2Fvision3.png&w=640&q=80"
              alt="Builder at sunrise"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-5 -right-5 lg:-bottom-5 lg:-right-5 bg-charcoal rounded-md p-6 max-w-[260px] fade-in fade-in-delay-2 shadow-xl">
            <p className="font-display font-extrabold text-[15px] text-white leading-snug">
              &ldquo;Buildings don&apos;t remember who built them. We do.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
