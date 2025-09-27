import { NextRequest, NextResponse } from 'next/server'
import { checkDatabaseConnection, getDatabaseStats } from '@/lib/db'

export interface DatabaseHealthResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  connectionStatus: {
    success: boolean
    message: string
    responseTime: number
  }
  statistics?: {
    activeConnections?: number
    totalConnections?: number
    databaseSize?: string
    uptime?: string
  }
  error?: string
}

export async function GET(request: NextRequest): Promise<NextResponse<DatabaseHealthResponse>> {
  const startTime = Date.now()
  
  try {
    // Test basic connection
    const connectionResult = await checkDatabaseConnection()
    const responseTime = Date.now() - startTime
    
    let statistics
    try {
      // Try to get additional database statistics
      statistics = await getDatabaseStats()
    } catch (error) {
      // Statistics are optional - don't fail the health check if they're unavailable
      console.warn('Could not retrieve database statistics:', error)
    }

    const response: DatabaseHealthResponse = {
      status: connectionResult.success ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      connectionStatus: {
        success: connectionResult.success,
        message: connectionResult.message,
        responseTime
      }
    }

    if (statistics) {
      response.statistics = statistics
    }

    const httpStatus = connectionResult.success ? 200 : 503

    return NextResponse.json(response, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    const responseTime = Date.now() - startTime
    
    const errorResponse: DatabaseHealthResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      connectionStatus: {
        success: false,
        message: 'Database health check failed',
        responseTime
      },
      error: error instanceof Error ? error.message : 'Unknown error'
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