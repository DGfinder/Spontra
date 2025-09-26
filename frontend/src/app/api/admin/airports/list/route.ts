import { NextRequest, NextResponse } from 'next/server'
import { Client as PgClient } from 'pg'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '50', 10)))
  const search = (searchParams.get('search') || '').trim()
  const filter = searchParams.get('filter') || 'all' // all, active, inactive
  const sort = searchParams.get('sort') || 'city' // city, name, country, flight_count
  const order = searchParams.get('order') || 'asc' // asc, desc

  const pgUrl = process.env.SEARCH_DATABASE_URL || process.env.DATABASE_URL
  if (!pgUrl) {
    return NextResponse.json({ ok: false, error: 'Database URL not configured' }, { status: 503 })
  }

  const pg = new PgClient({ connectionString: pgUrl })
  try {
    await pg.connect()
    
    // Build the WHERE clause
    let whereClause = '1=1'
    const queryParams: any[] = []
    let paramCount = 0

    // Search filter
    if (search && search.length >= 2) {
      paramCount++
      whereClause += ` AND (
        LOWER(a.iata_code) LIKE LOWER($${paramCount}) || '%'
        OR LOWER(a.city) LIKE '%' || LOWER($${paramCount}) || '%'
        OR LOWER(a.name) LIKE '%' || LOWER($${paramCount}) || '%'
        OR LOWER(a.country) LIKE '%' || LOWER($${paramCount}) || '%'
      )`
      queryParams.push(search)
    }

    // Active/inactive filter
    if (filter === 'active') {
      whereClause += ' AND a.is_active = true'
    } else if (filter === 'inactive') {
      whereClause += ' AND a.is_active = false'
    }

    // Build the ORDER BY clause
    let orderClause = 'a.city ASC'
    if (sort === 'name') orderClause = `a.name ${order.toUpperCase()}`
    else if (sort === 'country') orderClause = `a.country ${order.toUpperCase()}, a.city ${order.toUpperCase()}`
    else if (sort === 'flight_count') orderClause = `flight_count ${order.toUpperCase()}, a.city ASC`
    else orderClause = `a.city ${order.toUpperCase()}`

    // Main query with flight count
    const query = `
      SELECT 
        a.iata_code,
        a.icao_code,
        a.name,
        a.city,
        a.country,
        a.country_code,
        a.latitude,
        a.longitude,
        a.timezone,
        a.is_active,
        a.created_at,
        a.updated_at,
        COALESCE(flight_stats.flight_count, 0) as flight_count,
        CASE WHEN flight_stats.flight_count > 0 THEN true ELSE false END as has_flight_data
      FROM airports a
      LEFT JOIN (
        SELECT 
          airport_code,
          COUNT(*) as flight_count
        FROM (
          SELECT origin_airport as airport_code FROM flight_durations
          UNION ALL
          SELECT destination_airport as airport_code FROM flight_durations
        ) flight_airports
        GROUP BY airport_code
      ) flight_stats ON flight_stats.airport_code = a.iata_code
      WHERE ${whereClause}
      ORDER BY ${orderClause}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `

    queryParams.push(limit, (page - 1) * limit)

    const { rows } = await pg.query(query, queryParams)

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM airports a
      WHERE ${whereClause}
    `
    const countParams = queryParams.slice(0, paramCount) // Remove limit/offset params
    const { rows: countRows } = await pg.query(countQuery, countParams)
    const total = parseInt(countRows[0].total)

    // Transform the data
    const airports = rows.map((row: any) => ({
      iata_code: row.iata_code,
      icao_code: row.icao_code,
      name: row.name,
      city: row.city,
      country: row.country,
      country_code: row.country_code,
      latitude: row.latitude ? parseFloat(row.latitude) : null,
      longitude: row.longitude ? parseFloat(row.longitude) : null,
      timezone: row.timezone,
      is_active: row.is_active,
      has_flight_data: row.has_flight_data,
      flight_count: parseInt(row.flight_count),
      created_at: row.created_at,
      updated_at: row.updated_at
    }))

    return NextResponse.json({ 
      ok: true, 
      data: {
        airports,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (e: any) {
    console.error('Airport list query failed:', e)
    return NextResponse.json({ ok: false, error: e?.message || 'Query failed' }, { status: 500 })
  } finally {
    try { await pg.end() } catch {}
  }
}