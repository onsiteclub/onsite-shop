# AUDIT: Performance & Bundle Size

You are auditing the performance of this Next.js e-commerce application. Slow pages lose sales — every 100ms of load time costs ~1% conversion.

## Instructions

Analyze bundle size, render patterns, and data fetching. Focus on what the CUSTOMER experiences.

## Files to Read

1. `next.config.js` — Config, image optimization, redirects
2. `app/page.tsx` — Homepage (most critical page)
3. `app/layout.tsx` — Root layout, fonts, global imports
4. `app/cart/page.tsx` — Cart page
5. `components/shop/Hero.tsx` — Above-the-fold content
6. `components/shop/Navbar.tsx` — Always visible
7. `components/shop/ProductGridByCategory.tsx` — Product listing
8. `package.json` — Dependencies (large libraries?)
9. `tailwind.config.ts` — Purge config

Also run these commands and include results:
- `npx next build` — Check bundle sizes in output
- Check for `'use client'` directives — which components are client-side?

## Checks

### A. Critical Rendering Path
- [ ] Above-the-fold content (Hero) renders without JavaScript? (SSR/SSG)
- [ ] Fonts are preloaded or use `next/font`
- [ ] No layout shift (CLS) from loading images or fonts
- [ ] Homepage is 'use client' → entire page is client-rendered? (bad for SEO)
- [ ] Product images use `next/image` with proper sizes/priority

### B. Bundle Size
- [ ] Total First Load JS under 100KB per route
- [ ] No unnecessary large libraries imported client-side
- [ ] Dynamic imports (`next/dynamic`) used for below-fold components
- [ ] Tree-shaking working (no full library imports like `import _ from 'lodash'`)
- [ ] lucide-react: individual icon imports (not entire library)

### C. Images
- [ ] Product images are optimized (WebP/AVIF)
- [ ] Images have width/height or fill to prevent CLS
- [ ] Hero images/videos are lazy loaded or have priority flag
- [ ] Thumbnail images use appropriate sizes (not full-res)
- [ ] External images have `domains` or `remotePatterns` in next.config

### D. Data Fetching
- [ ] Products fetched once, not on every render
- [ ] No unnecessary re-fetches on navigation
- [ ] Loading states shown during data fetch (skeleton or spinner)
- [ ] Error states shown when fetch fails (not blank page)
- [ ] Supabase queries use select() with specific columns (not select('*'))

### E. Client vs Server
- [ ] Pages that could be static (about, FAQ, blog) ARE static
- [ ] 'use client' is on leaf components, not entire pages (when possible)
- [ ] Server Components used for data fetching where possible
- [ ] Client state (Zustand) only for truly interactive state (cart, auth)

### F. Caching
- [ ] Static pages have proper Cache-Control headers
- [ ] API routes that don't change often have revalidation
- [ ] Product data could be cached/revalidated (ISR)?
- [ ] Assets (images, fonts) have long cache TTL

## Output Format

```
## Performance Audit Report — [DATE]

### Page Load Grade: [A / B / C / D / F]

### Bundle Size Issues
1. [Route] → [Size] → [Recommendation]

### Render Blocking Issues
1. [Component] → [Issue] → [Fix]

### Quick Wins (easy fixes, big impact)
1. [Fix] → [Expected improvement]

### Larger Optimizations (consider for later)
1. [Optimization] → [Effort] → [Impact]
```
