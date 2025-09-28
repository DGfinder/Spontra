import { NextRequest, NextResponse } from 'next/server'
import { cacheSet, cacheGet } from '@/lib/cacheEdge'

export const runtime = 'edge'

interface PerformanceReport {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  navigationType: string
  entries: PerformanceEntry[]
  route: string
  userAgent: string
  connectionType: string
  deviceMemory: number
  hardwareConcurrency: number
  timestamp: number
  sessionId: string
  userId?: string
  navigationTiming?: PerformanceNavigationTiming
  isBot: boolean
  hasServiceWorker: boolean
  cacheStatus?: string
}

interface PerformanceAggregates {
  // Core Web Vitals
  lcp: { p50: number; p75: number; p95: number; count: number }
  inp: { p50: number; p75: number; p95: number; count: number }
  cls: { p50: number; p75: number; p95: number; count: number }
  fcp: { p50: number; p75: number; p95: number; count: number }
  ttfb: { p50: number; p75: number; p95: number; count: number }
  
  // Custom metrics
  hydration: { p50: number; p75: number; p95: number; count: number }
  routeChange: { p50: number; p75: number; p95: number; count: number }
  
  // By route breakdown
  routes: Record<string, {
    lcp: number[]
    inp: number[]
    cls: number[]
    count: number
  }>
  
  // Device/connection breakdown
  devices: Record<string, number>
  connections: Record<string, number>
  
  lastUpdated: number
}

function calculatePercentiles(values: number[]): { p50: number; p75: number; p95: number } {
  if (values.length === 0) return { p50: 0, p75: 0, p95: 0 }
  
  const sorted = values.slice().sort((a, b) => a - b)
  const p50 = sorted[Math.floor(sorted.length * 0.5)]
  const p75 = sorted[Math.floor(sorted.length * 0.75)]
  const p95 = sorted[Math.floor(sorted.length * 0.95)]
  
  return { p50, p75, p95 }
}

