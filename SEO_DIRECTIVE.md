# SEO Implementation Directive — OnSite Shop
**shop.onsiteclub.ca · Next.js + Supabase + Stripe · March 2026**

> This is a directive for the Claude Code agent. Implement everything in **IMPLEMENT** blocks. Run every **WEB-SEARCH** query before writing code and leave findings as inline comments. Do not skip research steps.

---

## SECTION 1 · Research Mandate (Run Before Any Code)

Before writing a single line, run these web searches and use the findings to inform implementation. Add a comment block at the top of each file referencing relevant findings.

```
WEB-SEARCH: next.js generateStaticParams product page SEO App Router 2025
WEB-SEARCH: next.js generateMetadata dynamic ecommerce product page best practice
WEB-SEARCH: schema.org Product JSON-LD next.js Script tag App Router 2025
WEB-SEARCH: next/image alt text SEO ecommerce best practices 2025
WEB-SEARCH: open graph image next.js opengraph-image.tsx App Router
WEB-SEARCH: robots.txt next.js App Router MetadataRoute configuration
WEB-SEARCH: canonical URL next.js ecommerce dynamic routes duplicate content
WEB-SEARCH: next-sitemap vs app/sitemap.ts App Router 2025 which to use
WEB-SEARCH: Google Search Console verification next.js metadata.verification
WEB-SEARCH: OfferShippingDetails schema.org ecommerce Canada CAD 2025
```

> ⚠ Log at least one finding per query as an inline comment in the relevant file. This is not optional.

---

## SECTION 2 · Keyword Bank

Distribute these keywords naturally across the codebase. Do NOT cluster them all in one place.

### Primary keywords — highest priority

| Keyword | Where to place |
|---|---|
| `construction worker clothing Canada` | Home H1, home meta title, layout default title |
| `tradesman apparel Canada` | Collection page H1, collection meta description |
| `carpenter hoodie Canada` | Hoodie product title, hoodie alt text |
| `construction lifestyle brand` | Home H2, Organization schema description |
| `gift for construction worker Canada` | Collection description, hoodie + tee body copy |
| `framing crew gear` | Product body copy, schema category field |
| `wear what you do` | Home H1 tagline — keep as-is, it already works |
| `built for those who build` | Home subheadline, OG default description |
| `OnSite Club Canada` | Organization schema, all page title suffixes |

### Secondary keywords — medium priority

| Keyword | Where to place |
|---|---|
| `Latino construction worker Canada` | About/manifesto copy, future blog |
| `trabalhador construção Canada` | `pt-BR` hreflang meta if i18n exists |
| `Brazilian carpenter Canada` | Manifesto section body copy |
| `immigrant tradesman Canada` | About page long description |
| `construction worker pride apparel` | Collection meta description |
| `tradesperson community Canada` | Home paragraph copy |
| `framer carpenter ironworker clothing` | Product long descriptions |
| `construction crew gift ideas Canada` | Gift collection or blog |

### Long-tail / gift cluster — high conversion, low competition

| Keyword | Page |
|---|---|
| `gift for carpenter husband Canada` | Hoodie description footer |
| `gift for framer Canada` | Hoodie + tee description |
| `birthday gift construction worker` | Product description last paragraph |
| `construction crew gift ideas Canada` | Future gift collection page |

### ❌ Never use these words anywhere on the site

`cheap` · `affordable` · `budget` · `discount` · `best price` · `low cost` · `free shipping` (unless true)

---

## SECTION 3 · File-by-File Implementation

---

### 3.1 `app/layout.tsx` — Global Metadata

**IMPLEMENT:** Replace or augment the existing metadata export with the following.

