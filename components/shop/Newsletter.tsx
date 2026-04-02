'use client';

export function Newsletter() {
  return (
    <section className="py-20 bg-charcoal" id="contact">
      <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="max-w-[500px] md:text-left text-center">
          <h2 className="section-title !text-white !mb-2">Get 10% Off Your First Order</h2>
          <p className="text-white/60 text-[15px]">
            Join the crew. Get early drops, jobsite stories, and exclusive deals.
          </p>
        </div>

        <form
          className="flex flex-col sm:flex-row gap-3 flex-1 max-w-[480px] w-full"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="email"
            placeholder="your@email.com"
            required
            className="flex-1 py-4 px-6 border border-white/20 rounded-lg text-sm font-body bg-white/[0.08] text-white outline-none placeholder:text-warm-500 focus:bg-white transition-colors focus:text-charcoal"
          />
          <button
            type="submit"
            className="btn-amber whitespace-nowrap !py-4 !px-8"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
