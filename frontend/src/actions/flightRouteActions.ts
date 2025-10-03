'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getOriginAirports() {
  try {
    // Get unique origin airports with route counts using raw SQL
    const origins = await db.$queryRaw<Array<{
      origin_airport_code: string
      city: string
      country: string
      route_count: bigint
    }>>`
      SELECT
        fr.origin_airport_code,
        a.city,
        a.country,
        COUNT(fr.id)::int as route_count
      FROM flight_routes fr
      JOIN airports a ON fr.origin_airport_code = a.iata_code
      GROUP BY fr.origin_airport_code, a.city, a.country
      ORDER BY a.city ASC
    `

    // Serialize for client
    const serialized = origins.map(origin => ({
      airportCode: origin.origin_airport_code,
      city: origin.city,
      country: origin.country,
      routeCount: Number(origin.route_count)
    }))

    return { success: true, data: serialized }
  } catch (error) {
    console.error('[getOriginAirports] Error:', error)
    return { success: false, error: 'Failed to fetch origin airports' }
  }
}

export async function getRoutesByOrigin(originAirportCode: string) {
  try {
    // Get all routes for this origin with destination details and verification status
    const routes = await db.$queryRaw<Array<{
      id: string
      origin_airport_code: string
      destination_airport_code: string
      total_duration_minutes: number
      is_direct: boolean | null
      is_estimated: boolean
      data_source: string | null
      last_updated: Date | null
      dest_city: string
      dest_country: string
    }>>`
      SELECT
        fr.id,
        fr.origin_airport_code,
        fr.destination_airport_code,
        fr.total_duration_minutes,
        fr.is_direct,
        fr.is_estimated,
        fr.data_source,
        fr.last_updated,
        a.city as dest_city,
        a.country as dest_country
      FROM flight_routes fr
      JOIN airports a ON fr.destination_airport_code = a.iata_code
      WHERE fr.origin_airport_code = ${originAirportCode}
      ORDER BY a.city ASC
    `

    // Serialize for client
    const serialized = routes.map(route => ({
      id: route.id,
      originAirportCode: route.origin_airport_code,
      destinationAirportCode: route.destination_airport_code,
      totalDurationMinutes: route.total_duration_minutes,
      isDirect: route.is_direct,
      isEstimated: route.is_estimated,
      dataSource: route.data_source,
      lastUpdated: route.last_updated?.toISOString() || null,
      destinationCity: route.dest_city,
      destinationCountry: route.dest_country
    }))

    return { success: true, data: serialized }
  } catch (error) {
    console.error('[getRoutesByOrigin] Error:', error)
    return { success: false, error: 'Failed to fetch routes' }
  }
}

export async function createFlightRoute(data: {
  originAirportCode: string
  destinationAirportCode: string
  totalDurationMinutes: number
}) {
  try {
    // Check if route already exists
    const existing = await db.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM flight_routes
      WHERE origin_airport_code = ${data.originAirportCode}
      AND destination_airport_code = ${data.destinationAirportCode}
    `

    if (existing.length > 0) {
      return { success: false, error: 'Route already exists' }
    }

    // Create using raw SQL
    await db.$executeRaw`
      INSERT INTO flight_routes (id, origin_airport_code, destination_airport_code, total_duration_minutes)
      VALUES (gen_random_uuid(), ${data.originAirportCode}, ${data.destinationAirportCode}, ${data.totalDurationMinutes})
    `

    revalidatePath('/admin/routes')
    return { success: true }
  } catch (error) {
    console.error('[createFlightRoute] Error:', error)
    return { success: false, error: 'Failed to create route' }
  }
}

export async function updateFlightRoute(id: string, totalDurationMinutes: number) {
  try {
    await db.$executeRaw`
      UPDATE flight_routes
      SET total_duration_minutes = ${totalDurationMinutes}
      WHERE id = ${id}
    `

    revalidatePath('/admin/routes')
    return { success: true }
  } catch (error) {
    console.error('[updateFlightRoute] Error:', error)
    return { success: false, error: 'Failed to update route' }
  }
}

export async function deleteFlightRoute(id: string) {
  try {
    await db.$executeRaw`
      DELETE FROM flight_routes
      WHERE id = ${id}
    `

    revalidatePath('/admin/routes')
    return { success: true }
  } catch (error) {
    console.error('[deleteFlightRoute] Error:', error)
    return { success: false, error: 'Failed to delete route' }
  }
}

export async function getSearchableAirports() {
  try {
    const airports = await db.airport.findMany({
      where: { isActive: true },
      select: {
        iataCode: true,
        city: true,
        country: true
      },
      orderBy: { city: 'asc' }
    })

    return { success: true, data: airports }
  } catch (error) {
    console.error('[getSearchableAirports] Error:', error)
    return { success: false, error: 'Failed to fetch airports' }
  }
}
