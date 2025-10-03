'use client'

import { useState, useEffect } from 'react'
import { getMapData } from '@/actions/mapActions'
import type { MapAirport, MapPOI } from '@/actions/mapActions'
import MapView from '@/components/admin/MapView'
import MapControls from '@/components/admin/MapControls'

export default function MapPage() {
  const [airports, setAirports] = useState<MapAirport[]>([])
  const [pois, setPois] = useState<MapPOI[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Map controls state
  const [showAirports, setShowAirports] = useState(true)
  const [showPOIs, setShowPOIs] = useState(true)
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)

  useEffect(() => {
    loadMapData()
  }, [])

  async function loadMapData() {
    setIsLoading(true)
    setError(null)

    const result = await getMapData({
      showAirports: true,
      showPOIs: true
    })

    if (result.success && result.data) {
      setAirports(result.data.airports)
      setPois(result.data.pois)
    } else {
      setError(result.error || 'Failed to load map data')
    }

    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white mx-auto"></div>
          <p className="text-white/70 mt-4">Loading map data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-md">
          <h3 className="text-red-300 font-bold text-lg mb-2">Error Loading Map</h3>
          <p className="text-red-200/70">{error}</p>
          <button
            onClick={loadMapData}
            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Map View</h1>
        <p className="text-white/70 mt-1">
          Visualize airports and points of interest • {airports.length} airports • {pois.length} POIs
        </p>
      </div>

      {/* Map Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Left Sidebar - Controls */}
        <div className="order-2 lg:order-1">
          <MapControls
            showAirports={showAirports}
            showPOIs={showPOIs}
            selectedTheme={selectedTheme}
            onToggleAirports={() => setShowAirports(!showAirports)}
            onTogglePOIs={() => setShowPOIs(!showPOIs)}
            onThemeChange={setSelectedTheme}
          />
        </div>

        {/* Right - Map */}
        <div className="order-1 lg:order-2 h-[600px] lg:h-[calc(100vh-180px)]">
          <MapView
            airports={airports}
            pois={pois}
            showAirports={showAirports}
            showPOIs={showPOIs}
            selectedTheme={selectedTheme || undefined}
          />
        </div>
      </div>

      {/* Stats Footer */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4">
          <div className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">Total Airports</div>
          <div className="text-white text-2xl font-bold">{airports.length}</div>
          <div className="text-white/50 text-xs mt-1">
            {airports.filter((a) => a.isSearchable).length} searchable
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4">
          <div className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">Points of Interest</div>
          <div className="text-white text-2xl font-bold">{pois.length}</div>
          <div className="text-white/50 text-xs mt-1">
            {pois.filter((p) => p.primaryAirport).length} linked to airports
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4">
          <div className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">Total Videos</div>
          <div className="text-white text-2xl font-bold">
            {pois.reduce((sum, poi) => sum + poi.videoCount, 0)}
          </div>
          <div className="text-white/50 text-xs mt-1">Across all POIs</div>
        </div>
      </div>
    </div>
  )
}
