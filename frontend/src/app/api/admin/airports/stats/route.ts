import { NextRequest, NextResponse } from 'next/server'

// Dynamic import for pg to handle build-time issues
const PgClient = (() => {
  try {
    return require('pg').Client
  } catch {
    return class MockClient {
      constructor() {}
      async connect() {}
      async query() { return { rows: [] } }
      async end() {}
    }
  }
})()

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const pgUrl = process.env.SEARCH_DATABASE_URL || process.env.DATABASE_URL
  if (!pgUrl) {
    return NextResponse.json({ ok: false, error: 'Database URL not configured' }, { status: 503 })
  }

  const pg = new PgClient({ connectionString: pgUrl })
  try {
    await pg.connect()
    
    // Get comprehensive airport statistics
    const { rows } = await pg.query(`
      SELECT 
        (SELECT COUNT(*) FROM airports) as total_airports,
        (SELECT COUNT(*) FROM airports WHERE is_active = true) as active_airports,
        (SELECT COUNT(*) FROM airports WHERE is_active = false) as inactive_airports,
        (SELECT COUNT(DISTINCT a.iata_code) 
         FROM airports a 
         WHERE EXISTS (
           SELECT 1 FROM flight_durations fd 
           WHERE fd.origin_airport = a.iata_code OR fd.destination_airport = a.iata_code
         )) as airports_with_flights,
        (SELECT COUNT(DISTINCT a.iata_code) 
         FROM airports a 
         WHERE NOT EXISTS (
           SELECT 1 FROM flight_durations fd 
           WHERE fd.origin_airport = a.iata_code OR fd.destination_airport = a.iata_code
         )) as airports_without_flights
    `)

    const stats = rows[0]
    
    return NextResponse.json({ 
      ok: true, 
      data: {
        total_airports: parseInt(stats.total_airports),
        active_airports: parseInt(stats.active_airports),
        inactive_airports: parseInt(stats.inactive_airports),
        airports_with_flights: parseInt(stats.airports_with_flights),
        airports_without_flights: parseInt(stats.airports_without_flights)
      }
    })
  } catch (e: any) {
    console.error('Airport stats query failed:', e)
    return NextResponse.json({ ok: false, error: e?.message || 'Query failed' }, { status: 500 })
  } finally {
    try { await pg.end() } catch {}
  }
}