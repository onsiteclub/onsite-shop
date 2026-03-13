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
      priceCurrency: currency,
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
