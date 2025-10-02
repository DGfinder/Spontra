/**
 * YouTube Utility Functions
 * Handles video ID extraction, URL validation, and thumbnail generation
 */

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - youtube.com/shorts/VIDEO_ID
 * - youtube.com/watch?v=VIDEO_ID
 * - youtu.be/VIDEO_ID
 * - youtube.com/embed/VIDEO_ID
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null

  const patterns = [
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/v\/)([\w-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * Get YouTube thumbnail URL for a video
 * @param videoId YouTube video ID
 * @param quality 'default' | 'medium' | 'high' | 'maxres'
 */
export function getYouTubeThumbnail(
  videoId: string,
  quality: 'default' | 'medium' | 'high' | 'maxres' = 'maxres'
): string {
  const qualityMap = {
    default: 'default.jpg',         // 120x90
    medium: 'mqdefault.jpg',        // 320x180
    high: 'hqdefault.jpg',          // 480x360
    maxres: 'maxresdefault.jpg'     // 1280x720
  }

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}`
}

/**
 * Validate if a YouTube video URL is valid format
 */
export function isValidYouTubeUrl(url: string): boolean {
  const videoId = extractYouTubeId(url)
  return videoId !== null && videoId.length === 11
}

/**
 * Get YouTube embed URL for iframe
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`
}

/**
 * Get YouTube Shorts URL (canonical format)
 */
export function getYouTubeShortsUrl(videoId: string): string {
  return `https://www.youtube.com/shorts/${videoId}`
}

/**
 * Validate video exists (checks if thumbnail loads)
 * Returns true if valid, false if video doesn't exist or is private
 */
export async function validateYouTubeVideo(videoId: string): Promise<boolean> {
  try {
    const thumbnailUrl = getYouTubeThumbnail(videoId, 'default')
    const response = await fetch(thumbnailUrl, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Parse and validate YouTube URL, return normalized data
 */
export interface YouTubeVideoData {
  videoId: string
  embedUrl: string
  thumbnailUrl: string
  shortsUrl: string
  isValid: boolean
}

export function parseYouTubeUrl(url: string): YouTubeVideoData | null {
  const videoId = extractYouTubeId(url)

  if (!videoId) {
    return null
  }

  return {
    videoId,
    embedUrl: getYouTubeEmbedUrl(videoId),
    thumbnailUrl: getYouTubeThumbnail(videoId),
    shortsUrl: getYouTubeShortsUrl(videoId),
    isValid: true
  }
}