```tsx
// app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://shop.onsiteclub.ca'),

  title: {
    default: 'OnSite Club | Construction Worker Clothing Canada',
    template: '%s | OnSite Club Canada',
  },

  description:
    'Premium apparel for construction workers, carpenters, and trades professionals across Canada. Built for those who build.',

  keywords: [
    'construction worker clothing Canada',
    'tradesman apparel Canada',
    'carpenter hoodie Canada',
    'construction lifestyle brand',
    'gift for construction worker Canada',
    'OnSite Club',
  ],

  authors: [{ name: 'OnSite Club', url: 'https://onsiteclub.ca' }],
  creator: 'OnSite Club Inc.',
  publisher: 'OnSite Club Inc.',

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  alternates: {
    canonical: 'https://shop.onsiteclub.ca',
  },

  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: 'https://shop.onsiteclub.ca',
    siteName: 'OnSite Club',
    title: 'OnSite Club | Construction Worker Clothing Canada',
    description:
      'Premium apparel built for the trades. Worn by framers, carpenters, and crews across Canada.',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'OnSite Club — Built for those who build',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'OnSite Club | Construction Worker Clothing Canada',
    description: 'Premium apparel built for the trades.',
    images: ['/og-default.jpg'],
  },

  // IMPLEMENT after Google Search Console setup — paste verification code here:
  // verification: {
  //   google: 'PASTE_GSC_CODE_HERE',
  // },
}
```

> ⚠ Place `og-default.jpg` in `/public/og-default.jpg`. Minimum 1200×630px. Ideally shows a product being worn on a worksite.

---

### 3.2 `app/products/[slug]/page.tsx` — Product Page SSR + Metadata

**IMPLEMENT:** This is the most critical fix. Without `generateStaticParams`, Google cannot index any product.

```tsx
// app/products/[slug]/page.tsx
import type { Metadata } from 'next'

// ─── 1. Static generation — builds HTML at build time ────────────────────────
// Without this, Next.js renders client-side only and Google sees blank pages.
export async function generateStaticParams() {
  const products = await getProductsFromSupabase() // fetch all {slug} values
  return products.map((p) => ({ slug: p.slug }))
}

// ─── 2. Dynamic metadata per product ─────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const product = await getProductBySlug(params.slug)

  const title = `${product.name} | OnSite Club Canada`
  const description = `${product.name} — ${product.shortDescription} Worn by construction workers and trades professionals across Canada.`

  return {
    title,
    description,
    alternates: {
      canonical: `https://shop.onsiteclub.ca/products/${params.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://shop.onsiteclub.ca/products/${params.slug}`,
      type: 'website',
      images: [
        {
          url: product.imageUrl,
          width: 1200,
          height: 630,
          alt: `${product.name} — OnSite Club Canada`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [product.imageUrl],
    },
  }
}

// ─── 3. Page component — must render visible text server-side ─────────────────
export default async function ProductPage({
  params,
}: {
  params: { slug: string }
}) {
  const product = await getProductBySlug(params.slug)

  return (
    <main>
      {/* H1 must contain primary keyword — not just the product name */}
      <h1>{product.name} | Construction Worker Apparel Canada</h1>

      {/* Visible body text — Google reads this. Must be at least 150 words. */}
      <p>{product.longDescription}</p>

      {/* ... rest of UI (images, add-to-cart, variants, etc.) */}
    </main>
  )
}
```

> ⚠ **SSR validation test:** after deploying, run `curl https://shop.onsiteclub.ca/products/[any-slug]` and grep for the product name. If it's not in the raw HTML, `generateStaticParams` is not working.

---

### 3.3 `components/ProductSchema.tsx` — Structured Data

**IMPLEMENT:** Create this component and import it in every product page.

```tsx
// components/ProductSchema.tsx
import Script from 'next/script'

interface ProductSchemaProps {
  name: string
  description: string
  image: string
  sku: string
  price: number
  currency?: string
  inStock?: boolean
  url: string
}

export function ProductSchema({
  name,
  description,
  image,
  sku,
  price,
  currency = 'CAD',
  inStock = true,
  url,
}: ProductSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: [image],
    sku,
    brand: {
      '@type': 'Brand',
      name: 'OnSite Club',
    },
    category: 'Construction Worker Apparel',
    offers: {
      '@type': 'Offer',
      url,
      price: price.toFixed(2),
      priceCurrency: currency,           // always 'CAD' — not USD
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'OnSite Club Inc.',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'CA',
        },
      },
    },
  }

  return (
    <Script
      id={`schema-product-${sku}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Usage in product page:
