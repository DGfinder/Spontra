'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getCountries() {
  try {
    const countries = await db.country.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { destinations: true }
        }
      }
    })

    return { success: true, data: countries }
  } catch (error) {
    return { success: false, error: 'Failed to fetch countries' }
  }
}

export async function getCountryWithCities(countryId: string) {
  try {
    const destinations = await db.destination.findMany({
      where: { countryId },
      orderBy: { cityName: 'asc' },
      include: {
        _count: {
          select: { themePOIs: true }
        }
      }
    })

    // Fetch airports using raw SQL (until Prisma Client is regenerated)
    const airportLinks = await db.$queryRaw<Array<{
      destination_id: string
      airport_code: string
      is_primary: boolean
      iata_code: string
      name: string
    }>>`
      SELECT
        da.destination_id,
        da.airport_code,
        da.is_primary,
        a.iata_code,
        a.name
      FROM destination_airports da
      JOIN airports a ON da.airport_code = a.iata_code
      WHERE da.destination_id IN (
        SELECT id FROM destinations WHERE country_id = ${countryId}
      )
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

    // Serialize for client
    const serialized = destinations.map(dest => ({
      id: dest.id,
      cityName: dest.cityName,
      airportCode: dest.airportCode, // Deprecated field, kept for backwards compatibility
      airports: (airportsByDest.get(dest.id) || []).map(da => ({
        iataCode: da.iata_code,
        name: da.name,
        isPrimary: da.is_primary
      })),
      _count: dest._count
    }))

    return { success: true, data: serialized }
  } catch (error) {
    console.error('[getCountryWithCities] Error:', error)
    return { success: false, error: 'Failed to fetch country cities' }
  }
}

export async function createCountry(data: { name: string; code: string; mapSvg?: string }) {
  try {
    const country = await db.country.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        mapSvg: data.mapSvg || null
      }
    })

    revalidatePath('/admin/countries')
    return { success: true, data: country }
  } catch (error) {
    return { success: false, error: 'Failed to create country' }
  }
}

export async function updateCountry(id: string, data: { name: string; code: string; mapSvg?: string }) {
  try {
    const country = await db.country.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        mapSvg: data.mapSvg || null
      }
    })

    revalidatePath('/admin/countries')
    return { success: true, data: country }
  } catch (error) {
    return { success: false, error: 'Failed to update country' }
  }
}

export async function deleteCountry(id: string) {
  try {
    await db.country.delete({
      where: { id }
    })

    revalidatePath('/admin/countries')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete country. It may have destinations linked to it.' }
  }
}
