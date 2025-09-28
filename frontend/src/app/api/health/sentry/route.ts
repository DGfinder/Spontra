import { NextRequest, NextResponse } from 'next/server'
import { checkSentryConfig } from '@/lib/sentry'

export interface SentryHealthResponse {
  status: 'healthy' | 'unhealthy' | 'not_configured'
  timestamp: string
  configuration: {
    configured: boolean
    environment: string
    message: string
  }
  features?: {
    errorTracking: boolean
    performanceMonitoring: boolean
    sessionReplay: boolean
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<SentryHealthResponse>> {
  try {
    const config = checkSentryConfig()
    
    let status: 'healthy' | 'unhealthy' | 'not_configured'
    let features
    
    if (!config.configured) {
      status = 'not_configured'
    } else {
      status = 'healthy'
      features = {
        errorTracking: true,
        performanceMonitoring: true,
        sessionReplay: process.env.NODE_ENV === 'production'
      }
    }

    const response: SentryHealthResponse = {
      status,
      timestamp: new Date().toISOString(),
      configuration: config,
      features
    }

    const httpStatus = status === 'healthy' ? 200 : 
                      status === 'not_configured' ? 200 : 503

    return NextResponse.json(response, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    const errorResponse: SentryHealthResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      configuration: {
        configured: false,
        environment: process.env.NODE_ENV || 'unknown',
        message: `Sentry health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
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

// Only support GET for health checks
export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}