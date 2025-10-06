'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { extractYouTubeId } from '@/lib/youtube'

export async function getVideosForPOI(poiId: string) {
  try {
    const videos = await db.pOIVideo.findMany({
      where: { poiId },
      orderBy: { displayOrder: 'asc' }
    })

    return { success: true, data: videos }
  } catch (error) {
    console.error('[getVideosForPOI] Error:', error)
    return { success: false, error: 'Failed to fetch videos' }
  }
}

export interface VideoWithMetadata {
  url: string
  caption?: string
  altText?: string
  instagramUrl?: string
}

export async function addVideos(poiId: string, videos: VideoWithMetadata[]) {
  try {
    // Validate all URLs have valid YouTube IDs
    const invalidUrls = videos.filter(v => !extractYouTubeId(v.url))
    if (invalidUrls.length > 0) {
      return {
        success: false,
        error: `Invalid YouTube URLs: ${invalidUrls.map(v => v.url).join(', ')}`
      }
    }

    // Get current max display order for this POI
    const maxOrder = await db.pOIVideo.findFirst({
      where: { poiId },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true }
    })

    const startOrder = (maxOrder?.displayOrder ?? -1) + 1

    // Create all videos with metadata
    await db.pOIVideo.createMany({
      data: videos.map((video, index) => ({
        poiId,
        videoUrl: video.url,
        displayOrder: startOrder + index,
        caption: video.caption || null,
        altText: video.altText || null,
        instagramUrl: video.instagramUrl || null
      }))
    })

    revalidatePath('/admin/destinations')
    revalidatePath('/admin/countries')
    return { success: true }
  } catch (error) {
    console.error('[addVideos] Error:', error)
    return { success: false, error: 'Failed to add videos' }
  }
}

export async function updateVideoUrl(videoId: string, newUrl: string) {
  try {
    // Validate new URL
    if (!extractYouTubeId(newUrl)) {
      return { success: false, error: 'Invalid YouTube URL' }
    }

    await db.pOIVideo.update({
      where: { id: videoId },
      data: { videoUrl: newUrl }
    })

    revalidatePath('/admin/destinations')
    revalidatePath('/admin/countries')
    return { success: true }
  } catch (error) {
    console.error('[updateVideoUrl] Error:', error)
    return { success: false, error: 'Failed to update video' }
  }
}

export async function deleteVideo(videoId: string) {
  try {
    await db.pOIVideo.delete({
      where: { id: videoId }
    })

    revalidatePath('/admin/destinations')
    revalidatePath('/admin/countries')
    return { success: true }
  } catch (error) {
    console.error('[deleteVideo] Error:', error)
    return { success: false, error: 'Failed to delete video' }
  }
}

export async function reorderVideo(videoId: string, direction: 'up' | 'down') {
  try {
    const video = await db.pOIVideo.findUnique({
      where: { id: videoId }
    })

    if (!video) {
      return { success: false, error: 'Video not found' }
    }

    // Find adjacent video to swap with
    const adjacentVideo = await db.pOIVideo.findFirst({
      where: {
        poiId: video.poiId,
        displayOrder: direction === 'up'
          ? { lt: video.displayOrder }
          : { gt: video.displayOrder }
      },
      orderBy: {
        displayOrder: direction === 'up' ? 'desc' : 'asc'
      }
    })

    if (!adjacentVideo) {
      return { success: false, error: 'Cannot move further ' + direction }
    }

    // Swap display orders
    await db.$transaction([
      db.pOIVideo.update({
        where: { id: video.id },
        data: { displayOrder: adjacentVideo.displayOrder }
      }),
      db.pOIVideo.update({
        where: { id: adjacentVideo.id },
        data: { displayOrder: video.displayOrder }
      })
    ])

    revalidatePath('/admin/destinations')
    revalidatePath('/admin/countries')
    return { success: true }
  } catch (error) {
    console.error('[reorderVideo] Error:', error)
    return { success: false, error: 'Failed to reorder video' }
  }
}

export async function bulkReorderVideos(updates: Array<{ id: string; displayOrder: number }>) {
  try {
    await db.$transaction(
      updates.map(({ id, displayOrder }) =>
        db.pOIVideo.update({
          where: { id },
          data: { displayOrder }
        })
      )
    )

    revalidatePath('/admin/destinations')
    revalidatePath('/admin/countries')
    return { success: true }
  } catch (error) {
    console.error('[bulkReorderVideos] Error:', error)
    return { success: false, error: 'Failed to reorder videos' }
  }
}
