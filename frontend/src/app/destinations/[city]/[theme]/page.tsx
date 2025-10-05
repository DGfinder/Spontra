import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { DestinationDetail } from '@/components/DestinationDetail'
import { StructuredData } from '@/components/SEO/StructuredData'
import {
  generateThemeDestinationMetadata,
  getThemeInfo
} from '@/lib/seo/generateMetadata'
import {
  generateThemeDestinationStructuredData,
  generateBreadcrumbStructuredData
} from '@/lib/seo/generateStructuredData'

interface PageProps {
  params: Promise<{ city: string; theme: string }>
  searchParams: Promise<{ from?: string }>
}

const VALID_THEMES = ['adventure', 'nature', 'vibe', 'indulge', 'discover']

/**
 * Generate static params for all destination/theme combinations
 * This creates 2,500+ static pages at build time for programmatic SEO
 */
export async function generateStaticParams() {
  // Fetch all destinations with slugs
  const destinations = await db.destination.findMany({
    where: {
      slug: { not: null }
    },
    select: {
      slug: true,
      cityName: true
    },
    take: 500 // Limit for initial launch, increase as database grows
  })

  // Generate params for each destination × theme combination
  const params: Array<{ city: string; theme: string }> = []

  for (const dest of destinations) {
    for (const theme of VALID_THEMES) {
      params.push({
        city: dest.slug || slugify(dest.cityName),
        theme
      })
    }
  }

  console.log(`[generateStaticParams] Generated ${params.length} theme destination pages`)

  return params
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: PageProps) {
  const { city, theme } = await params

  // Validate theme
  if (!VALID_THEMES.includes(theme)) {
    return {
      title: 'Page Not Found',
      description: 'The requested page could not be found.'
    }
  }

  // Find destination by slug
  const destination = await db.destination.findFirst({
    where: {
      OR: [
        { slug: city },
        { cityName: { equals: city, mode: 'insensitive' } }
      ]
    },
    include: {
      country: true
    }
  })

  if (!destination) {
    return {
      title: 'Destination Not Found',
      description: 'The requested destination could not be found.'
    }
  }

  return generateThemeDestinationMetadata({
    cityName: destination.cityName,
    countryName: destination.country?.name || destination.countryName,
    description: destination.description,
    imageUrl: destination.imageUrl,
    theme,
    metaTitle: destination.metaTitle,
    metaDescription: destination.metaDescription
  })
}

/**
 * Page Component
 */
export default async function ThemeDestinationPage({ params, searchParams }: PageProps) {
  const { city, theme } = await params
  const { from } = await searchParams

  // Validate theme
  if (!VALID_THEMES.includes(theme)) {
    notFound()
  }

  // Find destination by slug or city name
  const destination = await db.destination.findFirst({
    where: {
      OR: [
        { slug: city },
        { cityName: { equals: city, mode: 'insensitive' } }
      ]
    },
    include: {
      country: true,
      themePOIs: {
        where: { theme },
        include: {
          videos: {
            orderBy: { displayOrder: 'asc' }
          }
        },
        orderBy: { displayOrder: 'asc' }
      }
    }
  })

  if (!destination) {
    notFound()
  }

  // Serialize for client components
  const serializedDestination = {
    id: destination.id,
    airportCode: destination.airportCode,
    cityName: destination.cityName,
    countryName: destination.country?.name || destination.countryName,
    countryId: destination.countryId,
    description: destination.description,
    imageUrl: destination.imageUrl,
    popularityScore: destination.popularityScore ? Number(destination.popularityScore) : null,
    createdAt: destination.createdAt.toISOString(),
    updatedAt: destination.updatedAt.toISOString(),
    country: destination.country ? {
      id: destination.country.id,
      name: destination.country.name,
      code: destination.country.code,
      createdAt: destination.country.createdAt.toISOString(),
      updatedAt: destination.country.updatedAt.toISOString()
    } : null,
    themePOIs: destination.themePOIs.map(poi => ({
      id: poi.id,
      destinationId: poi.destinationId,
      theme: poi.theme,
      name: poi.name,
      description: poi.description,
      videoUrl: poi.videoUrl,
      displayOrder: poi.displayOrder,
      latitude: poi.latitude ? Number(poi.latitude) : null,
      longitude: poi.longitude ? Number(poi.longitude) : null,
      caption: poi.caption,
      altText: poi.altText,
      instagramUrl: poi.instagramUrl,
      createdAt: poi.createdAt.toISOString(),
      updatedAt: poi.updatedAt.toISOString(),
      videos: poi.videos.map(video => ({
        id: video.id,
        poiId: video.poiId,
        videoUrl: video.videoUrl,
        displayOrder: video.displayOrder,
        createdAt: video.createdAt.toISOString()
      }))
    }))
  }

  // Generate structured data for SEO
  const destinationStructuredData = generateThemeDestinationStructuredData({
    cityName: destination.cityName,
    countryName: destination.country?.name || destination.countryName,
    description: destination.description,
    imageUrl: destination.imageUrl,
    theme,
    themePOIs: destination.themePOIs.map(poi => ({
      id: poi.id,
      name: poi.name,
      description: poi.description,
      latitude: poi.latitude ? Number(poi.latitude) : null,
      longitude: poi.longitude ? Number(poi.longitude) : null,
      videos: poi.videos
    }))
  })

  const breadcrumbStructuredData = generateBreadcrumbStructuredData([
    { name: 'Home', url: '/' },
    { name: 'Destinations', url: '/destinations' },
    { name: destination.cityName, url: `/destinations/${city}` },
    { name: getThemeInfo(theme).label, url: `/destinations/${city}/${theme}` }
  ])

  return (
    <>
      {/* Structured Data for SEO */}
      <StructuredData data={[destinationStructuredData, breadcrumbStructuredData]} />

      {/* Main Content */}
      <DestinationDetail
        destination={serializedDestination}
        originAirport={from}
        selectedTheme={theme}
      />
    </>
  )
}

/**
 * Helper: Convert city name to URL slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/--+/g, '-')      // Replace multiple hyphens with single
    .trim()
}
