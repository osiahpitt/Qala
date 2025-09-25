import type { Metadata } from 'next'
import { Geist, Geist_Mono, Roboto } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/lib/query-client'
import { AuthProvider } from '@/contexts/AuthContext'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const roboto = Roboto({
  variable: '--font-roboto',
  weight: ['300', '400', '700'],
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'QALA - Language Exchange Platform',
  description:
    'Connect with native speakers worldwide. Practice languages through video calls with real-time translation support.',
  keywords: [
    'language exchange',
    'language learning',
    'video chat',
    'native speakers',
    'practice',
    'conversation',
  ],
  authors: [{ name: 'QALA Team' }],
  openGraph: {
    title: 'QALA - Language Exchange Platform',
    description:
      'Connect with native speakers worldwide. Practice languages through video calls with real-time translation support.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QALA - Language Exchange Platform',
    description:
      'Connect with native speakers worldwide. Practice languages through video calls with real-time translation support.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${roboto.variable} antialiased`}>
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
