import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { ThemeBrowsePage } from '@/components/explore/ThemeBrowsePage'
import { CountryBrowsePage } from '@/components/explore/CountryBrowsePage'
import { FlightTimeSelector } from '@/components/explore/FlightTimeSelector'
import { StructuredData } from '@/components/SEO/StructuredData'
import { getThemeInfo } from '@/lib/seo/generateMetadata'
import { generateBreadcrumbStructuredData } from '@/lib/seo/generateStructuredData'
import { getFilteredCountryDestinations } from '@/app/actions/country-destinations'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const THEMES = ['adventure', 'nature', 'vibe', 'indulge', 'discover'] as const
const TIME_RANGES = {
  weekend: { label: 'Weekend Getaways', subtitle: '2-4 hours', min: 2, max: 4, range: '2-4' },
  week: { label: 'Week Trips', subtitle: '4-8 hours', min: 4, max: 8, range: '4-8' },
  'long-haul': { label: 'Long Haul Adventures', subtitle: '8+ hours', min: 8, max: 16, range: '8-16' }
} as const

type TimeRangeKey = keyof typeof TIME_RANGES

// ISR: Revalidate every 30 minutes (destination data changes occasionally)
export const revalidate = 1800

/**
 * Generate static params for explore pages
 */
export async function generateStaticParams() {
  const params: Array<{ slug: string }> = []

  // Theme pages
  THEMES.forEach(theme => {
    params.push({ slug: theme })
  })

  // Time range pages
  Object.keys(TIME_RANGES).forEach(range => {
    params.push({ slug: range })
  })

  // Country pages - fetch all countries from database
  const countries = await db.country.findMany({
    select: {
      code: true
    }
  })

  countries.forEach(country => {
    params.push({ slug: country.code.toLowerCase() })
  })

  return params
}

/**
 * Generate metadata
 */
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params

  // Check if it's a country code
  if (slug.length === 2 && /^[a-z]{2}$/i.test(slug)) {
    const countryCode = slug.toUpperCase()
    const country = await db.country.findUnique({
      where: { code: countryCode },
      include: {
        destinations: {
          select: { id: true }
        }
      }
    })

    if (country) {
      const destCount = country.destinations.length
      return {
        title: `Explore ${country.name} - ${destCount} Destination${destCount !== 1 ? 's' : ''} | Spontra`,
        description: `Discover amazing travel destinations across ${country.name}. Browse ${destCount} cities and experiences, find flights, hotels, and plan your perfect trip.`,
        keywords: `${country.name} travel, ${country.name} destinations, ${country.name} vacations, ${country.name} trips, ${country.name} cities`,
        openGraph: {
          title: `Explore ${country.name} | Spontra`,
          description: `Discover ${destCount} amazing destinations in ${country.name}`,
          type: 'website',
        }
      }
    }
  }

  // Check if it's a theme
  if (THEMES.includes(slug as any)) {
    const themeInfo = getThemeInfo(slug)
    return {
      title: `${themeInfo.label} Destinations - Explore ${themeInfo.label} Travel | Spontra`,
      description: `${themeInfo.tagline}. Discover the world's best ${themeInfo.label.toLowerCase()} destinations. ${themeInfo.description}`,
      keywords: `${slug} travel, ${slug} destinations, ${slug} vacations, ${slug} trips`,
      openGraph: {
        title: `${themeInfo.label} Destinations | Spontra`,
        description: themeInfo.tagline,
        type: 'website',
      }
    }
  }

  // Check if it's a time range
  if (slug in TIME_RANGES) {
    const timeInfo = TIME_RANGES[slug as TimeRangeKey]
    return {
      title: `${timeInfo.label} - ${timeInfo.subtitle} from anywhere | Spontra`,
      description: `Find perfect ${timeInfo.subtitle} flight destinations from your city. Browse ${timeInfo.label.toLowerCase()} around the world.`,
      keywords: `${timeInfo.subtitle} flights, ${slug} getaways, short haul travel, flight time search`,
      openGraph: {
        title: `${timeInfo.label} | Spontra`,
        description: `${timeInfo.subtitle} from anywhere`,
        type: 'website',
      }
    }
  }

  return {
    title: 'Explore Destinations | Spontra',
    description: 'Discover your next adventure'
  }
}

/**
 * Main Explore Page Component
 */
