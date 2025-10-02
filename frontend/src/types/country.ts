import { Destination } from '@/lib/store'

export type ImageType = 'custom' | 'default' | 'gradient'

export interface CountryGroup {
  countryCode: string
  countryName: string
  imageUrl?: string | null
  imageType: ImageType
  shortestFlightTime: number // in hours
  cheapestPrice: number
  currency: string
  destinationCount: number
  destinations: Destination[]
}

export interface CountryImageResolution {
  url: string
  type: ImageType
}
