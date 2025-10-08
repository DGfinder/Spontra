'use server'

import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

/**
 * Get creator analytics data
 */
export async function getCreatorAnalytics(
  creatorId: string,
  dateRange: 'week' | 'month' | 'year' | 'all' = 'month'
) {
  try {
    const now = new Date()
    let startDate = new Date()

    switch (dateRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setDate(now.getDate() - 30)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case 'all':
        startDate = new Date(0) // Beginning of time
        break
    }

    // Get earnings timeline (daily)
    const earningsTimeline = await db.creatorEarning.groupBy({
      by: ['earnedAt'],
      where: {
        creatorId,
        earnedAt: { gte: startDate }
      },
      _sum: {
        amount: true
      },
      orderBy: {
        earnedAt: 'asc'
      }
    })

    // Get total metrics
    const [totalEarnings, totalViews, totalVideos, conversionData] = await Promise.all([
      db.creatorEarning.aggregate({
        where: { creatorId, earnedAt: { gte: startDate } },
        _sum: { amount: true },
        _count: true
      }),
      db.videoView.count({
        where: {
          creatorId,
          viewedAt: { gte: startDate }
        }
      }),
      db.pOIVideo.count({
        where: {
          creatorId,
          status: 'approved',
          createdAt: { gte: startDate }
        }
      }),
      // Get booking count (via affiliate clicks)
      db.creatorEarning.groupBy({
        by: ['affiliateClickId'],
        where: {
          creatorId,
          earnedAt: { gte: startDate },
          affiliateClickId: { not: null }
        }
      })
    ])

    return {
      success: true,
      data: {
        timeline: earningsTimeline.map(item => ({
          date: item.earnedAt.toISOString().split('T')[0],
          earnings: Number(item._sum.amount || 0)
        })),
        metrics: {
          totalEarnings: Number(totalEarnings._sum.amount || 0),
          totalBookings: conversionData.length,
          totalViews,
          totalVideos,
          conversionRate: totalViews > 0 ? (conversionData.length / totalViews) * 100 : 0
        }
      }
    }
  } catch (error) {
    console.error('[Analytics] Error fetching creator analytics:', error)
    return {
      success: false,
      error: 'Failed to fetch analytics'
    }
  }
}

/**
 * Get top performing videos for a creator
 */
