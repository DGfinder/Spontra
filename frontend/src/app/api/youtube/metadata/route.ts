/**
 * YouTube Metadata API Route
 * Fetches channel attribution data from YouTube Data API
 *
 * GET /api/youtube/metadata?videoId=VIDEO_ID
 * or
 * GET /api/youtube/metadata?url=YOUTUBE_URL
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchYouTubeMetadata, fetchYouTubeMetadataFromUrl } from '@/lib/youtube-api'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const videoId = searchParams.get('videoId')
    const url = searchParams.get('url')

    // Require either videoId or url parameter
    if (!videoId && !url) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: videoId or url'
        },
        { status: 400 }
      )
    }

    // Fetch metadata using appropriate method
    const metadata = url
      ? await fetchYouTubeMetadataFromUrl(url)
      : await fetchYouTubeMetadata(videoId!)

    if (!metadata) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch video metadata. Check video ID/URL and API quota.'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: metadata
    })
  } catch (error) {
    console.error('[YouTube Metadata API] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}
