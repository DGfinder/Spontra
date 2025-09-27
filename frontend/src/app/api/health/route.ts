import { NextRequest, NextResponse } from 'next/server'
import { checkDatabaseConnection } from '@/lib/db'
import { checkKVHealth } from '@/lib/cache'

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
  environment: string
  version: string
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
  const startTime = Date.now()
  
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
      })
    ])

    // Determine overall system status
    const unhealthyServices = healthChecks.filter(check => check.status === 'unhealthy')
    const degradedServices = healthChecks.filter(check => check.responseTime && check.responseTime > 5000)
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy'
    
    if (unhealthyServices.length > 0) {
      overallStatus = 'unhealthy'
    } else if (degradedServices.length > 0) {
      overallStatus = 'degraded'
    } else {
      overallStatus = 'healthy'
    }

    const response: SystemHealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: healthChecks,
      environment: process.env.NODE_ENV || 'unknown',
      version: process.env.npm_package_version || '0.1.0'
    }

    // Return appropriate HTTP status based on health
    const httpStatus = overallStatus === 'unhealthy' ? 503 : 
                      overallStatus === 'degraded' ? 200 : 200

    return NextResponse.json(response, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    const errorResponse: SystemHealthResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: [{
        service: 'health-endpoint',
        status: 'unhealthy',
        message: `Health check endpoint error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      }],
      environment: process.env.NODE_ENV || 'unknown',
      version: process.env.npm_package_version || '0.1.0'
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