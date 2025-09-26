'use client'

import { useState, useEffect } from 'react'
import { Search, TrendingUp, Clock, BarChart3 } from 'lucide-react'

interface PopularSearch {
  query: string
  search_count: number
  result_count: number
  last_searched: string
  recency_category: string
}

export default function PopularSearchesPage() {
  const [searches, setSearches] = useState<PopularSearch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSearches = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/analytics/popular-searches?limit=50')
        const data = await response.json()
        
        if (data.ok) {
          setSearches(data.data)
        } else {
          setError(data.error || 'Failed to load search analytics')
        }
      } catch (err) {
        setError('Network error loading search analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchSearches()
  }, [])

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'recent':
        return <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Recent</span>
      case 'monthly':
        return <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Monthly</span>
      default:
        return <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Older</span>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">Popular Searches</h1>
          <p className="text-sm text-slate-600">Loading search analytics...</p>
        </header>
        <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">Popular Searches</h1>
          <p className="text-sm text-red-600">Error: {error}</p>
        </header>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Popular Searches</h1>
        <p className="text-sm text-slate-600">Track the most popular airport search queries</p>
      </header>

      {/* Summary stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Search className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-slate-600">Total Queries</p>
              <p className="text-2xl font-bold text-slate-900">{searches.length}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-slate-600">Total Searches</p>
              <p className="text-2xl font-bold text-slate-900">
                {searches.reduce((sum, search) => sum + search.search_count, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-slate-600">Avg Results</p>
              <p className="text-2xl font-bold text-slate-900">
                {searches.length > 0 
                  ? Math.round(searches.reduce((sum, search) => sum + search.result_count, 0) / searches.length)
                  : 0
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search results table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Search Queries</h2>
        </div>
        
        {searches.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No search data available yet. Searches will appear here once users start searching.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Query</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Search Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Results Found</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Searched</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Recency</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {searches.map((search, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Search className="h-4 w-4 text-slate-400 mr-2" />
                        <span className="text-sm font-medium text-slate-900">&quot;{search.query}&quot;</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {search.search_count.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {search.result_count.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDate(search.last_searched)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getCategoryBadge(search.recency_category)}
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