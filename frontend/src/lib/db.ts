import { sql } from '@vercel/postgres'
import { PrismaClient } from '@prisma/client'

// Vercel Postgres direct connection for edge runtime
export { sql }

// Prisma client with optimized configuration for Vercel
// Use lazy initialization to avoid build-time errors when DATABASE_URL is not set
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL
  if (!url) {
    // Return a mock client during build time
    console.warn('[Prisma] No DATABASE_URL - returning stub client for build')
    return new Proxy({} as PrismaClient, {
      get: (target, prop) => {
        if (prop === '$disconnect') return async () => {}
        if (prop === '$connect') return async () => {}
        throw new Error(`Database not configured - attempted to access prisma.${String(prop)}`)
      }
    })
  }
  
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: { url }
    }
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Connection health check
export async function checkDatabaseConnection() {
  try {
    // Use Vercel Postgres for health check (faster for edge)
    await sql`SELECT 1 as connection_test`
    return { success: true, message: 'Database connection successful' }
  } catch (error) {
    console.error('Database connection failed:', error)
    return { 
      success: false, 
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

// Connection pool monitoring
export async function getDatabaseStats(): Promise<{
  activeConnections?: number
  totalConnections?: number
  databaseSize?: string
  uptime?: string
} | null> {
  try {
    // Get connection statistics
    const connectionResult = await sql`
      SELECT 
        count(*) as active_connections,
        (SELECT setting FROM pg_settings WHERE name = 'max_connections') as max_connections
      FROM pg_stat_activity 
      WHERE state = 'active'
    `
    
    // Get database size
    const sizeResult = await sql`
      SELECT pg_size_pretty(pg_database_size(current_database())) as database_size
    `
    
    // Get uptime
    const uptimeResult = await sql`
      SELECT date_trunc('second', current_timestamp - pg_postmaster_start_time()) as uptime
    `

    return {
      activeConnections: parseInt(connectionResult[0]?.active_connections || '0'),
      totalConnections: parseInt(connectionResult[0]?.max_connections || '0'),
      databaseSize: sizeResult[0]?.database_size || 'Unknown',
      uptime: uptimeResult[0]?.uptime || 'Unknown'
    }
  } catch (error) {
    console.error('Failed to get database stats:', error)
    return null
  }
}

// Helper function to safely close connections
export async function disconnectDatabase() {
  await prisma.$disconnect()
}

// Database initialization for migrations
export async function initializeDatabase() {
  try {
    // Ensure database is ready
    await checkDatabaseConnection()
    
    // Run any pending migrations in production
    if (process.env.NODE_ENV === 'production') {
      console.log('Running database migrations...')
      // Migrations should be run via Vercel build process
    }
    
    return { success: true }
  } catch (error) {
    console.error('Database initialization failed:', error)
    return { success: false, error }
  }
}

export default prisma