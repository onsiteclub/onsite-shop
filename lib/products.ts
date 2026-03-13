import { createClient } from '@/lib/supabase/server'
import { STRIPE_PRODUCTS } from '@/lib/stripe-config'

export interface ServerProduct {
  id: string
  slug: string
  name: string
  description: string
  primary_image: string
  images: string[]
  sizes: string[]
  colors: string[]
  color_images: Record<string, string[]>
  base_price: number
  sku: string
  stripe_price_id: string
  product_type: string
  category_slug: string
  updated_at: string
}

const SKU_PREFIX_MAP: Record<string, keyof typeof STRIPE_PRODUCTS> = {
  'CTEE': 'cotton-tee',
  'STEE': 'sport-tee',
  'HOOD': 'hoodie',
  'CAP': 'cap',
  'STK': 'sticker-kit',
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function mapProduct(p: any): ServerProduct {
  const skuPrefix = (p.sku || '').split('-')[0]
  const skuType = SKU_PREFIX_MAP[skuPrefix]
  const typeMatch = p.product_type
    ? STRIPE_PRODUCTS[p.product_type as keyof typeof STRIPE_PRODUCTS]
    : null
  const skuMatch = skuType ? STRIPE_PRODUCTS[skuType] : null

  return {
    id: p.id,
    slug: p.slug || slugify(p.name),
    name: p.name,
    description: p.description || '',
    primary_image: p.primary_image || p.images?.[0] || '',
    images: p.images || [],
    sizes: p.sizes || [],
    colors: p.colors || [],
    color_images: p.color_images || {},
    base_price: p.base_price ?? (typeMatch?.price || skuMatch?.price || 0) / 100,
    sku: p.sku || '',
    stripe_price_id: p.stripe_price_id || typeMatch?.priceId || skuMatch?.priceId || '',
    product_type: p.product_type || skuType || '',
    category_slug: p.category?.slug || 'mens',
    updated_at: p.updated_at || p.created_at || new Date().toISOString(),
  }
}

export async function getAllProducts(): Promise<ServerProduct[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('app_shop_products')
      .select('*, category:categories(slug)')
      .eq('is_active', true)
      .order('sort_order')

    if (error || !data) return []
    return data.map(mapProduct)
  } catch {
    return []
  }
}

export async function getProductBySlug(slug: string): Promise<ServerProduct | null> {
  try {
    const supabase = createClient()

    // Try by slug column first
    let { data, error } = await supabase
      .from('app_shop_products')
      .select('*, category:categories(slug)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      // Fallback: fetch all and match by generated slug from name
      const all = await getAllProducts()
      const match = all.find(p => p.slug === slug)
      return match || null
    }

    return mapProduct(data)
  } catch {
    return null
  }
}
