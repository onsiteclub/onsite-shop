import type { Metadata } from 'next'
import { OrganizationSchema } from '@/components/OrganizationSchema'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://shop.onsiteclub.ca'),

  title: {
    default: 'OnSite Club Shop | Construction Worker Clothing Canada',
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
    title: 'OnSite Club Shop | Construction Worker Clothing Canada',
    description:
      'Premium apparel built for the trades. Worn by framers, carpenters, and crews across Canada.',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'OnSite Club Shop | Construction Worker Clothing Canada',
    description: 'Premium apparel built for the trades.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-CA">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#F3F2EF] font-body text-text-primary">
        <OrganizationSchema />
        {children}
      </body>
    </html>
  )
}
