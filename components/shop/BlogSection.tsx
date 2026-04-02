'use client';

import { BLOG_POSTS, SIDEBAR_TAGS } from '@/lib/blog-data';

export function BlogSection() {
  return (
    <section className="py-[100px] bg-white" id="blog">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="section-label block">The OnSite Edit</span>
            <h2 className="section-title">Stories from the Jobsite</h2>
          </div>
          <a href="/blog" className="font-display font-bold text-[13px] text-charcoal tracking-[0.05em] uppercase hover:text-amber-dark transition-colors">
            All Posts &rarr;
          </a>
        </div>

        {/* Layout: Posts + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
          {/* Posts */}
          <div className="flex flex-col gap-8">
            {BLOG_POSTS.map((post) => (
              <a
                key={post.slug}
                href="/blog"
                className="grid grid-cols-1 sm:grid-cols-[280px_1fr] gap-7 items-start pb-8 border-b border-warm-200 last:border-b-0 last:pb-0 group hover:translate-x-1 transition-transform duration-300"
              >
                <div className="aspect-[4/3] rounded-md overflow-hidden bg-warm-100">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="pt-1">
                  <span className="font-display text-[11px] font-bold tracking-[0.15em] uppercase text-warm-500 mb-2.5 inline-block">
                    {post.tag}
                  </span>
                  <h3 className="font-display text-xl font-extrabold leading-snug mb-2.5 tracking-tight group-hover:text-charcoal-light transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed mb-3.5 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-warm-400">
                    <span>{post.date}</span>
                    <span>&middot;</span>
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col lg:flex-col sm:flex-row sm:flex-wrap gap-8">
            {/* Recent Posts */}
            <div className="bg-off-white rounded-[10px] p-7 sm:flex-1 sm:min-w-[280px] lg:min-w-0">
              <h4 className="font-display text-sm font-extrabold tracking-[0.03em] mb-5 pb-3 border-b-2 border-warm-200">
                Recent Posts
              </h4>
              <div className="flex flex-col gap-4">
                {BLOG_POSTS.map((post) => (
                  <a key={post.slug} href="/blog" className="flex gap-3 items-start group hover:translate-x-1 transition-transform duration-200">
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-warm-100">
                      <img src={post.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="font-display text-[13px] font-bold leading-snug mb-1 group-hover:text-charcoal-light transition-colors">
                        {post.title.length > 40 ? post.title.slice(0, 40) + '...' : post.title}
                      </div>
                      <div className="text-[11px] text-warm-400">{post.date}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Topics */}
            <div className="bg-off-white rounded-[10px] p-7 sm:flex-1 sm:min-w-[280px] lg:min-w-0">
              <h4 className="font-display text-sm font-extrabold tracking-[0.03em] mb-5 pb-3 border-b-2 border-warm-200">
                Topics
              </h4>
              <div className="flex flex-wrap gap-2">
                {SIDEBAR_TAGS.map((tag) => (
                  <a
                    key={tag}
                    href={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="font-display text-[11px] font-bold tracking-[0.05em] uppercase py-2 px-4 rounded-lg border border-warm-200 bg-white text-text-secondary hover:bg-amber hover:border-amber hover:text-charcoal transition-all duration-200"
                  >
                    {tag}
                  </a>
                ))}
              </div>
            </div>

            {/* Join CTA */}
            <div className="bg-charcoal rounded-[10px] p-7 text-white sm:flex-1 sm:min-w-[280px] lg:min-w-0">
              <h4 className="font-display text-sm font-extrabold mb-5 pb-3 border-b border-white/15">
                Join the Crew
              </h4>
              <p className="text-sm text-white/60 leading-relaxed mb-4">
                Get new posts, gear drops, and exclusive content delivered to your inbox.
              </p>
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full py-3 px-4 rounded-lg border border-white/15 bg-white/[0.08] text-white text-[13px] font-body mb-2.5 outline-none placeholder:text-warm-500 focus:bg-white/15 transition-colors"
              />
              <button className="w-full py-3 rounded-lg bg-white text-charcoal-deep font-display font-bold text-xs uppercase tracking-wider hover:bg-amber transition-colors">
                Subscribe
              </button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
