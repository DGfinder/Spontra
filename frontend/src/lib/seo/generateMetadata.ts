import type { Metadata } from 'next'
import { Compass, Trees, Wine, Music, Globe } from 'lucide-react'

interface DestinationMetadata {
  cityName: string
  countryName?: string | null
  description?: string | null
  imageUrl?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
}

interface ThemeMetadata extends DestinationMetadata {
  theme: string
  heroCaption?: string | null
}

export interface ThemeInfo {
  label: string
  tagline: string
  description: string
  color: string
  icon: any
}

const THEME_DATA: Record<string, ThemeInfo> = {
  adventure: {
    label: 'Adventure',
    tagline: 'Epic experiences for thrill-seekers',
    description: 'Hiking, surfing, skiing, skydiving & extreme sports',
    color: '#ffbd0a',
    icon: Compass
  },
  nature: {
    label: 'Nature',
    tagline: 'Breathtaking natural wonders',
    description: 'National parks, wildlife, mountains & pristine landscapes',
    color: '#02c06d',
    icon: Trees
  },
  indulge: {
    label: 'Indulge',
    tagline: 'Luxury & culinary excellence',
    description: 'Fine dining, wine tasting, spas & premium experiences',
    color: '#e52b00',
    icon: Wine
  },
  vibe: {
    label: 'Vibe',
    tagline: 'Nightlife & entertainment',
    description: 'Music festivals, bars, clubs & vibrant scenes',
    color: '#eb5b25',
    icon: Music
  },
  discover: {
    label: 'Discover',
    tagline: 'Culture & history awaits',
    description: 'Museums, historic sites, local traditions & cultural immersion',
    color: '#7f6ae4',
    icon: Globe
  }
}

/**
 * Generate metadata for destination pages
 */
export function generateDestinationMetadata(data: DestinationMetadata): Metadata {
  const title = data.metaTitle ||
    `${data.cityName} Travel Guide - Flights, Hotels & Things to Do | Spontra`

  const locationName = data.countryName ? `${data.cityName}, ${data.countryName}` : data.cityName

  const description = data.metaDescription ||
    data.description ||
    `Discover ${locationName}. Find cheap flights, explore activities, watch traveler videos. Plan your spontaneous trip with Spontra.`

  return {
    title,
    description: description.substring(0, 160), // Trim to SEO limit
    openGraph: {
      title,
      description: description.substring(0, 160),
      images: data.imageUrl ? [
        {
          url: data.imageUrl,
          width: 1200,
          height: 630,
          alt: locationName
        }
      ] : [],
      type: 'website',
      siteName: 'Spontra'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description.substring(0, 160),
      images: data.imageUrl ? [data.imageUrl] : []
    },
    alternates: {
      canonical: `/destinations/${data.cityName.toLowerCase().replace(/\s+/g, '-')}`
    }
  }
}

/**
 * Generate metadata for theme-specific destination pages
 */
export function generateThemeDestinationMetadata(data: ThemeMetadata): Metadata {
  const themeInfo = THEME_DATA[data.theme] || THEME_DATA.adventure
  const locationName = data.countryName ? `${data.cityName}, ${data.countryName}` : data.cityName

  const title = data.metaTitle ||
    `${data.cityName} ${themeInfo.label} - ${themeInfo.tagline} | Spontra`

  const description = data.metaDescription ||
    data.heroCaption ||
    `${data.cityName} ${themeInfo.label.toLowerCase()}: ${themeInfo.description}. Watch real traveler videos, find cheap flights, plan your ${data.theme} trip to ${data.cityName}.`

  return {
    title,
    description: description.substring(0, 160),
    openGraph: {
      title,
      description: description.substring(0, 160),
      images: data.imageUrl ? [
        {
          url: data.imageUrl,
          width: 1200,
          height: 630,
          alt: `${data.cityName} ${themeInfo.label} - ${locationName}`
        }
      ] : [],
      type: 'website',
      siteName: 'Spontra'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description.substring(0, 160),
      images: data.imageUrl ? [data.imageUrl] : []
    },
    alternates: {
      canonical: `/destinations/${data.cityName.toLowerCase().replace(/\s+/g, '-')}/${data.theme}`
    },
    keywords: [
      data.cityName,
      ...(data.countryName ? [data.countryName] : []),
      themeInfo.label.toLowerCase(),
      data.theme,
      'travel',
      'flights',
      'activities',
      'things to do'
    ]
  }
}

/**
 * Generate metadata for time-based search pages (unique Spontra feature)
 */
export function generateTimeBasedSearchMetadata(params: {
  origin: string
  flightTime: string
  theme: string
}): Metadata {
  const themeInfo = THEME_DATA[params.theme] || THEME_DATA.adventure
  const [min, max] = params.flightTime.split('-').map(Number)

  const timeText = min === max
    ? `${min} hour${min > 1 ? 's' : ''}`
    : `${min}-${max} hours`

  const title = `${themeInfo.label} Destinations ${timeText} from ${params.origin} | Spontra`
  const description = `Discover ${themeInfo.label.toLowerCase()} destinations within ${timeText} flight from ${params.origin}. ${themeInfo.tagline}. Find flights, watch videos, plan your spontaneous trip.`

  return {
    title,
    description: description.substring(0, 160),
    openGraph: {
      title,
      description: description.substring(0, 160),
      type: 'website',
      siteName: 'Spontra'
    },
    twitter: {
      card: 'summary',
      title,
      description: description.substring(0, 160)
    },
    alternates: {
      canonical: `/from/${params.origin.toLowerCase()}/${params.flightTime}/${params.theme}`
    },
    keywords: [
      params.origin,
      `${timeText} flight`,
      themeInfo.label.toLowerCase(),
      params.theme,
      'destinations by flight time',
      'spontaneous travel',
      'weekend getaway'
    ]
  }
}

/**
 * Get theme info by theme key
 */
export function getThemeInfo(theme: string): ThemeInfo {
  return THEME_DATA[theme] || THEME_DATA.adventure
}
