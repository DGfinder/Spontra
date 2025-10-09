'use server'

import { db } from '@/lib/db'
import { getTierRate } from '@/lib/creator/tiers'

/**
 * Track a video view for attribution
 */
export async function trackVideoView(data: {
  userId?: string | null
  sessionId: string
  videoId: string
}) {
  try {
    // Get video with destination info
    const video = await db.pOIVideo.findUnique({
      where: { id: data.videoId },
      include: {
        poi: {
          select: {
            destinationId: true
          }
        }
      }
    })

    if (!video) {
      return { success: false, error: 'Video not found' }
    }

    // Create view record
    await db.videoView.create({
      data: {
        userId: data.userId || null,
        sessionId: data.sessionId,
        videoId: data.videoId,
        creatorId: video.creatorId,
        destinationId: video.poi.destinationId,
        viewedAt: new Date()
      }
    })

    return { success: true }
  } catch (error) {
    console.error('[trackVideoView] Error:', error)
    return { success: false, error: 'Failed to track view' }
  }
}

/**
 * Attribution result interface
 */
interface AttributionResult {
  attribution: Array<{
    creatorId: string
    videoId: string
    share: number
    weight: number
    tierRate: number
  }> | null
  mode?: 'discovery' | 'research'
  reason?: string
}

/**
 * Calculate attribution for a booking (same-day, destination-filtered)
 */
export async function calculateAttribution(
  userId: string | null,
  sessionId: string,
  bookedDestinationId: string,
  bookingTimestamp: Date,
  totalCommission: number
): Promise<AttributionResult> {
  try {
    // Get same-day videos for booked destination only
    const todayStart = new Date(bookingTimestamp)
    todayStart.setHours(0, 0, 0, 0)

    const sameDayViews = await db.videoView.findMany({
      where: {
        ...(userId ? { userId } : { sessionId }),
        destinationId: bookedDestinationId,
        viewedAt: {
          gte: todayStart,
          lte: bookingTimestamp
        }
      },
      include: {
        video: {
          include: {
            creator: {
              select: {
                id: true,
                tier: true
              }
            }
          }
        }
      },
      orderBy: { viewedAt: 'desc' }
    })

    // No same-day views = No attribution
    if (sameDayViews.length === 0) {
      return {
        attribution: null,
        reason: 'no_same_day_views'
      }
    }

    // Filter to only videos with creators
    const creatorViews = sameDayViews.filter(v => v.video.creator)

    if (creatorViews.length === 0) {
      return {
        attribution: null,
        reason: 'no_creator_videos'
      }
    }

    // Single video = 100% attribution (Discovery Mode)
    if (creatorViews.length === 1) {
      const view = creatorViews[0]
      const tierRate = getTierRate(view.video.creator!.tier)
      const creatorShare = totalCommission * tierRate

      return {
        attribution: [{
          creatorId: view.video.creator!.id,
          videoId: view.videoId,
          share: creatorShare,
          weight: 1.0,
          tierRate
        }],
        mode: 'discovery'
      }
    }

    // Multiple videos = Equal split (Research Mode)
    // Cap at 10 most recent to prevent extreme dilution
    const qualifyingViews = creatorViews.slice(0, 10)

    const attribution = qualifyingViews.map(view => {
      const tierRate = getTierRate(view.video.creator!.tier)
      const weight = 1 / qualifyingViews.length
      const creatorShare = totalCommission * tierRate * weight

      return {
        creatorId: view.video.creator!.id,
        videoId: view.videoId,
        share: creatorShare,
        weight,
        tierRate
      }
    })

    return {
      attribution,
      mode: 'research'
    }
  } catch (error) {
    console.error('[calculateAttribution] Error:', error)
    return {
      attribution: null,
      reason: 'calculation_error'
    }
  }
}

/**
 * Process booking attribution and create earnings
 */
export async function processBookingAttribution(data: {
  userId?: string | null
  sessionId: string
  affiliateClickId: string
  destinationId: string
  bookingValue: number
  commission: number
  bookingTimestamp?: Date
}) {
  try {
    const bookingTime = data.bookingTimestamp || new Date()

    // Calculate attribution
    const attribution = await calculateAttribution(
      data.userId || null,
      data.sessionId,
      data.destinationId,
      bookingTime,
      data.commission
    )

    // No attribution - commission stays with platform
    if (!attribution.attribution) {
      return {
        success: true,
        attributed: false,
        reason: attribution.reason
      }
    }

    // Create earnings records for creators
    const earnings = await Promise.all(
      attribution.attribution.map(async (attr) => {
        const earning = await db.creatorEarning.create({
          data: {
            creatorId: attr.creatorId,
            videoId: attr.videoId,
            affiliateClickId: data.affiliateClickId,
            amount: attr.share,
            commission: data.commission,
            shareWeight: attr.weight,
            tierRate: attr.tierRate,
            earnedAt: bookingTime
          }
        })

        // Update creator total earnings
        await db.creator.update({
          where: { id: attr.creatorId },
          data: {
            totalEarnings: {
              increment: attr.share
            }
          }
        })

        return earning
      })
    )

    // Check for tier upgrades
    const uniqueCreators = [...new Set(attribution.attribution.map(a => a.creatorId))]
    await Promise.all(
      uniqueCreators.map(creatorId =>
        // Import and call upgradeCreatorTier from creatorActions
        db.creator.findUnique({
          where: { id: creatorId },
          include: {
            _count: { select: { videos: true, earnings: true } }
          }
        }).then(async (creator) => {
          if (!creator) return

          const totalEarnings = Number(creator.totalEarnings)
          const videoCount = creator._count.videos
          const bookingCount = creator._count.earnings

          let newTier = creator.tier

          if (totalEarnings >= 5000 || bookingCount >= 1000) {
            newTier = 'elite'
          } else if (totalEarnings >= 1000 || bookingCount >= 200) {
            newTier = 'top'
          } else if (totalEarnings >= 100 || bookingCount >= 50 || videoCount >= 10) {
            newTier = 'active'
          }

          if (newTier !== creator.tier) {
            await db.creator.update({
              where: { id: creatorId },
              data: { tier: newTier }
            })
          }
        })
      )
    )

    const totalPaid = earnings.reduce((sum, e) => sum + Number(e.amount), 0)

    return {
      success: true,
      attributed: true,
      mode: attribution.mode,
      creatorsCount: uniqueCreators.length,
      totalPaid,
      earnings
    }
  } catch (error) {
    console.error('[processBookingAttribution] Error:', error)
    return {
      success: false,
      error: 'Failed to process attribution'
    }
  }
}

/**
 * Get video analytics (for creator dashboard)
 */
export async function getVideoAnalytics(videoId: string) {
  try {
    const [views, earnings] = await Promise.all([
      db.videoView.count({
        where: { videoId }
      }),

      db.creatorEarning.aggregate({
        where: { videoId },
        _sum: { amount: true },
        _count: true
      })
    ])

    return {
      success: true,
      data: {
        totalViews: views,
        totalEarnings: earnings._sum.amount || 0,
        totalBookings: earnings._count
      }
    }
  } catch (error) {
    console.error('[getVideoAnalytics] Error:', error)
    return {
      success: false,
      error: 'Failed to get analytics'
    }
  }
}