// <ProductSchema
//   name={product.name}
//   description={product.longDescription}
//   image={product.imageUrl}
//   sku={product.sku}
//   price={product.price}
//   url={`https://shop.onsiteclub.ca/products/${product.slug}`}
// />
```

---

### 3.4 `components/OrganizationSchema.tsx` — Brand Schema

**IMPLEMENT:** Add to `app/layout.tsx` or the home page. Runs once globally.

```tsx
// components/OrganizationSchema.tsx
import Script from 'next/script'

export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'OnSite Club',
    url: 'https://shop.onsiteclub.ca',
    logo: 'https://shop.onsiteclub.ca/assets/logo-onsite-club.png',
    description:
      'Premium lifestyle apparel brand for construction workers, carpenters, framers, and trades professionals across Canada.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CA',
    },
    sameAs: [
      'https://onsiteclub.ca',
      'https://instagram.com/onsiteclub',
      // add YouTube, TikTok, etc. as they go live
    ],
  }

  return (
    <Script
      id="schema-organization"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
```

---

### 3.5 `components/BreadcrumbSchema.tsx` — Breadcrumb Schema

**IMPLEMENT:** Add to product pages and collection pages.

```tsx
// components/BreadcrumbSchema.tsx
import Script from 'next/script'

interface BreadcrumbItem {
  name: string
  url: string
}

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <Script
      id="schema-breadcrumb"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Usage in product page:
// <BreadcrumbSchema items={[
//   { name: 'Shop', url: 'https://shop.onsiteclub.ca' },
//   { name: 'Hoodies', url: 'https://shop.onsiteclub.ca/collections/hoodies' },
//   { name: product.name, url: `https://shop.onsiteclub.ca/products/${product.slug}` },
// ]} />
```

---

### 3.6 `app/robots.ts` — robots.txt

**IMPLEMENT:** Replace any existing robots.txt file or static `/public/robots.txt`.

```ts
// app/robots.ts
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/cart', '/checkout', '/admin'],
      },
    ],
    sitemap: 'https://shop.onsiteclub.ca/sitemap.xml',
  }
}
```

---

### 3.7 `app/sitemap.ts` — Dynamic Sitemap

**IMPLEMENT:** Replace any static sitemap. This pulls slugs from Supabase at build time.

```ts
// app/sitemap.ts
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProductsFromSupabase()

  const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
    url: `https://shop.onsiteclub.ca/products/${p.slug}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    {
      url: 'https://shop.onsiteclub.ca',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: 'https://shop.onsiteclub.ca/products',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...productUrls,
  ]
}
```

---

### 3.8 `app/opengraph-image.tsx` — Default OG Image (Native Next.js)

**IMPLEMENT:** This auto-generates a branded OG image without any external service.

```tsx
// app/opengraph-image.tsx
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'OnSite Club — Built for those who build'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#1B2B27',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 80,
        }}
      >
        <div style={{ color: '#F6C343', fontSize: 72, fontWeight: 700 }}>
          OnSite Club
        </div>
        <div style={{ color: '#ffffff', fontSize: 36, marginTop: 20 }}>
          Built For Those Who Build
        </div>
        <div style={{ color: '#9FE1CB', fontSize: 24, marginTop: 16 }}>
          Construction Worker Apparel · Canada
        </div>
      </div>
    ),
    { ...size }
  )
}
```

Also create `app/products/[slug]/opengraph-image.tsx` with the same pattern, pulling `product.name` and `product.imageUrl` from params.

---

### 3.9 Image Alt Text — Audit All `<Image>` Tags

**IMPLEMENT:** Find every `<Image>` component in the codebase and update alt text to follow this convention.

