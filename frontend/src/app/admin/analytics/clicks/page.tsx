'use client'

import { useEffect, useState } from 'react'

export default function ClickAnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/analytics/click?timeframe=24h', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok || json.success === false) throw new Error(json.error || 'Failed to load')
      setData(json)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Click Analytics</h1>
          <p className="text-gray-600">Outbound clicks and engagement (last 24h)</p>
        </div>
        <button onClick={load} className="px-4 py-2 bg-gray-800 text-white rounded-lg">Refresh</button>
      </div>

      {loading && <div className="text-gray-600">Loading…</div>}
      {error && <div className="text-red-600">{error}</div>}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-sm text-gray-500">Total Clicks</div>
            <div className="text-2xl font-semibold">{data.metrics.totalClicks}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-sm text-gray-500">Total Value</div>
            <div className="text-2xl font-semibold">{data.metrics.totalValue}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-sm text-gray-500">Top Partner</div>
            <div className="text-2xl font-semibold">{data.metrics.topPartner || '—'}</div>
          </div>
        </div>
      )}

      {data && (
        <div className="bg-white rounded-lg p-4 border">
          <div className="text-lg font-semibold mb-3">Partner Breakdown</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Partner</th>
                  <th className="py-2">Clicks</th>
                  <th className="py-2">Total Value</th>
                  <th className="py-2">Avg Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.metrics.partnerStats || {}).map(([partner, stats]: any) => (
                  <tr key={partner} className="border-b last:border-0">
                    <td className="py-2 pr-4">{partner}</td>
                    <td className="py-2 pr-4">{stats.clicks}</td>
                    <td className="py-2 pr-4">{Math.round(stats.totalValue * 100) / 100}</td>
                    <td className="py-2">{Math.round((stats.averageValue || 0) * 100) / 100}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )}

