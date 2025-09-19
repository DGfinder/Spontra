import { NextRequest, NextResponse } from 'next/server'
import { Client as PgClient } from 'pg'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const pgUrl = process.env.SEARCH_DATABASE_URL || process.env.DATABASE_URL
  if (!pgUrl) {
    return NextResponse.json({ ok: false, error: 'Database URL not configured' }, { status: 503 })
  }

  const pg = new PgClient({ connectionString: pgUrl })
  try {
    await pg.connect()
    
    // Start transaction
    await pg.query('BEGIN')

    // Get airports that should be active (have flight data)
    const { rows: airportsWithFlights } = await pg.query(`
      SELECT DISTINCT airport_code
      FROM (
        SELECT origin_airport as airport_code FROM flight_durations
        UNION
        SELECT destination_airport as airport_code FROM flight_durations
      ) flight_airports
    `)

    const airportsWithFlightData = airportsWithFlights.map(row => row.airport_code)

    // Activate airports that have flight data but are currently inactive
    const { rowCount: activated } = await pg.query(`
      UPDATE airports 
      SET is_active = true, updated_at = NOW() 
      WHERE iata_code = ANY($1) AND is_active = false
    `, [airportsWithFlightData])

    // Deactivate airports that don't have flight data but are currently active
    const { rowCount: deactivated } = await pg.query(`
      UPDATE airports 
      SET is_active = false, updated_at = NOW() 
      WHERE iata_code != ALL($1) AND is_active = true
    `, [airportsWithFlightData])

    // Commit transaction
    await pg.query('COMMIT')

    return NextResponse.json({ 
      ok: true, 
      data: { 
        activated: activated || 0,
        deactivated: deactivated || 0,
        total_active_airports: airportsWithFlightData.length,
        message: `Sync completed: ${activated} activated, ${deactivated} deactivated`
      }
    })
  } catch (e: any) {
    // Rollback transaction on error
    try { await pg.query('ROLLBACK') } catch {}
    console.error('Airport sync failed:', e)
    return NextResponse.json({ ok: false, error: e?.message || 'Sync failed' }, { status: 500 })
  } finally {
    try { await pg.end() } catch {}
  }
}
