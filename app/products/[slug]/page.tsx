import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllProducts, getProductBySlug } from '@/lib/products'
import { ProductSchema } from '@/components/ProductSchema'
import { BreadcrumbSchema } from '@/components/BreadcrumbSchema'
import { ProductActions } from './ProductActions'

// Category label mapping for breadcrumbs
const CATEGORY_LABELS: Record<string, string> = {
  'cotton-tee': 'Cotton Tees',
  'sport-tee': 'Sport Tees',
  'hoodie': 'Hoodies',
  'cap': 'Caps',
  'sticker-kit': 'Stickers',
}

// ─── 1. Static generation — builds HTML at build time ────────────────────────
export async function generateStaticParams() {
  const products = await getAllProducts()
  return products
    .filter(p => p.category_slug !== 'members')
    .map((p) => ({ slug: p.slug }))
}

// ─── 2. Dynamic metadata per product ─────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    return { title: 'Product Not Found | OnSite Club Canada' }
  }

  const title = `${product.name} | OnSite Club Canada`
  const description = product.description
    ? `${product.name} — ${product.description.slice(0, 140)}. Worn by construction workers and trades professionals across Canada.`
    : `${product.name} — Premium construction worker apparel from OnSite Club. Shipped across Canada.`

  return {
    title,
    description,
    alternates: {
      canonical: `https://shop.onsiteclub.ca/products/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://shop.onsiteclub.ca/products/${slug}`,
      type: 'website',
      images: product.primary_image
        ? [
            {
              url: product.primary_image,
              width: 1200,
              height: 630,
              alt: `${product.name} — OnSite Club Canada`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.primary_image ? [product.primary_image] : undefined,
    },
  }
}

// ─── 3. Page component — server-rendered visible text ────────────────────────
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const categoryLabel = CATEGORY_LABELS[product.product_type] || 'Shop'
  const productUrl = `https://shop.onsiteclub.ca/products/${slug}`

  return (
    <main className="bg-white min-h-screen">
      {/* JSON-LD Structured Data */}
      <ProductSchema
        name={product.name}
        description={product.description || `${product.name} — premium construction worker apparel from OnSite Club Canada.`}
        image={product.primary_image}
        sku={product.sku}
        price={product.base_price}
        url={productUrl}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Shop', url: 'https://shop.onsiteclub.ca' },
          { name: categoryLabel, url: 'https://shop.onsiteclub.ca' },
          { name: product.name, url: productUrl },
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Breadcrumb navigation */}
        <nav className="font-display text-xs text-text-secondary mb-6 uppercase tracking-wider">
          <a href="/" className="hover:text-text-primary transition-colors">Shop</a>
          <span className="mx-2">/</span>
          <span>{categoryLabel}</span>
          <span className="mx-2">/</span>
          <span className="text-text-primary">{product.name}</span>
        </nav>

        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          {/* Image section - Server rendered with first image */}
          <div className="md:w-3/5">
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-white shadow-lg">
              {product.primary_image ? (
                <img
                  src={product.primary_image}
                  alt={`${product.name} — construction worker apparel Canada`}
                  className="w-full h-full object-cover"
                  style={{
                    filter: 'contrast(1.08) brightness(1.02) saturate(1.05)',
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400">
                  <span className="text-6xl">📦</span>
                </div>
              )}
            </div>
          </div>

          {/* Product info section */}
          <div className="md:w-2/5">
            {/* H1 with primary keyword */}
            <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary mb-2">
              {product.name}
            </h1>

            <p className="font-display text-lg text-amber-dark font-bold tracking-wider uppercase mb-4">
              CA${product.base_price.toFixed(2)} CAD
            </p>

            {/* Visible body text for SEO — at least 150 words server-rendered */}
            {product.description && (
              <p className="text-text-secondary mb-6 leading-relaxed text-sm">
                {product.description}
              </p>
            )}

            <p className="text-text-secondary mb-6 leading-relaxed text-sm">
              Shipped across Canada — Ontario, Quebec, British Columbia, Alberta, and all provinces.
            </p>

            {/* Client-side interactive component */}
            <ProductActions
              productKey={product.sku || product.id}
              priceId={product.stripe_price_id}
              name={product.name}
              price={product.base_price}
              sizes={product.sizes}
              colors={product.colors}
              images={product.images}
              colorImages={product.color_images}
              primaryImage={product.primary_image}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
