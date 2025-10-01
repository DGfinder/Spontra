/**
 * Prometheus Metrics Endpoint
 *
 * Exposes application metrics in Prometheus format for Grafana/monitoring
 */

import { NextResponse } from 'next/server'
import { db } from '@/server/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const metrics: string[] = []

    // Application info
    metrics.push('# HELP spontra_info Application information')
    metrics.push('# TYPE spontra_info gauge')
    metrics.push(`spontra_info{version="${process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}",environment="${process.env.NODE_ENV}"} 1`)

    // Uptime
    metrics.push('')
    metrics.push('# HELP spontra_uptime_seconds Application uptime in seconds')
    metrics.push('# TYPE spontra_uptime_seconds gauge')
    metrics.push(`spontra_uptime_seconds ${process.uptime()}`)

    // Memory usage
    const memUsage = process.memoryUsage()
    metrics.push('')
    metrics.push('# HELP spontra_memory_heap_used_bytes Heap memory used in bytes')
    metrics.push('# TYPE spontra_memory_heap_used_bytes gauge')
    metrics.push(`spontra_memory_heap_used_bytes ${memUsage.heapUsed}`)

    metrics.push('')
    metrics.push('# HELP spontra_memory_heap_total_bytes Total heap memory in bytes')
    metrics.push('# TYPE spontra_memory_heap_total_bytes gauge')
    metrics.push(`spontra_memory_heap_total_bytes ${memUsage.heapTotal}`)

    // Database metrics
    const dbMetrics = await getDatabaseMetrics()
    metrics.push(...dbMetrics)

    // Metasearch metrics
    const metasearchMetrics = await getMetasearchMetrics()
    metrics.push(...metasearchMetrics)

    // Cache metrics
    const cacheMetrics = await getCacheMetrics()
    metrics.push(...cacheMetrics)

    return new NextResponse(metrics.join('\n'), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (error) {
    console.error('[Metrics] Error generating metrics:', error)
    return new NextResponse('Error generating metrics', { status: 500 })
  }
}

async function getDatabaseMetrics(): Promise<string[]> {
  const metrics: string[] = []

  try {
    // Total clicks (last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const clickCount = await db.click.count({
      where: { createdAt: { gte: oneDayAgo } }
    })

    metrics.push('')
    metrics.push('# HELP spontra_clicks_total_24h Total clicks in last 24 hours')
    metrics.push('# TYPE spontra_clicks_total_24h gauge')
    metrics.push(`spontra_clicks_total_24h ${clickCount}`)

    // Total conversions (last 24h)
    const conversionCount = await db.conversion.count({
      where: {
        createdAt: { gte: oneDayAgo },
        status: 'APPROVED'
      }
    })

    metrics.push('')
    metrics.push('# HELP spontra_conversions_total_24h Total conversions in last 24 hours')
    metrics.push('# TYPE spontra_conversions_total_24h gauge')
    metrics.push(`spontra_conversions_total_24h ${conversionCount}`)

    // Conversion rate
    const conversionRate = clickCount > 0 ? (conversionCount / clickCount) * 100 : 0

    metrics.push('')
    metrics.push('# HELP spontra_conversion_rate_percent Conversion rate percentage')
    metrics.push('# TYPE spontra_conversion_rate_percent gauge')
    metrics.push(`spontra_conversion_rate_percent ${conversionRate.toFixed(2)}`)

  } catch (error) {
    console.error('[Metrics] Database metrics error:', error)
  }

  return metrics
}

async function getMetasearchMetrics(): Promise<string[]> {
  const metrics: string[] = []

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // Provider EPC metrics
    const providerMetrics = await db.$queryRaw<Array<{
      provider_id: string
      click_count: bigint
      total_commission: number
    }>>`
      SELECT
        p."providerId" as provider_id,
        COUNT(DISTINCT c.id) as click_count,
        COALESCE(SUM(conv.commission), 0) as total_commission
      FROM providers p
      LEFT JOIN clicks c ON c."providerRef" = p.id
        AND c."createdAt" >= ${sevenDaysAgo}
      LEFT JOIN conversions conv ON conv."clickId" = c."clickId"
        AND conv.status = 'APPROVED'
      WHERE p."isActive" = true
      GROUP BY p.id, p."providerId"
    `

    metrics.push('')
    metrics.push('# HELP spontra_provider_epc_7d Provider EPC over last 7 days')
    metrics.push('# TYPE spontra_provider_epc_7d gauge')

    for (const pm of providerMetrics) {
      const clickCount = Number(pm.click_count)
      const epc = clickCount > 0 ? pm.total_commission / clickCount : 0
      metrics.push(`spontra_provider_epc_7d{provider="${pm.provider_id}"} ${epc.toFixed(4)}`)
    }

    metrics.push('')
    metrics.push('# HELP spontra_provider_clicks_7d Provider clicks over last 7 days')
    metrics.push('# TYPE spontra_provider_clicks_7d gauge')

    for (const pm of providerMetrics) {
      metrics.push(`spontra_provider_clicks_7d{provider="${pm.provider_id}"} ${Number(pm.click_count)}`)
    }

  } catch (error) {
    console.error('[Metrics] Metasearch metrics error:', error)
  }

  return metrics
}

async function getCacheMetrics(): Promise<string[]> {
  const metrics: string[] = []

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    // Cache operations
    const cacheOps = await db.cacheAnalytics.groupBy({
      by: ['operation'],
      where: { recordedAt: { gte: oneHourAgo } },
      _count: true
    })

    metrics.push('')
    metrics.push('# HELP spontra_cache_operations_1h Cache operations in last hour')
    metrics.push('# TYPE spontra_cache_operations_1h gauge')

    for (const op of cacheOps) {
      metrics.push(`spontra_cache_operations_1h{operation="${op.operation}"} ${op._count}`)
    }

    // Cache hit rate
    const hits = cacheOps.find((op: any) => op.operation === 'hit')?._count || 0
    const misses = cacheOps.find((op: any) => op.operation === 'miss')?._count || 0
    const total = hits + misses
    const hitRate = total > 0 ? (hits / total) * 100 : 0

    metrics.push('')
    metrics.push('# HELP spontra_cache_hit_rate_percent Cache hit rate percentage')
    metrics.push('# TYPE spontra_cache_hit_rate_percent gauge')
    metrics.push(`spontra_cache_hit_rate_percent ${hitRate.toFixed(2)}`)

  } catch (error) {
    console.error('[Metrics] Cache metrics error:', error)
  }

  return metrics
}