import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Terra Atlas - The Planetary Nervous System',
  description: 'Real-time planetary intelligence platform for climate monitoring and renewable energy coordination',
  keywords: 'climate, energy, renewable, monitoring, data, visualization, terra atlas',
  authors: [{ name: 'Terra Atlas Team' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Terra Atlas',
  },
  openGraph: {
    title: 'Terra Atlas - The Planetary Nervous System',
    description: 'Real-time planetary intelligence platform',
    url: 'https://terra-atlas.earth',
    siteName: 'Terra Atlas',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terra Atlas',
    description: 'The Planetary Nervous System',
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
      <body className={inter.className}>{children}</body>
    </html>
  )
}