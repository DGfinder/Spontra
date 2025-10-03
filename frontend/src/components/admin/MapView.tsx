'use client'

import { useState, useEffect, useMemo } from 'react'
import Map, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl/maplibre'
import type { MapRef } from 'react-map-gl/maplibre'
import { Plane, MapPin } from 'lucide-react'
import type { MapAirport, MapPOI } from '@/actions/mapActions'

interface MapViewProps {
  airports: MapAirport[]
  pois: MapPOI[]
  showAirports?: boolean
  showPOIs?: boolean
  selectedTheme?: string
}

const THEME_COLORS: Record<string, string> = {
  adventure: '#ffbd0a',
  nature: '#02c06d',
  vibe: '#eb5b25',
  indulge: '#e52b00',
  discover: '#7f6ae4',
  culture: '#a855f7',
  beach: '#06b6d4',
  city: '#6b7280'
}

export default function MapView({
  airports,
  pois,
  showAirports = true,
  showPOIs = true,
  selectedTheme
}: MapViewProps) {
  const [selectedAirport, setSelectedAirport] = useState<MapAirport | null>(null)
  const [selectedPOI, setSelectedPOI] = useState<MapPOI | null>(null)

  // Filter POIs by theme if specified
  const filteredPOIs = useMemo(() => {
    if (!selectedTheme) return pois
    return pois.filter((poi) => poi.theme === selectedTheme)
  }, [pois, selectedTheme])

  // Calculate map bounds to fit all markers
  const bounds = useMemo(() => {
    const allPoints: { latitude: number; longitude: number }[] = []

    if (showAirports) {
      allPoints.push(...airports.map((a) => ({ latitude: a.latitude, longitude: a.longitude })))
    }

    if (showPOIs) {
      allPoints.push(...filteredPOIs.map((p) => ({ latitude: p.latitude, longitude: p.longitude })))
    }

    if (allPoints.length === 0) {
      return { center: [0, 20] as [number, number], zoom: 2 }
    }

    const lngs = allPoints.map((p) => p.longitude)
    const lats = allPoints.map((p) => p.latitude)

    return {
      center: [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2] as [
        number,
        number
      ],
      zoom: 3
    }
  }, [airports, filteredPOIs, showAirports, showPOIs])

  // Create GeoJSON for POI to Airport lines
  const connectionLines = useMemo(() => {
    if (!showPOIs || !showAirports) return null

    const features = filteredPOIs
      .filter((poi) => poi.primaryAirport)
      .map((poi) => ({
        type: 'Feature' as const,
        properties: {
          poiName: poi.name,
          airportCode: poi.primaryAirport!.iataCode,
          theme: poi.theme
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: [
            [poi.longitude, poi.latitude],
            [poi.primaryAirport!.longitude, poi.primaryAirport!.latitude]
          ]
        }
      }))

    return {
      type: 'FeatureCollection' as const,
      features
    }
  }, [filteredPOIs, showPOIs, showAirports])

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/20">
      <Map
        initialViewState={{
          longitude: bounds.center[0],
          latitude: bounds.center[1],
          zoom: bounds.zoom
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        attributionControl={false}
      >
        {/* Navigation Controls */}
        <NavigationControl position="top-right" />

        {/* Connection Lines (POI to Airport) */}
        {connectionLines && showPOIs && showAirports && (
          <Source id="connection-lines" type="geojson" data={connectionLines}>
            <Layer
              id="connections"
              type="line"
              paint={{
                'line-color': ['get', 'theme'],
                'line-width': 1,
                'line-opacity': 0.3,
                'line-dasharray': [2, 2]
              }}
            />
          </Source>
        )}

        {/* Airport Markers */}
        {showAirports &&
          airports.map((airport) => (
            <Marker
              key={airport.id}
              longitude={airport.longitude}
              latitude={airport.latitude}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation()
                setSelectedAirport(airport)
                setSelectedPOI(null)
              }}
            >
              <div
                className={`cursor-pointer transition-all hover:scale-110 ${
                  airport.isSearchable ? 'w-8 h-8' : 'w-6 h-6'
                }`}
              >
                <div className="relative">
                  <div
                    className={`absolute inset-0 rounded-full bg-brand-blue/20 blur-sm ${
                      airport.isSearchable ? 'animate-pulse' : ''
                    }`}
                  />
                  <div
                    className={`relative flex items-center justify-center rounded-full bg-brand-blue border-2 border-white/50 shadow-lg ${
                      airport.isSearchable ? 'w-8 h-8' : 'w-6 h-6'
                    }`}
                  >
                    <Plane className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </Marker>
          ))}

        {/* POI Markers */}
        {showPOIs &&
          filteredPOIs.map((poi) => {
            const themeColor = THEME_COLORS[poi.theme] || '#3b82f6'

            return (
              <Marker
                key={poi.id}
                longitude={poi.longitude}
                latitude={poi.latitude}
                anchor="center"
                onClick={(e) => {
                  e.originalEvent.stopPropagation()
                  setSelectedPOI(poi)
                  setSelectedAirport(null)
                }}
              >
                <div className="cursor-pointer transition-all hover:scale-110 w-6 h-6">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full blur-sm" style={{ backgroundColor: `${themeColor}40` }} />
                    <div
                      className="relative flex items-center justify-center rounded-full border-2 border-white/50 shadow-lg w-6 h-6"
                      style={{ backgroundColor: themeColor }}
                    >
                      <MapPin className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>
              </Marker>
            )
          })}

        {/* Airport Popup */}
        {selectedAirport && (
          <Popup
            longitude={selectedAirport.longitude}
            latitude={selectedAirport.latitude}
            anchor="top"
            onClose={() => setSelectedAirport(null)}
            closeButton={true}
            closeOnClick={false}
            className="map-popup"
          >
            <div className="bg-white/10 backdrop-blur-xl rounded-lg p-3 min-w-[200px]">
              <div className="flex items-start gap-2">
                <Plane className="w-5 h-5 text-brand-blue mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-white font-bold text-sm">{selectedAirport.iataCode}</h3>
                  <p className="text-white/90 text-xs font-medium">{selectedAirport.name}</p>
                  <p className="text-white/70 text-xs">
                    {selectedAirport.city}, {selectedAirport.country}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        selectedAirport.isSearchable ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'
                      }`}
                    >
                      {selectedAirport.isSearchable ? 'Searchable' : 'Not Searchable'}
                    </span>
                    <span className="text-white/60">{selectedAirport.routeCount} routes</span>
                  </div>
                </div>
              </div>
            </div>
          </Popup>
        )}

        {/* POI Popup */}
        {selectedPOI && (
          <Popup
            longitude={selectedPOI.longitude}
            latitude={selectedPOI.latitude}
            anchor="top"
            onClose={() => setSelectedPOI(null)}
            closeButton={true}
            closeOnClick={false}
            className="map-popup"
          >
            <div className="bg-white/10 backdrop-blur-xl rounded-lg p-3 min-w-[200px]">
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 mt-0.5" style={{ color: THEME_COLORS[selectedPOI.theme] || '#3b82f6' }} />
                <div className="flex-1">
                  <h3 className="text-white font-bold text-sm">{selectedPOI.name}</h3>
                  <p className="text-white/90 text-xs">
                    {selectedPOI.destinationCity}
                    {selectedPOI.destinationCountry && `, ${selectedPOI.destinationCountry}`}
                  </p>
                  {selectedPOI.description && (
                    <p className="text-white/70 text-xs mt-1 line-clamp-2">{selectedPOI.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span
                      className="px-2 py-0.5 rounded-full text-white font-medium"
                      style={{ backgroundColor: `${THEME_COLORS[selectedPOI.theme]}40` }}
                    >
                      {selectedPOI.theme}
                    </span>
                    <span className="text-white/60">{selectedPOI.videoCount} videos</span>
                  </div>
                  {selectedPOI.primaryAirport && (
                    <p className="text-white/50 text-xs mt-1">Near {selectedPOI.primaryAirport.iataCode}</p>
                  )}
                </div>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}
