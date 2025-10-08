'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export type VideoStatus = 'pending' | 'approved' | 'rejected'

export interface ModerationFilters {
  status?: VideoStatus
  search?: string
}

/**
 * Get moderation queue with filters
 */
export async function getModerationQueue(filters: ModerationFilters = {}) {
  try {
    const where: any = {}

    // Filter by status
    if (filters.status) {
      where.status = filters.status
    }

    // Search by POI name, destination, or creator name
    if (filters.search) {
      where.OR = [
        {
          poi: {
            name: {
              contains: filters.search,
              mode: 'insensitive'
            }
          }
        },
        {
          poi: {
            destination: {
              cityName: {
                contains: filters.search,
                mode: 'insensitive'
              }
            }
          }
        },
        {
          creator: {
            displayName: {
              contains: filters.search,
              mode: 'insensitive'
            }
          }
        }
      ]
    }

    const videos = await db.pOIVideo.findMany({
      where,
      include: {
        poi: {
          select: {
            id: true,
            name: true,
            theme: true,
            description: true,
            destination: {
              select: {
                id: true,
                cityName: true,
                country: {
                  select: {
                    name: true,
                    code: true
                  }
                }
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            displayName: true,
            tier: true,
            instagramHandle: true,
            tiktokHandle: true,
            totalEarnings: true,
            isVerified: true,
            user: {
              select: {
                email: true
              }
            }
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // pending first
        { createdAt: 'desc' } // newest first
      ]
    })

    return { success: true, data: videos }
  } catch (error) {
    console.error('[getModerationQueue] Error:', error)
    return { success: false, error: 'Failed to fetch moderation queue' }
  }
}

/**
 * Get moderation statistics
 */
export async function getModerationStats() {
  try {
    const [pending, approved, rejected, total] = await Promise.all([
      db.pOIVideo.count({ where: { status: 'pending' } }),
      db.pOIVideo.count({ where: { status: 'approved' } }),
      db.pOIVideo.count({ where: { status: 'rejected' } }),
      db.pOIVideo.count()
    ])

    return {
      success: true,
      data: {
        pending,
        approved,
        rejected,
        total
      }
    }
  } catch (error) {
    console.error('[getModerationStats] Error:', error)
    return { success: false, error: 'Failed to fetch stats' }
  }
}

/**
 * Approve a video
 */
export async function approveVideo(videoId: string) {
  try {
    const video = await db.pOIVideo.update({
      where: { id: videoId },
      data: {
        status: 'approved',
        rejectionReason: null // Clear any previous rejection reason
      },
      include: {
        creator: {
          select: {
            displayName: true,
            user: {
              select: {
                email: true
              }
            }
          }
        }
      }
    })

    revalidatePath('/admin/moderate-videos')

    // TODO: Send approval email to creator
    // await sendApprovalEmail(video.creator.user.email, video.creator.displayName)

    return { success: true, data: video }
  } catch (error) {
    console.error('[approveVideo] Error:', error)
    return { success: false, error: 'Failed to approve video' }
  }
}

/**
 * Reject a video
 */
export async function rejectVideo(videoId: string, reason: string) {
  try {
    const video = await db.pOIVideo.update({
      where: { id: videoId },
      data: {
        status: 'rejected',
        rejectionReason: reason
      },
      include: {
        creator: {
          select: {
            displayName: true,
            user: {
              select: {
                email: true
              }
            }
          }
        }
      }
    })

    revalidatePath('/admin/moderate-videos')

    // TODO: Send rejection email to creator
    // await sendRejectionEmail(video.creator.user.email, video.creator.displayName, reason)

    return { success: true, data: video }
  } catch (error) {
    console.error('[rejectVideo] Error:', error)
    return { success: false, error: 'Failed to reject video' }
  }
}

/**
 * Bulk approve videos
 */
export async function bulkApprove(videoIds: string[]) {
  try {
    const result = await db.pOIVideo.updateMany({
      where: {
        id: { in: videoIds }
      },
      data: {
        status: 'approved',
        rejectionReason: null
      }
    })

    revalidatePath('/admin/moderate-videos')

    return {
      success: true,
      data: { count: result.count }
    }
  } catch (error) {
    console.error('[bulkApprove] Error:', error)
    return { success: false, error: 'Failed to bulk approve videos' }
  }
}

/**
 * Bulk reject videos
 */
export async function bulkReject(videoIds: string[], reason: string) {
  try {
    const result = await db.pOIVideo.updateMany({
      where: {
        id: { in: videoIds }
      },
      data: {
        status: 'rejected',
        rejectionReason: reason
      }
    })

    revalidatePath('/admin/moderate-videos')

    return {
      success: true,
      data: { count: result.count }
    }
  } catch (error) {
    console.error('[bulkReject] Error:', error)
    return { success: false, error: 'Failed to bulk reject videos' }
  }
}

/**
 * Get video details by ID (for review)
 */
export async function getVideoForReview(videoId: string) {
  try {
    const video = await db.pOIVideo.findUnique({
      where: { id: videoId },
      include: {
        poi: {
          include: {
            destination: {
              include: {
                country: true
              }
            }
          }
        },
        creator: {
          include: {
            user: {
              select: {
                email: true,
                createdAt: true
              }
            },
            _count: {
              select: {
                videos: true,
                earnings: true
              }
            }
          }
        },
        _count: {
          select: {
            views: true,
            earnings: true
          }
        }
      }
    })

    if (!video) {
      return { success: false, error: 'Video not found' }
    }

    return { success: true, data: video }
  } catch (error) {
    console.error('[getVideoForReview] Error:', error)
    return { success: false, error: 'Failed to fetch video details' }
  }
}
