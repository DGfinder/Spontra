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

export async function POST(req: NextRequest) {
  try {
    const { iata_code, is_active } = await req.json()

    if (!iata_code || typeof is_active !== 'boolean') {
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid request: iata_code and is_active are required' 
      }, { status: 400 })
    }

    const pgUrl = process.env.SEARCH_DATABASE_URL || process.env.DATABASE_URL
    if (!pgUrl) {
      return NextResponse.json({ ok: false, error: 'Database URL not configured' }, { status: 503 })
    }

    const pg = new PgClient({ connectionString: pgUrl })
    await pg.connect()
    
    try {
      // Update the airport status
      const { rowCount } = await pg.query(
        'UPDATE airports SET is_active = $1, updated_at = NOW() WHERE iata_code = $2',
        [is_active, iata_code.toUpperCase()]
      )

      if (rowCount === 0) {
        return NextResponse.json({ 
          ok: false, 
          error: 'Airport not found' 
        }, { status: 404 })
      }

      return NextResponse.json({ 
        ok: true, 
        data: { 
          iata_code: iata_code.toUpperCase(), 
          is_active,
          message: `Airport ${iata_code.toUpperCase()} ${is_active ? 'activated' : 'deactivated'}` 
        }
      })
    } finally {
      await pg.end()
    }
  } catch (e: any) {
    console.error('Airport toggle failed:', e)
    return NextResponse.json({ ok: false, error: e?.message || 'Update failed' }, { status: 500 })
  }
}