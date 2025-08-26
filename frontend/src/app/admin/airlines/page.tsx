'use client'

import { useEffect, useState } from 'react'
import { Search, Plane } from 'lucide-react'
import { Airline } from '@/types'

export default function AirlinesPage() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Airline[]>([])
  const [loading, setLoading] = useState(false)

  const search = async (query: string) => {
    setLoading(true)
    try {
      // Placeholder: try backend search-service when available; fallback to empty
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || ''
      if (base) {
        // Implement when backend endpoint exists
      }
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
          <h1 className="text-2xl font-bold text-gray-900">Airlines</h1>
          <p className="text-gray-600">Reference airline data (read-only)</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="relative max-w-xl">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or IATA/ICAO code..."
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
                <div key={`${a.iataCode}`} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{a.name}</div>
                      <div className="text-sm text-gray-600">IATA {a.iataCode}{a.icaoCode ? ` · ICAO ${a.icaoCode}` : ''}</div>
                      {a.country && <div className="text-sm text-gray-600">{a.country}</div>}
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


