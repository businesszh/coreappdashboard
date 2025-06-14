import './globals.css'
import { Inter } from 'next/font/google'
import { Layout } from '@/components/Layout'
import { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Core App Dashboard',
    template: '%s | Core App Dashboard'
  },
  description: 'Core App Dashboard - A powerful dashboard solution built with Next.js',
  keywords: 'dashboard, next.js, web application, management tools, admin panel',
  authors: [{ name: 'Core App Dashboard Team' }],
  creator: 'Core App Dashboard',
  publisher: 'Core App Dashboard',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://coreappdashboard.net'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://coreappdashboard.net',
    title: 'Core App Dashboard',
    description: 'A powerful dashboard solution built with Next.js',
    siteName: 'Core App Dashboard',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Core App Dashboard Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Core App Dashboard',
    description: 'A powerful dashboard solution built with Next.js',
    images: ['/twitter-image.jpg'],
    creator: '@coreappdashboard',
    site: '@coreappdashboard',
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
  verification: {
    google: 'google-site-verification=your-google-verification-code',
    yandex: 'yandex-verification=your-yandex-verification-code',
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Layout>{children}</Layout>
      </body>
    </html>
  )
}