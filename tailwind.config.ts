import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // New OnSite Shop Design System
        amber: {
          DEFAULT: '#F7B324',
          dark: '#C58B1B',
          light: '#FFF8E8',
        },
        charcoal: {
          DEFAULT: '#2C2C2C',
          deep: '#1A1A1A',
          light: '#3D3D3D',
        },
        'off-white': '#F7F6F3',
        warm: {
          100: '#EDECE8',
          200: '#DEDCD6',
          300: '#C5C3BC',
          400: '#9C9A93',
          500: '#7A7870',
          600: '#5C5A53',
        },
        'text-primary': '#1A1A18',
        'text-secondary': '#6B6960',
        // Legacy colors (kept for login/checkout pages)
        onsite: {
          primary: '#1B2B27',
          light: '#FBFAFC',
          amber: '#F6C343',
          accent: '#F6C343',
        },
        grain: {
          light: '#D8D4C8',
          mid: '#C9C4B5',
          dark: '#B8B3A4',
        },
      },
      fontFamily: {
        display: ['Montserrat', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        // Legacy font for admin pages
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'marquee': 'marquee 25s linear infinite',
        'float-slow': 'float 20s ease-in-out infinite',
        'float-medium': 'float 15s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
