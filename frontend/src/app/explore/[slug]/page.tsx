import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { ThemeBrowsePage } from '@/components/explore/ThemeBrowsePage'
import { FlightTimeSelector } from '@/components/explore/FlightTimeSelector'
import { StructuredData } from '@/components/SEO/StructuredData'
import { getThemeInfo } from '@/lib/seo/generateMetadata'
import { generateBreadcrumbStructuredData } from '@/lib/seo/generateStructuredData'

interface PageProps {
  params: Promise<{ slug: string }>
}

const THEMES = ['adventure', 'nature', 'vibe', 'indulge', 'discover'] as const
const TIME_RANGES = {
  weekend: { label: 'Weekend Getaways', subtitle: '2-4 hours', min: 2, max: 4, range: '2-4' },
  week: { label: 'Week Trips', subtitle: '4-8 hours', min: 4, max: 8, range: '4-8' },
  'long-haul': { label: 'Long Haul Adventures', subtitle: '8+ hours', min: 8, max: 16, range: '8-16' }
} as const

type TimeRangeKey = keyof typeof TIME_RANGES

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

  return params
}

/**
 * Generate metadata
 */
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params

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
export default async function ExplorePage({ params }: PageProps) {
  const { slug } = await params

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
          code: dest.country?.code || dest.countryCode || 'XX'
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
