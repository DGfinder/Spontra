'use client'

import React, { useState } from 'react'
import { useSearchStore } from '@/lib/store'
import { Button } from './ui/Button'
import { MapPinIcon, CalendarIcon, ClockIcon } from 'lucide-react'

export function SearchForm() {
  const { filters, updateFilter, search, isLoading, error } = useSearchStore()
  const [isFocused, setIsFocused] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    await search()
  }

  const themes = [
    { value: 'adventure', label: '🏔️ Adventure', color: 'adventure' },
    { value: 'beach', label: '🏖️ Beach', color: 'beach' },
    { value: 'city', label: '🏙️ City Break', color: 'city' },
    { value: 'culture', label: '🏛️ Culture', color: 'culture' },
    { value: 'nature', label: '🌲 Nature', color: 'nature' }
  ] as const

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-2xl">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-float">
          <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
            Spontra
          </h1>
          <p className="text-2xl text-white/90 mb-3 font-light">
            Discover your next adventure
          </p>
          <p className="text-lg text-white/70 max-w-md mx-auto">
            Find amazing destinations based on flight time and your travel style
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch}>
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
            <div className="space-y-8">
              
              {/* Departure Airport */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-white text-sm font-medium">
                  <MapPinIcon className="h-4 w-4" />
                  Where are you flying from?
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.departureAirport}
                    onChange={(e) => updateFilter('departureAirport', e.target.value)}
                    onFocus={() => setIsFocused('departure')}
                    onBlur={() => setIsFocused(null)}
                    placeholder="e.g. LAX, JFK, LHR"
                    className={`
                      w-full px-6 py-4 rounded-2xl text-white placeholder-white/50 
                      border transition-all duration-300 transform-gpu
                      ${isFocused === 'departure' 
                        ? 'bg-white/25 border-white/60 scale-[1.02] shadow-lg' 
                        : 'bg-white/15 border-white/30 hover:bg-white/20'
                      }
                      focus:outline-none focus:bg-white/25 focus:border-white/60 focus:scale-[1.02]
                      data-filled:bg-white/20
                    `}
                    data-filled={filters.departureAirport ? true : undefined}
                  />
                </div>
              </div>

              {/* Theme Selection */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-white text-sm font-medium">
                  <CalendarIcon className="h-4 w-4" />
                  What type of adventure?
                </label>
                
                {/* Dynamic grid using v4.0 - auto-generates columns */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {themes.map((theme) => (
                    <button
                      key={theme.value}
                      type="button"
                      onClick={() => updateFilter('theme', theme.value)}
                      className={`
                        p-4 rounded-2xl text-sm font-medium transition-all duration-300 transform-gpu
                        border backdrop-blur-sm
                        ${filters.theme === theme.value
                          ? `bg-${theme.color} text-white border-white/50 scale-105 shadow-xl`
                          : 'bg-white/10 text-white/90 border-white/20 hover:bg-white/20 hover:scale-[1.02] active:scale-95'
                        }
                        focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent
                      `}
                    >
                      <div className="text-lg mb-1">{theme.label.split(' ')[0]}</div>
                      <div className="text-xs opacity-90">{theme.label.split(' ')[1]}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Flight Time Range */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-white text-sm font-medium">
                  <ClockIcon className="h-4 w-4" />
                  Flight time: {filters.minFlightTime}h - {filters.maxFlightTime}h
                </label>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-white/70 text-xs font-medium">Min hours</label>
                    <div className="relative">
                      <input
                        type="range"
                        min="1"
                        max="12"
                        value={filters.minFlightTime}
                        onChange={(e) => updateFilter('minFlightTime', parseInt(e.target.value))}
                        className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, var(--color-brand-blue) 0%, var(--color-brand-blue) ${(filters.minFlightTime / 12) * 100}%, rgba(255,255,255,0.2) ${(filters.minFlightTime / 12) * 100}%, rgba(255,255,255,0.2) 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-white/50 mt-1">
                        <span>1h</span>
                        <span>12h</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-white/70 text-xs font-medium">Max hours</label>
                    <div className="relative">
                      <input
                        type="range"
                        min="1"
                        max="12"
                        value={filters.maxFlightTime}
                        onChange={(e) => updateFilter('maxFlightTime', parseInt(e.target.value))}
                        className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, var(--color-brand-purple) 0%, var(--color-brand-purple) ${(filters.maxFlightTime / 12) * 100}%, rgba(255,255,255,0.2) ${(filters.maxFlightTime / 12) * 100}%, rgba(255,255,255,0.2) 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-white/50 mt-1">
                        <span>1h</span>
                        <span>12h</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-500/20 border border-red-400/30 rounded-2xl p-4 backdrop-blur-sm">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              {/* Search Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                disabled={!filters.departureAirport || !filters.theme}
                className="w-full text-lg font-semibold shadow-2xl"
              >
                {isLoading ? 'Searching amazing destinations...' : 'Find My Adventure'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}