/**
 * Business Metrics Service
 * Provides comprehensive analytics for conversion rates, revenue tracking, and performance metrics
 */

import { prisma } from '@/lib/db'
import { trackDatabaseOperation, metrics } from '@/lib/telemetry'
import { sentryHelpers } from '@/lib/sentry'

export interface ConversionMetrics {
  totalClicks: number
  totalConversions: number
  totalRevenue: number
  conversionRate: number
  averageEPC: number
  averageOrderValue: number
  period: string
  generatedAt: string
}

export interface ProviderMetrics {
  provider: string
  clicks: number
  conversions: number
  revenue: number
  conversionRate: number
  epc: number
  marketShare: number
  trend: 'up' | 'down' | 'stable'
  changePctVs7d: number
}

export interface RouteMetrics {
  route: string
  origin: string
  destination: string
  clicks: number
  conversions: number
  revenue: number
  conversionRate: number
  averagePrice: number
  popularity: number
  trend: 'up' | 'down' | 'stable'
  changePctVs7d: number
}

export interface RevenueBreakdown {
  totalRevenue: number
  revenueByProvider: Record<string, number>
  revenueByRoute: Record<string, number>
  revenueByDay: Array<{ date: string; revenue: number; clicks: number; conversions: number }>
  commission: number
  commissionRate: number
}

export interface PerformanceMetrics {
  searchesToClicks: number
  clicksToConversions: number
  avgTimeToConversion: number
  bounceRate: number
  returnUserRate: number
  mobileConversionRate: number
  desktopConversionRate: number
}

export class BusinessMetricsService {
  /**
   * Get comprehensive conversion metrics for a given period
   */
  async getConversionMetrics(
    period: '1h' | '24h' | '7d' | '30d' = '24h',
    filters: {
      provider?: string
      route?: string
      country?: string
    } = {}
  ): Promise<ConversionMetrics> {
    return trackDatabaseOperation(
      'conversion_metrics',
      'analytics',
      async () => {
        const timeFilter = this.getTimeFilter(period)
        
        // Build where conditions
        const whereConditions: any = {
          timestamp: { gte: timeFilter }
        }
        
        if (filters.provider) {
          whereConditions.provider = filters.provider
        }
        
        if (filters.route) {
          const [origin, destination] = filters.route.split('-')
          whereConditions.origin = origin
          whereConditions.destination = destination
        }

        // Get click metrics
        const clickStats = await prisma.clickEvent.aggregate({
          where: whereConditions,
          _count: { id: true },
          _sum: { price: true },
          _avg: { price: true }
        })

        // Get conversion metrics
        const conversionStats = await prisma.conversionEvent.aggregate({
          where: {
            timestamp: { gte: timeFilter },
            clickEvent: whereConditions
          },
          _count: { id: true },
          _sum: { total_price: true, commission: true },
          _avg: { total_price: true }
        })

        const totalClicks = clickStats._count.id || 0
        const totalConversions = conversionStats._count.id || 0
        const totalRevenue = conversionStats._sum.commission || 0
        const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0
        const averageEPC = totalClicks > 0 ? totalRevenue / totalClicks : 0
        const averageOrderValue = totalConversions > 0 ? (conversionStats._sum.total_price || 0) / totalConversions : 0

        // Record metrics
        metrics.recordGauge('business.conversion_rate', conversionRate, {
          period,
          provider: filters.provider || 'all'
        })
        
        metrics.recordGauge('business.epc', averageEPC, {
          period,
          provider: filters.provider || 'all'
        })

        return {
          totalClicks,
          totalConversions,
          totalRevenue,
          conversionRate,
          averageEPC,
          averageOrderValue,
          period,
          generatedAt: new Date().toISOString()
        }
      }
    )
  }

