import { NextRequest, NextResponse } from 'next/server'
import { telemetry } from '@/lib/serverActionsTelemetry'

export const runtime = 'edge'

interface ServerActionMetrics {
  name: string
  duration: number
  success: boolean
  errorMessage?: string
  userAgent?: string
  route?: string
  userId?: string
  cacheHit?: boolean
  dbQueryCount?: number
  timestamp: number
}

export async function POST(req: NextRequest) {
  try {
    const metrics: ServerActionMetrics = await req.json()
    
    // Basic validation
    if (!metrics.name || typeof metrics.duration !== 'number') {
      return NextResponse.json(
        { error: 'Invalid server action metrics format' },
        { status: 400 }
      )
    }
    
    // Log performance issues immediately
    if (!metrics.success) {
      console.error(`🚨 Server Action Failed: ${metrics.name} - ${metrics.errorMessage}`)
    } else if (metrics.duration > 1000) {
      console.warn(`⚠️ Slow Server Action: ${metrics.name} took ${metrics.duration}ms`)
    }
    
    // Record success
    return NextResponse.json({ 
      ok: true, 
      received: metrics.name,
      duration: metrics.duration 
    })
    
  } catch (error) {
    console.error('Server Actions analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to process server action metrics' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')
    
    const metrics = await telemetry.getMetrics()
    
    if (!metrics) {
      return NextResponse.json({
        message: 'No server action metrics available yet',
        actions: {}
      })
    }
    
    // Filter by specific action if requested
    if (action) {
      const actionData = metrics.actions[action]
      if (!actionData) {
        return NextResponse.json({ error: 'Action not found' }, { status: 404 })
      }
      
      return NextResponse.json({
        action,
        data: actionData,
        lastUpdated: metrics.lastUpdated
      })
    }
    
    // Return dashboard summary
    const summary = {
      overview: {
        totalActions: Object.keys(metrics.actions).length,
        totalExecutions: Object.values(metrics.actions).reduce((sum, action) => sum + action.count, 0),
        averageSuccessRate: Object.values(metrics.actions).reduce((sum, action) => sum + action.successRate, 0) / Object.keys(metrics.actions).length || 0,
        averageP95: Object.values(metrics.actions).reduce((sum, action) => sum + action.p95, 0) / Object.keys(metrics.actions).length || 0
      },
      actions: Object.entries(metrics.actions)
        .map(([name, data]) => ({
          name,
          count: data.count,
          successRate: Math.round(data.successRate * 100) / 100,
          p50: Math.round(data.p50),
          p75: Math.round(data.p75),
          p95: Math.round(data.p95),
          errorRate: Math.round(data.errorRate * 100) / 100,
          lastError: data.lastError,
          status: data.errorRate > 5 ? 'critical' : data.p95 > 1000 ? 'warning' : 'healthy'
        }))
        .sort((a, b) => b.count - a.count), // Sort by usage
      
      // Performance insights
      insights: {
        slowestActions: Object.entries(metrics.actions)
          .filter(([, data]) => data.p95 > 500)
          .map(([name, data]) => ({ name, p95: data.p95 }))
          .sort((a, b) => b.p95 - a.p95)
          .slice(0, 5),
        
        errorProneActions: Object.entries(metrics.actions)
          .filter(([, data]) => data.errorRate > 1)
          .map(([name, data]) => ({ name, errorRate: data.errorRate, lastError: data.lastError }))
          .sort((a, b) => b.errorRate - a.errorRate)
          .slice(0, 5),
        
        mostUsedActions: Object.entries(metrics.actions)
          .map(([name, data]) => ({ name, count: data.count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      },
      
      lastUpdated: metrics.lastUpdated
    }
    
    return NextResponse.json(summary)
    
  } catch (error) {
    console.error('Server Actions analytics GET error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve server action metrics' },
      { status: 500 }
    )
  }
}