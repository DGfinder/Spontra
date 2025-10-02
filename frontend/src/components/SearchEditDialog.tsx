'use client'

import React, { useState, useEffect } from 'react'
import { X, MapPin, Users, ChevronDown, Compass, Trees, Wine, Music, Globe, Calendar } from 'lucide-react'
import { SearchFilters } from '@/lib/store'
import { DualRangeSlider } from './DualRangeSlider'

interface SearchEditDialogProps {
  isOpen: boolean
  onClose: () => void
  currentFilters: SearchFilters
  onApply: (filters: SearchFilters) => void
  isLoading?: boolean
}

export function SearchEditDialog({
  isOpen,
  onClose,
  currentFilters,
  onApply,
  isLoading = false
}: SearchEditDialogProps) {
  const [filters, setFilters] = useState<SearchFilters>(currentFilters)
  const [isPassengerOpen, setIsPassengerOpen] = useState(false)

  // Update local state when dialog opens with new filters
  useEffect(() => {
    if (isOpen) {
      setFilters(currentFilters)
    }
  }, [isOpen, currentFilters])

  if (!isOpen) return null

  const themes = [
    { value: 'adventure', label: 'Adventure', icon: Compass, color: '#ffbd0a' },
    { value: 'nature', label: 'Nature', icon: Trees, color: '#02c06d' },
    { value: 'indulge', label: 'Indulge', icon: Wine, color: '#e52b00' },
    { value: 'vibe', label: 'Vibe', icon: Music, color: '#eb5b25' },
    { value: 'discover', label: 'Discover', icon: Globe, color: '#7f6ae4' }
  ] as const

  const currentTheme = themes.find((t) => t.value === filters.theme)
  const themeColor = currentTheme?.color || '#FFC83A'

  const handleApply = () => {
    onApply(filters)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                   w-full max-w-lg max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div
          className="bg-[rgba(11,15,18,0.95)] backdrop-blur-xl rounded-2xl p-6
                     border shadow-2xl m-4"
          style={{
            borderColor: `${themeColor}33`,
            boxShadow: `0 24px 48px rgba(0,0,0,0.3), 0 0 0 1px ${themeColor}22`
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2
              id="dialog-title"
              className="text-2xl font-bold"
              style={{ color: '#F3F6F9' }}
            >
              Edit Search
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Departure Airport */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-normal uppercase" style={{ color: '#C9CFD6' }}>
                From
              </label>
              <div className="relative">
                <MapPin
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: '#C9CFD6' }}
                />
                <input
                  type="text"
                  value={filters.departureAirport}
                  onChange={(e) =>
                    setFilters({ ...filters, departureAirport: e.target.value.toUpperCase() })
                  }
                  placeholder="LHR"
                  maxLength={3}
                  className="w-full h-12 pl-10 pr-4 rounded-xl text-sm
                             bg-transparent border border-[rgba(255,255,255,0.12)]
                             text-white placeholder:text-[#A7AFB7]
                             focus:outline-none focus:border-[rgba(255,255,255,0.24)]
                             transition-colors"
                />
              </div>
            </div>

            {/* Travelers & Cabin */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-normal uppercase" style={{ color: '#C9CFD6' }}>
                Travelers
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsPassengerOpen(!isPassengerOpen)}
                  className="w-full h-12 px-4 rounded-xl text-sm
                             bg-transparent border border-[rgba(255,255,255,0.12)]
                             text-white transition-colors
                             focus:outline-none focus:border-[rgba(255,255,255,0.24)]
                             hover:border-[rgba(255,255,255,0.24)]
                             flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" style={{ color: '#C9CFD6' }} />
                    <span style={{ color: '#F3F6F9' }}>
                      {filters.passengers} passenger{filters.passengers !== 1 ? 's' : ''} •{' '}
                      {filters.cabin}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      isPassengerOpen ? 'rotate-180' : ''
                    }`}
                    style={{ color: '#C9CFD6' }}
                  />
                </button>

                {isPassengerOpen && (
                  <div className="absolute z-10 mt-1 w-full space-y-3 bg-[rgba(11,15,18,0.98)] border border-[rgba(255,255,255,0.12)] rounded-xl p-4 shadow-lg">
                    {/* Passengers Counter */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: '#F3F6F9' }}>
                        Passengers
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setFilters({
                              ...filters,
                              passengers: Math.max(1, filters.passengers - 1)
                            })
                          }
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
                          onClick={() =>
                            setFilters({ ...filters, passengers: filters.passengers + 1 })
                          }
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm
                                     transition-colors bg-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.18)]"
                          style={{ color: '#F3F6F9' }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Cabin Class */}
                    <div className="space-y-2">
                      <span className="text-sm" style={{ color: '#F3F6F9' }}>
                        Cabin Class
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {['Economy', 'Premium', 'Business', 'First'].map((cabin) => (
                          <button
                            key={cabin}
                            type="button"
                            onClick={() => {
                              setFilters({ ...filters, cabin })
                              setIsPassengerOpen(false)
                            }}
                            className={`px-3 py-2 rounded-lg text-sm transition-all duration-300
                                       ${
                                         filters.cabin === cabin
                                           ? 'text-[#1A1A1A] font-medium'
                                           : 'bg-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.18)]'
                                       }`}
                            style={
                              filters.cabin === cabin
                                ? { backgroundColor: themeColor }
                                : { color: '#F3F6F9' }
                            }
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
                Theme
              </label>
              <div className="flex flex-wrap gap-2">
                {themes.map((theme) => {
                  const Icon = theme.icon
                  const isSelected = filters.theme === theme.value
                  return (
                    <button
                      key={theme.value}
                      type="button"
                      onClick={() => setFilters({ ...filters, theme: theme.value })}
                      className={`flex items-center gap-2 px-4 h-11 rounded-full text-sm font-normal
                                 transition-all duration-300
                                 ${
                                   isSelected
                                     ? 'text-[#1A1A1A] shadow-lg'
                                     : 'bg-transparent text-[#E6E6E6] border border-[rgba(255,255,255,0.16)] hover:bg-white/5'
                                 }`}
                      style={
                        isSelected
                          ? {
                              backgroundColor: theme.color,
                              borderColor: theme.color
                            }
                          : {}
                      }
                    >
                      <Icon className="h-4 w-4" />
                      <span>{theme.label}</span>
                    </button>
                  )
                })}
              </div>
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
                    onClick={() => setFilters({ ...filters, tripType: type })}
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
                      onChange={(e) => setFilters({ ...filters, departureDate: e.target.value })}
                      className="w-full h-12 pl-10 pr-4 rounded-xl text-sm
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
                      onChange={(e) => setFilters({ ...filters, returnDate: e.target.value })}
                      disabled={filters.tripType === 'one-way'}
                      className="w-full h-12 pl-10 pr-4 rounded-xl text-sm
                                 bg-transparent border border-[rgba(255,255,255,0.12)]
                                 text-white
                                 focus:outline-none focus:border-[rgba(255,255,255,0.24)]
                                 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Flight Time Range - Single Dual-Handle Slider */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-normal uppercase" style={{ color: '#C9CFD6' }}>
                Flight Time Range
              </label>

              <DualRangeSlider
                min={1}
                max={12}
                minValue={filters.minFlightTime}
                maxValue={filters.maxFlightTime}
                onChange={(min, max) => {
                  setFilters({ ...filters, minFlightTime: min, maxFlightTime: max })
                }}
                formatLabel={(v) => `${v}h`}
                themeColor={themeColor}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
            <button
              onClick={onClose}
              className="flex-1 h-12 rounded-xl text-base font-medium
                         bg-transparent border border-white/20 text-white
                         hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={
                !filters.departureAirport ||
                filters.departureAirport.length !== 3 ||
                !filters.theme ||
                !filters.departureDate ||
                (filters.tripType === 'round-trip' && !filters.returnDate) ||
                isLoading
              }
              className="flex-1 h-12 rounded-xl text-base font-bold
                         transition-all disabled:opacity-50 disabled:cursor-not-allowed
                         hover:opacity-90 active:scale-[0.98] shadow-lg text-[#1A1A1A]"
              style={{ backgroundColor: themeColor }}
            >
              {isLoading ? 'Updating...' : 'Update Search'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
