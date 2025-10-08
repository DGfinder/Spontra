import { redirect } from 'next/navigation'
import { DollarSign, Eye, ShoppingCart, TrendingUp } from 'lucide-react'
import { getUserId } from '@/lib/session'
import { getCreatorByUserId } from '@/actions/creatorActions'
import { getCreatorAnalytics, getTopVideos, getEarningsByDestination } from '@/actions/analyticsActions'
import { MetricCard } from '@/components/analytics/MetricCard'
import { EarningsChart } from '@/components/analytics/EarningsChart'
import { VideoPerformanceChart } from '@/components/analytics/VideoPerformanceChart'
import { DestinationBreakdownChart } from '@/components/analytics/DestinationBreakdownChart'

export default async function CreatorAnalyticsPage({
  searchParams
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const params = await searchParams
  const dateRange = (params.range as 'week' | 'month' | 'year' | 'all') || 'month'

  // Check if user is logged in
  const userId = await getUserId()
  if (!userId) {
    redirect('/login?return=/dashboard/creator/analytics')
  }

  // Get creator profile
  const profileResult = await getCreatorByUserId(userId)
  if (!profileResult.success || !profileResult.data) {
    redirect('/become-creator')
  }

  const creator = profileResult.data

  // Fetch analytics data
  const [analyticsResult, topVideosResult, destinationResult] = await Promise.all([
    getCreatorAnalytics(creator.id, dateRange),
    getTopVideos(creator.id, 5),
    getEarningsByDestination(creator.id)
  ])

  const analytics = analyticsResult.success && analyticsResult.data ? analyticsResult.data : null
  const topVideos = topVideosResult.success && topVideosResult.data ? topVideosResult.data : []
  const destinations = destinationResult.success && destinationResult.data ? destinationResult.data : []

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/20 p-8">
            <p className="text-white text-center">Failed to load analytics data</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Analytics</h1>
            <p className="text-white/70">Track your performance and earnings</p>
          </div>

          {/* Date Range Selector */}
          <div className="flex gap-2">
            {(['week', 'month', 'year', 'all'] as const).map((range) => (
              <a
                key={range}
                href={`?range=${range}`}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  dateRange === range
                    ? 'bg-white text-purple-900'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {range === 'all' ? 'All Time' : range.charAt(0).toUpperCase() + range.slice(1)}
              </a>
            ))}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Earnings"
            value={`$${analytics.metrics.totalEarnings.toFixed(2)}`}
            icon={DollarSign}
            color="green"
          />
          <MetricCard
            title="Total Bookings"
            value={analytics.metrics.totalBookings}
            icon={ShoppingCart}
            color="blue"
          />
          <MetricCard
            title="Total Views"
            value={analytics.metrics.totalViews.toLocaleString()}
            icon={Eye}
            color="purple"
          />
          <MetricCard
            title="Conversion Rate"
            value={`${analytics.metrics.conversionRate.toFixed(2)}%`}
            icon={TrendingUp}
            color="yellow"
            subtitle={`${analytics.metrics.totalVideos} videos`}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EarningsChart data={analytics.timeline} />
          <DestinationBreakdownChart data={destinations} />
        </div>

        {/* Charts Row 2 */}
        <VideoPerformanceChart data={topVideos} />

        {/* Top Videos List */}
        {topVideos.length > 0 && (
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top Performing Videos</h3>
            <div className="space-y-4">
              {topVideos.map((video, index) => (
                <div
                  key={video.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/20 text-purple-200 font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{video.poiName}</h4>
                      <p className="text-sm text-white/60">{video.destination}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-white/60">Views</p>
                      <p className="text-white font-semibold">{video.views.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white/60">Bookings</p>
                      <p className="text-white font-semibold">{video.bookings}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white/60">Earned</p>
                      <p className="text-green-400 font-bold">${video.totalEarned.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
