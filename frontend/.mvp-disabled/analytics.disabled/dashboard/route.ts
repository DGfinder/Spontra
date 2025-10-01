import { NextRequest, NextResponse } from 'next/server'
import { cacheGet } from '@/lib/cacheServer'
import { telemetry } from '@/lib/serverActionsTelemetry'

export const runtime = 'nodejs'

interface DashboardMetrics {
  // Core Web Vitals
  coreWebVitals: {
    lcp: { p50: number; p75: number; p95: number; status: 'good' | 'needs-improvement' | 'poor' }
    inp: { p50: number; p75: number; p95: number; status: 'good' | 'needs-improvement' | 'poor' }
    cls: { p50: number; p75: number; p95: number; status: 'good' | 'needs-improvement' | 'poor' }
    fcp: { p50: number; p75: number; p95: number }
    ttfb: { p50: number; p75: number; p95: number }
  }
  
  // Server Actions Performance
  serverActions: {
    overview: {
      totalActions: number
      totalExecutions: number
      averageSuccessRate: number
      averageP95: number
    }
    topActions: Array<{
      name: string
      count: number
      p95: number
      errorRate: number
      status: string
    }>
  }
  
  // Bundle Analysis
  bundles: {
    homepage: { size: number; budget: number; status: 'pass' | 'fail' }
    flights: { size: number; budget: number; status: 'pass' | 'fail' }
    booking: { size: number; budget: number; status: 'pass' | 'fail' }
    total: { size: number; budget: number; status: 'pass' | 'fail' }
  }
  
  // Cache Performance
  cache: {
    hitRate: number
    avgResponseTime: { hit: number; miss: number }
    routes: Record<string, { hitRate: number; requests: number }>
  }
  
  // Health Score
  healthScore: {
    overall: number
    breakdown: {
      performance: number
      reliability: number
      user_experience: number
    }
  }
  
  lastUpdated: number
}