  /**
   * Get provider performance metrics with comparison
   */
  async getProviderMetrics(
    period: '1h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<ProviderMetrics[]> {
    return trackDatabaseOperation(
      'provider_metrics',
      'analytics',
      async () => {
        const timeFilter = this.getTimeFilter(period)
        const previousTimeFilter = this.getPreviousTimeFilter(period)

        // Current period metrics
        const currentStats = await prisma.$queryRaw<Array<{
          provider: string
          clicks: bigint
          conversions: bigint
          revenue: number
        }>>`
          SELECT 
            ce.provider,
            COUNT(ce.id)::bigint as clicks,
            COUNT(conv.id)::bigint as conversions,
            COALESCE(SUM(conv.commission), 0) as revenue
          FROM click_events ce
          LEFT JOIN conversion_events conv ON conv.click_id = ce.id
          WHERE ce.timestamp >= ${timeFilter}
          GROUP BY ce.provider
          ORDER BY revenue DESC
        `

        // Previous period metrics for trend calculation
        const previousStats = await prisma.$queryRaw<Array<{
          provider: string
          clicks: bigint
          revenue: number
        }>>`
          SELECT 
            ce.provider,
            COUNT(ce.id)::bigint as clicks,
            COALESCE(SUM(conv.commission), 0) as revenue
          FROM click_events ce
          LEFT JOIN conversion_events conv ON conv.click_id = ce.id
          WHERE ce.timestamp >= ${previousTimeFilter} AND ce.timestamp < ${timeFilter}
          GROUP BY ce.provider
        `

        // Calculate total revenue for market share
        const totalRevenue = currentStats.reduce((sum, stat) => sum + stat.revenue, 0)

        // Create lookup for previous stats
        const previousStatsMap = new Map(
          previousStats.map(stat => [stat.provider, stat])
        )

        return currentStats.map(stat => {
          const clicks = Number(stat.clicks)
          const conversions = Number(stat.conversions)
          const revenue = stat.revenue
          const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0
          const epc = clicks > 0 ? revenue / clicks : 0
          const marketShare = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0

          // Calculate trend
          const previousStat = previousStatsMap.get(stat.provider)
          const previousRevenue = previousStat?.revenue || 0
          const changePctVs7d = previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0
          
          let trend: 'up' | 'down' | 'stable' = 'stable'
          if (changePctVs7d > 5) trend = 'up'
          else if (changePctVs7d < -5) trend = 'down'

          // Record provider-specific metrics
          metrics.recordGauge('business.provider.conversion_rate', conversionRate, {
            provider: stat.provider,
            period
          })
          
          metrics.recordGauge('business.provider.epc', epc, {
            provider: stat.provider,
            period
          })

          return {
            provider: stat.provider,
            clicks,
            conversions,
            revenue,
            conversionRate,
            epc,
            marketShare,
            trend,
            changePctVs7d
          }
        })
      }
    )
  }

  /**
   * Get route performance metrics
   */
  async getRouteMetrics(
    period: '1h' | '24h' | '7d' | '30d' = '24h',
    limit: number = 20
  ): Promise<RouteMetrics[]> {
    return trackDatabaseOperation(
      'route_metrics',
      'analytics',
      async () => {
        const timeFilter = this.getTimeFilter(period)
        const previousTimeFilter = this.getPreviousTimeFilter(period)

        // Current period route metrics
        const currentStats = await prisma.$queryRaw<Array<{
          origin: string
          destination: string
          clicks: bigint
          conversions: bigint
          revenue: number
          avg_price: number
        }>>`
          SELECT 
            ce.origin,
            ce.destination,
            COUNT(ce.id)::bigint as clicks,
            COUNT(conv.id)::bigint as conversions,
            COALESCE(SUM(conv.commission), 0) as revenue,
            COALESCE(AVG(ce.price), 0) as avg_price
          FROM click_events ce
          LEFT JOIN conversion_events conv ON conv.click_id = ce.id
          WHERE ce.timestamp >= ${timeFilter}
          GROUP BY ce.origin, ce.destination
          ORDER BY clicks DESC
          LIMIT ${limit}
        `

        // Previous period for trend calculation
        const previousStats = await prisma.$queryRaw<Array<{
          origin: string
          destination: string
          clicks: bigint
          revenue: number
        }>>`
          SELECT 
            ce.origin,
            ce.destination,
            COUNT(ce.id)::bigint as clicks,
            COALESCE(SUM(conv.commission), 0) as revenue
          FROM click_events ce
          LEFT JOIN conversion_events conv ON conv.click_id = ce.id
          WHERE ce.timestamp >= ${previousTimeFilter} AND ce.timestamp < ${timeFilter}
          GROUP BY ce.origin, ce.destination
        `

        // Calculate total clicks for popularity
        const totalClicks = currentStats.reduce((sum, stat) => sum + Number(stat.clicks), 0)

        // Create lookup for previous stats
        const previousStatsMap = new Map(
          previousStats.map(stat => [`${stat.origin}-${stat.destination}`, stat])
        )

        return currentStats.map(stat => {
          const route = `${stat.origin}-${stat.destination}`
          const clicks = Number(stat.clicks)
          const conversions = Number(stat.conversions)
          const revenue = stat.revenue
          const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0
          const averagePrice = stat.avg_price
          const popularity = totalClicks > 0 ? (clicks / totalClicks) * 100 : 0

          // Calculate trend
          const previousStat = previousStatsMap.get(route)
          const previousClicks = previousStat ? Number(previousStat.clicks) : 0
          const changePctVs7d = previousClicks > 0 ? ((clicks - previousClicks) / previousClicks) * 100 : 0
          
          let trend: 'up' | 'down' | 'stable' = 'stable'
          if (changePctVs7d > 10) trend = 'up'
          else if (changePctVs7d < -10) trend = 'down'

          return {
            route,
            origin: stat.origin,
            destination: stat.destination,
            clicks,
            conversions,
            revenue,
            conversionRate,
            averagePrice,
            popularity,
            trend,
            changePctVs7d
          }
        })
      }
    )
  }

