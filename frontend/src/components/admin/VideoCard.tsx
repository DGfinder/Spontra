'use client'

import { useState } from 'react'
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/youtube'
import { Trash2, Edit2, GripVertical, Play } from 'lucide-react'

interface POIVideo {
  id: string
  videoUrl: string
  displayOrder: number
  caption?: string | null
  altText?: string | null
  instagramUrl?: string | null
}

interface VideoCardProps {
  video: POIVideo
  poiName: string
  poiDescription?: string | null
  onEdit: (videoId: string) => void
  onDelete: (videoId: string) => void
  onMoveUp?: (videoId: string) => void
  onMoveDown?: (videoId: string) => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  dragHandleProps?: any // For drag & drop
}

export function VideoCard({
  video,
  poiName,
  poiDescription,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
  dragHandleProps
}: VideoCardProps) {
  const [showPlayer, setShowPlayer] = useState(false)
  const [imageError, setImageError] = useState(false)

  const videoId = extractYouTubeId(video.videoUrl)
  const thumbnailUrl = videoId ? getYouTubeThumbnail(videoId, 'maxres') : null

  return (
    <div className="bg-white/5 rounded-xl overflow-hidden border border-white/10 mb-4 hover:border-white/20 transition-colors">
      {/* Video Embed */}
      <div className="aspect-video relative bg-black">
        {videoId ? (
          showPlayer ? (
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0"
            />
          ) : (
            <div 
              className="w-full h-full relative cursor-pointer group"
              onClick={() => setShowPlayer(true)}
            >
              {!imageError && thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={`${poiName} video thumbnail`}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <div className="text-center text-white/70">
                    <Play className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">Click to play video</p>
                  </div>
                </div>
              )}
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                <div className="bg-red-600 rounded-full p-4 group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-white fill-current" />
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/50">
            <div className="text-center">
              <p className="text-sm">Invalid YouTube URL</p>
              <p className="text-xs mt-1">{video.videoUrl}</p>
            </div>
          </div>
        )}
      </div>

      {/* POI Info & Actions */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-medium truncate">{poiName}</h4>
            {poiDescription && (
              <p className="text-white/60 text-sm mt-1 line-clamp-2">
                {poiDescription}
              </p>
            )}

            {/* Video Metadata */}
            {(video.caption || video.altText || video.instagramUrl) && (
              <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                {video.caption && (
                  <div>
                    <span className="text-xs text-white/40">Caption: </span>
                    <span className="text-xs text-white/60 line-clamp-2">{video.caption}</span>
                  </div>
                )}
                {video.altText && (
                  <div>
                    <span className="text-xs text-white/40">Alt: </span>
                    <span className="text-xs text-white/60">{video.altText}</span>
                  </div>
                )}
                {video.instagramUrl && (
                  <div>
                    <a
                      href={video.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-300 hover:text-blue-200 underline"
                    >
                      📷 Instagram Post
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Drag Handle */}
          {dragHandleProps && (
            <div
              {...dragHandleProps}
              className="text-white/40 hover:text-white/60 cursor-grab active:cursor-grabbing transition-colors"
            >
              <GripVertical className="w-5 h-5" />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/10">
          <button
            onClick={() => onEdit(video.id)}
            className="text-blue-300 hover:text-blue-200 text-sm flex items-center gap-1.5 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit URL
          </button>

          <button
            onClick={() => onDelete(video.id)}
            className="text-red-300 hover:text-red-200 text-sm flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>

          {/* Manual Reorder Buttons (fallback if no drag & drop) */}
          {(onMoveUp || onMoveDown) && !dragHandleProps && (
            <div className="ml-auto flex items-center gap-2">
              {onMoveUp && (
                <button
                  onClick={() => onMoveUp(video.id)}
                  disabled={!canMoveUp}
                  className="text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move up"
                >
                  ↑
                </button>
              )}
              {onMoveDown && (
                <button
                  onClick={() => onMoveDown(video.id)}
                  disabled={!canMoveDown}
                  className="text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move down"
                >
                  ↓
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
