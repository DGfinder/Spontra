import { NextRequest, NextResponse } from 'next/server'

export interface AnalyticsHealthResponse {
  status: 'healthy' | 'disabled' | 'unknown'
  timestamp: string
  configuration: {
    analyticsEnabled: boolean
    speedInsightsEnabled: boolean
    environment: string
  }
  features?: {
    customEvents: boolean
    pageTracking: boolean
    performanceMonitoring: boolean
    errorTracking: boolean
  }
}

function checkAnalyticsConfig() {
  const analyticsEnabled = process.env.NODE_ENV === 'production' || 
                          process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'
  
  return {
    analyticsEnabled,
    speedInsightsEnabled: true, // Vercel Speed Insights is always available
    environment: process.env.NODE_ENV || 'development',
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<AnalyticsHealthResponse>> {
  try {
    const config = checkAnalyticsConfig()
    
    let status: 'healthy' | 'disabled' | 'unknown'
    let features
    
    if (config.analyticsEnabled) {
      status = 'healthy'
      features = {
        customEvents: true,
        pageTracking: true,
        performanceMonitoring: true,
        errorTracking: true,
      }
    } else {
      status = 'disabled'
      features = {
        customEvents: false,
        pageTracking: false,
        performanceMonitoring: config.speedInsightsEnabled,
        errorTracking: false,
      }
    }

    const response: AnalyticsHealthResponse = {
      status,
      timestamp: new Date().toISOString(),
      configuration: config,
      features
    }

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    const errorResponse: AnalyticsHealthResponse = {
      status: 'unknown',
      timestamp: new Date().toISOString(),
      configuration: {
        analyticsEnabled: false,
        speedInsightsEnabled: false,
        environment: process.env.NODE_ENV || 'unknown',
      }
    }

    return NextResponse.json(errorResponse, { 
      status: 500,
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