'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getDestinations() {
  try {
    console.log('[getDestinations] Querying destinations...')
    const destinations = await db.destination.findMany({
      include: {
        country: true,
        _count: {
          select: { themePOIs: true }
        }
      },
      orderBy: { cityName: 'asc' }
    })

    console.log('[getDestinations] Found', destinations.length, 'destinations')

    // Fetch airports using raw SQL until Prisma Client is regenerated
    const airportLinks = await db.$queryRaw<Array<{
      destination_id: string
      airport_code: string
      is_primary: boolean
      created_at: Date
      iata_code: string
      name: string
    }>>`
      SELECT
        da.destination_id,
        da.airport_code,
        da.is_primary,
        da.created_at,
        a.iata_code,
        a.name
      FROM destination_airports da
      JOIN airports a ON da.airport_code = a.iata_code
      ORDER BY da.is_primary DESC, da.airport_code ASC
    `

    // Group airports by destination
    const airportsByDest = new Map<string, typeof airportLinks>()
    for (const link of airportLinks) {
      if (!airportsByDest.has(link.destination_id)) {
        airportsByDest.set(link.destination_id, [])
      }
      airportsByDest.get(link.destination_id)!.push(link)
    }

    // Serialize data for client components (convert Decimal to number/null)
    const serialized = destinations.map(dest => ({
      ...dest,
      popularityScore: dest.popularityScore ? Number(dest.popularityScore) : null,
      createdAt: dest.createdAt.toISOString(),
      updatedAt: dest.updatedAt.toISOString(),
      country: dest.country ? {
        ...dest.country,
        createdAt: dest.country.createdAt.toISOString(),
        updatedAt: dest.country.updatedAt.toISOString()
      } : null,
      airports: (airportsByDest.get(dest.id) || []).map(da => ({
        isPrimary: da.is_primary,
        createdAt: da.created_at.toISOString(),
        airport: {
          iataCode: da.iata_code,
          name: da.name
        }
      }))
    }))

    console.log('[getDestinations] Serialized successfully')
    return { success: true, data: serialized }
  } catch (error) {
    console.error('[getDestinations] Error:', error)
    console.error('[getDestinations] Error stack:', error instanceof Error ? error.stack : 'No stack')
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch destinations' }
  }
}

export async function getDestinationWithPOIs(id: string) {
  try {
    console.log('[getDestinationWithPOIs] Fetching destination:', id)
    const destination = await db.destination.findUnique({
      where: { id },
      include: {
        country: true,
        themePOIs: {
          include: {
            videos: {
              orderBy: { displayOrder: 'asc' }
            }
          },
          orderBy: [{ theme: 'asc' }, { displayOrder: 'asc' }]
        }
      }
    })

    if (!destination) {
      console.log('[getDestinationWithPOIs] Destination not found')
      return { success: false, error: 'Destination not found' }
    }

    console.log('[getDestinationWithPOIs] Found destination:', destination.cityName, 'with', destination.themePOIs.length, 'POIs')

    // Serialize data for client components (convert Decimal to number/null, Date to string)
    const serialized = {
      id: destination.id,
      airportCode: destination.airportCode,
      cityName: destination.cityName,
      countryName: destination.countryName,
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

    console.log('[getDestinationWithPOIs] Serialization complete, returning data')
    return { success: true, data: serialized }
  } catch (error) {
    console.error('[getDestinationWithPOIs] Error:', error)
    return { success: false, error: 'Failed to fetch destination' }
  }
}
