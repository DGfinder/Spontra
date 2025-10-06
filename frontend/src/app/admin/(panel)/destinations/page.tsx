'use client'

import { useState, useEffect } from 'react'
import { getDestinations } from '@/actions/destinationActions'
import { ManagePOIModal } from '@/components/admin/poi/ManagePOIModal'

interface Destination {
  id: string
  cityName: string
  airportCode: string | null
  country: {
    id: string
    name: string
    code: string
    createdAt: string
    updatedAt: string
  } | null
  airports: Array<{
    isPrimary: boolean
    createdAt: string
    airport: {
      iataCode: string
      name: string
    }
  }>
  _count: {
    themePOIs: number
  }
}

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null)

  useEffect(() => {
    loadDestinations()
  }, [])

  async function loadDestinations() {
    setIsLoading(true)
    const result = await getDestinations()
    console.log('[Destinations] Load result:', result)
    if (result.success && result.data) {
      console.log('[Destinations] Setting data:', result.data.length, 'destinations')
      setDestinations(result.data)
    } else {
      console.error('[Destinations] Failed to load:', result.error)
    }
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Destinations</h1>
        <p className="text-white/70 mt-1">Manage destination content and theme POIs</p>
      </div>

      {/* Table */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                City
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                Country
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                Airports
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                POIs
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {destinations.map((dest) => (
              <tr key={dest.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                  {dest.cityName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                  {dest.country?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm text-white/70">
                  <div className="flex flex-wrap gap-1">
                    {dest.airports && dest.airports.length > 0 ? (
                      dest.airports.map((da) => (
                        <span
                          key={da.airport.iataCode}
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            da.isPrimary
                              ? 'bg-white/20 text-white'
                              : 'bg-white/10 text-white/70'
                          }`}
                          title={da.airport.name}
                        >
                          {da.airport.iataCode}
                          {da.isPrimary && ' ★'}
                        </span>
                      ))
                    ) : dest.airportCode ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/20 text-white">
                        {dest.airportCode}
                      </span>
                    ) : (
                      <span className="text-white/50">No airports</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                  {dest._count.themePOIs} POIs
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setSelectedDestinationId(dest.id)}
                    className="text-blue-300 hover:text-blue-200"
                  >
                    Manage POIs
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* POI Management Modal */}
      <ManagePOIModal
        destinationId={selectedDestinationId}
        isOpen={selectedDestinationId !== null}
        onClose={() => setSelectedDestinationId(null)}
        onSuccess={loadDestinations}
      />
    </div>
  )
}
