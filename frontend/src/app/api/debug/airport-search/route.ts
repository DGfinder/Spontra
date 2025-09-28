import { NextRequest, NextResponse } from 'next/server'

// Dynamic import for pg to handle build-time issues
let isPgMocked = false
const PgClient = (() => {
  try {
    const pgModule = require('pg')
    return pgModule.Client
  } catch (error) {
    isPgMocked = true
    return class MockClient {
      constructor(config: any) {}
      async connect() {
        throw new Error('Database unavailable: pg module could not be loaded.')
      }
      async query() { 
        throw new Error('Database unavailable: pg module could not be loaded.')
      }
      async end() {}
    }
  }
})()

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    pgModuleStatus: isPgMocked ? 'MOCKED (pg module failed to load)' : 'LOADED',
    databaseConfig: {
      searchDbUrl: !!process.env.SEARCH_DATABASE_URL,
      databaseUrl: !!process.env.DATABASE_URL,
      activeUrl: !!(process.env.SEARCH_DATABASE_URL || process.env.DATABASE_URL)
    },
    runtime: 'nodejs',
    deployment: {
      vercel: !!process.env.VERCEL,
      region: process.env.VERCEL_REGION || 'unknown'
    }
  }

  // Test database connection if possible
  const pgUrl = process.env.SEARCH_DATABASE_URL || process.env.DATABASE_URL
  if (pgUrl && !isPgMocked) {
    try {
      const pg = new PgClient({ connectionString: pgUrl })
      debugInfo.databaseTest = 'attempting connection...'
      
      await pg.connect()
      debugInfo.databaseTest = 'connection successful'
      
      // Test a simple query
      const result = await pg.query('SELECT COUNT(*) as count FROM airports WHERE is_active = true LIMIT 1')
      debugInfo.airportsCount = result.rows[0]?.count || 0
      debugInfo.databaseTest = 'query successful'
      
      await pg.end()
    } catch (error: any) {
      debugInfo.databaseTest = {
        status: 'failed',
        error: error.message,
        code: error.code,
        type: error.name
      }
    }
  } else {
    debugInfo.databaseTest = pgUrl ? 'pg module not available' : 'no database URL configured'
  }

  return NextResponse.json({
    ok: true,
    debug: debugInfo
  })
}