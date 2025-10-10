/**
 * YouTube Data API v3 Integration
 * Server-side utilities for fetching video metadata
 */

import { extractYouTubeId, getYouTubeChannelUrl } from './youtube'

export interface YouTubeVideoMetadata {
  videoId: string
  channelId: string
  channelTitle: string
  channelUrl: string
}

/**
 * Fetch video metadata from YouTube Data API v3
 * Uses videos.list endpoint with part=snippet
 *
 * @param videoId YouTube video ID
 * @returns Video metadata including channel information
 */
export async function fetchYouTubeMetadata(videoId: string): Promise<YouTubeVideoMetadata | null> {
  const apiKey = process.env.YOUTUBE_API_KEY

  if (!apiKey) {
    console.error('[fetchYouTubeMetadata] YOUTUBE_API_KEY not configured')
    return null
  }

  if (!videoId) {
    console.error('[fetchYouTubeMetadata] No video ID provided')
    return null
  }

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/videos')
    url.searchParams.set('part', 'snippet')
    url.searchParams.set('id', videoId)
    url.searchParams.set('key', apiKey)

    const response = await fetch(url.toString(), {
      next: {
        revalidate: 86400 // Cache for 24 hours
      }
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`[fetchYouTubeMetadata] YouTube API error ${response.status}:`, error)
      return null
    }

    const data = await response.json()

    if (!data.items || data.items.length === 0) {
      console.error('[fetchYouTubeMetadata] No video found for ID:', videoId)
      return null
    }

    const video = data.items[0]
    const snippet = video.snippet

    if (!snippet.channelId || !snippet.channelTitle) {
      console.error('[fetchYouTubeMetadata] Missing channel data in response')
      return null
    }

    return {
      videoId,
      channelId: snippet.channelId,
      channelTitle: snippet.channelTitle,
      channelUrl: getYouTubeChannelUrl(snippet.channelId)
    }
  } catch (error) {
    console.error('[fetchYouTubeMetadata] Failed to fetch metadata:', error)
    return null
  }
}

/**
 * Fetch metadata from a YouTube URL (extracts ID automatically)
 *
 * @param url Full YouTube URL (watch, shorts, embed, etc.)
 * @returns Video metadata including channel information
 */
export async function fetchYouTubeMetadataFromUrl(url: string): Promise<YouTubeVideoMetadata | null> {
  const videoId = extractYouTubeId(url)

  if (!videoId) {
    console.error('[fetchYouTubeMetadataFromUrl] Could not extract video ID from URL:', url)
    return null
  }

  return fetchYouTubeMetadata(videoId)
}
