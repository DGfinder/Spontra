/**
 * Production Health Check Endpoint
 *
 * Provides comprehensive health status for monitoring systems
 */

import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { kv } from '@vercel/kv'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  services: {
    database: ServiceHealth
    redis: ServiceHealth
    amadeus: ServiceHealth
    metasearch: ServiceHealth
  }
  metrics: {
    uptime: number
    memory: {
      used: number
      total: number
      percentage: number
    }
  }
}

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime?: number
  message?: string
}

export async function GET() {
  const startTime = Date.now()

  const health: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    services: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      amadeus: await checkAmadeus(),
      metasearch: await checkMetasearch()
    },
    metrics: {
      uptime: process.uptime(),
      memory: getMemoryUsage()
    }
  }

  // Determine overall health status
  const serviceStatuses = Object.values(health.services).map(s => s.status)

  if (serviceStatuses.includes('unhealthy')) {
    health.status = 'unhealthy'
  } else if (serviceStatuses.includes('degraded')) {
    health.status = 'degraded'
  }

  const responseTime = Date.now() - startTime

  const status = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 207 : 503

  return NextResponse.json(
    {
      ...health,
      responseTime
    },
    {
      status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }
  )
}

/**
 * Check database connectivity and responsiveness
 */
async function checkDatabase(): Promise<ServiceHealth> {
  const startTime = Date.now()

  try {
    await db.$queryRaw`SELECT 1`

    const responseTime = Date.now() - startTime

    if (responseTime > 1000) {
      return {
        status: 'degraded',
        responseTime,
        message: 'Database responding slowly'
      }
    }

    return {
      status: 'healthy',
      responseTime
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Database connection failed'
    }
  }
}

/**
 * Check Redis/Vercel KV connectivity
 */
async function checkRedis(): Promise<ServiceHealth> {
  const startTime = Date.now()

  try {
    const testKey = `health:check:${Date.now()}`
    const testValue = 'ok'

    await kv.set(testKey, testValue, { ex: 5 })
    const result = await kv.get(testKey)
    await kv.del(testKey)

    const responseTime = Date.now() - startTime

    if (result !== testValue) {
      return {
        status: 'degraded',
        responseTime,
        message: 'Redis data integrity issue'
      }
    }

    if (responseTime > 500) {
      return {
        status: 'degraded',
        responseTime,
        message: 'Redis responding slowly'
      }
    }

    return {
      status: 'healthy',
      responseTime
    }
  } catch (error) {
    return {
      status: 'degraded',
      message: 'Redis unavailable (using fallback)'
    }
  }
}

/**
 * Check Amadeus API connectivity
 */
async function checkAmadeus(): Promise<ServiceHealth> {
  const startTime = Date.now()

  try {
    const { amadeusClient } = await import('@/lib/amadeusSimple')

    if (!amadeusClient) {
      return {
        status: 'degraded',
        message: 'Amadeus client not configured'
      }
    }

    // Try a simple location search
    const result = await amadeusClient.searchLocations('LON')
    const responseTime = Date.now() - startTime

    if (!result || !result.data || result.data.length === 0) {
      return {
        status: 'degraded',
        responseTime,
        message: 'Amadeus returning empty results'
      }
    }

    if (responseTime > 2000) {
      return {
        status: 'degraded',
        responseTime,
        message: 'Amadeus responding slowly'
      }
    }

    return {
      status: 'healthy',
      responseTime
    }
  } catch (error) {
    return {
      status: 'degraded',
      message: 'Amadeus unavailable (using cache fallback)'
    }
  }
}

/**
 * Check metasearch provider health
 */
async function checkMetasearch(): Promise<ServiceHealth> {
  try {
    const { getProviderHealthStatus } = await import('@/lib/metasearch/providerOptimizer')

    const health = await getProviderHealthStatus()

    const unhealthyProviders = health.filter(p => !p.isHealthy)

    if (unhealthyProviders.length === health.length) {
      return {
        status: 'unhealthy',
        message: 'All providers unhealthy'
      }
    } else if (unhealthyProviders.length > 0) {
      return {
        status: 'degraded',
        message: `${unhealthyProviders.length}/${health.length} providers unhealthy`
      }
    }

    return {
      status: 'healthy'
    }
  } catch (error) {
    return {
      status: 'degraded',
      message: 'Unable to check provider health'
    }
  }
}

/**
 * Get memory usage statistics
 */
function getMemoryUsage() {
  const usage = process.memoryUsage()
  const total = usage.heapTotal
  const used = usage.heapUsed

  return {
    used: Math.round(used / 1024 / 1024), // MB
    total: Math.round(total / 1024 / 1024), // MB
    percentage: Math.round((used / total) * 100)
  }
}