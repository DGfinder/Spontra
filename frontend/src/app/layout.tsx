import type { Metadata } from 'next'
import { Instrument_Serif, DM_Sans } from 'next/font/google'
import { ClientProviders } from './ClientProviders'
import './globals.css'

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Spontra — Explore Destinations',
  description: 'Discover your next trip based on how you want to feel.',
  other: {
    // iOS Smart App Banner — update app-id once App Store listing is live
    'apple-itunes-app': 'app-id=PLACEHOLDER, app-argument=spontra://',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${dmSans.variable} ${instrumentSerif.variable} h-full`}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}
