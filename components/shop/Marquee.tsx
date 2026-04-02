'use client';

const ITEMS = [
  'Built for the Jobsite',
  'Rep Your Trade',
  'Made in Canada',
  'Buildings Don\'t Remember Who Built Them — We Do',
  'Wear the Work',
];

export function Marquee() {
  return (
    <div className="bg-charcoal-deep py-3.5 overflow-hidden whitespace-nowrap">
      <div className="flex animate-marquee">
        {/* Duplicate items for seamless loop */}
        {[...ITEMS, ...ITEMS].map((text, i) => (
          <span
            key={i}
            className="font-display font-extrabold text-[13px] tracking-[0.15em] uppercase text-warm-300 px-10 flex-shrink-0 flex items-center gap-10"
          >
            {text}
            <span className="text-[8px] opacity-50">&#9670;</span>
          </span>
        ))}
      </div>
    </div>
  );
}
