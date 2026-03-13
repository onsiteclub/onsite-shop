import { ImageResponse } from 'next/og'
import { getProductBySlug } from '@/lib/products'

export const runtime = 'edge'
export const alt = 'OnSite Club Product'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  const name = product?.name || 'OnSite Club'

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
        <div style={{ color: '#B8860B', fontSize: 28, fontWeight: 400, marginBottom: 16 }}>
          OnSite Club
        </div>
        <div style={{ color: '#ffffff', fontSize: 56, fontWeight: 700, textAlign: 'center' }}>
          {name}
        </div>
        <div style={{ color: '#9FE1CB', fontSize: 22, marginTop: 20 }}>
          Construction Worker Apparel · Canada
        </div>
      </div>
    ),
    { ...size }
  )
}
