import { NextRequest, NextResponse } from 'next/server'
import { checkDatabaseConnection } from '@/lib/db'
import { checkKVHealth } from '@/lib/cache'
import { trackExternalAPI, addCorrelationIds } from '@/lib/telemetry'
import { circuitBreakerRegistry } from '@/lib/circuitBreaker'
import { slaMonitoring } from '@/lib/slaMonitoring'
import { logger } from '@/lib/logger'

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
  circuitBreakers: Array<{
    service: string
    state: string
    uptime: number
    healthy: boolean
  }>
  sla: Array<{
    name: string
    status: string
    currentValue?: number
    threshold?: number
    hasAlert: boolean
  }>
  environment: string
  version: string
  responseTime: number
}

async function performHealthCheck(
  serviceName: string,
  checkFunction: () => Promise<{ success: boolean; message: string }>
): Promise<HealthCheckResult> {
  const startTime = Date.now()
  
  try {
    const result = await checkFunction()
    const responseTime = Date.now() - startTime
    
    return {
      service: serviceName,
      status: result.success ? 'healthy' : 'unhealthy',
      message: result.message,
      timestamp: new Date().toISOString(),
      responseTime
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    return {
      service: serviceName,
      status: 'unhealthy',
      message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
      responseTime
    }
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<SystemHealthResponse>> {
  return trackExternalAPI(
    'health_check',
    'system_health',
    async (span) => {
      const startTime = Date.now()
      const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID()
      
      addCorrelationIds(span, { requestId: correlationId })
      
      try {
        // Perform all health checks in parallel
        const healthChecks = await Promise.all([
          performHealthCheck('database', checkDatabaseConnection),
          performHealthCheck('cache', checkKVHealth),
          performHealthCheck('application', async () => ({
            success: true,
            message: 'Application is running'
          })),
          performHealthCheck('monitoring', async () => {
            const { checkSentryConfig } = await import('@/lib/sentry')
            const sentryConfig = checkSentryConfig()
            return {
              success: sentryConfig.configured,
              message: sentryConfig.message
            }
          }),
          performHealthCheck('analytics', async () => {
            const analyticsEnabled = process.env.NODE_ENV === 'production' || 
                                    process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'
            return {
              success: true, // Analytics is optional, so always healthy
              message: analyticsEnabled ? 'Analytics enabled' : 'Analytics disabled (optional)'
            }
          }),
          performHealthCheck('external_apis', checkExternalServices)
        ])

        // Get circuit breaker status
        const circuitBreakers = circuitBreakerRegistry.getAllStats()
        const circuitBreakerStatus = Object.entries(circuitBreakers).map(([name, stats]) => ({
          service: name,
          state: stats.state,
          uptime: stats.uptime,
          healthy: stats.state === 'CLOSED' && stats.uptime >= 95
        }))

        // Get SLA status
        const slaStatus = slaMonitoring.getSLAStatus()
        const slaMetrics = Object.entries(slaStatus).map(([name, status]) => ({
          name,
          status: status.status,
          currentValue: status.currentValue,
          threshold: status.target?.threshold,
          hasAlert: !!status.alert
        }))

        // Determine overall system status
        const unhealthyServices = healthChecks.filter(check => check.status === 'unhealthy')
        const degradedServices = healthChecks.filter(check => check.responseTime && check.responseTime > 5000)
        const unhealthyCircuitBreakers = circuitBreakerStatus.filter(cb => !cb.healthy)
        const criticalSLAAlerts = slaMetrics.filter(sla => sla.hasAlert && sla.status === 'critical')
        
        let overallStatus: 'healthy' | 'degraded' | 'unhealthy'
        
        if (unhealthyServices.length > 0 || criticalSLAAlerts.length > 0) {
          overallStatus = 'unhealthy'
        } else if (degradedServices.length > 0 || unhealthyCircuitBreakers.length > 0) {
          overallStatus = 'degraded'
        } else {
          overallStatus = 'healthy'
        }

        const responseTime = Date.now() - startTime

        const response: SystemHealthResponse = {
          status: overallStatus,
          timestamp: new Date().toISOString(),
          services: healthChecks,
          circuitBreakers: circuitBreakerStatus,
          sla: slaMetrics,
          environment: process.env.NODE_ENV || 'unknown',
          version: process.env.npm_package_version || '0.1.0',
          responseTime
        }

        // Log health check
        logger.info('Health check completed', {
          component: 'health_check',
          correlationId,
          metadata: { 
            status: overallStatus, 
            responseTime,
            unhealthyServices: unhealthyServices.length,
            unhealthyCircuitBreakers: unhealthyCircuitBreakers.length,
            criticalAlerts: criticalSLAAlerts.length
          }
        })

        // Record SLA metric
        slaMonitoring.recordMetric('api_response_time', responseTime)

        // Return appropriate HTTP status based on health
        const httpStatus = overallStatus === 'unhealthy' ? 503 : 
                          overallStatus === 'degraded' ? 200 : 200

        return NextResponse.json(response, { 
          status: httpStatus,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Health-Status': overallStatus,
            'X-Response-Time': responseTime.toString(),
            'X-Correlation-ID': correlationId
          }
        })
      } catch (error) {
        span.recordException(error as Error)
        
        logger.error('Health check failed', {
          component: 'health_check',
          correlationId,
          metadata: { error: (error as Error).message }
        })

        const errorResponse: SystemHealthResponse = {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          services: [{
            service: 'health-endpoint',
            status: 'unhealthy',
            message: `Health check endpoint error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date().toISOString()
          }],
          circuitBreakers: [],
          sla: [],
          environment: process.env.NODE_ENV || 'unknown',
          version: process.env.npm_package_version || '0.1.0',
          responseTime: Date.now() - startTime
        }

        return NextResponse.json(errorResponse, { 
          status: 503,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
      }
    },
    { endpoint: '/api/health', method: 'GET' }
  )
}

async function checkExternalServices(): Promise<{ success: boolean; message: string }> {
  try {
    const checks = []
    
    // Check Amadeus API availability
    if (process.env.AMADEUS_CLIENT_ID) {
      const amadeusCheck = fetch('https://api.amadeus.com', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      }).then(res => ({ service: 'amadeus', success: res.ok }))
        .catch(() => ({ service: 'amadeus', success: false }))
      
      checks.push(amadeusCheck)
    }
    
    const results = await Promise.all(checks)
    const failedServices = results.filter(r => !r.success)
    
    if (failedServices.length > 0) {
      return {
        success: false,
        message: `External services unhealthy: ${failedServices.map(f => f.service).join(', ')}`
      }
    }
    
    return {
      success: true,
      message: `${results.length} external services healthy`
    }
  } catch (error) {
    return {
      success: false,
      message: `External service check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// Health check should only support GET requests
export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}