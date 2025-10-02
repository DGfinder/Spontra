'use client'

import React from 'react'
import { MapPin, Compass, Clock, Users, Armchair, Edit3 } from 'lucide-react'
import { SearchFilters } from '@/lib/store'

interface SearchSummaryBarProps {
  filters: SearchFilters
  onEdit: () => void
  theme: string
}

export function SearchSummaryBar({ filters, onEdit, theme }: SearchSummaryBarProps) {
  // Get theme configuration
  const themeConfigs: Record<string, { color: string; icon: any }> = {
    adventure: { color: '#ffbd0a', icon: Compass },
    nature: { color: '#02c06d', icon: Compass },
    indulge: { color: '#e52b00', icon: Compass },
    vibe: { color: '#eb5b25', icon: Compass },
    discover: { color: '#7f6ae4', icon: Compass }
  }

  const themeConfig = themeConfigs[filters.theme] || themeConfigs.adventure
  const ThemeIcon = themeConfig.icon

  return (
    <div
      className="sticky top-0 z-40 backdrop-blur-md border-b py-4 mb-8"
      style={{
        backgroundColor: 'rgba(11,15,18,0.9)',
        borderColor: 'rgba(255,255,255,0.12)'
      }}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Search Pills */}
          <div className="flex items-center gap-3 flex-wrap flex-1">
            {/* Departure Airport */}
            <Pill icon={MapPin} label="From">
              <span className="font-semibold">{filters.departureAirport}</span>
            </Pill>

            {/* Theme */}
            <Pill
              icon={ThemeIcon}
              label="Theme"
              style={{ backgroundColor: `${themeConfig.color}22` }}
            >
              <span
                className="font-semibold capitalize"
                style={{ color: themeConfig.color }}
              >
                {filters.theme}
              </span>
            </Pill>

            {/* Flight Time */}
            <Pill icon={Clock} label="Flight Time">
              <span className="font-semibold">
                {filters.minFlightTime}h - {filters.maxFlightTime}h
              </span>
            </Pill>

            {/* Travelers */}
            <Pill icon={Users} label="Travelers">
              <span className="font-semibold">
                {filters.passengers} {filters.passengers === 1 ? 'traveler' : 'travelers'}
              </span>
            </Pill>

            {/* Cabin Class */}
            <Pill icon={Armchair} label="Class">
              <span className="font-semibold">{filters.cabin}</span>
            </Pill>
          </div>

          {/* Edit Button */}
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 rounded-full
                       bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30
                       text-white transition-all duration-200
                       active:scale-95 whitespace-nowrap"
          >
            <Edit3 className="w-4 h-4" />
            <span className="text-sm font-medium">Edit Search</span>
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Pill component for search parameter display
 */
function Pill({
  icon: Icon,
  label,
  children,
  style
}: {
  icon: any
  label: string
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-full
                 bg-white/10 border border-white/20 text-sm"
      style={style}
    >
      <Icon className="w-4 h-4 text-white/60" />
      <span className="text-white/60 text-xs">{label}:</span>
      {children}
    </div>
  )
}
