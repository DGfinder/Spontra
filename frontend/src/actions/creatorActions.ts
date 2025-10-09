'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { CreatorTier } from '@prisma/client'

/**
 * Create a creator profile for a user
 */
export async function createCreatorProfile(data: {
  userId: string
  displayName: string
  bio?: string
  instagramHandle?: string
  tiktokHandle?: string
}) {
  try {
    // Check if creator profile already exists
    const existing = await db.creator.findUnique({
      where: { userId: data.userId }
    })

    if (existing) {
      return { success: false, error: 'Creator profile already exists' }
    }

    const creator = await db.creator.create({
      data: {
        userId: data.userId,
        displayName: data.displayName,
        bio: data.bio || null,
        instagramHandle: data.instagramHandle || null,
        tiktokHandle: data.tiktokHandle || null,
        tier: 'new'
      },
      include: {
        user: {
          select: { email: true }
        }
      }
    })

    revalidatePath('/dashboard/creator')
    return { success: true, data: creator }
  } catch (error) {
    console.error('[createCreatorProfile] Error:', error)
    return { success: false, error: 'Failed to create creator profile' }
  }
}

/**
 * Update creator profile
 */
export async function updateCreatorProfile(
  creatorId: string,
  data: {
    displayName?: string
    bio?: string
    instagramHandle?: string
    tiktokHandle?: string
  }
) {
  try {
    const creator = await db.creator.update({
      where: { id: creatorId },
      data: {
        displayName: data.displayName,
        bio: data.bio || null,
        instagramHandle: data.instagramHandle || null,
        tiktokHandle: data.tiktokHandle || null
      }
    })

    revalidatePath('/dashboard/creator')
    return { success: true, data: creator }
  } catch (error) {
    console.error('[updateCreatorProfile] Error:', error)
    return { success: false, error: 'Failed to update creator profile' }
  }
}

/**
 * Get creator by user ID
 */
export async function getCreatorByUserId(userId: string) {
  try {
    const creator = await db.creator.findUnique({
      where: { userId },
      include: {
        user: {
          select: { email: true, createdAt: true }
        },
        _count: {
          select: {
            videos: true,
            earnings: true
          }
        }
      }
    })

    return { success: true, data: creator }
  } catch (error) {
    console.error('[getCreatorByUserId] Error:', error)
    return { success: false, error: 'Failed to get creator' }
  }
}

/**
 * Get creator earnings summary
 */
export async function getCreatorEarnings(creatorId: string) {
  try {
    const [totalEarnings, monthlyEarnings, topVideos] = await Promise.all([
      // Total lifetime earnings
      db.creatorEarning.aggregate({
        where: { creatorId },
        _sum: { amount: true },
        _count: true
      }),

      // This month's earnings
      db.creatorEarning.aggregate({
        where: {
          creatorId,
          earnedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { amount: true },
        _count: true
      }),

      // Top performing videos
      db.creatorEarning.groupBy({
        by: ['videoId'],
        where: { creatorId },
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
        take: 10
      })
    ])

    // Get video details for top performers
    const videoIds = topVideos.map(v => v.videoId)
    const videos = await db.pOIVideo.findMany({
      where: { id: { in: videoIds } },
      include: {
        poi: {
          select: {
            name: true,
            destination: {
              select: { cityName: true }
            }
          }
        }
      }
    })

    const topVideosWithDetails = topVideos.map(earning => {
      const video = videos.find(v => v.id === earning.videoId)
      return {
        videoId: earning.videoId,
        totalEarned: earning._sum.amount,
        bookings: earning._count,
        poiName: video?.poi.name,
        cityName: video?.poi.destination.cityName,
        videoUrl: video?.videoUrl
      }
    })

    return {
      success: true,
      data: {
        lifetime: {
          total: totalEarnings._sum.amount || 0,
          bookings: totalEarnings._count
        },
        thisMonth: {
          total: monthlyEarnings._sum.amount || 0,
          bookings: monthlyEarnings._count
        },
        topVideos: topVideosWithDetails
      }
    }
  } catch (error) {
    console.error('[getCreatorEarnings] Error:', error)
    return { success: false, error: 'Failed to get earnings' }
  }
}

/**
 * Upgrade creator tier based on performance
 */
export async function upgradeCreatorTier(creatorId: string) {
  try {
    const creator = await db.creator.findUnique({
      where: { id: creatorId },
      include: {
        _count: {
          select: {
            videos: true,
            earnings: true
          }
        }
      }
    })

    if (!creator) {
      return { success: false, error: 'Creator not found' }
    }

    const totalEarnings = Number(creator.totalEarnings)
    const videoCount = creator._count.videos
    const bookingCount = creator._count.earnings

    let newTier: CreatorTier = creator.tier

    // Tier upgrade logic
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

      return {
        success: true,
        upgraded: true,
        oldTier: creator.tier,
        newTier
      }
    }

    return { success: true, upgraded: false }
  } catch (error) {
    console.error('[upgradeCreatorTier] Error:', error)
    return { success: false, error: 'Failed to upgrade tier' }
  }
}
