'use client'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'

interface AircraftType {
  icaoCode: string
  iataCode?: string
  name: string
  manufacturer?: string
}

export default function AircraftPage() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<AircraftType[]>([])
  const [loading, setLoading] = useState(false)

  const search = async (query: string) => {
    setLoading(true)
    try {
      // Placeholder until backend route is available
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
          <h1 className="text-2xl font-bold text-gray-900">Aircraft Types</h1>
          <p className="text-gray-600">Reference aircraft data (read-only)</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="relative max-w-xl">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or ICAO/IATA code..."
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
                <div key={`${a.icaoCode}`} className="border border-gray-200 rounded-lg p-4">
                  <div className="font-semibold text-gray-900">{a.name}</div>
                  <div className="text-sm text-gray-600">ICAO {a.icaoCode}{a.iataCode ? ` · IATA ${a.iataCode}` : ''}</div>
                  {a.manufacturer && <div className="text-sm text-gray-600">{a.manufacturer}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