export default async function ExplorePage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const search = await searchParams

  // Handle country browsing (2-letter country codes like "us", "fr", "jp")
  if (slug.length === 2 && /^[a-z]{2}$/i.test(slug)) {
    const countryCode = slug.toUpperCase()

    // Check if we have search context
    const hasSearchContext = search?.from && search?.theme
    let searchContext = undefined

    if (hasSearchContext) {
      searchContext = {
        originAirport: String(search.from),
        theme: String(search.theme),
        minFlightTime: search.minTime ? parseInt(String(search.minTime)) : 2,
        maxFlightTime: search.maxTime ? parseInt(String(search.maxTime)) : 8,
        departureDate: search.departure ? String(search.departure) : '',
        returnDate: search.return ? String(search.return) : '',
        passengers: search.passengers ? parseInt(String(search.passengers)) : 1
      }
    }

    // Fetch country data
    const country = await db.country.findUnique({
      where: { code: countryCode }
    })

    if (!country) {
      notFound()
    }

    // Get destinations - filtered by search context if available
    const destinations = hasSearchContext && searchContext
      ? await getFilteredCountryDestinations(countryCode, searchContext)
      : await db.destination.findMany({
          where: {
            countryId: country.id
          },
          include: {
            themePOIs: {
              orderBy: { createdAt: 'desc' },
              take: 5,
              select: { theme: true }
            },
            airports: {
              orderBy: { isPrimary: 'desc' },
              select: {
                airportCode: true,
                isPrimary: true
              }
            }
          },
          orderBy: {
            popularityScore: 'desc'
          }
        })

    // Breadcrumb structured data
    const breadcrumbData = generateBreadcrumbStructuredData([
      { name: 'Home', url: '/' },
      { name: 'Explore', url: '/explore' },
      { name: country.name, url: `/explore/${slug}` }
    ])

    return (
      <>
        <StructuredData data={breadcrumbData} />
        <CountryBrowsePage
          country={{
            ...country,
            destinations: destinations as any
          }}
          searchContext={searchContext}
        />
      </>
    )
  }

  // Handle theme browsing
  if (THEMES.includes(slug as any)) {
    const theme = slug as typeof THEMES[number]
    const themeInfo = getThemeInfo(theme)

    // Get all destinations with POIs for this theme
    const destinations = await db.destination.findMany({
      where: {
        themePOIs: {
          some: {
            theme
          }
        }
      },
      include: {
        country: true,
        themePOIs: {
          where: { theme },
          take: 1
        }
      },
      orderBy: {
        popularityScore: 'desc'
      },
      take: 100 // Limit for performance
    })

    // Group by country
    const destinationsByCountry = new Map<string, any[]>()

    for (const dest of destinations) {
      const countryName = dest.country?.name || dest.countryName || 'Unknown'
      if (!destinationsByCountry.has(countryName)) {
        destinationsByCountry.set(countryName, [])
      }
      destinationsByCountry.get(countryName)!.push({
        id: dest.id,
        cityName: dest.cityName,
        airportCode: dest.airportCode,
        imageUrl: dest.imageUrl,
        description: dest.description,
        slug: dest.slug || slugify(dest.cityName),
        country: {
          name: countryName,
          code: dest.country?.code || 'XX'
        }
      })
    }

    const countryGroups = Array.from(destinationsByCountry.entries()).map(([countryName, dests]) => ({
      country: {
        name: countryName,
        code: dests[0].country.code
      },
      destinations: dests
    }))

    // Breadcrumb structured data
    const breadcrumbData = generateBreadcrumbStructuredData([
      { name: 'Home', url: '/' },
      { name: 'Explore', url: '/explore' },
      { name: themeInfo.label, url: `/explore/${theme}` }
    ])

    return (
      <>
        <StructuredData data={breadcrumbData} />
        <ThemeBrowsePage
          theme={theme}
          countryGroups={countryGroups}
          totalDestinations={destinations.length}
        />
      </>
    )
  }

  // Handle flight time selection
  if (slug in TIME_RANGES) {
    const timeInfo = TIME_RANGES[slug as TimeRangeKey]

    // Get popular airports for selection
    const airports = await db.airport.findMany({
      where: {
        isActive: true,
        originFlights: {
          some: {}
        }
      },
      select: {
        iataCode: true,
        name: true,
        city: true,
        country: true
      },
      take: 50,
      orderBy: {
        name: 'asc'
      }
    })

    // Breadcrumb structured data
    const breadcrumbData = generateBreadcrumbStructuredData([
      { name: 'Home', url: '/' },
      { name: 'Explore', url: '/explore' },
      { name: timeInfo.label, url: `/explore/${slug}` }
    ])

    return (
      <>
        <StructuredData data={breadcrumbData} />
        <FlightTimeSelector
          timeRange={slug as TimeRangeKey}
          timeInfo={timeInfo}
          airports={airports}
        />
      </>
    )
  }

  // Invalid slug
  notFound()
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
