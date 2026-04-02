'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/shop/Navbar';
import { Footer } from '@/components/shop/Footer';
import { BLOG_POSTS, SIDEBAR_TAGS } from '@/lib/blog-data';

function BlogContent() {
  const searchParams = useSearchParams();
  const initialTag = searchParams.get('tag') || '';
  const [activeTag, setActiveTag] = useState(initialTag);

  useEffect(() => {
    const tag = searchParams.get('tag') || '';
    setActiveTag(tag);
  }, [searchParams]);

  const filteredPosts = activeTag
    ? BLOG_POSTS.filter(p => p.tag.toLowerCase() === activeTag.toLowerCase())
    : BLOG_POSTS;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Header */}
      <section className="mt-[72px] bg-charcoal-deep text-white py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <span className="font-display text-xs font-bold tracking-[0.2em] uppercase text-warm-300 mb-4 inline-block">
            The OnSite Edit
          </span>
          <h1 className="font-display text-[clamp(32px,4vw,48px)] font-black leading-[1.1] mb-4 tracking-tight">
            Stories from the Jobsite
          </h1>
          <p className="text-white/60 text-lg max-w-[520px] leading-relaxed">
            Culture, guides, gear drops, and everything the crew needs to know.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
            {/* Posts */}
            <div>
              {/* Tag filter pills */}
              <div className="flex flex-wrap gap-2 mb-10">
                <button
                  onClick={() => setActiveTag('')}
                  className={`font-display text-[11px] font-bold tracking-[0.05em] uppercase py-2 px-4 rounded-lg border transition-all duration-200 ${
                    !activeTag
                      ? 'bg-charcoal-deep border-charcoal-deep text-white'
                      : 'border-warm-200 bg-white text-text-secondary hover:bg-amber hover:border-amber hover:text-charcoal'
                  }`}
                >
                  All
                </button>
                {SIDEBAR_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
                    className={`font-display text-[11px] font-bold tracking-[0.05em] uppercase py-2 px-4 rounded-lg border transition-all duration-200 ${
                      activeTag === tag
                        ? 'bg-charcoal-deep border-charcoal-deep text-white'
                        : 'border-warm-200 bg-white text-text-secondary hover:bg-amber hover:border-amber hover:text-charcoal'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Post list */}
              {filteredPosts.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-warm-400 text-lg mb-4">No posts found for &ldquo;{activeTag}&rdquo;</p>
                  <button
                    onClick={() => setActiveTag('')}
                    className="font-display text-sm font-bold text-amber-dark hover:text-charcoal transition-colors"
                  >
                    View all posts &rarr;
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-8">
                  {filteredPosts.map((post) => (
                    <article
                      key={post.slug}
                      className="grid grid-cols-1 sm:grid-cols-[300px_1fr] gap-7 items-start pb-8 border-b border-warm-200 last:border-b-0 last:pb-0 group"
                    >
                      <div className="aspect-[4/3] rounded-[10px] overflow-hidden bg-warm-100">
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
                        <h2 className="font-display text-xl font-extrabold leading-snug mb-3 tracking-tight">
                          {post.title}
                        </h2>
                        <p className="text-[15px] text-text-secondary leading-relaxed mb-4">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-warm-400">
                          <span>{post.date}</span>
                          <span>&middot;</span>
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="flex flex-col lg:flex-col sm:flex-row sm:flex-wrap gap-8">
              {/* Topics */}
              <div className="bg-off-white rounded-[10px] p-7 sm:flex-1 sm:min-w-[280px] lg:min-w-0">
                <h4 className="font-display text-sm font-extrabold tracking-[0.03em] mb-5 pb-3 border-b-2 border-warm-200">
                  Topics
                </h4>
                <div className="flex flex-wrap gap-2">
                  {SIDEBAR_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
                      className={`font-display text-[11px] font-bold tracking-[0.05em] uppercase py-2 px-4 rounded-lg border transition-all duration-200 ${
                        activeTag === tag
                          ? 'bg-amber border-amber text-charcoal'
                          : 'border-warm-200 bg-white text-text-secondary hover:bg-amber hover:border-amber hover:text-charcoal'
                      }`}
                    >
                      {tag}
                    </button>
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

              {/* Back to Shop */}
              <div className="bg-off-white rounded-[10px] p-7 sm:flex-1 sm:min-w-[280px] lg:min-w-0 text-center">
                <h4 className="font-display text-sm font-extrabold tracking-[0.03em] mb-3">
                  Looking for gear?
                </h4>
                <a
                  href="/"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-display font-bold text-xs uppercase tracking-wider bg-amber text-charcoal-deep hover:bg-charcoal-deep hover:text-white transition-all duration-300"
                >
                  Shop Collection
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense>
      <BlogContent />
    </Suspense>
  );
}