| Product | Alt text |
|---|---|
| Hoodie | `OnSite Club Framing Crew Hoodie — construction worker apparel Canada` |
| Cap | `OnSite Club snapback cap — tradesman hat Canada` |
| Cotton tee | `OnSite Club cotton tee — carpenter t-shirt Canada` |
| Sport tee | `OnSite Club performance tee — construction worker clothing Canada` |
| Sticker | `OnSite Club sticker — built for the trades Canada` |
| Lifestyle photo | `Construction worker wearing OnSite Club — framing crew Canada` |
| Logo | `OnSite Club logo — Canadian construction lifestyle brand` |

> ⚠ Never use filenames (`hoodie-v3-final.jpg`) or empty strings as alt text. Every `<Image>` must have a descriptive, keyword-containing alt.

---

### 3.10 Visible Copy — H1, H2, and Body Text

**IMPLEMENT:** These text blocks must exist as rendered server-side HTML. Not hidden via CSS. Not inside a JS-only bundle.

#### Home page (`app/page.tsx`)

```
H1:   Wear What You Do
H2:   Premium apparel for construction workers, carpenters, and trades professionals across Canada.
Body: OnSite Club is the construction lifestyle brand built by people who've been on the tools.
      From framing crews to ironworkers, our gear is made to carry the pride of the trade —
      shipped to Ontario, Quebec, BC, Alberta, and across Canada.
```

#### Products collection (`app/products/page.tsx`)

```
H1:   Shop Construction Worker Clothing — Canada
H2:   Apparel built for the trades. No fluff, no logos you don't believe in.
Body: Browse hoodies, tees, caps, and accessories designed for framers, carpenters,
      ironworkers, and crews. Flat-rate shipping across Canada.
```

#### Framing Crew Hoodie product page

```
H1:   Framing Crew Hoodie | OnSite Club
Body: The Framing Crew Hoodie is made for workers who show up before the sun does.
      Heavy cotton blend, pre-shrunk, with the OnSite Club wordmark printed in-house.
      Worn by framers, carpenters, and construction crews across Canada — from Ontario
      job sites to BC mountain builds. This isn't a fashion piece. It's a statement
      that you build things for real. Available in sizes S through 3XL.
      Ships to all Canadian provinces. The best gift for a construction worker
      who takes pride in the trade.
```

---

### 3.11 Canadian SEO Signals

**IMPLEMENT** each of the following small details — they tell Google this is a Canadian business:

- Display prices as `$49.99 CAD` (explicit currency, not just `$49.99`)
- Add visible text "Shipped across Canada" on home and product pages
- Footer: `OnSite Club Inc. · Canada · shop.onsiteclub.ca`
- Shipping copy must name provinces: `Ontario, Quebec, British Columbia, Alberta, Manitoba, Saskatchewan`
- `Organization` schema: `addressCountry: 'CA'`
- `Offer` schema: `priceCurrency: 'CAD'`

---

### 3.12 Canonical URLs — Prevent Duplicate Content

**IMPLEMENT:** Every `generateMetadata` call on dynamic routes must include canonical.

