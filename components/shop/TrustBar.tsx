'use client';

const TRUST_ITEMS = [
  { icon: '\u{1F1E8}\u{1F1E6}', label: 'Canadian Made', value: 'Ontario-based' },
  { icon: '\u{1F4E6}', label: 'Fast Shipping', value: 'Canada Post' },
  { icon: '\u{1F4B3}', label: 'Secure Checkout', value: 'Stripe powered' },
  { icon: '\u21A9\uFE0F', label: '14 Day Returns', value: 'No hassle' },
  { icon: '\u{1F4AC}', label: 'Real Support', value: 'Humans, not bots' },
];

export function TrustBar() {
  return (
    <section className="bg-charcoal py-12">
      <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
        <h3 className="font-display text-[clamp(18px,2.5vw,24px)] font-extrabold text-white flex items-center gap-3 flex-shrink-0">
          Built Right, Shipped Right
          <span className="text-[28px]">&#9889;</span>
        </h3>

        <div className="flex flex-wrap justify-center gap-8 md:gap-10">
          {TRUST_ITEMS.map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="text-xs font-semibold text-white/60 tracking-[0.05em] uppercase font-display">
                {item.label}
              </div>
              <div className="text-[13px] text-white/40 mt-0.5">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