async function updateAggregates(report: PerformanceReport) {
  const cacheKey = 'performance:aggregates'
  const windowKey = `performance:window:${Math.floor(Date.now() / (5 * 60 * 1000))}` // 5-minute windows
  
  try {
    // Get current aggregates
    const existingRaw = await cacheGet(cacheKey).catch(() => null)
    const existing: PerformanceAggregates = existingRaw ? JSON.parse(existingRaw) : {
      lcp: { p50: 0, p75: 0, p95: 0, count: 0 },
      inp: { p50: 0, p75: 0, p95: 0, count: 0 },
      cls: { p50: 0, p75: 0, p95: 0, count: 0 },
      fcp: { p50: 0, p75: 0, p95: 0, count: 0 },
      ttfb: { p50: 0, p75: 0, p95: 0, count: 0 },
      hydration: { p50: 0, p75: 0, p95: 0, count: 0 },
      routeChange: { p50: 0, p75: 0, p95: 0, count: 0 },
      routes: {},
      devices: {},
      connections: {},
      lastUpdated: Date.now()
    }

    // Get raw values for this window
    const windowDataRaw = await cacheGet(windowKey).catch(() => null)
    const windowData: Record<string, number[]> = windowDataRaw ? JSON.parse(windowDataRaw) : {}
    
    // Add new value to window
    if (!windowData[report.name]) windowData[report.name] = []
    windowData[report.name].push(report.value)
    
    // Keep only last 100 values per metric for performance
    if (windowData[report.name].length > 100) {
      windowData[report.name] = windowData[report.name].slice(-100)
    }
    
    // Update route-specific data
    if (!existing.routes[report.route]) {
      existing.routes[report.route] = { lcp: [], inp: [], cls: [], count: 0 }
    }
    
    if (['lcp', 'inp', 'cls'].includes(report.name)) {
      const routeData = existing.routes[report.route]
      if (!routeData[report.name as keyof typeof routeData]) {
        (routeData[report.name as keyof typeof routeData] as number[]) = []
      }
      ;(routeData[report.name as keyof typeof routeData] as number[]).push(report.value)
      
      // Keep only last 50 values per route metric
      if ((routeData[report.name as keyof typeof routeData] as number[]).length > 50) {
        (routeData[report.name as keyof typeof routeData] as number[]) = 
          (routeData[report.name as keyof typeof routeData] as number[]).slice(-50)
      }
    }
    
    existing.routes[report.route].count++
    
    // Update device/connection stats
    const deviceType = report.deviceMemory > 4 ? 'high-end' : 
                      report.deviceMemory > 2 ? 'mid-tier' : 'low-end'
    existing.devices[deviceType] = (existing.devices[deviceType] || 0) + 1
    existing.connections[report.connectionType] = (existing.connections[report.connectionType] || 0) + 1
    
    // Recalculate percentiles for each metric
    if (windowData[report.name]) {
      const percentiles = calculatePercentiles(windowData[report.name])
      if (existing[report.name as keyof PerformanceAggregates]) {
        const metric = existing[report.name as keyof PerformanceAggregates] as any
        metric.p50 = percentiles.p50
        metric.p75 = percentiles.p75
        metric.p95 = percentiles.p95
        metric.count = windowData[report.name].length
      }
    }
    
    existing.lastUpdated = Date.now()
    
    // Cache updated data
    await cacheSet(cacheKey, JSON.stringify(existing), { ttlSeconds: 3600 }) // 1 hour
    await cacheSet(windowKey, JSON.stringify(windowData), { ttlSeconds: 600 }) // 10 minutes
    
  } catch (error) {
    console.error('Failed to update performance aggregates:', error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const report: PerformanceReport = await req.json()
    
    // Basic validation
    if (!report.name || typeof report.value !== 'number' || !report.route) {
      return NextResponse.json(
        { error: 'Invalid performance report format' },
        { status: 400 }
      )
    }
    
    // Filter out bot traffic for cleaner metrics
    if (report.isBot) {
      return NextResponse.json({ ok: true, filtered: 'bot' })
    }
    
    // Update aggregates asynchronously
    updateAggregates(report).catch(console.error)
    
    // Log critical performance issues immediately
    if (report.rating === 'poor' && ['lcp', 'inp', 'cls'].includes(report.name)) {
      console.warn(`🚨 Poor ${report.name.toUpperCase()}: ${report.value}ms on ${report.route} (${report.userAgent})`)
    }
    
    return NextResponse.json({ ok: true, received: report.name })
    
  } catch (error) {
    console.error('Performance analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to process performance report' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const route = searchParams.get('route')
    const metric = searchParams.get('metric')
    
    const cacheKey = 'performance:aggregates'
    const dataRaw = await cacheGet(cacheKey).catch(() => null)
    
    if (!dataRaw) {
      return NextResponse.json({
        message: 'No performance data available yet',
        routes: {},
        aggregates: {}
      })
    }
    
    const data: PerformanceAggregates = JSON.parse(dataRaw)
    
    // Filter by route if requested
    if (route) {
      const routeData = data.routes[route]
      if (!routeData) {
        return NextResponse.json({ error: 'Route not found' }, { status: 404 })
      }
      
      return NextResponse.json({
        route,
        data: routeData,
        lastUpdated: data.lastUpdated
      })
    }
    
    // Filter by metric if requested
    if (metric) {
      const metricData = data[metric as keyof PerformanceAggregates]
      if (!metricData) {
        return NextResponse.json({ error: 'Metric not found' }, { status: 404 })
      }
      
      return NextResponse.json({
        metric,
        data: metricData,
        lastUpdated: data.lastUpdated
      })
    }
    
    // Return summary dashboard data
    const summary = {
      coreWebVitals: {
        lcp: data.lcp,
        inp: data.inp,
        cls: data.cls
      },
      loadingMetrics: {
        fcp: data.fcp,
        ttfb: data.ttfb,
        hydration: data.hydration
      },
      navigationMetrics: {
        routeChange: data.routeChange
      },
      breakdown: {
        topRoutes: Object.entries(data.routes)
          .sort(([,a], [,b]) => b.count - a.count)
          .slice(0, 10)
          .map(([route, stats]) => ({
            route,
            count: stats.count,
            avgLcp: stats.lcp.length ? stats.lcp.reduce((a, b) => a + b) / stats.lcp.length : 0
          })),
        devices: data.devices,
        connections: data.connections
      },
      lastUpdated: data.lastUpdated
    }
    
    return NextResponse.json(summary)
    
  } catch (error) {
    console.error('Performance analytics GET error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve performance data' },
      { status: 500 }
    )
  }
}