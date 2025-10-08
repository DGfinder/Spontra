'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { extractYouTubeId } from '@/lib/youtube'

/**
 * Create a video submission (pending admin approval)
 */
export async function submitCreatorVideo(data: {
  creatorId: string
  destinationId: string
  poiId?: string // Optional - can create new POI or use existing
  theme: string
  videoUrl: string
  caption?: string
  altText?: string
  instagramUrl?: string
}) {
  try {
    // Validate video URL (currently only YouTube supported)
    const youtubeId = extractYouTubeId(data.videoUrl)
    if (!youtubeId) {
      return {
        success: false,
        error: 'Invalid video URL. Currently only YouTube Shorts are supported.'
      }
    }

    // If POI ID provided, add video to existing POI
    if (data.poiId) {
      const video = await db.pOIVideo.create({
        data: {
          poiId: data.poiId,
          creatorId: data.creatorId,
          videoUrl: data.videoUrl,
          caption: data.caption || null,
          altText: data.altText || null,
          instagramUrl: data.instagramUrl || null,
          displayOrder: 0
        }
      })

      revalidatePath('/dashboard/creator')
      return { success: true, data: video }
    }

    // TODO: Create new POI with video (requires POI name and description)
    // For now, require POI selection
    return {
      success: false,
      error: 'Please select an existing point of interest'
    }
  } catch (error) {
    console.error('[submitCreatorVideo] Error:', error)
    return { success: false, error: 'Failed to submit video' }
  }
}

/**
 * Get POIs for a destination (for selection in upload form)
 */
export async function getPOIsForDestination(destinationId: string, theme: string) {
  try {
    const pois = await db.themePOI.findMany({
      where: {
        destinationId,
        theme
      },
      orderBy: {
        name: 'asc'
      }
    })

    return { success: true, data: pois }
  } catch (error) {
    console.error('[getPOIsForDestination] Error:', error)
    return { success: false, error: 'Failed to get POIs' }
  }
}

/**
 * Get all destinations for selection
 */
export async function getDestinationsForSelection() {
  try {
    const destinations = await db.destination.findMany({
      select: {
        id: true,
        cityName: true,
        country: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        cityName: 'asc'
      }
    })

    return { success: true, data: destinations }
  } catch (error) {
    console.error('[getDestinationsForSelection] Error:', error)
    return { success: false, error: 'Failed to get destinations' }
  }
}

/**
 * Get creator's videos
 */
export async function getCreatorVideos(creatorId: string) {
  try {
    const videos = await db.pOIVideo.findMany({
      where: { creatorId },
      include: {
        poi: {
          select: {
            name: true,
            theme: true,
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return { success: true, data: videos }
  } catch (error) {
    console.error('[getCreatorVideos] Error:', error)
    return { success: false, error: 'Failed to get videos' }
  }
}

/**
 * Delete a video
 */
export async function deleteCreatorVideo(videoId: string, creatorId: string) {
  try {
    // Verify ownership
    const video = await db.pOIVideo.findUnique({
      where: { id: videoId },
      select: { creatorId: true }
    })

    if (!video || video.creatorId !== creatorId) {
      return { success: false, error: 'Video not found or unauthorized' }
    }

    await db.pOIVideo.delete({
      where: { id: videoId }
    })

    revalidatePath('/dashboard/creator/videos')
    return { success: true }
  } catch (error) {
    console.error('[deleteCreatorVideo] Error:', error)
    return { success: false, error: 'Failed to delete video' }
  }
}
