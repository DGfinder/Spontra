import { Destination } from '@/lib/store'

export type ImageType = 'custom' | 'default' | 'gradient'

export interface CountryGroup {
  countryCode: string
  countryName: string
  mapSvg?: string | null // SVG code for country map outline
  imageUrl?: string | null
  imageType: ImageType
  shortestFlightTime: number // in hours
  cheapestPrice: number
  currency: string
  destinationCount: number
  destinations: Destination[]
  poiHighlights?: string[] // Top POI names for subtext
}

export interface CountryImageResolution {
  url: string
  type: ImageType
}
