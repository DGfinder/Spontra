'use client'

import { Plane, MapPin, Filter } from 'lucide-react'

interface MapControlsProps {
  showAirports: boolean
  showPOIs: boolean
  selectedTheme: string | null
  onToggleAirports: () => void
  onTogglePOIs: () => void
  onThemeChange: (theme: string | null) => void
}

const THEMES = [
  { value: 'adventure', label: 'Adventure', emoji: '🏔️', color: '#ffbd0a' },
  { value: 'nature', label: 'Nature', emoji: '🌲', color: '#02c06d' },
  { value: 'vibe', label: 'Vibe', emoji: '🎭', color: '#eb5b25' },
  { value: 'indulge', label: 'Indulge', emoji: '🍷', color: '#e52b00' },
  { value: 'discover', label: 'Discover', emoji: '🔍', color: '#7f6ae4' },
  { value: 'culture', label: 'Culture', emoji: '🎨', color: '#a855f7' },
  { value: 'beach', label: 'Beach', emoji: '🏖️', color: '#06b6d4' },
  { value: 'city', label: 'City', emoji: '🏙️', color: '#6b7280' }
]

export default function MapControls({
  showAirports,
  showPOIs,
  selectedTheme,
  onToggleAirports,
  onTogglePOIs,
  onThemeChange
}: MapControlsProps) {
  return (
    <div className="space-y-4">
      {/* Layer Toggles */}
      <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4">
        <h3 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Layers
        </h3>
        <div className="space-y-2">
          <button
            onClick={onToggleAirports}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
              showAirports ? 'bg-brand-blue/30 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Plane className="w-4 h-4" />
            <span className="text-sm font-medium">Airports</span>
            <div className="ml-auto">
              <div
                className={`w-10 h-5 rounded-full transition-colors ${
                  showAirports ? 'bg-brand-blue' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform transform ${
                    showAirports ? 'translate-x-5' : 'translate-x-0.5'
                  } mt-0.5`}
                />
              </div>
            </div>
          </button>

          <button
            onClick={onTogglePOIs}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
              showPOIs ? 'bg-brand-purple/30 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">Points of Interest</span>
            <div className="ml-auto">
              <div
                className={`w-10 h-5 rounded-full transition-colors ${
                  showPOIs ? 'bg-brand-purple' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform transform ${
                    showPOIs ? 'translate-x-5' : 'translate-x-0.5'
                  } mt-0.5`}
                />
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Theme Filter */}
      {showPOIs && (
        <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4">
          <h3 className="text-white font-medium text-sm mb-3">Filter by Theme</h3>
          <div className="space-y-1">
            <button
              onClick={() => onThemeChange(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedTheme === null
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              All Themes
            </button>
            {THEMES.map((theme) => (
              <button
                key={theme.value}
                onClick={() => onThemeChange(theme.value)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                  selectedTheme === theme.value
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>{theme.emoji}</span>
                <span>{theme.label}</span>
                {selectedTheme === theme.value && (
                  <div className="ml-auto w-2 h-2 rounded-full" style={{ backgroundColor: theme.color }} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4">
        <h3 className="text-white font-medium text-sm mb-3">Legend</h3>
        <div className="space-y-2 text-xs text-white/70">
          {showAirports && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-brand-blue border-2 border-white/50 flex items-center justify-center">
                <Plane className="w-3 h-3 text-white" />
              </div>
              <span>Airport (larger = searchable)</span>
            </div>
          )}
          {showPOIs && (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-brand-purple border-2 border-white/50 flex items-center justify-center">
                <MapPin className="w-2.5 h-2.5 text-white" />
              </div>
              <span>Point of Interest (color = theme)</span>
            </div>
          )}
          {showPOIs && showAirports && (
            <div className="flex items-center gap-2">
              <div className="w-8 border-t border-dashed border-white/30" />
              <span>POI to Airport connection</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
