'use client'

import Link from 'next/link'
import { DollarSign, TrendingUp, Video, Award, Plus } from 'lucide-react'
import { Decimal } from '@prisma/client/runtime/library'

interface Creator {
  id: string
  displayName: string
  bio: string | null
  instagramHandle: string | null
  tiktokHandle: string | null
  tier: string
  totalEarnings: number | Decimal
  isVerified: boolean
  _count: {
    videos: number
    earnings: number
  }
}

interface Earnings {
  lifetime: {
    total: number | Decimal
    bookings: number
  }
  thisMonth: {
    total: number | Decimal
    bookings: number
  }
  topVideos: Array<{
    videoId: string
    totalEarned: number | Decimal | null
    bookings: number
    poiName: string | undefined
    cityName: string | undefined
    videoUrl: string | undefined
  }>
}

interface CreatorDashboardProps {
  creator: Creator
  earnings: Earnings
}

export function CreatorDashboard({ creator, earnings }: CreatorDashboardProps) {
  const tierColors = {
    new: 'bg-gray-500',
    active: 'bg-blue-500',
    top: 'bg-purple-500',
    elite: 'bg-yellow-500'
  }

  const tierRates = {
    new: '5%',
    active: '8%',
    top: '12%',
    elite: '15%'
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {creator.displayName}
          </h1>
          <p className="text-white/70">
            Track your earnings and manage your travel content
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tier Badge */}
          <div className={`${tierColors[creator.tier as keyof typeof tierColors]} px-4 py-2 rounded-full flex items-center gap-2`}>
            <Award className="w-4 h-4 text-white" />
            <span className="text-white font-semibold uppercase text-sm">
              {creator.tier} - {tierRates[creator.tier as keyof typeof tierRates]}
            </span>
          </div>

          {/* Upload Video Button */}
          <Link
            href="/dashboard/creator/upload"
            className="bg-white text-purple-900 px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Upload Video
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Lifetime Earnings */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white/70 text-sm font-medium">Lifetime Earnings</h3>
            <DollarSign className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white">
            ${Number(earnings.lifetime.total).toFixed(2)}
          </p>
          <p className="text-white/50 text-sm mt-2">
            {earnings.lifetime.bookings} bookings
          </p>
        </div>

        {/* This Month */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white/70 text-sm font-medium">This Month</h3>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">
            ${Number(earnings.thisMonth.total).toFixed(2)}
          </p>
          <p className="text-white/50 text-sm mt-2">
            {earnings.thisMonth.bookings} bookings
          </p>
        </div>

        {/* Total Videos */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white/70 text-sm font-medium">Total Videos</h3>
            <Video className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-white">
            {creator._count.videos}
          </p>
          <p className="text-white/50 text-sm mt-2">
            Active content
          </p>
        </div>

        {/* Next Payout */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white/70 text-sm font-medium">Next Payout</h3>
            <DollarSign className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-3xl font-bold text-white">
            ${Number(earnings.lifetime.total).toFixed(2)}
          </p>
          <p className="text-white/50 text-sm mt-2">
            {Number(earnings.lifetime.total) >= 25 ? 'Ready' : `$${(25 - Number(earnings.lifetime.total)).toFixed(2)} to go`}
          </p>
        </div>
      </div>

      {/* Tier Progress */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
        <h2 className="text-xl font-bold text-white mb-4">Tier Progress</h2>
        <div className="space-y-4">
          {creator.tier === 'new' && (
            <>
              <p className="text-white/70">
                Unlock <span className="font-semibold text-white">Active tier (8%)</span> by reaching:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/50 text-sm">Videos</p>
                  <p className="text-white font-semibold">
                    {creator._count.videos} / 10
                  </p>
                  <div className="mt-2 bg-white/10 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((creator._count.videos / 10) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/50 text-sm">Bookings</p>
                  <p className="text-white font-semibold">
                    {earnings.lifetime.bookings} / 50
                  </p>
                  <div className="mt-2 bg-white/10 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((earnings.lifetime.bookings / 50) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/50 text-sm">Earnings</p>
                  <p className="text-white font-semibold">
                    ${Number(earnings.lifetime.total).toFixed(0)} / $100
                  </p>
                  <div className="mt-2 bg-white/10 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((Number(earnings.lifetime.total) / 100) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {creator.tier === 'active' && (
            <>
              <p className="text-white/70">
                Unlock <span className="font-semibold text-white">Top tier (12%)</span> by reaching:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/50 text-sm">Bookings</p>
                  <p className="text-white font-semibold">
                    {earnings.lifetime.bookings} / 200
                  </p>
                  <div className="mt-2 bg-white/10 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((earnings.lifetime.bookings / 200) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/50 text-sm">Earnings</p>
                  <p className="text-white font-semibold">
                    ${Number(earnings.lifetime.total).toFixed(0)} / $1,000
                  </p>
                  <div className="mt-2 bg-white/10 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((Number(earnings.lifetime.total) / 1000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {creator.tier === 'top' && (
            <>
              <p className="text-white/70">
                Unlock <span className="font-semibold text-white">Elite tier (15%)</span> by reaching:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/50 text-sm">Bookings</p>
                  <p className="text-white font-semibold">
                    {earnings.lifetime.bookings} / 1,000
                  </p>
                  <div className="mt-2 bg-white/10 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((earnings.lifetime.bookings / 1000) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/50 text-sm">Earnings</p>
                  <p className="text-white font-semibold">
                    ${Number(earnings.lifetime.total).toFixed(0)} / $5,000
                  </p>
                  <div className="mt-2 bg-white/10 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((Number(earnings.lifetime.total) / 5000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {creator.tier === 'elite' && (
            <div className="text-center py-4">
              <p className="text-yellow-400 font-semibold text-lg">
                🎉 You've reached the highest tier! You're earning 15% on all bookings.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Top Performing Videos */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
        <h2 className="text-xl font-bold text-white mb-4">Top Performing Videos</h2>

        {earnings.topVideos.length === 0 ? (
          <div className="text-center py-12">
            <Video className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/50 mb-4">No earnings yet</p>
            <Link
              href="/dashboard/creator/upload"
              className="inline-block bg-white text-purple-900 px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors"
            >
              Upload Your First Video
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {earnings.topVideos.map((video) => (
              <div
                key={video.videoId}
                className="bg-white/5 rounded-lg p-4 flex items-center justify-between hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-24 h-16 bg-white/10 rounded-lg overflow-hidden">
                    {/* TODO: Add video thumbnail */}
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-8 h-8 text-white/30" />
                    </div>
                  </div>
                  <div>
                    <p className="text-white font-semibold">
                      {video.poiName || 'Untitled Video'}
                    </p>
                    <p className="text-white/50 text-sm">
                      {video.cityName || 'Unknown Location'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-white font-semibold">
                    ${Number(video.totalEarned || 0).toFixed(2)}
                  </p>
                  <p className="text-white/50 text-sm">
                    {video.bookings} bookings
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/dashboard/creator/upload"
          className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-colors group"
        >
          <Plus className="w-8 h-8 text-white mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-white font-semibold mb-2">Upload New Video</h3>
          <p className="text-white/70 text-sm">
            Share your latest travel content and start earning
          </p>
        </Link>

        <Link
          href="/dashboard/creator/videos"
          className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-colors group"
        >
          <Video className="w-8 h-8 text-white mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-white font-semibold mb-2">Manage Videos</h3>
          <p className="text-white/70 text-sm">
            View and edit your uploaded content
          </p>
        </Link>

        <Link
          href="/dashboard/creator/settings"
          className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-colors group"
        >
          <Award className="w-8 h-8 text-white mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-white font-semibold mb-2">Profile Settings</h3>
          <p className="text-white/70 text-sm">
            Update your creator profile and payout info
          </p>
        </Link>
      </div>
    </div>
  )
}
