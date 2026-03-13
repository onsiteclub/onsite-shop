import { MetadataRoute } from 'next'
import { getAllProducts } from '@/lib/products'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProducts()

  const productUrls: MetadataRoute.Sitemap = products
    .filter(p => p.category_slug !== 'members')
    .map((p) => ({
      url: `https://shop.onsiteclub.ca/products/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

  return [
    {
      url: 'https://shop.onsiteclub.ca',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    ...productUrls,
  ]
}
