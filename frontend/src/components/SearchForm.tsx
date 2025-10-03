'use client'

import React, { useState } from 'react'
import { useSearchStore } from '@/lib/store'
import { Button } from './ui/Button'
import { DualRangeSlider } from './DualRangeSlider'
import { AirportAutocomplete } from './AirportAutocomplete'
import { MapPinIcon, Compass, Trees, Wine, Music, Globe, Users, ChevronDown, Calendar } from 'lucide-react'

export function SearchForm() {
  const { filters, updateFilter, search, isLoading, error } = useSearchStore()
  const [onlyDirect, setOnlyDirect] = useState(false)
  const [isPassengerOpen, setIsPassengerOpen] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    await search()
  }

  const themes = [
    { value: 'adventure', label: 'Adventure', icon: Compass, color: '#ffbd0a' },
    { value: 'nature', label: 'Nature', icon: Trees, color: '#02c06d' },
    { value: 'indulge', label: 'Indulge', icon: Wine, color: '#e52b00' },
    { value: 'vibe', label: 'Vibe', icon: Music, color: '#eb5b25' },
    { value: 'discover', label: 'Discover', icon: Globe, color: '#7f6ae4' }
  ] as const

  // Get the current theme color
  const currentTheme = themes.find(t => t.value === filters.theme)
  const themeColor = currentTheme?.color || '#FFC83A' // fallback to gold

  return (
    <div className="flex items-start justify-start min-h-screen pl-[120px] pt-[60px]">
      <div className="w-full max-w-[420px]">
        {/* Search Card */}
        <form onSubmit={handleSearch}>
          <div
            className="bg-[rgba(11,15,18,0.84)] backdrop-blur-sm rounded-2xl p-[21px] pb-1
                       border transition-colors duration-500"
            style={{
              fontFamily: 'var(--font-arimo)',
              borderColor: `${themeColor}33`, // 20% opacity
              boxShadow: `0 24px 48px rgba(0,0,0,0.3), 0 8px 16px rgba(0,0,0,0.2), 0 0 0 1px ${themeColor}22`
            }}
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="mb-2">
                <h1 className="text-[26px] font-bold leading-[39px]" style={{ color: '#F3F6F9' }}>
                  Book Your Next Trip
                </h1>
              </div>

              {/* Route - From and To */}
              <div className="grid grid-cols-2 gap-3">
                {/* Departure Airport */}
                <AirportAutocomplete
                  value={filters.departureAirport}
                  onChange={(code) => updateFilter('departureAirport', code)}
                  label="From"
                  placeholder="LHR - London Heathrow"
                  showIcon={true}
                  themeColor={themeColor}
                />

                {/* Destination Airport */}
                <AirportAutocomplete
                  value={filters.destinationAirport}
                  onChange={(code) => updateFilter('destinationAirport', code)}
                  label="To"
                  placeholder="Anywhere"
                  showIcon={false}
                  themeColor={themeColor}
                />
              </div>

              {/* Dates */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-normal uppercase" style={{ color: '#C9CFD6' }}>
                  Dates
                </label>

                {/* Trip Type Toggle */}
                <div className="flex gap-2 mb-2">
                  {(['round-trip', 'one-way'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateFilter('tripType', type)}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all
                                 ${filters.tripType === type
                                   ? 'text-[#1A1A1A]'
                                   : 'bg-transparent text-white/70 border border-white/20 hover:bg-white/5'
                                 }`}
                      style={filters.tripType === type ? { backgroundColor: themeColor } : {}}
                    >
                      {type === 'round-trip' ? 'Round-trip' : 'One-way'}
                    </button>
                  ))}
                </div>

                {/* Date Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Departure Date */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs" style={{ color: '#A7AFB7' }}>
                      Departure
                    </label>
                    <div className="relative">
                      <Calendar
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                        style={{ color: '#C9CFD6' }}
                      />
                      <input
                        type="date"
                        value={filters.departureDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => updateFilter('departureDate', e.target.value)}
                        className="w-full h-[47px] pl-10 pr-4 rounded-[10px] text-sm
                                   bg-transparent border border-[rgba(255,255,255,0.12)]
                                   text-white
                                   focus:outline-none focus:border-[rgba(255,255,255,0.24)]
                                   transition-colors"
                      />
                    </div>
                  </div>

                  {/* Return Date */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs" style={{ color: '#A7AFB7' }}>
                      Return
                    </label>
                    <div className="relative">
                      <Calendar
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                        style={{ color: '#C9CFD6' }}
                      />
                      <input
                        type="date"
                        value={filters.returnDate}
                        min={filters.departureDate}
                        onChange={(e) => updateFilter('returnDate', e.target.value)}
                        disabled={filters.tripType === 'one-way'}
                        className="w-full h-[47px] pl-10 pr-4 rounded-[10px] text-sm
                                   bg-transparent border border-[rgba(255,255,255,0.12)]
                                   text-white
                                   focus:outline-none focus:border-[rgba(255,255,255,0.24)]
                                   transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Passengers & Cabin Class */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-normal uppercase" style={{ color: '#C9CFD6' }}>
                  Travelers
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsPassengerOpen(!isPassengerOpen)}
                    className="w-full h-[47px] px-4 rounded-[10px] text-sm
                               bg-transparent border border-[rgba(255,255,255,0.12)]
                               text-white transition-colors
                               focus:outline-none focus:border-[rgba(255,255,255,0.24)]
                               hover:border-[rgba(255,255,255,0.24)]
                               flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" style={{ color: '#C9CFD6' }} />
                      <span style={{ color: '#F3F6F9' }}>
                        {filters.passengers} passenger{filters.passengers !== 1 ? 's' : ''} • {filters.cabin}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isPassengerOpen ? 'rotate-180' : ''}`}
                      style={{ color: '#C9CFD6' }}
                    />
                  </button>

                  {isPassengerOpen && (
                    <div className="absolute z-10 mt-1 w-full space-y-3 bg-[rgba(11,15,18,0.95)] border border-[rgba(255,255,255,0.12)] rounded-[10px] p-4 shadow-lg">
                      {/* Passengers Counter */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: '#F3F6F9' }}>Passengers</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => updateFilter('passengers', Math.max(1, filters.passengers - 1))}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm
                                       transition-colors bg-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.18)]"
                            style={{ color: '#F3F6F9' }}
                          >
                            -
                          </button>
                          <span className="text-sm w-8 text-center" style={{ color: '#F3F6F9' }}>
                            {filters.passengers}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateFilter('passengers', filters.passengers + 1)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm
                                       transition-colors bg-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.18)]"
                            style={{ color: '#F3F6F9' }}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Cabin Class Selection */}
                      <div className="space-y-2">
                        <span className="text-sm" style={{ color: '#F3F6F9' }}>Cabin Class</span>
                        <div className="grid grid-cols-2 gap-2">
                          {['Economy', 'Premium', 'Business', 'First'].map((cabin) => (
                            <button
                              key={cabin}
                              type="button"
                              onClick={() => {
                                updateFilter('cabin', cabin)
                                setIsPassengerOpen(false)
                              }}
                              className={`px-3 py-2 rounded-md text-sm transition-all duration-300
                                         ${filters.cabin === cabin
                                           ? 'text-[#1A1A1A] font-medium'
                                           : 'bg-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.18)]'
                                         }`}
                              style={filters.cabin === cabin ? {
                                backgroundColor: themeColor
                              } : {
                                color: '#F3F6F9'
                              }}
                            >
                              {cabin}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Theme Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-normal uppercase" style={{ color: '#C9CFD6' }}>
                  What Are You Looking For?
                </label>
                <div className="flex flex-wrap gap-3">
                  {themes.map((theme) => {
                    const Icon = theme.icon
                    const isSelected = filters.theme === theme.value
                    return (
                      <button
                        key={theme.value}
                        type="button"
                        onClick={() => updateFilter('theme', theme.value)}
                        className={`
                          flex items-center gap-3 px-4 h-12 rounded-full text-[15px] font-normal
                          transition-all duration-300
                          ${isSelected
                            ? 'text-[#1A1A1A] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]'
                            : 'bg-transparent text-[#E6E6E6] border border-[rgba(255,255,255,0.16)] hover:bg-white/5'
                          }
                        `}
                        style={isSelected ? {
                          backgroundColor: theme.color,
                          borderColor: theme.color
                        } : {}}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{theme.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Flight Time Range - Single Dual-Handle Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-normal uppercase" style={{ color: '#C9CFD6' }}>
                    Flight Time
                  </label>
                  <button
                    type="button"
                    onClick={() => setOnlyDirect(!onlyDirect)}
                    className="flex items-center gap-2 rounded transition-all duration-300"
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-300
                                  ${onlyDirect ? '' : 'border-[rgba(255,255,255,0.19)]'}`}
                      style={onlyDirect ? {
                        backgroundColor: themeColor,
                        borderColor: themeColor
                      } : {}}
                    >
                      {onlyDirect && (
                        <svg className="w-3 h-3 text-[#1A1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm" style={{ color: '#C9CFD6' }}>Only direct</span>
                  </button>
                </div>

                <DualRangeSlider
                  min={1}
                  max={12}
                  minValue={filters.minFlightTime}
                  maxValue={filters.maxFlightTime}
                  onChange={(min, max) => {
                    updateFilter('minFlightTime', min)
                    updateFilter('maxFlightTime', max)
                  }}
                  formatLabel={(v) => `${v}h`}
                  themeColor={themeColor}
                />
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3 mb-3">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              {/* Action Buttons Container */}
              <div className="pt-3 border-t border-[rgba(255,255,255,0.08)] space-y-3">
                <button
                  type="submit"
                  disabled={
                    !filters.departureAirport ||
                    filters.departureAirport.length !== 3 ||
                    !filters.theme ||
                    !filters.departureDate ||
                    (filters.tripType === 'round-trip' && !filters.returnDate) ||
                    isLoading
                  }
                  className="w-full h-12 rounded-[10px] text-base font-bold text-[#1A1A1A]
                             transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                             hover:opacity-90 active:scale-[0.98] shadow-lg"
                  style={{ backgroundColor: themeColor }}
                >
                  {isLoading ? 'Searching...' : 'Search flights'}
                </button>

                <button
                  type="button"
                  className="w-full text-sm underline text-center transition-colors duration-300 hover:opacity-80"
                  style={{ color: '#C9CFD6' }}
                >
                  Explore Map
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}