import type { Metadata } from 'next'
import { Inter, Mulish } from 'next/font/google'
import { ErrorBoundary } from '../components/ErrorBoundary'
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
        <ErrorBoundary 
          onError={(error, errorInfo) => {
            // Log errors to console in production for debugging
            console.error('React Error Boundary caught:', error, errorInfo)
            
            // In a real app, you might want to send this to an error reporting service
            // like Sentry, LogRocket, or Bugsnag
            if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
              console.log('Error in production build - this would be sent to error reporting service')
            }
          }}
        >
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}