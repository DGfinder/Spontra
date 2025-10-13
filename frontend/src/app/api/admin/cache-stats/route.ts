import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCacheStats } from '@/lib/cache'
import { verifyAdminToken } from '@/lib/auth'

/**
 * GET /api/admin/cache-stats
 * Returns comprehensive cache performance metrics
 */
export async function GET(request: Request) {
  try {
    // Verify admin authentication
    const token = request.headers.get('cookie')?.split('auth_token=')[1]?.split(';')[0]

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    const user = await verifyAdminToken(token)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid or insufficient permissions' },
        { status: 403 }
      )
    }

    // Get database cache stats
    const cacheStats = await getCacheStats()

    // Get cache size/storage metrics
    const cacheSize = await db.$queryRaw<Array<{ total_size: bigint; entry_count: bigint }>>`
      SELECT
        pg_total_relation_size('"OfferCache"') as total_size,
        COUNT(*) as entry_count
      FROM "OfferCache"
    `

    // Get recent cache activity (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentActivity = await db.offerCache.groupBy({
      by: ['dataSource'],
      _count: {
        id: true
      },
      where: {
        createdAt: { gte: oneDayAgo }
      }
    })

    // Get average offer count and response times
    const aggregates = await db.offerCache.aggregate({
      _avg: {
        offerCount: true
      },
      _max: {
        createdAt: true
      },
      _min: {
        createdAt: true
      },
      where: {
        expiresAt: { gt: new Date() },
        isStale: false
      }
    })

    // Get most popular routes (top 10 cached queries)
    const popularRoutes = await db.offerCache.groupBy({
      by: ['queryHash'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10,
      where: {
        expiresAt: { gt: new Date() },
        isStale: false
      }
    })

    // Get sample queries for popular routes
    const popularRouteDetails = await Promise.all(
      popularRoutes.map(async (route) => {
        const sample = await db.offerCache.findFirst({
          where: { queryHash: route.queryHash },
          select: {
            query: true,
            offerCount: true,
            createdAt: true
          }
        })
        return {
          queryHash: route.queryHash,
          requestCount: route._count.id,
          query: sample?.query,
          offerCount: sample?.offerCount,
          lastCached: sample?.createdAt
        }
      })
    )

    // Calculate cost savings (estimated)
    const totalCacheHits = cacheStats.valid
    const amadeusApiCost = 0.00035 // $0.00035 per API call (estimated)
    const costSavings = totalCacheHits * amadeusApiCost

    // Calculate hit rate over time (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const dailyStats = await db.$queryRaw<
      Array<{
        date: Date
        total: bigint
        valid: bigint
      }>
    >`
      SELECT
        DATE("createdAt") as date,
        COUNT(*) as total,
        SUM(CASE WHEN "expiresAt" > NOW() AND "isStale" = false THEN 1 ELSE 0 END) as valid
      FROM "OfferCache"
      WHERE "createdAt" >= ${sevenDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date DESC
    `

    // Format response
    const response = {
      success: true,
      data: {
        // Overview metrics
        overview: {
          totalEntries: cacheStats.total,
          validEntries: cacheStats.valid,
          staleEntries: cacheStats.stale,
          expiredEntries: cacheStats.expired,
          hitRate: cacheStats.hitRate.toFixed(2),
          costSavings: costSavings.toFixed(2),
          storageSize: cacheSize[0]
            ? `${(Number(cacheSize[0].total_size) / 1024 / 1024).toFixed(2)} MB`
            : 'N/A'
        },

        // Performance metrics
        performance: {
          avgOffersPerCache: aggregates._avg.offerCount?.toFixed(0) || '0',
          oldestValidCache: aggregates._min.createdAt,
          newestCache: aggregates._max.createdAt,
          estimatedResponseTime: {
            redis: '~50ms',
            database: '~150ms',
            amadeus: '~2000ms'
          }
        },

        // Recent activity (24h)
        recentActivity: recentActivity.map((activity) => ({
          source: activity.dataSource,
          count: activity._count.id
        })),

        // Popular routes
        popularRoutes: popularRouteDetails.map((route) => {
          const query = route.query as any
          return {
            origin: query?.origin || 'N/A',
            destination: query?.destination || 'N/A',
            requestCount: route.requestCount,
            offerCount: route.offerCount || 0,
            lastCached: route.lastCached
          }
        }),

        // Hit rate trend (7 days)
        trend: dailyStats.map((day) => ({
          date: day.date.toISOString().split('T')[0],
          total: Number(day.total),
          valid: Number(day.valid),
          hitRate:
            Number(day.total) > 0 ? ((Number(day.valid) / Number(day.total)) * 100).toFixed(1) : '0'
        }))
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[API] Cache stats error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch cache stats'
      },
      { status: 500 }
    )
  }
}