```ts
// Pattern for all dynamic pages:
alternates: {
  canonical: `https://shop.onsiteclub.ca/products/${params.slug}`,
  // Prevents ?color=black, ?size=xl from creating duplicate index entries
},
```

---

## SECTION 4 · Product Copy Templates

Use these as `longDescription` values in Supabase, or as hardcoded copy if products are static. Keywords are distributed naturally — do not compress or rewrite.

### Cotton Tee
> The OnSite Club Cotton Tee is built for the worker who puts in the hours. 100% pre-shrunk cotton, heavyweight feel, screen-printed OnSite Club mark. Worn by carpenters, framers, and construction workers across Canada — from Toronto to Vancouver. Available in sizes S to 3XL. Flat-rate shipping to all Canadian provinces. The perfect gift for a construction worker who takes pride in the trade.

### Sport Tee
> High-performance construction worker tee from OnSite Club. Moisture-wicking fabric designed for physical work — whether you're on a framing site in the Ontario heat or pushing through a concrete pour. Lightweight, durable, and marked with the OnSite Club brand. Ships across Canada. Ideal gift for tradespersons and crew leads.

### Framing Crew Hoodie
> The OnSite Club Framing Crew Hoodie is the worksite staple for Canadian construction workers. Heavy cotton blend, kangaroo pocket, reinforced seams. Designed for framers, ironworkers, and all-trade crews working Canadian job sites from coast to coast. Pre-shrunk. Available S to 3XL. Flat regional shipping — Ontario, Quebec, BC, Alberta, and beyond. The best gift for a carpenter or construction worker.

### Cap
> OnSite Club snapback cap — the hat for the trades professional who shows up every day. Structured front, adjustable back, embroidered OnSite Club wordmark. Worn by construction workers, foremen, and framing supervisors across Canada. One size adjustable. Ships nationwide.

### Sticker
> OnSite Club sticker pack — mark your hard hat, toolbox, or truck with the construction lifestyle brand. Made for Canadian tradespersons who build it right. Waterproof vinyl.

---

## SECTION 5 · Google Search Console Setup (Manual — Flag for Developer)

The agent cannot automate these steps. Create a file `TODO_GSC_SETUP.md` with the following instructions for the developer:

```
1. Go to search.google.com/search-console
2. Add property: shop.onsiteclub.ca (URL prefix method)
3. Verify via HTML meta tag
4. Copy verification code into app/layout.tsx:
   verification: { google: 'PASTE_CODE_HERE' }
5. Deploy
6. Submit sitemap: https://shop.onsiteclub.ca/sitemap.xml
7. Request indexing for: /, /products, and each product URL
8. Check Core Web Vitals report after 28 days
```

---

## SECTION 6 · Validation After Implementation

After all code changes are deployed, run these tests and write results to `SEO_VALIDATION_REPORT.md`.

| Test | How to run | Pass condition |
|---|---|---|
| SSR check | `curl https://shop.onsiteclub.ca/products/[slug] \| grep "product name"` | Product name appears in raw HTML |
| Sitemap | `curl https://shop.onsiteclub.ca/sitemap.xml` | Returns valid XML with product URLs |
| robots.txt | `curl https://shop.onsiteclub.ca/robots.txt` | Contains `Sitemap:` line |
| Structured data | Google Rich Results Test — paste each product URL | No errors on Product schema |
| Open Graph | opengraph.xyz — paste home + one product URL | Image and text preview correct |
| Canonical tags | View source on product page | `<link rel="canonical">` present |
| Alt texts | Grep codebase: `grep -r 'alt=""'` | Zero results |
| PageSpeed | pagespeed.web.dev — mobile | Score > 80 |

> ⚠ The SSR check is the most important. If the product name is not in the raw curl output, `generateStaticParams` is broken and nothing else matters.

---

## SECTION 7 · Blog Content Placeholders

**IMPLEMENT:** Create route files with TODO comments. Do not write content — flag for human.

```
app/blog/page.tsx                                        — blog index
app/blog/[slug]/page.tsx                                 — blog post template
```

Target posts (create as placeholder slugs in Supabase or a static list):

| Slug | Target keyword |
|---|---|
| `what-to-wear-on-a-framing-site-canadian-winter` | construction worker clothing Canada winter |
| `best-gift-for-construction-worker-canada` | gift for construction worker Canada |
| `how-onsiteclub-started-on-a-jobsite-ottawa` | OnSite Club construction brand Canada story |
| `immigrant-workers-building-canada` | Latino construction worker Canada |
| `5-things-every-framing-crew-needs-on-site` | framing crew gear Canada |

Each blog post must use `generateMetadata` with a unique title and description. Target keyword goes in H1 and first paragraph.

---

*OnSite Club Inc. · shop.onsiteclub.ca · Generated March 2026*
