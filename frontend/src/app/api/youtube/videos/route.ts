import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const destination = searchParams.get('destination')
    const activity = searchParams.get('activity')
    const maxResults = parseInt(searchParams.get('maxResults') || '5')

    if (!destination) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Missing required parameter: destination' 
      }, { status: 400 })
    }

    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        ok: false,
        error: 'YouTube API key not configured'
      }, { status: 500 })
    }

    const query = activity 
      ? `${destination} ${activity} travel guide`
      : `${destination} travel guide`

    const youtubeUrl = new URL('https://www.googleapis.com/youtube/v3/search')
    youtubeUrl.searchParams.set('part', 'snippet')
    youtubeUrl.searchParams.set('q', query)
    youtubeUrl.searchParams.set('type', 'video')
    youtubeUrl.searchParams.set('maxResults', maxResults.toString())
    youtubeUrl.searchParams.set('key', apiKey)

    const response = await fetch(youtubeUrl.toString())

    if (!response.ok) {
      throw new Error(`YouTube API request failed: ${response.status}`)
    }

    const data = await response.json()

    const videos = data.items?.map((item: any) => ({
      id: item.id?.videoId,
      title: item.snippet?.title,
      description: item.snippet?.description,
      thumbnail: item.snippet?.thumbnails?.medium?.url,
      channelTitle: item.snippet?.channelTitle,
      publishedAt: item.snippet?.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id?.videoId}`
    })) || []

    return NextResponse.json({ 
      ok: true, 
      data: videos 
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}