  /**
   * Get detailed revenue breakdown
   */
  async getRevenueBreakdown(
    period: '1h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<RevenueBreakdown> {
    return trackDatabaseOperation(
      'revenue_breakdown',
      'analytics',
      async () => {
        const timeFilter = this.getTimeFilter(period)

        // Total revenue and commission
        const totalStats = await prisma.conversionEvent.aggregate({
          where: { timestamp: { gte: timeFilter } },
          _sum: { total_price: true, commission: true }
        })

        const totalRevenue = totalStats._sum.commission || 0
        const commission = totalStats._sum.commission || 0
        const totalBookingValue = totalStats._sum.total_price || 0
        const commissionRate = totalBookingValue > 0 ? (commission / totalBookingValue) * 100 : 0

        // Revenue by provider
        const revenueByProvider = await prisma.$queryRaw<Array<{
          provider: string
          revenue: number
        }>>`
          SELECT 
            ce.provider,
            COALESCE(SUM(conv.commission), 0) as revenue
          FROM click_events ce
          JOIN conversion_events conv ON conv.click_id = ce.id
          WHERE conv.timestamp >= ${timeFilter}
          GROUP BY ce.provider
          ORDER BY revenue DESC
        `

        // Revenue by route
        const revenueByRoute = await prisma.$queryRaw<Array<{
          route: string
          revenue: number
        }>>`
          SELECT 
            CONCAT(ce.origin, '-', ce.destination) as route,
            COALESCE(SUM(conv.commission), 0) as revenue
          FROM click_events ce
          JOIN conversion_events conv ON conv.click_id = ce.id
          WHERE conv.timestamp >= ${timeFilter}
          GROUP BY ce.origin, ce.destination
          ORDER BY revenue DESC
          LIMIT 10
        `

        // Daily revenue breakdown (for trends)
        const dailyRevenue = await prisma.$queryRaw<Array<{
          date: string
          revenue: number
          clicks: bigint
          conversions: bigint
        }>>`
          SELECT 
            DATE(conv.timestamp) as date,
            COALESCE(SUM(conv.commission), 0) as revenue,
            COUNT(DISTINCT ce.id)::bigint as clicks,
            COUNT(conv.id)::bigint as conversions
          FROM click_events ce
          JOIN conversion_events conv ON conv.click_id = ce.id
          WHERE conv.timestamp >= ${timeFilter}
          GROUP BY DATE(conv.timestamp)
          ORDER BY date DESC
        `

        return {
          totalRevenue,
          revenueByProvider: Object.fromEntries(
            revenueByProvider.map(item => [item.provider, item.revenue])
          ),
          revenueByRoute: Object.fromEntries(
            revenueByRoute.map(item => [item.route, item.revenue])
          ),
          revenueByDay: dailyRevenue.map(item => ({
            date: item.date,
            revenue: item.revenue,
            clicks: Number(item.clicks),
            conversions: Number(item.conversions)
          })),
          commission,
          commissionRate
        }
      }
    )
  }

