/**
 * Provider Optimizer - EPC-based provider selection for maximum revenue
 *
 * This module implements intelligent provider routing based on:
 * - Expected EPC (earnings per click)
 * - Conversion rates
 * - Provider health/reliability
 * - Market-specific performance
 */

import { db } from '@/server/db'
import * as Sentry from '@sentry/nextjs'

export interface ProviderScore {
  providerId: string
  providerRef: string
  score: number
  epc: number
  conversionRate: number
  reliabilityScore: number
  market: string
}

export interface OptimizationContext {
  market: string
  route?: string // e.g., "LAX-JFK"
  cabinClass?: string
  userSegment?: string // premium, budget, frequent
}

/**
 * Get optimal provider based on EPC, conversion rate, and reliability
 */
export async function getOptimalProvider(
  context: OptimizationContext
): Promise<ProviderScore | null> {
  try {
    const providers = await getProviderPerformance(context)

    if (providers.length === 0) {
      Sentry.captureMessage('No providers available for market', {
        level: 'warning',
        extra: context
      })
      return null
    }

    // Calculate composite score for each provider
    const scoredProviders = providers.map(p => calculateProviderScore(p, context))

    // Sort by score descending
    scoredProviders.sort((a, b) => b.score - a.score)

    // Log selection for analytics
    await logProviderSelection(scoredProviders[0], context)

    return scoredProviders[0]
  } catch (error) {
    Sentry.captureException(error, {
      tags: { module: 'providerOptimizer' },
      extra: context
    })
    return null
  }
}

/**
 * Get provider performance metrics from database
 */
async function getProviderPerformance(
  context: OptimizationContext
): Promise<ProviderScore[]> {
  const { market } = context

  // Query clicks and conversions for last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const results = await db.$queryRaw<Array<{
    provider_id: string
    provider_ref: string
    market: string
    reliability_score: number
    click_count: bigint
    conversion_count: bigint
    total_commission: number
  }>>`
    SELECT
      p."providerId" as provider_id,
      p.id as provider_ref,
      p.market,
      p."reliabilityScore" as reliability_score,
      COUNT(DISTINCT c.id) as click_count,
      COUNT(DISTINCT conv.id) as conversion_count,
      COALESCE(SUM(conv.commission), 0) as total_commission
    FROM providers p
    LEFT JOIN clicks c ON c."providerRef" = p.id
      AND c."createdAt" >= ${sevenDaysAgo}
    LEFT JOIN conversions conv ON conv."clickId" = c."clickId"
      AND conv.status = 'APPROVED'
    WHERE p.market = ${market}
      AND p."isActive" = true
    GROUP BY p.id, p."providerId", p.market, p."reliabilityScore"
    ORDER BY p."expectedEPC" DESC
  `

  return results.map(r => {
    const clickCount = Number(r.click_count)
    const conversionCount = Number(r.conversion_count)
    const totalCommission = Number(r.total_commission)

    const epc = clickCount > 0 ? totalCommission / clickCount : 0
    const conversionRate = clickCount > 0 ? conversionCount / clickCount : 0

    return {
      providerId: r.provider_id,
      providerRef: r.provider_ref,
      market: r.market,
      epc,
      conversionRate,
      reliabilityScore: Number(r.reliability_score),
      score: 0 // Will be calculated
    }
  })
}

/**
 * Calculate composite score for provider selection
 *
 * Scoring formula:
 * score = (EPC * 0.5) + (ConversionRate * 100 * 0.3) + (ReliabilityScore * 20 * 0.2)
 */
function calculateProviderScore(
  provider: ProviderScore,
  _context: OptimizationContext
): ProviderScore {
  const epcWeight = 0.5
  const conversionWeight = 0.3
  const reliabilityWeight = 0.2

  // Normalize metrics to similar scales
  const epcScore = provider.epc // Already in currency units
  const conversionScore = provider.conversionRate * 100 // Convert to percentage
  const reliabilityScoreNormalized = provider.reliabilityScore * 20 // 0-1 to 0-20

  const score =
    (epcScore * epcWeight) +
    (conversionScore * conversionWeight) +
    (reliabilityScoreNormalized * reliabilityWeight)

  return {
    ...provider,
    score
  }
}

/**
 * Log provider selection for analytics
 */
async function logProviderSelection(
  provider: ProviderScore,
  context: OptimizationContext
): Promise<void> {
  try {
    // This could be sent to analytics service or logged for reporting
    console.log('[ProviderOptimizer] Selected provider:', {
      providerId: provider.providerId,
      market: context.market,
      score: provider.score,
      epc: provider.epc,
      conversionRate: provider.conversionRate
    })

    // Optional: Store in analytics table for reporting
    // await db.providerSelectionLog.create({ ... })
  } catch (error) {
    // Don't fail the main flow if logging fails
    console.error('[ProviderOptimizer] Failed to log selection:', error)
  }
}

/**
 * Update provider EPC based on actual performance
 * This should be run periodically (e.g., daily via cron)
 */
export async function updateProviderEPCs(): Promise<void> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const results = await db.$queryRaw<Array<{
      provider_ref: string
      click_count: bigint
      total_commission: number
    }>>`
      SELECT
        p.id as provider_ref,
        COUNT(DISTINCT c.id) as click_count,
        COALESCE(SUM(conv.commission), 0) as total_commission
      FROM providers p
      LEFT JOIN clicks c ON c."providerRef" = p.id
        AND c."createdAt" >= ${sevenDaysAgo}
      LEFT JOIN conversions conv ON conv."clickId" = c."clickId"
        AND conv.status = 'APPROVED'
      WHERE p."isActive" = true
      GROUP BY p.id
    `

    for (const result of results) {
      const clickCount = Number(result.click_count)
      const totalCommission = Number(result.total_commission)
      const epc = clickCount > 0 ? totalCommission / clickCount : 0

      await db.provider.update({
        where: { id: result.provider_ref },
        data: { expectedEPC: epc }
      })
    }

    console.log(`[ProviderOptimizer] Updated EPC for ${results.length} providers`)
  } catch (error) {
    Sentry.captureException(error, {
      tags: { module: 'providerOptimizer', operation: 'updateEPCs' }
    })
    throw error
  }
}

/**
 * Get provider health status (for monitoring)
 */
export async function getProviderHealthStatus(market?: string): Promise<Array<{
  providerId: string
  market: string
  isHealthy: boolean
  failureRate: number
  avgResponseTime: number
}>> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  const whereClause = market ? { providerId: market } : {}

  const results = await db.$queryRaw<Array<{
    provider_id: string
    market: string
    total_checks: bigint
    failed_checks: bigint
    avg_response_time: number
  }>>`
    SELECT
      sc."providerId" as provider_id,
      sc.market,
      COUNT(*) as total_checks,
      COUNT(*) FILTER (WHERE sc."isHealthy" = false) as failed_checks,
      AVG(sc."responseTimeMs")::int as avg_response_time
    FROM synthetic_checks sc
    WHERE sc."checkedAt" >= ${oneHourAgo}
    ${market ? db.$queryRaw`AND sc.market = ${market}` : db.$queryRaw``}
    GROUP BY sc."providerId", sc.market
  `

  return results.map(r => {
    const totalChecks = Number(r.total_checks)
    const failedChecks = Number(r.failed_checks)
    const failureRate = totalChecks > 0 ? failedChecks / totalChecks : 0

    return {
      providerId: r.provider_id,
      market: r.market,
      isHealthy: failureRate < 0.1, // Less than 10% failure rate
      failureRate,
      avgResponseTime: r.avg_response_time
    }
  })
}