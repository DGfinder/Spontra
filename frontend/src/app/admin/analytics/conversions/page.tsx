'use client'

import { useEffect, useState } from 'react'

export default function ConversionAnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/webhooks/conversion?timeframe=24h', { cache: 'no-store' })
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
          <h1 className="text-2xl font-bold text-gray-900">Conversion Analytics</h1>
          <p className="text-gray-600">Partner conversions and revenue (last 24h)</p>
        </div>
        <button onClick={load} className="px-4 py-2 bg-gray-800 text-white rounded-lg">Refresh</button>
      </div>

      {loading && <div className="text-gray-600">Loading…</div>}
      {error && <div className="text-red-600">{error}</div>}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-sm text-gray-500">Total Conversions</div>
            <div className="text-2xl font-semibold">{data.metrics.totalConversions}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-sm text-gray-500">Total Revenue</div>
            <div className="text-2xl font-semibold">{data.metrics.totalRevenue}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-sm text-gray-500">Total Commissions</div>
            <div className="text-2xl font-semibold">{data.metrics.totalCommissions}</div>
          </div>
        </div>
      )}

      {data && (
        <div className="bg-white rounded-lg p-4 border">
          <div className="text-lg font-semibold mb-3">Recent Conversions</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Click ID</th>
                  <th className="py-2">Booking</th>
                  <th className="py-2">Value</th>
                  <th className="py-2">Commission</th>
                  <th className="py-2">Route</th>
                </tr>
              </thead>
              <tbody>
                {data.conversions?.map((c: any, idx: number) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-2 pr-4">{c.clickId}</td>
                    <td className="py-2 pr-4">{c.bookingReference}</td>
                    <td className="py-2 pr-4">{c.currency}{c.bookingValue}</td>
                    <td className="py-2 pr-4">{c.currency}{c.commissionValue}</td>
                    <td className="py-2">{c.flightDetails?.origin} → {c.flightDetails?.destination}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )}

