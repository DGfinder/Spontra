import { Users, Video, DollarSign, TrendingUp, CheckCircle, XCircle } from 'lucide-react'
import { getPlatformAnalytics, getModerationMetrics } from '@/actions/analyticsActions'
import { MetricCard } from '@/components/analytics/MetricCard'

export default async function AdminAnalyticsPage({
  searchParams
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const params = await searchParams
  const dateRange = (params.range as 'week' | 'month' | 'year' | 'all') || 'month'

  // Fetch analytics data
  const [platformResult, moderationResult] = await Promise.all([
    getPlatformAnalytics(dateRange),
    getModerationMetrics()
  ])

  const platform = platformResult.success && platformResult.data ? platformResult.data : null
  const moderation = moderationResult.success && moderationResult.data ? moderationResult.data : null

  if (!platform || !moderation) {
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
            <h1 className="text-4xl font-bold text-white mb-2">Platform Analytics</h1>
            <p className="text-white/70">Monitor platform performance and creator activity</p>
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

        {/* Platform Metrics */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Platform Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Revenue"
              value={`$${platform.metrics.totalRevenue.toFixed(2)}`}
              icon={DollarSign}
              color="green"
              subtitle={`${platform.metrics.totalBookings.toLocaleString()} bookings`}
            />
            <MetricCard
              title="Total Creators"
              value={platform.metrics.totalCreators}
              icon={Users}
              color="blue"
              subtitle={`${platform.metrics.activeCreators} active`}
            />
            <MetricCard
              title="Total Videos"
              value={platform.metrics.totalVideos}
              icon={Video}
              color="purple"
              subtitle={`${platform.metrics.approvedVideos} approved`}
            />
            <MetricCard
              title="Conversion Rate"
              value={`${platform.metrics.conversionRate.toFixed(2)}%`}
              icon={TrendingUp}
              color="yellow"
              subtitle={`${platform.metrics.totalViews.toLocaleString()} views`}
            />
          </div>
        </div>

        {/* Moderation Metrics */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Moderation Pipeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {moderation.statusCounts.map((statusCount) => {
              const icons = {
                pending: Video,
                approved: CheckCircle,
                rejected: XCircle
              }
              const colors = {
                pending: 'yellow' as const,
                approved: 'green' as const,
                rejected: 'red' as const
              }

              const Icon = icons[statusCount.status as keyof typeof icons] || Video
              const color = colors[statusCount.status as keyof typeof colors] || 'blue'

              return (
                <MetricCard
                  key={statusCount.status}
                  title={`${statusCount.status.charAt(0).toUpperCase() + statusCount.status.slice(1)} Videos`}
                  value={statusCount.count}
                  icon={Icon}
                  color={color}
                />
              )
            })}
          </div>

          <div className="mt-6 bg-white/5 backdrop-blur-xl rounded-xl border border-white/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Approval Rate</h3>
            <p className="text-3xl font-bold text-white mb-4">{moderation.approvalRate.toFixed(1)}%</p>
            <div className="bg-white/10 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${moderation.approvalRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Top Creators */}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/20 p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Top Creators</h2>
          <div className="space-y-4">
            {platform.topCreators.map((creator, index) => (
              <div
                key={creator.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/20 text-purple-200 font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="text-white font-medium flex items-center gap-2">
                      {creator.displayName}
                      {creator.isVerified && (
                        <span className="text-blue-400 text-xs">✓ Verified</span>
                      )}
                    </h4>
                    <p className="text-sm text-white/60">
                      {creator.tier.toUpperCase()} Tier
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-white/60">Videos</p>
                    <p className="text-white font-semibold">{creator.videoCount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/60">Bookings</p>
                    <p className="text-white font-semibold">{creator.bookingCount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/60">Earnings</p>
                    <p className="text-green-400 font-bold">${creator.totalEarnings.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Moderation Activity */}
        {moderation.recentActivity.length > 0 && (
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/20 p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Recent Moderation Activity (7 Days)</h2>
            <div className="space-y-2">
              {moderation.recentActivity.map((activity) => (
                <div
                  key={activity.date}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <p className="text-white font-medium">{activity.date}</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-white">{activity.approved} approved</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span className="text-white">{activity.rejected} rejected</span>
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