export async function getTopVideos(creatorId: string, limit: number = 5) {
  try {
    const topVideos = await db.pOIVideo.findMany({
      where: {
        creatorId,
        status: 'approved'
      },
      include: {
        poi: {
          select: {
            name: true,
            destination: {
              select: {
                cityName: true,
                country: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            views: true,
            earnings: true
          }
        },
        earnings: {
          select: {
            amount: true
          }
        }
      },
      orderBy: {
        earnings: {
          _count: 'desc'
        }
      },
      take: limit
    })

    return {
      success: true,
      data: topVideos.map(video => ({
        id: video.id,
        videoUrl: video.videoUrl,
        poiName: video.poi.name,
        destination: `${video.poi.destination.cityName}, ${video.poi.destination.country?.name || ''}`,
        views: video._count.views,
        bookings: video._count.earnings,
        totalEarned: video.earnings.reduce((sum, e) => sum + Number(e.amount), 0)
      }))
    }
  } catch (error) {
    console.error('[Analytics] Error fetching top videos:', error)
    return {
      success: false,
      error: 'Failed to fetch top videos'
    }
  }
}

/**
 * Get earnings by destination for a creator
 */
export async function getEarningsByDestination(creatorId: string) {
  try {
    const earningsByDest = await db.$queryRaw<Array<{
      destination_id: string
      city_name: string
      country_name: string
      total_earnings: Prisma.Decimal
      booking_count: bigint
    }>>`
      SELECT
        d.id as destination_id,
        d.city_name,
        COALESCE(c.name, d.country_name) as country_name,
        COALESCE(SUM(ce.amount), 0) as total_earnings,
        COUNT(DISTINCT ce.affiliate_click_id) as booking_count
      FROM creator_earnings ce
      JOIN poi_videos pv ON ce.video_id = pv.id
      JOIN pois p ON pv.poi_id = p.id
      JOIN destinations d ON p.destination_id = d.id
      LEFT JOIN countries c ON d.country_id = c.id
      WHERE ce.creator_id = ${creatorId}
      GROUP BY d.id, d.city_name, c.name, d.country_name
      ORDER BY total_earnings DESC
      LIMIT 10
    `

    return {
      success: true,
      data: earningsByDest.map(row => ({
        destination: `${row.city_name}, ${row.country_name}`,
        earnings: Number(row.total_earnings),
        bookings: Number(row.booking_count)
      }))
    }
  } catch (error) {
    console.error('[Analytics] Error fetching earnings by destination:', error)
    return {
      success: false,
      error: 'Failed to fetch destination breakdown'
    }
  }
}

/**
 * Get platform-wide analytics (admin only)
 */
export async function getPlatformAnalytics(
  dateRange: 'week' | 'month' | 'year' | 'all' = 'month'
) {
  try {
    const now = new Date()
    let startDate = new Date()

    switch (dateRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setDate(now.getDate() - 30)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case 'all':
        startDate = new Date(0)
        break
    }

    // Get platform metrics
    const [
      totalCreators,
      activeCreators,
      totalVideos,
      pendingVideos,
      approvedVideos,
      totalViews,
      totalBookings,
      totalRevenue
    ] = await Promise.all([
      db.creator.count(),
      db.creator.count({
        where: {
          updatedAt: { gte: startDate }
        }
      }),
      db.pOIVideo.count(),
      db.pOIVideo.count({ where: { status: 'pending' } }),
      db.pOIVideo.count({ where: { status: 'approved' } }),
      db.videoView.count({
        where: { viewedAt: { gte: startDate } }
      }),
      db.affiliateClick.count({
        where: {
          converted: true,
          convertedAt: { gte: startDate }
        }
      }),
      db.creatorEarning.aggregate({
        where: { earnedAt: { gte: startDate } },
        _sum: { amount: true }
      })
    ])

    // Get creator growth timeline
    const creatorGrowth = await db.creator.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: true,
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Get top creators by earnings
    const topCreators = await db.creator.findMany({
      select: {
        id: true,
        displayName: true,
        tier: true,
        totalEarnings: true,
        isVerified: true,
        _count: {
          select: {
            videos: true,
            earnings: true
          }
        }
      },
      orderBy: {
        totalEarnings: 'desc'
      },
      take: 10
    })

    return {
      success: true,
      data: {
        metrics: {
          totalCreators,
          activeCreators,
          totalVideos,
          pendingVideos,
          approvedVideos,
          totalViews,
          totalBookings,
          totalRevenue: Number(totalRevenue._sum.amount || 0),
          conversionRate: totalViews > 0 ? (totalBookings / totalViews) * 100 : 0
        },
        creatorGrowth: creatorGrowth.map(item => ({
          date: item.createdAt.toISOString().split('T')[0],
          count: item._count
        })),
        topCreators: topCreators.map(creator => ({
          id: creator.id,
          displayName: creator.displayName,
          tier: creator.tier,
          totalEarnings: Number(creator.totalEarnings),
          isVerified: creator.isVerified,
          videoCount: creator._count.videos,
          bookingCount: creator._count.earnings
        }))
      }
    }
  } catch (error) {
    console.error('[Analytics] Error fetching platform analytics:', error)
    return {
      success: false,
      error: 'Failed to fetch platform analytics'
    }
  }
}

/**
 * Get moderation pipeline metrics (admin only)
 */
export async function getModerationMetrics() {
  try {
    const [statusCounts, recentActivity] = await Promise.all([
      db.pOIVideo.groupBy({
        by: ['status'],
        _count: true
      }),
      db.pOIVideo.findMany({
        where: {
          OR: [
            { status: 'approved' },
            { status: 'rejected' }
          ],
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        select: {
          status: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    ])

    // Calculate approval rate
    const approved = statusCounts.find(s => s.status === 'approved')?._count || 0
    const rejected = statusCounts.find(s => s.status === 'rejected')?._count || 0
    const total = approved + rejected
    const approvalRate = total > 0 ? (approved / total) * 100 : 0

    // Group recent activity by day
    const activityByDay = recentActivity.reduce((acc, video) => {
      const day = video.createdAt.toISOString().split('T')[0]
      if (!acc[day]) {
        acc[day] = { approved: 0, rejected: 0 }
      }
      if (video.status === 'approved') {
        acc[day].approved++
      } else {
        acc[day].rejected++
      }
      return acc
    }, {} as Record<string, { approved: number; rejected: number }>)

    return {
      success: true,
      data: {
        statusCounts: statusCounts.map(s => ({
          status: s.status,
          count: s._count
        })),
        approvalRate,
        recentActivity: Object.entries(activityByDay).map(([date, counts]) => ({
          date,
          ...counts
        }))
      }
    }
  } catch (error) {
    console.error('[Analytics] Error fetching moderation metrics:', error)
    return {
      success: false,
      error: 'Failed to fetch moderation metrics'
    }
  }
}
