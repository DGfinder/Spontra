import type { Metadata } from 'next'
import { Inter, Mulish } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const mulish = Mulish({ 
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-muli',
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'Spontra - Flight Comparison Platform',
  description: 'Find and compare the best flight deals across multiple airlines and booking platforms.',
  keywords: 'flights, travel, booking, comparison, cheap flights, airline tickets',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} ${mulish.variable} h-full`}>
        {children}
      </body>
    </html>
  )
}