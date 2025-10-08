'use client'

import { useState, useEffect } from 'react'
import { Search, AlertCircle } from 'lucide-react'
import { ModerationStats } from '@/components/admin/moderation/ModerationStats'
import { VideoReviewCard } from '@/components/admin/moderation/VideoReviewCard'
import { RejectionModal } from '@/components/admin/moderation/RejectionModal'
import {
  getModerationQueue,
  getModerationStats,
  approveVideo,
  rejectVideo,
  type VideoStatus
} from '@/actions/moderationActions'
import { toast } from 'react-toastify'
import type { Prisma } from '@prisma/client'

type VideoWithRelations = Prisma.POIVideoGetPayload<{
  include: {
    poi: {
      select: {
        id: true
        name: true
        theme: true
        description: true
        destination: {
          select: {
            id: true
            cityName: true
            country: {
              select: {
                name: true
                code: true
              }
            }
          }
        }
      }
    }
    creator: {
      select: {
        id: true
        displayName: true
        tier: true
        instagramHandle: true
        tiktokHandle: true
        totalEarnings: true
        isVerified: true
        user: {
          select: {
            email: true
          }
        }
      }
    }
  }
}>

export default function ModerateVideosPage() {
  const [videos, setVideos] = useState<VideoWithRelations[]>([])
  const [filteredVideos, setFilteredVideos] = useState<VideoWithRelations[]>([])
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | VideoStatus>('pending')
  const [searchQuery, setSearchQuery] = useState('')

  // Rejection modal state
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false)
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null)
  const [selectedVideoTitle, setSelectedVideoTitle] = useState('')

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  // Filter videos when tab or search changes
  useEffect(() => {
    let filtered = videos

    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(v => v.status === activeTab)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(v =>
        v.poi.name.toLowerCase().includes(query) ||
        v.poi.destination.cityName.toLowerCase().includes(query) ||
        v.creator?.displayName.toLowerCase().includes(query)
      )
    }

    setFilteredVideos(filtered)
  }, [activeTab, searchQuery, videos])

  async function loadData() {
    setLoading(true)

    const [queueResult, statsResult] = await Promise.all([
      getModerationQueue(),
      getModerationStats()
    ])

    if (queueResult.success && queueResult.data) {
      setVideos(queueResult.data)
    }

    if (statsResult.success && statsResult.data) {
      setStats(statsResult.data)
    }

    setLoading(false)
  }

  async function handleApprove(videoId: string) {
    const result = await approveVideo(videoId)

    if (result.success) {
      toast.success('Video approved successfully!')
      loadData() // Reload data
    } else {
      toast.error(result.error || 'Failed to approve video')
    }
  }

  function handleRejectClick(videoId: string, videoTitle: string) {
    setSelectedVideoId(videoId)
    setSelectedVideoTitle(videoTitle)
    setRejectionModalOpen(true)
  }

  async function handleRejectConfirm(reason: string) {
    if (!selectedVideoId) return

    const result = await rejectVideo(selectedVideoId, reason)

    if (result.success) {
      toast.success('Video rejected successfully')
      setRejectionModalOpen(false)
      setSelectedVideoId(null)
      setSelectedVideoTitle('')
      loadData() // Reload data
    } else {
      toast.error(result.error || 'Failed to reject video')
    }
  }

  const tabs: Array<{ id: 'all' | VideoStatus; label: string; count?: number }> = [
    { id: 'all', label: 'All Videos', count: stats.total },
    { id: 'pending', label: 'Pending', count: stats.pending },
    { id: 'approved', label: 'Approved', count: stats.approved },
    { id: 'rejected', label: 'Rejected', count: stats.rejected }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Video Moderation</h1>
        <p className="text-white/70">
          Review and moderate creator-submitted videos for quality and appropriateness
        </p>
      </div>

      {/* Stats */}
      <ModerationStats stats={stats} />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-3 font-medium transition-all whitespace-nowrap
              ${activeTab === tab.id
                ? 'text-white border-b-2 border-white'
                : 'text-white/60 hover:text-white'
              }
            `}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          placeholder="Search by POI name, destination, or creator..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-white/60 mt-4">Loading videos...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredVideos.length === 0 && (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-white/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No videos found</h3>
          <p className="text-white/60">
            {searchQuery
              ? 'Try adjusting your search query'
              : activeTab === 'pending'
              ? 'No videos awaiting moderation'
              : `No ${activeTab} videos`
            }
          </p>
        </div>
      )}

      {/* Video Grid */}
      {!loading && filteredVideos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <VideoReviewCard
              key={video.id}
              video={video}
              onApprove={handleApprove}
              onReject={(id) => handleRejectClick(id, video.poi.name)}
            />
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={rejectionModalOpen}
        onClose={() => {
          setRejectionModalOpen(false)
          setSelectedVideoId(null)
          setSelectedVideoTitle('')
        }}
        onConfirm={handleRejectConfirm}
        videoTitle={selectedVideoTitle}
      />
    </div>
  )
}
