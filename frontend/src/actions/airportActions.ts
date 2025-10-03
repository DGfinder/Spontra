'use server'

import { db } from '@/lib/db'

export interface Airport {
  id: string
  iataCode: string
  name: string
  city: string
  country: string
}

export async function searchAirports(query: string): Promise<{ success: boolean; data?: Airport[]; error?: string }> {
  try {
    if (!query || query.trim().length < 2) {
      return { success: true, data: [] }
    }

    const searchTerm = query.trim().toUpperCase()

    // Search by IATA code, city, or country name
    // Prioritize exact IATA matches, then partial matches
    const airports = await db.airport.findMany({
      where: {
        isSearchable: true,
        OR: [
          { iataCode: { contains: searchTerm, mode: 'insensitive' } },
          { city: { contains: searchTerm, mode: 'insensitive' } },
          { country: { contains: searchTerm, mode: 'insensitive' } },
          { name: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        iataCode: true,
        name: true,
        city: true,
        country: true
      },
      orderBy: [
        // Exact IATA match first
        { iataCode: 'asc' }
      ],
      take: 8
    })

    // Sort to prioritize exact matches
    const sortedAirports = airports.sort((a, b) => {
      const aExact = a.iataCode.toUpperCase() === searchTerm
      const bExact = b.iataCode.toUpperCase() === searchTerm
      const aStarts = a.iataCode.toUpperCase().startsWith(searchTerm)
      const bStarts = b.iataCode.toUpperCase().startsWith(searchTerm)

      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1

      return a.iataCode.localeCompare(b.iataCode)
    })

    return { success: true, data: sortedAirports }
  } catch (error) {
    console.error('[searchAirports] Error:', error)
    return { success: false, error: 'Failed to search airports' }
  }
}

export async function getAirportByCode(iataCode: string): Promise<{ success: boolean; data?: Airport; error?: string }> {
  try {
    const airport = await db.airport.findUnique({
      where: { iataCode: iataCode.toUpperCase() },
      select: {
        id: true,
        iataCode: true,
        name: true,
        city: true,
        country: true
      }
    })

    if (!airport) {
      return { success: false, error: 'Airport not found' }
    }

    return { success: true, data: airport }
  } catch (error) {
    console.error('[getAirportByCode] Error:', error)
    return { success: false, error: 'Failed to fetch airport' }
  }
}
