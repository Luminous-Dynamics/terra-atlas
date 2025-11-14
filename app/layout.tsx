import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { WebVitals } from './web-vitals'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Terra Atlas - Global Energy Investment Platform',
    template: '%s | Terra Atlas'
  },
  description: 'Democratizing energy investment with 79,000+ projects worldwide. Invest from $1,000 in solar, wind, hydro, and renewable energy projects. Track performance, manage portfolios, and support sustainable energy.',
  keywords: [
    'energy investment',
    'renewable energy',
    'solar investment',
    'wind power investment',
    'sustainable investing',
    'climate finance',
    'green energy',
    'clean energy projects',
    'renewable energy platform',
    'impact investing',
    'ESG investing',
    'project financing'
  ],
  authors: [{ name: 'Luminous Dynamics', url: 'https://luminousdynamics.io' }],
  creator: 'Luminous Dynamics',
  publisher: 'Terra Atlas',
  applicationName: 'Terra Atlas',
  category: 'Finance',
  manifest: '/manifest.json',
  metadataBase: new URL('https://terra-atlas.earth'),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Terra Atlas',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://terra-atlas.earth',
    siteName: 'Terra Atlas',
    title: 'Terra Atlas - Global Renewable Energy Investment Platform',
    description: 'Invest in the energy revolution. 79,000+ renewable energy projects worldwide. Starting at $1,000. Solar, wind, hydro, and more.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Terra Atlas - Global Energy Investment Platform',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@TerraAtlas',
    creator: '@LuminousDynamics',
    title: 'Terra Atlas - Global Energy Investment Platform',
    description: '79,000+ renewable energy projects. Invest from $1,000. Solar, wind, hydro & more.',
    images: ['/twitter-card.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#030712',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={inter.className}>
        <WebVitals />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}