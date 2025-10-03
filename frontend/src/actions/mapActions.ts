'use server'

import { db } from '@/lib/db'

export interface MapAirport {
  id: string
  iataCode: string
  name: string
  city: string
  country: string
  latitude: number
  longitude: number
  isSearchable: boolean
  routeCount: number
}

export interface MapPOI {
  id: string
  name: string
  description: string | null
  theme: string
  latitude: number
  longitude: number
  destinationId: string
  destinationCity: string
  destinationCountry: string | null
  videoCount: number
  primaryAirport?: {
    iataCode: string
    latitude: number
    longitude: number
  }
}

export interface MapData {
  airports: MapAirport[]
  pois: MapPOI[]
}

export async function getMapData(filters?: {
  showAirports?: boolean
  showPOIs?: boolean
  theme?: string
}): Promise<{ success: boolean; data?: MapData; error?: string }> {
  try {
    const showAirports = filters?.showAirports ?? true
    const showPOIs = filters?.showPOIs ?? true
    const theme = filters?.theme

    const airports: MapAirport[] = []
    const pois: MapPOI[] = []

    // Fetch airports with coordinates
    if (showAirports) {
      const airportsData = await db.airport.findMany({
        where: {
          AND: [
            { latitude: { not: null } },
            { longitude: { not: null } }
          ]
        },
        select: {
          id: true,
          iataCode: true,
          name: true,
          city: true,
          country: true,
          latitude: true,
          longitude: true,
          isSearchable: true,
          _count: {
            select: {
              originFlights: true,
              destinationFlights: true
            }
          }
        }
      })

      airports.push(
        ...airportsData.map((airport) => ({
          id: airport.id,
          iataCode: airport.iataCode,
          name: airport.name,
          city: airport.city,
          country: airport.country,
          latitude: Number(airport.latitude),
          longitude: Number(airport.longitude),
          isSearchable: airport.isSearchable,
          routeCount: airport._count.originFlights + airport._count.destinationFlights
        }))
      )
    }

    // Fetch POIs with coordinates
    if (showPOIs) {
      const poisData = await db.themePOI.findMany({
        where: {
          AND: [
            { latitude: { not: null } },
            { longitude: { not: null } },
            theme ? { theme } : {}
          ]
        },
        select: {
          id: true,
          name: true,
          description: true,
          theme: true,
          latitude: true,
          longitude: true,
          destinationId: true,
          destination: {
            select: {
              cityName: true,
              countryName: true,
              airports: {
                where: {
                  isPrimary: true
                },
                select: {
                  airport: {
                    select: {
                      iataCode: true,
                      latitude: true,
                      longitude: true
                    }
                  }
                },
                take: 1
              }
            }
          },
          _count: {
            select: {
              videos: true
            }
          }
        }
      })

      pois.push(
        ...poisData.map((poi) => {
          const primaryAirport = poi.destination.airports[0]?.airport

          return {
            id: poi.id,
            name: poi.name,
            description: poi.description,
            theme: poi.theme,
            latitude: Number(poi.latitude),
            longitude: Number(poi.longitude),
            destinationId: poi.destinationId,
            destinationCity: poi.destination.cityName,
            destinationCountry: poi.destination.countryName,
            videoCount: poi._count.videos,
            primaryAirport: primaryAirport
              ? {
                  iataCode: primaryAirport.iataCode,
                  latitude: Number(primaryAirport.latitude),
                  longitude: Number(primaryAirport.longitude)
                }
              : undefined
          }
        })
      )
    }

    return {
      success: true,
      data: { airports, pois }
    }
  } catch (error) {
    console.error('[getMapData] Error:', error)
    return { success: false, error: 'Failed to fetch map data' }
  }
}

export async function getAirportsForMap(): Promise<{ success: boolean; data?: MapAirport[]; error?: string }> {
  try {
    const result = await getMapData({ showAirports: true, showPOIs: false })
    if (!result.success || !result.data) {
      return { success: false, error: result.error }
    }
    return { success: true, data: result.data.airports }
  } catch (error) {
    console.error('[getAirportsForMap] Error:', error)
    return { success: false, error: 'Failed to fetch airports' }
  }
}

export async function getPOIsForMap(theme?: string): Promise<{ success: boolean; data?: MapPOI[]; error?: string }> {
  try {
    const result = await getMapData({ showAirports: false, showPOIs: true, theme })
    if (!result.success || !result.data) {
      return { success: false, error: result.error }
    }
    return { success: true, data: result.data.pois }
  } catch (error) {
    console.error('[getPOIsForMap] Error:', error)
    return { success: false, error: 'Failed to fetch POIs' }
  }
}
