'use client'

import { useState, useEffect } from 'react'
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/youtube'
import { Play, MapPin } from 'lucide-react'
import { StructuredData } from '@/components/SEO/StructuredData'
import { generateVideoStructuredData } from '@/lib/seo/generateStructuredData'
import { useSessionTracking } from '@/hooks/useSessionTracking'
import { trackVideoView } from '@/actions/videoTrackingActions'
import type { ThemePOI } from '../DestinationDetail'

interface POIVideoFeedProps {
  pois: ThemePOI[]
  theme: string
}

export function POIVideoFeed({ pois, theme }: POIVideoFeedProps) {
  return (
    <div id="poi-feed" className="space-y-8">
      {pois.map((poi) => (
        <div key={poi.id} className="space-y-4">
          {/* POI Header */}
          <div className="flex items-start gap-3 px-2">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-white/60" aria-hidden="true" />
                {poi.name}
              </h2>
              {poi.description && (
                <p className="text-white/70 text-sm mt-1">{poi.description}</p>
              )}
              {/* Instagram-style caption for SEO */}
              {poi.caption && (
                <p className="text-white/60 text-sm mt-2 italic">
                  {poi.caption}
                </p>
              )}
            </div>
          </div>

          {/* Videos for this POI */}
          {poi.videos && poi.videos.length > 0 ? (
            <div className="space-y-6">
              {poi.videos.map((video) => (
                <VideoPlayer
                  key={video.id}
                  videoId={video.id}
                  videoUrl={video.videoUrl}
                  poiName={poi.name}
                  caption={poi.caption}
                  altText={poi.altText}
                />
              ))}
            </div>
          ) : (
            // Fallback: Show deprecated videoUrl if no videos in collection
            poi.videoUrl && (
              <div className="space-y-6">
                <VideoPlayer
                  videoUrl={poi.videoUrl}
                  poiName={poi.name}
                  caption={poi.caption}
                  altText={poi.altText}
                />
              </div>
            )
          )}
        </div>
      ))}
    </div>
  )
}

interface VideoPlayerProps {
  videoUrl: string
  poiName: string
  caption?: string | null
  altText?: string | null
  videoId?: string // POIVideo ID for tracking
}

function VideoPlayer({ videoUrl, poiName, caption, altText, videoId: poiVideoId }: VideoPlayerProps) {
  const [showPlayer, setShowPlayer] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [hasTracked, setHasTracked] = useState(false)
  const { sessionId } = useSessionTracking()

  const videoId = extractYouTubeId(videoUrl)
  const thumbnailUrl = videoId ? getYouTubeThumbnail(videoId, 'maxres') : null

  // Track video view when player is shown
  useEffect(() => {
    async function trackView() {
      if (showPlayer && !hasTracked && poiVideoId && sessionId) {
        setHasTracked(true)

        try {
          await trackVideoView({
            userId: null, // Will be populated server-side if logged in
            sessionId,
            videoId: poiVideoId
          })
        } catch (error) {
          console.error('[VideoPlayer] Failed to track view:', error)
        }
      }
    }

    trackView()
  }, [showPlayer, hasTracked, poiVideoId, sessionId])

  if (!videoId) {
    return (
      <div className="aspect-video bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
        <p className="text-white/50 text-sm">Invalid video URL</p>
      </div>
    )
  }

  // Generate video structured data for SEO
  const videoSchema = generateVideoStructuredData({
    videoUrl,
    poiName,
    caption,
    thumbnailUrl: thumbnailUrl || undefined
  })

  // SEO-optimized alt text
  const imageAlt = altText || `${poiName} - Travel experience video`

  return (
    <article className="bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all">
      {/* Video Schema Markup */}
      <StructuredData data={videoSchema} />

      {/* Video Container */}
      <div className="aspect-video relative bg-black">
        {showPlayer ? (
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`}
            title={caption || `Experience ${poiName}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0"
            loading="lazy"
          />
        ) : (
          <button
            onClick={() => setShowPlayer(true)}
            className="w-full h-full relative group focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label={`Play video: ${caption || poiName}`}
          >
            {/* Thumbnail */}
            {!imageError && thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={imageAlt}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
                loading="lazy"
                width="1280"
                height="720"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <Play className="w-16 h-16 text-white/50" aria-hidden="true" />
              </div>
            )}

            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
              <div className="bg-red-600 rounded-full p-5 group-hover:scale-110 transition-transform shadow-2xl">
                <Play className="w-8 h-8 text-white fill-current" aria-hidden="true" />
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Caption (Instagram-style) */}
      {caption && !showPlayer && (
        <div className="p-4 bg-white/5">
          <p className="text-white/80 text-sm leading-relaxed">{caption}</p>
        </div>
      )}
    </article>
  )
}
