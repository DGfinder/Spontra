import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { CountryGrid } from '@/components/CountryGrid'
import { StructuredData } from '@/components/SEO/StructuredData'
import { generateTimeBasedSearchMetadata, getThemeInfo } from '@/lib/seo/generateMetadata'
import { generateBreadcrumbStructuredData } from '@/lib/seo/generateStructuredData'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ origin: string; flightTime: string; theme: string }>
  searchParams: Promise<Record<string, string>>
}

const VALID_THEMES = ['adventure', 'nature', 'vibe', 'indulge', 'discover']
const VALID_TIME_RANGES = ['2-4', '4-6', '6-8', '8-10', '10-12']

/**
 * Generate static params for popular time-based searches
 * Start with major airports and expand over time
 */
export async function generateStaticParams() {
  // Popular origin airports (top 50 to start)
  const popularOrigins = ['LAX', 'JFK', 'LHR', 'SYD', 'CDG', 'DXB', 'SIN', 'HKG', 'NRT', 'FRA']

  const params: Array<{ origin: string; flightTime: string; theme: string }> = []

  for (const origin of popularOrigins) {
    for (const timeRange of VALID_TIME_RANGES) {
      for (const theme of VALID_THEMES) {
        params.push({ origin, flightTime: timeRange, theme })
      }
    }
  }

  console.log(`[generateStaticParams] Generated ${params.length} time-based search pages`)

  return params
}

/**
 * Generate metadata for time-based search pages
 */
export async function generateMetadata({ params }: PageProps) {
  const { origin, flightTime, theme } = await params

  return generateTimeBasedSearchMetadata({
    origin: origin.toUpperCase(),
    flightTime,
    theme
  })
}

/**
 * Page Component
 */
export default async function TimeBasedSearchPage({ params }: PageProps) {
  const { origin, flightTime, theme } = await params

  // Validate inputs
  if (!VALID_THEMES.includes(theme)) {
    notFound()
  }

  if (!VALID_TIME_RANGES.includes(flightTime)) {
    notFound()
  }

  const originCode = origin.toUpperCase()

  // Validate origin airport exists
  const originAirport = await db.airport.findUnique({
    where: { iataCode: originCode }
  })

  if (!originAirport) {
    notFound()
  }

  // Parse flight time range
  const [minHours, maxHours] = flightTime.split('-').map(Number)
  const minMinutes = minHours * 60
  const maxMinutes = maxHours * 60

  // Find destinations within flight time range
  const routes = await db.flightRoute.findMany({
    where: {
      originAirportCode: originCode,
      totalDurationMinutes: {
        gte: minMinutes,
        lte: maxMinutes
      }
    },
    include: {
      destinationAirport: {
        include: {
          destinations: {
            include: {
              country: true,
              themePOIs: {
                where: { theme },
                take: 1 // Just check if any exist
              }
            }
          }
        }
      }
    },
    orderBy: {
      totalDurationMinutes: 'asc'
    }
  })

  // Group destinations by country
  const destinationsByCountry = new Map<string, any[]>()

  for (const route of routes) {
    for (const destination of route.destinationAirport.destinations) {
      // Only include destinations that have POIs for this theme
      if (destination.themePOIs.length === 0) continue

      const countryName = destination.country?.name || destination.countryName
      const countryCode = destination.country?.code || destination.countryCode || 'XX'

      if (!destinationsByCountry.has(countryName)) {
        destinationsByCountry.set(countryName, [])
      }

      destinationsByCountry.get(countryName)!.push({
        id: destination.id,
        cityName: destination.cityName,
        airportCode: destination.airportCode,
        imageUrl: destination.imageUrl,
        description: destination.description,
        slug: destination.slug || slugify(destination.cityName),
        flightDuration: route.totalDurationMinutes,
        country: {
          name: countryName,
          code: countryCode
        }
      })
    }
  }

  // Convert to array format for CountryGrid
  const countryGroups = Array.from(destinationsByCountry.entries()).map(([countryName, destinations]) => ({
    country: {
      name: countryName,
      code: destinations[0].country.code
    },
    destinations: destinations.sort((a, b) => a.flightDuration - b.flightDuration)
  }))

  // Structured data for SEO
  const breadcrumbStructuredData = generateBreadcrumbStructuredData([
    { name: 'Home', url: '/' },
    { name: 'Search by Flight Time', url: '/from' },
    { name: originCode, url: `/from/${originCode}` },
    { name: `${flightTime} hours`, url: `/from/${originCode}/${flightTime}` },
    { name: getThemeInfo(theme).label, url: `/from/${originCode}/${flightTime}/${theme}` }
  ])

  const themeInfo = getThemeInfo(theme)

  return (
    <>
      {/* Structured Data */}
      <StructuredData data={breadcrumbStructuredData} />

      {/* Page Content */}
      <div className="min-h-screen bg-gradient-to-br from-brand-purple via-brand-purple to-brand-blue">
        {/* Header */}
        <header className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Search
            </Link>

            <h1 className="text-4xl font-bold text-white mb-2">
              {themeInfo.label} Destinations
            </h1>
            <p className="text-xl text-white/80">
              {flightTime.split('-').join('-')} hours from {originAirport.city} ({originCode})
            </p>
            <p className="text-white/60 mt-2">
              {themeInfo.tagline} • {countryGroups.length} {countryGroups.length === 1 ? 'country' : 'countries'} • {
                countryGroups.reduce((sum, group) => sum + group.destinations.length, 0)
              } destinations
            </p>
          </div>
        </header>

        {/* Results */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          {countryGroups.length > 0 ? (
            <CountryGrid
              countryGroups={countryGroups}
              theme={theme}
              originAirport={originCode}
            />
          ) : (
            <div className="text-center py-16">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 max-w-md mx-auto">
                <h2 className="text-xl font-semibold text-white mb-4">
                  No {themeInfo.label.toLowerCase()} destinations found
                </h2>
                <p className="text-white/70 mb-6">
                  We couldn't find any {themeInfo.label.toLowerCase()} destinations {flightTime} hours from {originCode}.
                  Try a different time range or theme.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-brand-purple rounded-full font-semibold hover:bg-white/90 transition-colors"
                >
                  New Search
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  )
}

/**
 * Helper: Convert text to URL slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim()
}
