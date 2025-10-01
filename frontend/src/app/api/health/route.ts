import { NextRequest, NextResponse } from 'next/server'
import { checkDatabaseConnection } from '@/lib/db'
import { checkKVHealth } from '@/lib/cache'

export const runtime = 'nodejs'

export interface HealthCheckResult {
  service: string
  status: 'healthy' | 'unhealthy'
  message: string
  timestamp: string
  responseTime?: number
}

export interface SystemHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  services: HealthCheckResult[]
}

export async function GET(request: NextRequest): Promise<Response> {
  const startTime = Date.now()

  try {
    const services: HealthCheckResult[] = []

    // Check database
    const dbStart = Date.now()
    const dbHealthy = await checkDatabaseConnection()
    services.push({
      service: 'database',
      status: dbHealthy ? 'healthy' : 'unhealthy',
      message: dbHealthy ? 'Database connection OK' : 'Database connection failed',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - dbStart
    })

    // Check KV cache
    const kvStart = Date.now()
    const kvHealthy = await checkKVHealth()
    services.push({
      service: 'kv-cache',
      status: kvHealthy ? 'healthy' : 'unhealthy',
      message: kvHealthy ? 'KV cache OK' : 'KV cache unavailable',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - kvStart
    })

    // Determine overall status
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length
    const status = unhealthyCount === 0 ? 'healthy' : unhealthyCount === services.length ? 'unhealthy' : 'degraded'

    const response: SystemHealthResponse = {
      status,
      timestamp: new Date().toISOString(),
      services
    }

    return NextResponse.json(response, {
      status: status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503
    })

  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: [{
        service: 'health-check',
        status: 'unhealthy',
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      }]
    }, { status: 503 })
  }
}