function calculateCWVStatus(metric: string, p75: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = {
    lcp: { good: 2500, poor: 4000 },
    inp: { good: 200, poor: 500 },
    cls: { good: 0.1, poor: 0.25 }
  }
  
  const threshold = thresholds[metric as keyof typeof thresholds]
  if (!threshold) return 'good'
  
  if (p75 <= threshold.good) return 'good'
  if (p75 <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

function calculateHealthScore(metrics: Partial<DashboardMetrics>): DashboardMetrics['healthScore'] {
  let performanceScore = 100
  let reliabilityScore = 100
  let userExperienceScore = 100
  
  // Performance scoring (Core Web Vitals)
  if (metrics.coreWebVitals) {
    const cwv = metrics.coreWebVitals
    const lcpScore = cwv.lcp.status === 'good' ? 100 : cwv.lcp.status === 'needs-improvement' ? 75 : 25
    const inpScore = cwv.inp.status === 'good' ? 100 : cwv.inp.status === 'needs-improvement' ? 75 : 25
    const clsScore = cwv.cls.status === 'good' ? 100 : cwv.cls.status === 'needs-improvement' ? 75 : 25
    
    performanceScore = (lcpScore + inpScore + clsScore) / 3
  }
  
  // Reliability scoring (Server Actions + Cache)
  if (metrics.serverActions && metrics.cache) {
    const actionsScore = Math.min(100, metrics.serverActions.overview.averageSuccessRate)
    const cacheScore = Math.min(100, (metrics.cache.hitRate / 80) * 100) // 80% target
    
    reliabilityScore = (actionsScore + cacheScore) / 2
  }
  
  // User Experience scoring (Bundle size + Response times)
  if (metrics.bundles && metrics.cache) {
    const bundleScore = Object.values(metrics.bundles).every(b => b.status === 'pass') ? 100 : 50
    const responseScore = metrics.cache.avgResponseTime.hit < 200 ? 100 : 75
    
    userExperienceScore = (bundleScore + responseScore) / 2
  }
  
  const overall = (performanceScore + reliabilityScore + userExperienceScore) / 3
  
  return {
    overall: Math.round(overall),
    breakdown: {
      performance: Math.round(performanceScore),
      reliability: Math.round(reliabilityScore),
      user_experience: Math.round(userExperienceScore)
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const timeRange = searchParams.get('timeRange') || '24h'
    
    // Fetch performance metrics
    const performanceRaw = await cacheGet('performance:aggregates').catch(() => null)
    const performance = performanceRaw ? JSON.parse(performanceRaw) : null
    
    // Fetch Server Actions metrics
    const serverActionsMetrics = await telemetry.getMetrics()
    
    // Mock bundle data (in real implementation, this would come from build artifacts)
    const bundleData = {
      homepage: { size: 118000, budget: 120000, status: 'pass' as const },
      flights: { size: 142000, budget: 150000, status: 'pass' as const },
      booking: { size: 175000, budget: 180000, status: 'pass' as const },
      total: { size: 435000, budget: 450000, status: 'pass' as const }
    }
    
    // Mock cache data (would come from Redis/cache analytics)
    const cacheData = {
      hitRate: 84.5,
      avgResponseTime: { hit: 145, miss: 680 },
      routes: {
        '/': { hitRate: 92.1, requests: 25000 },
        '/api/destinations': { hitRate: 78.3, requests: 18000 },
        '/flights': { hitRate: 65.2, requests: 12000 }
      }
    }
    
    // Build Core Web Vitals summary
    const coreWebVitals = performance ? {
      lcp: {
        p50: performance.lcp.p50,
        p75: performance.lcp.p75,
        p95: performance.lcp.p95,
        status: calculateCWVStatus('lcp', performance.lcp.p75)
      },
      inp: {
        p50: performance.inp.p50,
        p75: performance.inp.p75,
        p95: performance.inp.p95,
        status: calculateCWVStatus('inp', performance.inp.p75)
      },
      cls: {
        p50: performance.cls.p50,
        p75: performance.cls.p75,
        p95: performance.cls.p95,
        status: calculateCWVStatus('cls', performance.cls.p75)
      },
      fcp: {
        p50: performance.fcp?.p50 || 0,
        p75: performance.fcp?.p75 || 0,
        p95: performance.fcp?.p95 || 0
      },
      ttfb: {
        p50: performance.ttfb?.p50 || 0,
        p75: performance.ttfb?.p75 || 0,
        p95: performance.ttfb?.p95 || 0
      }
    } : {
      lcp: { p50: 0, p75: 0, p95: 0, status: 'good' as const },
      inp: { p50: 0, p75: 0, p95: 0, status: 'good' as const },
      cls: { p50: 0, p75: 0, p95: 0, status: 'good' as const },
      fcp: { p50: 0, p75: 0, p95: 0 },
      ttfb: { p50: 0, p75: 0, p95: 0 }
    }
    
    // Build Server Actions summary
    const serverActions = serverActionsMetrics ? {
      overview: {
        totalActions: Object.keys(serverActionsMetrics.actions).length,
        totalExecutions: Object.values(serverActionsMetrics.actions).reduce((sum, action) => sum + action.count, 0),
        averageSuccessRate: Object.values(serverActionsMetrics.actions).reduce((sum, action) => sum + action.successRate, 0) / Object.keys(serverActionsMetrics.actions).length || 0,
        averageP95: Object.values(serverActionsMetrics.actions).reduce((sum, action) => sum + action.p95, 0) / Object.keys(serverActionsMetrics.actions).length || 0
      },
      topActions: Object.entries(serverActionsMetrics.actions)
        .map(([name, data]) => ({
          name,
          count: data.count,
          p95: Math.round(data.p95),
          errorRate: Math.round(data.errorRate * 100) / 100,
          status: data.errorRate > 5 ? 'critical' : data.p95 > 1000 ? 'warning' : 'healthy'
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    } : {
      overview: { totalActions: 0, totalExecutions: 0, averageSuccessRate: 100, averageP95: 0 },
      topActions: []
    }
    
    const dashboardMetrics: DashboardMetrics = {
      coreWebVitals,
      serverActions,
      bundles: bundleData,
      cache: cacheData,
      healthScore: { overall: 0, breakdown: { performance: 0, reliability: 0, user_experience: 0 } },
      lastUpdated: Date.now()
    }
    
    // Calculate health score
    dashboardMetrics.healthScore = calculateHealthScore(dashboardMetrics)
    
    return NextResponse.json({
      status: 'success',
      data: dashboardMetrics,
      meta: {
        timeRange,
        generatedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    })
    
  } catch (error) {
    console.error('Performance dashboard error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to generate performance dashboard',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}