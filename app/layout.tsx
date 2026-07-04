import type { Metadata, Viewport } from 'next'
import { Montserrat, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import CookieBanner from '@/components/CookieBanner'
import ComplianceFooter from '@/components/ComplianceFooter'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#10b981',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'NOTSPAM.uk — Privacy-First Temporary Email Clean Room',
  description:
    'Instant, anonymous, disposable email addresses. Zero data storage. Zero tracking. 100% client-side. Shield your real inbox.',
  keywords: ['temporary email', 'disposable email', 'privacy', 'anonymous email', 'spam protection'],
  robots: { index: false, follow: false },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NOTSPAM.uk',
  },
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: [{ url: '/icons/favicon.ico' }],
  },
  openGraph: {
    title: 'NOTSPAM.uk — Verified Zero-Server Email Clean Room',
    description: 'Ephemeral inboxes that protect your real email. Zero server. Zero surveillance.',
    url: 'https://notspam.uk',
    siteName: 'NOTSPAM.uk',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body
        style={{ fontFamily: 'var(--font-inter), sans-serif' }}
        className="bg-[--color-bg-base] text-[--color-text-primary] flex flex-col min-h-screen"
      >
        <ServiceWorkerRegistrar />
        <main className="flex-1">
          {children}
        </main>
        <ComplianceFooter />
        <CookieBanner />
      </body>
    </html>
  )
}
