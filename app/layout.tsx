import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OnSite Shop - Wear What You Do',
  description: 'Clothing and accessories for those who build Canada. Tees, caps, hoodies and more.',
  keywords: ['construction', 'workwear', 'canada', 'onsite', 'tees', 'hoodies'],
  authors: [{ name: 'OnSite Club' }],
  openGraph: {
    title: 'OnSite Shop - Wear What You Do',
    description: 'Clothing and accessories for those who build Canada.',
    url: 'https://shop.onsiteclub.ca',
    siteName: 'OnSite Shop',
    locale: 'en_CA',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="bg-grain min-h-screen">
        {children}
      </body>
    </html>
  )
}
