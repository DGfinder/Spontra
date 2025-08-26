'use client'

import { useEffect, useState } from 'react'
import { Search, Plane } from 'lucide-react'
import apiClient from '@/services/apiClient'

interface AirportRow {
  code: string
  name: string
  city: string
  country: string
}

export default function AirportsPage() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<AirportRow[]>([])
  const [loading, setLoading] = useState(false)

  const search = async (query: string) => {
    setLoading(true)
    try {
      const items = await apiClient.getAirportSuggestions(query)
      setResults(items as AirportRow[])
    } catch (e) {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { if (q.length >= 2) search(q); else setResults([]) }, 250)
    return () => clearTimeout(id)
  }, [q])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Airports</h1>
          <p className="text-gray-600">Search reference airport data (read-only)</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="relative max-w-xl">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by city, airport name or code..."
            className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : results.length === 0 && q.length >= 2 ? (
            <div className="text-gray-600">No results</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((a) => (
                <div key={`${a.code}`} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{a.code}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{a.name}</div>
                        <div className="text-sm text-gray-600">{a.city}, {a.country}</div>
                      </div>
                    </div>
                    <Plane size={16} className="text-blue-600" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


