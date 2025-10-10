'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useSearchStore } from '@/lib/store'
import { Button } from './ui/Button'
import { DualRangeSlider } from './DualRangeSlider'
import { AirportAutocomplete } from './AirportAutocomplete'
import { MapPinIcon, Compass, Trees, Wine, Music, Globe, Users, ChevronDown, Calendar } from 'lucide-react'

export function SearchForm() {
  const { filters, updateFilter, search, isLoading, error } = useSearchStore()
  const [isPassengerOpen, setIsPassengerOpen] = useState(false)
  const [isThemeExpanded, setIsThemeExpanded] = useState(true)
  const [isFlightTimeExpanded, setIsFlightTimeExpanded] = useState(true)
  const departureInputRef = useRef<HTMLDivElement>(null)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus departure airport
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const input = departureInputRef.current?.querySelector('input')
        input?.focus()
      }
      // Escape to close passenger dropdown
      if (e.key === 'Escape' && isPassengerOpen) {
        setIsPassengerOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isPassengerOpen])

  // Auto-collapse discovery filters when destination is specified
  useEffect(() => {
    const hasDestination = filters.destinationAirport && filters.destinationAirport.length === 3

    if (hasDestination) {
      // Collapse both sections when destination filled
      setIsThemeExpanded(false)
      setIsFlightTimeExpanded(false)
    } else {
      // Auto-expand when destination cleared
      setIsThemeExpanded(true)
      setIsFlightTimeExpanded(true)
    }
  }, [filters.destinationAirport])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    await search()
  }

  // Smart date handling: auto-set return date when departure changes
  const handleDepartureDateChange = (newDate: string) => {
    updateFilter('departureDate', newDate)

    // If return date is empty or before new departure, set it to +7 days
    if (!filters.returnDate || filters.returnDate < newDate) {
      const departure = new Date(newDate)
      departure.setDate(departure.getDate() + 7)
      updateFilter('returnDate', departure.toISOString().split('T')[0])
    }
  }

  const themes = [
    {
      value: 'adventure',
      label: 'Adventure',
      icon: Compass,
      color: '#ffbd0a',
      description: 'Hiking, surfing, skiing, skydiving & extreme sports'
    },
    {
      value: 'nature',
      label: 'Nature',
      icon: Trees,
      color: '#02c06d',
      description: 'National parks, wildlife, mountains & natural wonders'
    },
    {
      value: 'indulge',
      label: 'Indulge',
      icon: Wine,
      color: '#e52b00',
      description: 'Fine dining, wine tasting, spas & luxury experiences'
    },
    {
      value: 'vibe',
      label: 'Vibe',
      icon: Music,
      color: '#eb5b25',
      description: 'Nightlife, music festivals, bars & entertainment'
    },
    {
      value: 'discover',
      label: 'Discover',
      icon: Globe,
      color: '#7f6ae4',
      description: 'Museums, historic sites, culture & local traditions'
    }
  ] as const

  // Get the current theme color
  const currentTheme = themes.find(t => t.value === filters.theme)
  const themeColor = currentTheme?.color || '#FFC83A' // fallback to gold

  return (
    <div className="flex items-start justify-start min-h-screen
                    pl-[clamp(1rem,3vw,2rem)] pt-[clamp(2rem,4vh,3rem)]
                    sm:pl-[clamp(1.5rem,3vw,2.5rem)] sm:pt-[clamp(2.5rem,5vh,4rem)]
                    md:pl-[clamp(2rem,3vw,3rem)] md:pt-[clamp(3rem,5vh,4.5rem)]
                    lg:pl-[clamp(2.5rem,4vw,4rem)] lg:pt-[clamp(3rem,6vh,5rem)]
                    xl:pl-[clamp(3.5rem,6vw,6rem)] xl:pt-[clamp(3rem,6vh,6rem)]
                    2xl:pl-[clamp(4rem,6vw,7rem)] 2xl:pt-[clamp(3rem,6vh,6rem)]">
      <div className="w-full
                      max-w-[clamp(300px,90vw,340px)]
                      sm:max-w-[clamp(320px,80vw,360px)]
                      md:max-w-[clamp(340px,36vw,380px)]
                      lg:max-w-[clamp(360px,26vw,400px)]
                      xl:max-w-[clamp(380px,22vw,420px)]
                      2xl:max-w-[clamp(400px,20vw,440px)]">
        {/* Search Card */}
        <form onSubmit={handleSearch}>
          <div
            className="bg-[rgba(11,15,18,0.84)] backdrop-blur-sm rounded-2xl p-3 pb-1
                       sm:p-3.5 md:p-4 lg:p-4.5 xl:p-5 border transition-colors duration-500"
            style={{
              fontFamily: 'var(--font-arimo)',
              borderColor: `${themeColor}33`, // 20% opacity
              boxShadow: `0 24px 48px rgba(0,0,0,0.3), 0 8px 16px rgba(0,0,0,0.2), 0 0 0 1px ${themeColor}22`
            }}
          >
            <div className="space-y-1.5 sm:space-y-2 md:space-y-2.5 lg:space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h1 className="font-bold" style={{
                  color: '#F3F6F9',
                  fontSize: 'clamp(1.2rem, 1.6vw, 1.5rem)',
                  lineHeight: '1.2'
                }}>
                  Book Your Next Trip
                </h1>
                {(filters.departureAirport || filters.destinationAirport || filters.passengers > 1 || filters.cabin !== 'Economy') && (
                  <button
                    type="button"
                    onClick={() => {
                      updateFilter('departureAirport', '')
                      updateFilter('destinationAirport', '')
                      updateFilter('passengers', 1)
                      updateFilter('cabin', 'Economy')
                      updateFilter('minFlightTime', 2)
                      updateFilter('maxFlightTime', 8)
                      updateFilter('onlyDirect', false)
                    }}
                    className="underline transition-colors hover:opacity-80"
                    style={{
                      color: '#A7AFB7',
                      fontSize: 'clamp(0.68rem, 0.85vw, 0.72rem)'
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Route - From and To */}
              <div className="grid grid-cols-2 gap-3">
                {/* Departure Airport */}
                <div ref={departureInputRef}>
                  <AirportAutocomplete
                    value={filters.departureAirport}
                    onChange={(code) => updateFilter('departureAirport', code)}
                    label="From"
                    placeholder="Your departure airport"
                    showIcon={true}
                    themeColor={themeColor}
                  />
                </div>

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
                <label className="font-normal uppercase" style={{
                  color: '#C9CFD6',
                  fontSize: 'clamp(0.68rem, 0.85vw, 0.72rem)'
                }}>
                  Dates
                </label>

                {/* Trip Type Toggle */}
                <div className="flex gap-2">
                  {(['round-trip', 'one-way'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateFilter('tripType', type)}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all
                                 ${filters.tripType === type
                                   ? 'text-[#1A1A1A]'
                                   : 'bg-transparent text-white/70 border border-white/20 hover:bg-white/5'
                                 }`}
                      style={filters.tripType === type ? {
                        backgroundColor: themeColor,
                        fontSize: 'clamp(0.78rem, 0.95vw, 0.82rem)'
                      } : {
                        fontSize: 'clamp(0.78rem, 0.95vw, 0.82rem)'
                      }}
                    >
                      {type === 'round-trip' ? 'Round-trip' : 'One-way'}
                    </button>
                  ))}
                </div>

                {/* Date Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Departure Date */}
                  <div className="flex flex-col gap-1">
                    <label style={{
                      color: '#A7AFB7',
                      fontSize: 'clamp(0.68rem, 0.85vw, 0.72rem)'
                    }}>
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
                        onChange={(e) => handleDepartureDateChange(e.target.value)}
                        className="w-full h-[47px] pl-10 pr-4 rounded-[10px]
                                   bg-transparent border border-[rgba(255,255,255,0.12)]
                                   text-white
                                   focus:outline-none focus:border-[rgba(255,255,255,0.24)]
                                   transition-colors"
                        style={{ fontSize: 'clamp(0.78rem, 0.95vw, 0.82rem)' }}
                      />
                    </div>
                  </div>

                  {/* Return Date */}
                  <div className="flex flex-col gap-1">
                    <label style={{
                      color: '#A7AFB7',
                      fontSize: 'clamp(0.68rem, 0.85vw, 0.72rem)'
                    }}>
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
                        className="w-full h-[47px] pl-10 pr-4 rounded-[10px]
                                   bg-transparent border border-[rgba(255,255,255,0.12)]
                                   text-white
                                   focus:outline-none focus:border-[rgba(255,255,255,0.24)]
                                   transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ fontSize: 'clamp(0.78rem, 0.95vw, 0.82rem)' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Passengers & Cabin Class */}
              <div className="flex flex-col gap-1">
                <label className="font-normal uppercase" style={{
                  color: '#C9CFD6',
                  fontSize: 'clamp(0.68rem, 0.85vw, 0.72rem)'
                }}>
                  Travelers
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsPassengerOpen(!isPassengerOpen)}
                    className="w-full h-[47px] px-4 rounded-[10px]
                               bg-transparent border border-[rgba(255,255,255,0.12)]
                               text-white transition-colors
                               focus:outline-none focus:border-[rgba(255,255,255,0.24)]
                               hover:border-[rgba(255,255,255,0.24)]
                               flex items-center justify-between"
                    style={{ fontSize: 'clamp(0.78rem, 0.95vw, 0.82rem)' }}
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
                        <span style={{
                          color: '#F3F6F9',
                          fontSize: 'clamp(0.78rem, 0.95vw, 0.82rem)'
                        }}>Passengers</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => updateFilter('passengers', Math.max(1, filters.passengers - 1))}
                            className="w-8 h-8 rounded-full flex items-center justify-center
                                       transition-colors bg-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.18)]"
                            style={{
                              color: '#F3F6F9',
                              fontSize: 'clamp(0.78rem, 0.95vw, 0.82rem)'
                            }}
                          >
                            -
                          </button>
                          <span className="w-8 text-center" style={{
                            color: '#F3F6F9',
                            fontSize: 'clamp(0.78rem, 0.95vw, 0.82rem)'
                          }}>
                            {filters.passengers}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateFilter('passengers', Math.min(9, filters.passengers + 1))}
                            disabled={filters.passengers >= 9}
                            className="w-8 h-8 rounded-full flex items-center justify-center
                                       transition-colors bg-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.18)]
                                       disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{
                              color: '#F3F6F9',
                              fontSize: 'clamp(0.78rem, 0.95vw, 0.82rem)'
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Cabin Class Selection */}
                      <div className="space-y-2">
                        <span style={{
                          color: '#F3F6F9',
                          fontSize: 'clamp(0.78rem, 0.95vw, 0.82rem)'
                        }}>Cabin Class</span>
                        <div className="grid grid-cols-2 gap-2">
                          {['Economy', 'Premium', 'Business', 'First'].map((cabin) => (
                            <button
                              key={cabin}
                              type="button"
                              onClick={() => {
                                updateFilter('cabin', cabin)
                                setIsPassengerOpen(false)
                              }}
                              className={`px-3 py-2 rounded-md transition-all duration-300
                                         ${filters.cabin === cabin
                                           ? 'text-[#1A1A1A] font-medium'
                                           : 'bg-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.18)]'
                                         }`}
                              style={filters.cabin === cabin ? {
                                backgroundColor: themeColor,
                                fontSize: 'clamp(0.78rem, 0.95vw, 0.82rem)'
                              } : {
                                color: '#F3F6F9',
                                fontSize: 'clamp(0.78rem, 0.95vw, 0.82rem)'
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
                <label className="font-normal uppercase" style={{
                  color: '#C9CFD6',
                  fontSize: 'clamp(0.68rem, 0.85vw, 0.72rem)'
                }}>
                  What Are You Looking For?
                </label>

                {isThemeExpanded ? (
                  // Full theme selection
                  <div className="flex flex-wrap gap-2 transition-all duration-300">
                    {themes.map((theme) => {
                      const Icon = theme.icon
                      const isSelected = filters.theme === theme.value
                      return (
                        <button
                          key={theme.value}
                          type="button"
                          onClick={() => updateFilter('theme', theme.value)}
                          className={`
                            flex items-center gap-2.5 px-3.5 h-9 sm:h-9 md:h-10 rounded-full font-normal
                            transition-all duration-300
                            ${isSelected
                              ? 'text-[#1A1A1A] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]'
                              : 'bg-transparent text-[#E6E6E6] border border-[rgba(255,255,255,0.16)] hover:bg-white/5'
                            }
                          `}
                          style={isSelected ? {
                            backgroundColor: theme.color,
                            borderColor: theme.color,
                            fontSize: 'clamp(0.82rem, 1.05vw, 0.88rem)'
                          } : {
                            fontSize: 'clamp(0.82rem, 1.05vw, 0.88rem)'
                          }}
                        >
                          <Icon className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                          <span>{theme.label}</span>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  // Collapsed pill
                  <button
                    type="button"
                    onClick={() => setIsThemeExpanded(true)}
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-full
                               bg-white/5 border border-white/10 hover:bg-white/10
                               transition-all duration-300 w-fit"
                  >
                    {(() => {
                      const selectedTheme = themes.find(t => t.value === filters.theme)
                      const Icon = selectedTheme?.icon || Compass
                      return (
                        <>
                          <Icon className="w-4 h-4" style={{ color: themeColor }} />
                          <span style={{
                            color: '#F3F6F9',
                            fontSize: 'clamp(0.78rem, 0.95vw, 0.82rem)'
                          }}>
                            {selectedTheme?.label || 'Adventure'}
                          </span>
                          <span style={{
                            color: '#A7AFB7',
                            fontSize: 'clamp(0.68rem, 0.85vw, 0.72rem)'
                          }}>
                            • Change
                          </span>
                        </>
                      )
                    })()}
                  </button>
                )}
              </div>

              {/* Flight Time Range - Single Dual-Handle Slider */}
              <div className="flex flex-col gap-2">
                <label className="font-normal uppercase" style={{
                  color: '#C9CFD6',
                  fontSize: 'clamp(0.68rem, 0.85vw, 0.72rem)'
                }}>
                  Flight Time
                </label>

                {isFlightTimeExpanded ? (
                  // Full flight time controls
                  <div className="space-y-2 transition-all duration-300">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => updateFilter('onlyDirect', !filters.onlyDirect)}
                        className="flex items-center gap-2 rounded transition-all duration-300"
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-300
                                      ${filters.onlyDirect ? '' : 'border-[rgba(255,255,255,0.19)]'}`}
                          style={filters.onlyDirect ? {
                            backgroundColor: themeColor,
                            borderColor: themeColor
                          } : {}}
                        >
                          {filters.onlyDirect && (
                            <svg className="w-3 h-3 text-[#1A1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span style={{
                          color: '#C9CFD6',
                          fontSize: 'clamp(0.78rem, 0.95vw, 0.82rem)'
                        }}>Only direct</span>
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
                ) : (
                  // Collapsed pill
                  <button
                    type="button"
                    onClick={() => setIsFlightTimeExpanded(true)}
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-full
                               bg-white/5 border border-white/10 hover:bg-white/10
                               transition-all duration-300 w-fit"
                  >
                    <svg className="w-4 h-4" style={{ color: themeColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span style={{
                      color: '#F3F6F9',
                      fontSize: 'clamp(0.78rem, 0.95vw, 0.82rem)'
                    }}>
                      {filters.minFlightTime}–{filters.maxFlightTime} hours
                      {filters.onlyDirect && ' (Direct)'}
                    </span>
                    <span style={{
                      color: '#A7AFB7',
                      fontSize: 'clamp(0.68rem, 0.85vw, 0.72rem)'
                    }}>
                      • Edit
                    </span>
                  </button>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3">
                  <p className="text-red-200" style={{
                    fontSize: 'clamp(0.78rem, 0.95vw, 0.82rem)'
                  }}>{error}</p>
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
                  className="w-full h-11 sm:h-11 md:h-12 rounded-[10px] font-bold text-[#1A1A1A]
                             transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                             hover:opacity-90 active:scale-[0.98] shadow-lg"
                  style={{
                    backgroundColor: themeColor,
                    fontSize: 'clamp(0.88rem, 1.05vw, 0.94rem)'
                  }}
                >
                  {isLoading ? 'Searching...' : 'Search flights'}
                </button>

                {/* Validation feedback */}
                {!isLoading && (
                  !filters.departureAirport ? (
                    <p className="text-center" style={{
                      color: '#A7AFB7',
                      fontSize: 'clamp(0.68rem, 0.85vw, 0.72rem)'
                    }}>
                      Please select a departure airport to continue
                    </p>
                  ) : filters.departureAirport.length !== 3 ? (
                    <p className="text-center" style={{
                      color: '#A7AFB7',
                      fontSize: 'clamp(0.68rem, 0.85vw, 0.72rem)'
                    }}>
                      Airport code must be 3 letters (e.g., LAX, JFK)
                    </p>
                  ) : !filters.theme ? (
                    <p className="text-center" style={{
                      color: '#A7AFB7',
                      fontSize: 'clamp(0.68rem, 0.85vw, 0.72rem)'
                    }}>
                      Choose what you're looking for above
                    </p>
                  ) : !filters.departureDate ? (
                    <p className="text-center" style={{
                      color: '#A7AFB7',
                      fontSize: 'clamp(0.68rem, 0.85vw, 0.72rem)'
                    }}>
                      Select your departure date
                    </p>
                  ) : filters.tripType === 'round-trip' && !filters.returnDate ? (
                    <p className="text-center" style={{
                      color: '#A7AFB7',
                      fontSize: 'clamp(0.68rem, 0.85vw, 0.72rem)'
                    }}>
                      Select your return date
                    </p>
                  ) : null
                )}

                <button
                  type="button"
                  disabled
                  className="w-full underline text-center transition-colors duration-300 opacity-50 cursor-not-allowed"
                  style={{
                    color: '#C9CFD6',
                    fontSize: 'clamp(0.78rem, 0.95vw, 0.82rem)'
                  }}
                  title="Coming Soon - Interactive map exploration"
                >
                  Explore Map (Coming Soon)
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}