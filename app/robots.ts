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
