'use client'

import { useEffect, useState } from 'react'
import { Trash2, RefreshCw } from 'lucide-react'

interface CacheEntry {
  cache_key: string
  origin_airport: string
  theme_name: string
  max_flight_hours: number
  generation_date: string
  expires_at: string
  created_at: string
}

export default function RecommendationsCachePage() {
  const [items, setItems] = useState<CacheEntry[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/themes/cache?limit=200', { cache: 'no-store' })
      const json = await res.json()
      setItems((json.data?.items || []) as CacheEntry[])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const purge = async (key: string) => {
    await fetch(`/api/admin/themes/cache/${encodeURIComponent(key)}`, { method: 'DELETE' })
    load()
  }

  useEffect(() => { load() }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recommendations Cache</h1>
          <p className="text-gray-600">View and purge cached theme-based recommendations</p>
        </div>
        <button onClick={load} className="px-3 py-2 bg-gray-100 rounded-lg text-gray-800 hover:bg-gray-200 flex items-center">
          <RefreshCw size={16} className="mr-2" /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {loading ? (
          <div className="text-gray-600">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-gray-600">No cache entries</div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="px-4 py-2">Cache Key</th>
                  <th className="px-4 py-2">Origin</th>
                  <th className="px-4 py-2">Theme</th>
                  <th className="px-4 py-2">Max Hours</th>
                  <th className="px-4 py-2">Generated</th>
                  <th className="px-4 py-2">Expires</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((e) => (
                  <tr key={e.cache_key}>
                    <td className="px-4 py-2 font-mono text-xs">{e.cache_key}</td>
                    <td className="px-4 py-2">{e.origin_airport}</td>
                    <td className="px-4 py-2 capitalize">{e.theme_name}</td>
                    <td className="px-4 py-2">{e.max_flight_hours}</td>
                    <td className="px-4 py-2">{new Date(e.generation_date).toLocaleString()}</td>
                    <td className="px-4 py-2">{new Date(e.expires_at).toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <button onClick={() => purge(e.cache_key)} className="px-2 py-1 text-red-600 hover:text-red-700 flex items-center">
                        <Trash2 size={16} className="mr-1" /> Purge
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}


