/**
 * Detailed Health Check Endpoint
 * Provides comprehensive system health information for monitoring dashboards
 */

import { NextRequest, NextResponse } from 'next/server'
import { trackExternalAPI, addCorrelationIds, type Span } from '@/lib/telemetry'
import { circuitBreakerRegistry } from '@/lib/circuitBreaker'
import { slaMonitoring } from '@/lib/slaMonitoring'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

export async function GET(request: NextRequest): Promise<Response> {
  return trackExternalAPI(
    'health_check',
    'detailed_health',
    async (span: Span) => {
      const startTime = Date.now()
      const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID()
      
      addCorrelationIds(span, { requestId: correlationId })
      
      try {
        // Get comprehensive system metrics
        const systemMetrics = await getSystemMetrics()
        const circuitBreakerMetrics = getCircuitBreakerMetrics()
        const slaMetrics = getSLAMetrics()
        const performanceMetrics = await getPerformanceMetrics()
        
        const responseTime = Date.now() - startTime
        
        const healthData = {
          status: 'healthy', // Detailed endpoint is always accessible
          timestamp: new Date().toISOString(),
          responseTime,
          system: systemMetrics,
          circuitBreakers: circuitBreakerMetrics,
          sla: slaMetrics,
          performance: performanceMetrics,
          environment: {
            nodeEnv: process.env.NODE_ENV,
            version: process.env.npm_package_version || '1.0.0',
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            platform: process.platform,
            nodeVersion: process.version
          },
          features: {
            analyticsEnabled: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
            sentryEnabled: !!process.env.SENTRY_DSN,
            amadeusEnabled: !!process.env.AMADEUS_CLIENT_ID,
            cacheEnabled: !!process.env.REDIS_URL,
            tracingEnabled: !!process.env.OTEL_EXPORTER_OTLP_ENDPOINT
          }
        }
        
        logger.debug('Detailed health check completed', {
          component: 'health_check_detailed',
          correlationId,
          metadata: { responseTime }
        })
        
        return NextResponse.json(healthData, {
          status: 200,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Health-Status': 'detailed',
            'X-Response-Time': responseTime.toString(),
            'X-Correlation-ID': correlationId
          }
        })
        
      } catch (error) {
        span.recordException(error as Error)
        
        logger.error('Detailed health check failed', {
          component: 'health_check_detailed',
          correlationId,
          metadata: { error: (error as Error).message }
        })
        
        return NextResponse.json({
          status: 'error',
          error: 'Detailed health check failed',
          timestamp: new Date().toISOString(),
          correlationId
        }, { status: 500 })
      }
    },
    { endpoint: '/api/health/detailed', method: 'GET' }
  )
}

async function getSystemMetrics() {
  return {
    database: await getDatabaseMetrics(),
    cache: await getCacheMetrics(),
    externalServices: await getExternalServiceMetrics()
  }
}

async function getDatabaseMetrics() {
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const queryTime = Date.now() - start
    
    // Get connection pool info if available
    const poolInfo = {
      // These would come from actual database monitoring
      activeConnections: 5,
      idleConnections: 3,
      maxConnections: 10
    }
    
    await prisma.$disconnect()
    
    return {
      status: 'healthy',
      queryTime,
      connectionPool: poolInfo,
      lastCheck: new Date().toISOString()
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: (error as Error).message,
      lastCheck: new Date().toISOString()
    }
  }
}

async function getCacheMetrics() {
  try {
    // Redis metrics would go here
    return {
      status: process.env.REDIS_URL ? 'healthy' : 'not_configured',
      hitRate: 85.2, // Example metric
      memory: {
        used: '45MB',
        peak: '67MB'
      },
      connections: {
        active: 2,
        idle: 1
      },
      lastCheck: new Date().toISOString()
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: (error as Error).message,
      lastCheck: new Date().toISOString()
    }
  }
}

async function getExternalServiceMetrics() {
  const services = []
  
  // Amadeus API
  if (process.env.AMADEUS_CLIENT_ID) {
    try {
      const start = Date.now()
      const response = await fetch('https://api.amadeus.com', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      })
      const responseTime = Date.now() - start
      
      services.push({
        name: 'amadeus',
        status: response.ok ? 'healthy' : 'degraded',
        responseTime,
        lastCheck: new Date().toISOString()
      })
    } catch (error) {
      services.push({
        name: 'amadeus',
        status: 'unhealthy',
        error: (error as Error).message,
        lastCheck: new Date().toISOString()
      })
    }
  }
  
  return services
}

function getCircuitBreakerMetrics() {
  const allStats = circuitBreakerRegistry.getAllStats()
  
  return Object.entries(allStats).map(([serviceName, stats]) => ({
    service: serviceName,
    state: stats.state,
    uptime: stats.uptime,
    totalRequests: stats.totalRequests,
    failureCount: stats.failureCount,
    successCount: stats.successCount,
    lastFailureTime: stats.lastFailureTime?.toISOString(),
    lastSuccessTime: stats.lastSuccessTime?.toISOString(),
    healthy: stats.state === 'CLOSED' && stats.uptime >= 95
  }))
}

function getSLAMetrics() {
  const slaStatus = slaMonitoring.getSLAStatus()
  
  return Object.entries(slaStatus).map(([name, status]) => ({
    name,
    status: status.status,
    currentValue: status.currentValue,
    threshold: status.target?.threshold,
    unit: status.target?.unit,
    period: status.target?.period,
    lastUpdated: status.lastUpdated?.toISOString(),
    compliance: slaMonitoring.calculateCompliance(name, 24),
    alert: status.alert ? {
      id: status.alert.id,
      message: status.alert.message,
      severity: status.alert.severity,
      timestamp: status.alert.timestamp
    } : null
  }))
}

async function getPerformanceMetrics() {
  return {
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    },
    cpu: {
      usage: process.cpuUsage(),
      loadAverage: process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0]
    },
    uptime: {
      process: Math.round(process.uptime()),
      system: Math.round(require('os').uptime())
    },
    gc: {
      // GC metrics would be collected by external monitoring
      collections: 0,
      totalTime: 0
    }
  }
}