import type { Metadata, Viewport } from 'next'
import { Playfair_Display } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Core English — Монгол хэлтнүүдэд зориулсан AI Англи хэлний сургалт',
  description: 'A1-аас C1 хүртэл AI тутортой англи хэл сур',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  interactiveWidget: 'resizes-content',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn" className={playfair.variable}>
      <body className="min-h-dvh bg-navy text-text-primary">
        <div className="page-enter">
          {children}
        </div>
      </body>
    </html>
  )
}
