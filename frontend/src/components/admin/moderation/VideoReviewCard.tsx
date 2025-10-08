'use client'

import { useState } from 'react'
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/youtube'
import {
  Play,
  CheckCircle,
  XCircle,
  User,
  MapPin,
  Tag,
  Calendar,
  ExternalLink,
  Award,
  DollarSign
} from 'lucide-react'
import type { Decimal } from '@prisma/client/runtime/library'

interface VideoReviewCardProps {
  video: {
    id: string
    videoUrl: string
    status: string
    caption: string | null
    altText: string | null
    instagramUrl: string | null
    createdAt: Date
    rejectionReason: string | null
    poi: {
      id: string
      name: string
      theme: string
      description: string | null
      destination: {
        id: string
        cityName: string
        country: {
          name: string
          code: string
        } | null
      }
    }
    creator: {
      id: string
      displayName: string
      tier: string
      instagramHandle: string | null
      tiktokHandle: string | null
      totalEarnings: number | Decimal
      isVerified: boolean
      user: {
        email: string
      }
    } | null
  }
  onApprove: (videoId: string) => void
  onReject: (videoId: string) => void
}

const STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30',
  approved: 'bg-green-500/20 text-green-200 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-200 border-red-500/30'
}

const TIER_COLORS = {
  new: 'bg-gray-500',
  active: 'bg-blue-500',
  top: 'bg-purple-500',
  elite: 'bg-yellow-500'
}

const TIER_RATES = {
  new: '5%',
  active: '8%',
  top: '12%',
  elite: '15%'
}

export function VideoReviewCard({ video, onApprove, onReject }: VideoReviewCardProps) {
  const [showPlayer, setShowPlayer] = useState(false)
  const [imageError, setImageError] = useState(false)

  const videoId = extractYouTubeId(video.videoUrl)
  const thumbnailUrl = videoId ? getYouTubeThumbnail(videoId, 'maxres') : null

  const formattedDate = new Date(video.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden hover:border-white/30 transition-all">
      {/* Status Badge */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[video.status as keyof typeof STATUS_COLORS]}`}>
          {video.status.toUpperCase()}
        </span>
        <span className="text-xs text-white/50 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formattedDate}
        </span>
      </div>

      {/* Video Player */}
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
                  alt={`${video.poi.name} video thumbnail`}
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
              <p className="text-xs mt-1 truncate px-4">{video.videoUrl}</p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* POI Info */}
        <div>
          <h3 className="text-white font-semibold text-lg mb-2">{video.poi.name}</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-xs text-white/70 bg-white/5 px-2 py-1 rounded">
              <MapPin className="w-3 h-3" />
              {video.poi.destination.cityName}, {video.poi.destination.country?.name}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-white/70 bg-white/5 px-2 py-1 rounded">
              <Tag className="w-3 h-3" />
              {video.poi.theme}
            </span>
          </div>
          {video.poi.description && (
            <p className="text-sm text-white/60 line-clamp-2">{video.poi.description}</p>
          )}
        </div>

        {/* Video Metadata */}
        {(video.caption || video.altText || video.instagramUrl) && (
          <div className="pt-3 border-t border-white/10 space-y-2">
            {video.caption && (
              <div>
                <span className="text-xs text-white/40 font-medium">Caption:</span>
                <p className="text-xs text-white/70 mt-1 line-clamp-3">{video.caption}</p>
              </div>
            )}
            {video.altText && (
              <div>
                <span className="text-xs text-white/40 font-medium">Alt Text:</span>
                <p className="text-xs text-white/70 mt-1">{video.altText}</p>
              </div>
            )}
            {video.instagramUrl && (
              <a
                href={video.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-300 hover:text-blue-200 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                View Instagram Post
              </a>
            )}
          </div>
        )}

        {/* Creator Info */}
        {video.creator && (
          <div className="pt-3 border-t border-white/10">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="bg-white/10 p-2 rounded-full">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white font-medium">{video.creator.displayName}</span>
                    {video.creator.isVerified && (
                      <span className="text-blue-400" title="Verified Creator">✓</span>
                    )}
                  </div>
                  <span className="text-xs text-white/50">{video.creator.user.email}</span>
                </div>
              </div>

              <div className={`${TIER_COLORS[video.creator.tier as keyof typeof TIER_COLORS]} px-2 py-1 rounded text-xs text-white font-medium flex items-center gap-1`}>
                <Award className="w-3 h-3" />
                {video.creator.tier.toUpperCase()} ({TIER_RATES[video.creator.tier as keyof typeof TIER_RATES]})
              </div>
            </div>

            {/* Creator Stats */}
            <div className="flex items-center gap-4 text-xs text-white/60">
              {video.creator.instagramHandle && (
                <span>@{video.creator.instagramHandle} (IG)</span>
              )}
              {video.creator.tiktokHandle && (
                <span>@{video.creator.tiktokHandle} (TT)</span>
              )}
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                ${Number(video.creator.totalEarnings).toFixed(2)} earned
              </span>
            </div>
          </div>
        )}

        {/* Rejection Reason */}
        {video.status === 'rejected' && video.rejectionReason && (
          <div className="pt-3 border-t border-white/10">
            <span className="text-xs text-red-300 font-medium">Rejection Reason:</span>
            <p className="text-xs text-white/70 mt-1">{video.rejectionReason}</p>
          </div>
        )}

        {/* Action Buttons */}
        {video.status === 'pending' && (
          <div className="flex gap-3 pt-3 border-t border-white/10">
            <button
              onClick={() => onApprove(video.id)}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={() => onReject(video.id)}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
          </div>
        )}

        {/* View Original Link */}
        <a
          href={video.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-white/50 hover:text-white/70 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          View Original Video
        </a>
      </div>
    </div>
  )
}
