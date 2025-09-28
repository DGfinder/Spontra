import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

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

export async function POST(req: NextRequest) {
  try {
    const { origin, theme, minFlightTime = 0, maxFlightTime = 1440 } = await req.json()

    if (!origin || !theme) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Origin and theme are required' 
      }, { status: 400 })
    }

    // Generate cache key
    const searchParams = `${origin}-${theme}-${minFlightTime}-${maxFlightTime}`
    const searchHash = createHash('md5').update(searchParams).digest('hex')

    const pgUrl = process.env.SEARCH_DATABASE_URL || process.env.DATABASE_URL
    if (!pgUrl) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Database not configured' 
      }, { status: 503 })
    }

    const pg = new PgClient({ connectionString: pgUrl })
    await pg.connect()

    try {
      // Check cache first
      const { rows } = await pg.query(`
        SELECT destinations, destination_count, cached_at
        FROM cached_theme_destinations 
        WHERE search_hash = $1 AND expires_at > NOW()
      `, [searchHash])

      if (rows.length > 0) {
        const cacheData = rows[0]
        
        return NextResponse.json({
          ok: true,
          data: cacheData.destinations,
          total_results: cacheData.destination_count,
          cached: true,
          cached_at: cacheData.cached_at,
          source: 'cache',
          search_params: { origin, theme, minFlightTime, maxFlightTime }
        }, {
          headers: { 'X-Cache': 'HIT' }
        })
      }

      // Cache miss - return empty for now (would call Amadeus API in production)
      return NextResponse.json({
        ok: true,
        data: [],
        total_results: 0,
        cached: false,
        source: 'cache-miss',
        message: 'Cache miss - would call Amadeus API in production',
        search_params: { origin, theme, minFlightTime, maxFlightTime }
      }, {
        headers: { 'X-Cache': 'MISS' }
      })

    } finally {
      await pg.end()
    }

  } catch (error: any) {
    console.error('Cached destinations API error:', error)
    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Failed to fetch destinations' 
    }, { status: 500 })
  }
}
