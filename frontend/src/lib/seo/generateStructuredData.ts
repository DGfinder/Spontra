import type { Thing, WithContext } from 'schema-dts'

interface DestinationData {
  cityName: string
  countryName?: string | null
  description?: string | null
  imageUrl?: string | null
  latitude?: number | null
  longitude?: number | null
}

interface ThemeDestinationData extends DestinationData {
  theme: string
  themePOIs?: Array<{
    id: string
    name: string
    description?: string | null
    latitude?: number | null
    longitude?: number | null
    videos?: Array<{
      videoUrl: string
    }>
  }>
}

interface VideoData {
  videoUrl: string
  poiName: string
  caption?: string | null
  thumbnailUrl?: string | null
}

/**
 * Generate TravelDestination schema.org structured data
 */
export function generateDestinationStructuredData(
  data: DestinationData
): WithContext<Thing> {
  const locationName = data.countryName ? `${data.cityName}, ${data.countryName}` : data.cityName

  const base: any = {
    '@context': 'https://schema.org',
    '@type': 'TravelDestination',
    name: data.cityName,
    description: data.description || `Travel guide for ${locationName}`,
    ...(data.imageUrl && {
      image: {
        '@type': 'ImageObject',
        url: data.imageUrl,
        caption: locationName
      }
    }),
    ...(data.latitude && data.longitude && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: data.latitude,
        longitude: data.longitude
      }
    })
  }

  return base as WithContext<Thing>
}

/**
 * Generate theme-specific destination structured data with activities
 */
export function generateThemeDestinationStructuredData(
  data: ThemeDestinationData
): WithContext<Thing> {
  const locationName = data.countryName ? `${data.cityName}, ${data.countryName}` : data.cityName

  const base: any = {
    '@context': 'https://schema.org',
    '@type': 'TravelDestination',
    name: `${data.cityName} - ${capitalizeFirst(data.theme)}`,
    description: data.description || `${capitalizeFirst(data.theme)} experiences in ${locationName}`,
    ...(data.imageUrl && {
      image: {
        '@type': 'ImageObject',
        url: data.imageUrl,
        caption: `${data.cityName} ${capitalizeFirst(data.theme)}`
      }
    }),
    ...(data.latitude && data.longitude && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: data.latitude,
        longitude: data.longitude
      }
    })
  }

  // Add POIs as itinerary items
  if (data.themePOIs && data.themePOIs.length > 0) {
    base.hasOfferCatalog = {
      '@type': 'OfferCatalog',
      name: `${capitalizeFirst(data.theme)} Activities in ${data.cityName}`,
      itemListElement: data.themePOIs.map((poi, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'TouristAttraction',
          name: poi.name,
          ...(poi.description && { description: poi.description }),
          ...(poi.latitude && poi.longitude && {
            geo: {
              '@type': 'GeoCoordinates',
              latitude: poi.latitude,
              longitude: poi.longitude
            }
          })
        }
      }))
    }
  }

  return base as WithContext<Thing>
}

/**
 * Generate VideoObject schema for YouTube videos
 */
export function generateVideoStructuredData(data: VideoData): WithContext<Thing> {
  const videoId = extractYouTubeId(data.videoUrl)

  if (!videoId) {
    return {} as WithContext<Thing>
  }

  const thumbnailUrl = data.thumbnailUrl ||
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

  const base: any = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: data.caption || `${data.poiName} Video`,
    description: data.caption || `Experience ${data.poiName} through this traveler video`,
    thumbnailUrl: [thumbnailUrl],
    contentUrl: data.videoUrl,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    uploadDate: new Date().toISOString(), // Would ideally come from YouTube API
    ...(data.caption && { caption: data.caption })
  }

  return base as WithContext<Thing>
}

/**
 * Generate BreadcrumbList schema for navigation
 */
export function generateBreadcrumbStructuredData(items: Array<{
  name: string
  url: string
}>): WithContext<Thing> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://spontra.com${item.url}`
    }))
  } as WithContext<Thing>
}

/**
 * Generate FAQPage schema for SEO
 */
export function generateFAQStructuredData(faqs: Array<{
  question: string
  answer: string
}>): WithContext<Thing> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  } as WithContext<Thing>
}

/**
 * Helper: Extract YouTube video ID from URL
 */
function extractYouTubeId(url: string): string | null {
  if (!url) return null

  // Handle different YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * Helper: Capitalize first letter
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
