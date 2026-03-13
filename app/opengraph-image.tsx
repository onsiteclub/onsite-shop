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
        <div style={{ color: '#B8860B', fontSize: 72, fontWeight: 700 }}>
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
