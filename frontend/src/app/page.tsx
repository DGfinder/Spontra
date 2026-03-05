import { Suspense } from 'react'
import { LandingPageFormModern } from '@/components/LandingPageFormModern'
import { cacheGet } from '@/lib/cacheServer'
import { config } from '@/lib/config'
import type { Metadata } from 'next'

// Force dynamic rendering - page has client interactivity
export const dynamic = 'force-dynamic'

// Enhanced metadata with dynamic content
export async function generateMetadata(): Promise<Metadata> {
  // Fetch dynamic data for SEO optimization
  const baseMetadata = {
    title: 'Spontra - AI-Powered Flight Discovery',
    description: 'Discover amazing destinations with AI-powered flight search. Compare deals across multiple airlines and find your perfect getaway.',
    keywords: 'flights, travel, booking, AI travel, destination discovery, cheap flights, airline tickets',
    openGraph: {
      title: 'Spontra - AI-Powered Flight Discovery',
      description: 'Discover amazing destinations with AI-powered flight search',
      type: 'website' as const,
      siteName: 'Spontra',
      url: config.appUrl,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: 'Spontra - AI-Powered Flight Discovery',
      description: 'Discover amazing destinations with AI-powered flight search',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large' as const,
        'max-snippet': -1,
      },
    },
  }

  try {
    // Try to get popular destinations for enhanced SEO
    const popularDestinations = await cacheGet('popular-destinations').catch(() => null)
    if (popularDestinations) {
      const destinations = JSON.parse(popularDestinations)
      const destinationNames = destinations.slice(0, 5).map((d: any) => d.city_name).join(', ')
      
      return {
        ...baseMetadata,
        description: `Discover amazing destinations like ${destinationNames} with AI-powered flight search. Compare deals across multiple airlines.`,
        keywords: `${baseMetadata.keywords}, ${destinationNames.toLowerCase()}`,
      }
    }
  } catch (error) {
    console.warn('Failed to enhance metadata with dynamic content:', error)
  }

  return baseMetadata
}

// Async page component with enhanced Next.js 15 patterns
export default async function HomePage() {
  // Pre-fetch critical data server-side for better performance
  let initialData = null
  
  try {
    // Pre-load popular destinations for faster initial render
    const popularDestinationsRaw = await cacheGet('popular-destinations').catch(() => null)
    if (popularDestinationsRaw) {
      initialData = {
        popularDestinations: JSON.parse(popularDestinationsRaw).slice(0, 3)
      }
    }
  } catch (error) {
    console.warn('Failed to pre-fetch initial data:', error)
  }

  return (
    <main className="min-h-screen w-full overflow-hidden">
      {/* Enhanced error boundary with Suspense for better UX */}
      <Suspense 
        fallback={
          <div className="min-h-screen w-full bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin h-12 w-12 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
              <p className="text-white/80 text-lg font-muli">Loading your travel adventure...</p>
            </div>
          </div>
        }
      >
        {/* Modern React 19 Landing Page with Server Actions and RSC */}
        <LandingPageFormModern initialData={initialData} />
      </Suspense>
      
      {/* Structured data for better SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Spontra",
            "applicationCategory": "TravelApplication",
            "description": "AI-powered flight discovery and booking platform",
            "url": "https://spontra.com",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "category": "Travel Services",
              "description": "Flight search and booking services"
            },
            "featureList": [
              "AI-powered destination discovery",
              "Multi-airline flight comparison",
              "Theme-based travel search",
              "Real-time price comparison"
            ]
          })
        }}
      />
    </main>
  )
}