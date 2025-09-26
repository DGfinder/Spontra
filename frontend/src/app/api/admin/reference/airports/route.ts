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
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 50)

  if (!q || q.length < 2) {
    return NextResponse.json({ ok: true, items: [], count: 0 })
  }

  const pgUrl = process.env.SEARCH_DATABASE_URL || process.env.DATABASE_URL
  if (!pgUrl) {
    // Graceful fallback when DB is not configured
    return NextResponse.json({ ok: false, error: 'Database URL not configured' }, { status: 503 })
  }

  const pg = new PgClient({ connectionString: pgUrl })
  try {
    await pg.connect()
    // Search by code, city, name, or country
    const { rows } = await pg.query(
      `SELECT iata_code, name, city, country, country_code, timezone, latitude, longitude
       FROM airports
       WHERE is_active = true
         AND (
            LOWER(iata_code) LIKE LOWER($1) || '%'
         OR LOWER(city) LIKE '%' || LOWER($1) || '%'
         OR LOWER(name) LIKE '%' || LOWER($1) || '%'
         OR LOWER(country) LIKE '%' || LOWER($1) || '%'
         )
       ORDER BY city ASC, name ASC
       LIMIT $2`,
      [q, limit]
    )
    const toNumber = (value: any) => {
      if (value === null || value === undefined || value === '') return null
      const num = typeof value === 'number' ? value : Number(value)
      return Number.isFinite(num) ? num : null
    }

    const items = rows.map((r: any) => ({
      code: (r.iata_code || '').toUpperCase(),
      name: r.name || '',
      city: r.city || '',
      country: r.country || '',
      countryCode: (r.country_code || '').toUpperCase(),
      timezone: r.timezone || '',
      latitude: toNumber(r.latitude),
      longitude: toNumber(r.longitude),
    }))

    return NextResponse.json({ ok: true, items, count: items.length })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Query failed' }, { status: 500 })
  } finally {
    try { await pg.end() } catch {}
  }
}