  /**
   * Get advanced performance metrics
   */
  async getPerformanceMetrics(
    period: '1h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<PerformanceMetrics> {
    return trackDatabaseOperation(
      'performance_metrics',
      'analytics',
      async () => {
        const timeFilter = this.getTimeFilter(period)

        // Get search to click conversion
        const searchSessions = await prisma.searchSession.count({
          where: { created_at: { gte: timeFilter } }
        })

        const clicksFromSessions = await prisma.clickEvent.count({
          where: { 
            timestamp: { gte: timeFilter },
            session_id: { not: null }
          }
        })

        // Get click to conversion metrics
        const totalClicks = await prisma.clickEvent.count({
          where: { timestamp: { gte: timeFilter } }
        })

        const totalConversions = await prisma.conversionEvent.count({
          where: { timestamp: { gte: timeFilter } }
        })

        // Average time to conversion
        const avgConversionTime = await prisma.$queryRaw<Array<{
          avg_time: number
        }>>`
          SELECT AVG(
            EXTRACT(EPOCH FROM (conv.timestamp - ce.timestamp)) / 60
          ) as avg_time
          FROM click_events ce
          JOIN conversion_events conv ON conv.click_id = ce.id
          WHERE conv.timestamp >= ${timeFilter}
        `

        // Device-specific conversion rates
        const mobileConversions = await prisma.$queryRaw<Array<{
          conversions: bigint
          clicks: bigint
        }>>`
          SELECT 
            COUNT(conv.id)::bigint as conversions,
            COUNT(ce.id)::bigint as clicks
          FROM click_events ce
          LEFT JOIN conversion_events conv ON conv.click_id = ce.id
          WHERE ce.timestamp >= ${timeFilter}
          AND ce.device_type = 'mobile'
        `

        const desktopConversions = await prisma.$queryRaw<Array<{
          conversions: bigint
          clicks: bigint
        }>>`
          SELECT 
            COUNT(conv.id)::bigint as conversions,
            COUNT(ce.id)::bigint as clicks
          FROM click_events ce
          LEFT JOIN conversion_events conv ON conv.click_id = ce.id
          WHERE ce.timestamp >= ${timeFilter}
          AND ce.device_type = 'desktop'
        `

        const searchesToClicks = searchSessions > 0 ? (clicksFromSessions / searchSessions) * 100 : 0
        const clicksToConversions = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0
        const avgTimeToConversion = avgConversionTime[0]?.avg_time || 0

        const mobileStats = mobileConversions[0]
        const desktopStats = desktopConversions[0]
        
        const mobileConversionRate = Number(mobileStats?.clicks) > 0 ? 
          (Number(mobileStats.conversions) / Number(mobileStats.clicks)) * 100 : 0
        
        const desktopConversionRate = Number(desktopStats?.clicks) > 0 ? 
          (Number(desktopStats.conversions) / Number(desktopStats.clicks)) * 100 : 0

        return {
          searchesToClicks,
          clicksToConversions,
          avgTimeToConversion,
          bounceRate: 0, // Would need session tracking
          returnUserRate: 0, // Would need user tracking
          mobileConversionRate,
          desktopConversionRate
        }
      }
    )
  }

  /**
   * Get time filter for given period
   */
  private getTimeFilter(period: string): Date {
    const now = new Date()
    switch (period) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000)
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000)
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }
  }

  /**
   * Get previous period time filter for trend calculation
   */
  private getPreviousTimeFilter(period: string): Date {
    const now = new Date()
    switch (period) {
      case '1h':
        return new Date(now.getTime() - 2 * 60 * 60 * 1000)
      case '24h':
        return new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
      case '7d':
        return new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
      case '30d':
        return new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
      default:
        return new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    }
  }
}

// Export singleton instance
export const businessMetricsService = new BusinessMetricsService()