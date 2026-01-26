'use client'

import { useEffect, useState } from 'react'
import { Activity, ClipboardList, MapPin, ShieldCheck, Video, TrendingUp, Users, DollarSign, Loader2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface MetricCard {
  id: string
  title: string
  value: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  helper: string
  icon: LucideIcon
  loading?: boolean
}

interface DashboardStats {
  destinations: { total: number; active: number }
  moderation: { pending: number }
  creators: { waitlist: number }
  health: { database: boolean; cache: boolean }
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [destinationsRes, moderationRes, waitlistRes, healthRes] = await Promise.allSettled([
          fetch('/api/admin/destinations?limit=1').then(r => r.json()),
          fetch('/api/admin/moderation?status=pending&limit=1').then(r => r.json()),
          fetch('/api/creators/waitlist').then(r => r.json()),
          fetch('/api/health').then(r => r.json()),
        ])

        setStats({
          destinations: {
            total: destinationsRes.status === 'fulfilled' ? (destinationsRes.value.total || 0) : 0,
            active: destinationsRes.status === 'fulfilled' ? (destinationsRes.value.data?.length || 0) : 0,
          },
          moderation: {
            pending: moderationRes.status === 'fulfilled' ? (moderationRes.value.total || 0) : 0,
          },
          creators: {
            waitlist: waitlistRes.status === 'fulfilled' ? (waitlistRes.value.count || 0) : 0,
          },
          health: {
            database: healthRes.status === 'fulfilled' && healthRes.value.status === 'healthy',
            cache: healthRes.status === 'fulfilled' && healthRes.value.cache?.status === 'healthy',
          },
        })
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const metrics: MetricCard[] = [
    {
      id: 'destinations',
      title: 'Destinations',
      value: loading ? '--' : String(stats?.destinations.total || 0),
      helper: 'Total destinations in the index',
      icon: MapPin,
      loading,
    },
    {
      id: 'moderation',
      title: 'Moderation Queue',
      value: loading ? '--' : String(stats?.moderation.pending || 0),
      changeType: (stats?.moderation.pending || 0) > 10 ? 'negative' : 'neutral',
      helper: 'Items awaiting review',
      icon: ShieldCheck,
      loading,
    },
    {
      id: 'waitlist',
      title: 'Creator Waitlist',
      value: loading ? '--' : String(stats?.creators.waitlist || 0),
      changeType: 'positive',
      helper: 'People signed up for creator program',
      icon: Users,
      loading,
    },
    {
      id: 'health',
      title: 'System Health',
      value: loading ? '--' : (stats?.health.database ? '✓ Online' : '✗ Issues'),
      changeType: stats?.health.database ? 'positive' : 'negative',
      helper: 'Database and cache status',
      icon: Activity,
      loading,
    },
  ]

  const quickActions = [
    { label: 'Review moderation queue', href: '/admin/moderation' },
    { label: 'Manage destinations', href: '/admin/destinations/manage' },
    { label: 'View creator waitlist', href: '/admin/creators' },
  ]

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
        <p className="text-sm text-slate-600">
          Overview of Spontra platform status and metrics
          {!loading && <span className="ml-2 text-xs text-slate-400">• Auto-refreshes every 30s</span>}
        </p>
      </header>

      {/* Metrics Grid */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ id, title, value, changeType, helper, icon: Icon, loading: isLoading }) => (
          <article key={id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  ) : (
                    <p className={`text-2xl font-semibold ${
                      changeType === 'positive' ? 'text-emerald-600' :
                      changeType === 'negative' ? 'text-red-600' :
                      'text-slate-900'
                    }`}>
                      {value}
                    </p>
                  )}
                </div>
              </div>
              <div className={`p-2 rounded-lg ${
                changeType === 'positive' ? 'bg-emerald-50' :
                changeType === 'negative' ? 'bg-red-50' :
                'bg-slate-50'
              }`}>
                <Icon size={20} className={
                  changeType === 'positive' ? 'text-emerald-500' :
                  changeType === 'negative' ? 'text-red-500' :
                  'text-slate-400'
                } />
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-500">{helper}</p>
          </article>
        ))}
      </section>

      {/* Quick Actions */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium text-slate-700 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {label}
              <span className="text-slate-400">→</span>
            </a>
          ))}
        </div>
      </section>

      {/* Recent Activity Placeholder */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium text-slate-700 mb-4">Platform Status</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-600">Database</span>
            <span className={`text-sm font-medium ${stats?.health.database ? 'text-emerald-600' : 'text-red-600'}`}>
              {loading ? '...' : (stats?.health.database ? 'Connected' : 'Disconnected')}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-600">Creator Program</span>
            <span className="text-sm font-medium text-amber-600">Coming Soon</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-600">Affiliate Integrations</span>
            <span className="text-sm font-medium text-emerald-600">Active</span>
          </div>
        </div>
      </section>
    </div>
  )
}
