import { NextResponse } from 'next/server'

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

// Dynamic import for cassandra-driver to handle build-time issues
const cassandra = (() => {
  try {
    return require('cassandra-driver')
  } catch {
    return {
      Client: class MockCassandraClient {
        constructor() {}
        async execute() { return { rows: [] } }
        async shutdown() {}
      },
      types: {
        Uuid: {
          random: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)
        }
      }
    }
  }
})()

// Use dynamic import to avoid bundling optional native deps (e.g., kerberos)

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST() {
  const pgUrl = process.env.SEARCH_DATABASE_URL || process.env.DATABASE_URL || 'postgres://spontra:development@localhost/spontra?sslmode=disable'
  const cassHosts = (process.env.CASSANDRA_HOSTS || 'localhost:9042').split(',')
  const origin = (process.env.SEED_ORIGIN || 'LHR').toUpperCase()

  const pg = new PgClient({ connectionString: pgUrl })
  const keyspace = process.env.CASSANDRA_KEYSPACE || 'spontra_destinations'
  const cass = new cassandra.Client({ contactPoints: cassHosts, localDataCenter: 'datacenter1' })

  try {
    await pg.connect()

    // Ensure keyspace and table exist
    await cass.execute(`CREATE KEYSPACE IF NOT EXISTS ${keyspace} WITH replication = { 'class': 'SimpleStrategy', 'replication_factor': '1' }`)
    await cass.execute(`
      CREATE TABLE IF NOT EXISTS ${keyspace}.destinations (
        id uuid,
        iata_code text,
        city_name text,
        country_name text,
        country_code text,
        theme_scores map<text, int>,
        highlights list<text>,
        description text,
        average_flight_time float,
        price_range text,
        best_months set<text>,
        image_url text,
        popularity_score float,
        timezone text,
        language set<text>,
        currency text,
        visa_required boolean,
        created_at timestamp,
        updated_at timestamp,
        PRIMARY KEY (iata_code)
      )
    `)

    const q = `
      SELECT a.iata_code, COALESCE(a.city, '') AS city, COALESCE(a.country, '') AS country, COALESCE(a.country_code, '') AS country_code, AVG(fd.duration_minutes)::int as avg_minutes
      FROM flight_durations fd
      JOIN airports a ON a.iata_code = fd.destination_airport
      WHERE fd.origin_airport = $1
      GROUP BY a.iata_code, a.city, a.country, a.country_code
      ORDER BY avg_minutes ASC
      LIMIT 1000`

    const { rows } = await pg.query(q, [origin])

    const insert = `INSERT INTO ${keyspace}.destinations (
      id, iata_code, city_name, country_name, country_code, theme_scores,
      highlights, description, average_flight_time, price_range, best_months,
      image_url, popularity_score, timezone, language, currency, visa_required,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

    const now = new Date()
    let seeded = 0

    for (const r of rows) {
      const avgMinutes = Number(r.avg_minutes || 0)
      if (!avgMinutes || !r.iata_code) continue

      const bestMonths = new Set(['Apr', 'May', 'Sep', 'Oct'])
      const languages = new Set<string>()

      await cass.execute(insert, [
        cassandra.types.Uuid.random(),
        String(r.iata_code).toUpperCase(),
        r.city,
        r.country,
        r.country_code,
        {},
        [],
        `${r.city}, ${r.country}.`,
        Number(avgMinutes) / 60.0,
        '',
        bestMonths,
        '',
        0,
        '',
        languages,
        '',
        false,
        now,
        now,
      ], { prepare: true })

      seeded++
    }

    return NextResponse.json({ success: true, seeded, origin })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'seed failed' }, { status: 500 })
  } finally {
    try { await pg.end() } catch {}
    try { await cass.shutdown() } catch {}
  }
}