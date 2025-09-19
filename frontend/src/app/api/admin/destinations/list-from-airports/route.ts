import { NextRequest, NextResponse } from 'next/server'
import { Client as PgClient } from 'pg'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const pgUrl = process.env.SEARCH_DATABASE_URL || process.env.DATABASE_URL
  if (!pgUrl) {
    return NextResponse.json({ ok: false, error: 'Database URL not configured' }, { status: 503 })
  }

  const pg = new PgClient({ connectionString: pgUrl })
  try {
    await pg.connect()
    
    // Get all airports that have flight data and create destination records
    const { rows } = await pg.query(`
      SELECT DISTINCT
        a.iata_code as airport_code,
        a.name,
        a.city,
        a.country,
        a.country_code,
        a.latitude,
        a.longitude,
        a.is_active,
        flight_stats.flight_count,
        COALESCE(dest.themes, '{}') as themes,
        dest.description,
        COALESCE(dest.highlights, '[]') as highlights,
        COALESCE(dest.activities, '{}') as activities,
        COALESCE(dest.videos, '{}') as videos,
        dest.hero_image
      FROM airports a
      LEFT JOIN (
        SELECT 
          airport_code,
          COUNT(*) as flight_count
        FROM (
          SELECT destination_airport as airport_code FROM flight_durations
          UNION ALL
          SELECT origin_airport as airport_code FROM flight_durations
        ) flight_airports
        GROUP BY airport_code
      ) flight_stats ON flight_stats.airport_code = a.iata_code
      LEFT JOIN destinations_enhanced dest ON dest.airport_code = a.iata_code
      WHERE flight_stats.flight_count > 0
      ORDER BY a.city ASC, a.country ASC
    `)

    // Transform the data to match the frontend interface
    const destinations = rows.map((row: any) => ({
      airport_code: row.airport_code,
      name: row.name,
      city: row.city,
      country: row.country,
      country_code: row.country_code,
      latitude: row.latitude ? parseFloat(row.latitude) : null,
      longitude: row.longitude ? parseFloat(row.longitude) : null,
      is_active: row.is_active,
      flight_count: parseInt(row.flight_count) || 0,
      themes: typeof row.themes === 'string' ? JSON.parse(row.themes) : (row.themes || {
        vibe: false,
        adventure: false,
        discover: false,
        indulge: false,
        nature: false
      }),
      description: row.description || '',
      highlights: typeof row.highlights === 'string' ? JSON.parse(row.highlights) : (row.highlights || []),
      activities: typeof row.activities === 'string' ? JSON.parse(row.activities) : (row.activities || {
        vibe: [],
        adventure: [],
        discover: [],
        indulge: [],
        nature: []
      }),
      videos: typeof row.videos === 'string' ? JSON.parse(row.videos) : (row.videos || {
        vibe: [],
        adventure: [],
        discover: [],
        indulge: [],
        nature: []
      }),
      hero_image: row.hero_image
    }))

    return NextResponse.json({ 
      ok: true, 
      data: destinations
    })
  } catch (e: any) {
    console.error('Destinations list query failed:', e)
    return NextResponse.json({ ok: false, error: e?.message || 'Query failed' }, { status: 500 })
  } finally {
    try { await pg.end() } catch {}
  }
}
