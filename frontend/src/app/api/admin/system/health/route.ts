import { NextRequest, NextResponse } from 'next/server'

import { AdminAuthError, requireAdminContext } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    await requireAdminContext(request)

    const systemHealth = {
      overall: 'unknown',
      services: [],
      performance: {
        cpu: null,
        memory: null,
        disk: null,
        database: {
          connections: null,
          queryTime: null,
          errorRate: null,
        },
        cache: {
          hitRate: null,
          memoryUsage: null,
        },
        api: {
          requestsPerSecond: null,
          averageResponseTime: null,
          errorRate: null,
        },
      },
      alerts: [],
      lastUpdated: new Date().toISOString(),
      monitoringEnabled: false,
      error: 'System health monitoring not configured',
    }

    return NextResponse.json(systemHealth)
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('System health API error:', error)
    return NextResponse.json(
      {
        overall: 'unknown',
        error: 'System health service unavailable',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 },
    )
  }
}
