'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { MapPin, Plane, Clock, Users, Star, Search, X } from 'lucide-react'
import { airportCodeSchema } from '@/lib/validations'

interface Airport {
  code: string
  icao_code?: string
  name: string
  city: string
  country: string
  latitude?: number
  longitude?: number
  timezone?: string
  type: 'AIRPORT' | 'CITY'
  importance_score: number
  search_score: number
  hub_info?: {
    airlines: Array<{
      code: string
      name: string
      alliance?: string
      hubType: 'primary' | 'secondary' | 'focus'
      routes: number
    }>
    isHub: boolean
    hubScore: number
  }
}

interface CityGroup {
  city: string
  country: string
  airports: Airport[]
  primary_code?: string
}

interface WorldClassAirportSearchProps {
  id?: string
  value: string
  onChange: (code: string, airport?: Airport) => void
  placeholder?: string
  error?: string
  required?: boolean
  onValidation?: (isValid: boolean, error?: string) => void
  disabled?: boolean
  autoFocus?: boolean
  className?: string
  // Enhanced features
  showRecentAirports?: boolean
  showPopularDestinations?: boolean
  groupMultiAirportCities?: boolean
  maxResults?: number
}

interface SearchCache {
  [query: string]: {
    results: Airport[]
    cityGroups: CityGroup[]
    timestamp: number
  }
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const DEBOUNCE_DELAY = 150 // ms
const MIN_QUERY_LENGTH = 1

// Popular airports to show when empty (based on global traffic)
const POPULAR_AIRPORTS = [
  'LHR', 'CDG', 'FRA', 'AMS', 'MAD', 'FCO', // Europe
  'JFK', 'LAX', 'ORD', 'ATL', 'DFW', 'SFO', // North America  
  'NRT', 'HND', 'ICN', 'SIN', 'HKG', 'BKK', // Asia
  'DXB', 'DOH', 'AUH', // Middle East
  'SYD', 'MEL', 'PER' // Oceania
]

export function WorldClassAirportSearch({
  id,
  value,
  onChange,
  placeholder = 'Search airports, cities, or codes',
  error,
  required = false,
  onValidation,
  disabled = false,
  autoFocus = false,
  className = '',
  showRecentAirports = true,
  showPopularDestinations = true,
  groupMultiAirportCities = true,
  maxResults = 20
}: WorldClassAirportSearchProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Airport[]>([])
  const [cityGroups, setCityGroups] = useState<CityGroup[]>([])
  const [contextualSuggestions, setContextualSuggestions] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [recentAirports, setRecentAirports] = useState<string[]>([])
  
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const searchCacheRef = useRef<SearchCache>({})
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Load recent airports from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('recentAirports')
      if (stored) {
        setRecentAirports(JSON.parse(stored).slice(0, 6))
      }
    } catch {}
  }, [])

  // Update query when value changes externally
  useEffect(() => {
    if (value) {
      // Try to find airport info for display
      const cachedResults = Object.values(searchCacheRef.current)
        .flatMap(cache => cache.results)
        .find(airport => airport.code === value)
      
      if (cachedResults) {
        setQuery(`${cachedResults.code} - ${cachedResults.name}`)
      } else {
        setQuery(value)
      }
    } else {
      setQuery('')
    }
  }, [value])

  // Validate airport code
  const validateAirport = useCallback((code: string): string => {
    if (!code && required) {
      return 'Airport is required'
    }
    
    if (code) {
      try {
        airportCodeSchema.parse(code)
      } catch {
        return 'Invalid airport code format'
      }
    }
    
    return ''
  }, [required])

  // Save airport to recent list
  const addToRecent = useCallback((code: string) => {
    const updated = [code, ...recentAirports.filter(c => c !== code)].slice(0, 6)
    setRecentAirports(updated)
    try {
      localStorage.setItem('recentAirports', JSON.stringify(updated))
    } catch {}
  }, [recentAirports])

  // Search airports with caching and debouncing
  const searchAirports = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < MIN_QUERY_LENGTH) {
      setSuggestions([])
      setCityGroups([])
      setIsLoading(false)
      return
    }

    // Check cache first
    const normalizedQuery = searchQuery.toLowerCase().trim()
    const cached = searchCacheRef.current[normalizedQuery]
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setSuggestions(cached.results)
      setCityGroups(cached.cityGroups)
      setIsLoading(false)
      return
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      setIsLoading(true)
      
      const url = new URL('/api/airports/search', window.location.origin)
      url.searchParams.set('q', searchQuery)
      url.searchParams.set('limit', maxResults.toString())
      if (groupMultiAirportCities) {
        url.searchParams.set('groupCities', 'true')
      }

      const response = await fetch(url.toString(), {
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`)
      }

      const data = await response.json()

      if (data.ok) {
        // Cache the results
        searchCacheRef.current[normalizedQuery] = {
          results: data.results || [],
          cityGroups: data.cityGroups || [],
          timestamp: Date.now()
        }

        setSuggestions(data.results || [])
        setCityGroups(data.cityGroups || [])
        setContextualSuggestions(data.suggestions || null)
      } else {
        console.warn('Airport search API error:', data.error)
        setSuggestions([])
        setCityGroups([])
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Airport search failed:', err)
        setSuggestions([])
        setCityGroups([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [maxResults, groupMultiAirportCities])

  // Debounced search
  const debouncedSearch = useCallback((searchQuery: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      searchAirports(searchQuery)
    }, DEBOUNCE_DELAY)
  }, [searchAirports])

  // Handle input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setQuery(inputValue)
    setSelectedIndex(-1)

    if (inputValue.length === 0) {
      onChange('')
      setSuggestions([])
      setCityGroups([])
      setIsOpen(false)
      return
    }

    setIsOpen(true)
    debouncedSearch(inputValue)
  }, [onChange, debouncedSearch])

  // Handle suggestion selection
  const handleSelect = useCallback((airport: Airport) => {
    setQuery(`${airport.code} - ${airport.name}`)
    onChange(airport.code, airport)
    setIsOpen(false)
    setSelectedIndex(-1)
    addToRecent(airport.code)

    // Validate selection
    const error = validateAirport(airport.code)
    setValidationError(error)
    onValidation?.(error === '', error || undefined)
  }, [onChange, addToRecent, validateAirport, onValidation])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true)
        if (query.length >= MIN_QUERY_LENGTH) {
          debouncedSearch(query)
        }
      }
      return
    }

    const totalItems = cityGroups.length + suggestions.length
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, totalItems - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          if (selectedIndex < cityGroups.length) {
            // Selected a city group - select the primary airport
            const cityGroup = cityGroups[selectedIndex]
            const primaryAirport = cityGroup.airports[0]
            handleSelect(primaryAirport)
          } else {
            // Selected an individual airport
            const airport = suggestions[selectedIndex - cityGroups.length]
            handleSelect(airport)
          }
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
      case 'Tab':
        setIsOpen(false)
        break
    }
  }, [isOpen, query, cityGroups, suggestions, selectedIndex, handleSelect, debouncedSearch])

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsOpen(true)
    if (query.length >= MIN_QUERY_LENGTH) {
      debouncedSearch(query)
    }
  }, [query, debouncedSearch])

  // Handle blur
  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Don't close if clicking within the dropdown
    if (dropdownRef.current?.contains(e.relatedTarget as Node)) {
      return
    }
    
    // Delay to allow clicks to register
    setTimeout(() => {
      setIsOpen(false)
      setSelectedIndex(-1)
      
      // Validate on blur
      const error = validateAirport(value)
      setValidationError(error)
      onValidation?.(error === '', error || undefined)
    }, 200)
  }, [value, validateAirport, onValidation])

  // Clear input
  const handleClear = useCallback(() => {
    setQuery('')
    onChange('')
    setSuggestions([])
    setCityGroups([])
    setIsOpen(false)
    inputRef.current?.focus()
  }, [onChange])

  // Get popular airports to show when empty
  const popularAirportsData = useMemo(() => {
    const cached = Object.values(searchCacheRef.current)
      .flatMap(cache => cache.results)
      .filter(airport => POPULAR_AIRPORTS.includes(airport.code))
      .sort((a, b) => POPULAR_AIRPORTS.indexOf(a.code) - POPULAR_AIRPORTS.indexOf(b.code))
    
    return cached.length > 0 ? cached.slice(0, 8) : []
  }, [])

  // Show recent/popular when input is empty and focused
  const showEmptyState = isOpen && query === ''
  const showRecentSection = showEmptyState && showRecentAirports && recentAirports.length > 0
  const showPopularSection = showEmptyState && showPopularDestinations && popularAirportsData.length > 0

  const displayError = error || validationError

  return (
    <div className={`relative ${className}`}>
      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`
            w-full h-10 px-4 pr-10 
            bg-white text-gray-900 
            border border-gray-200 rounded-lg
            placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-50 disabled:text-gray-500
            transition-all duration-200
            ${displayError ? 'border-red-300 ring-2 ring-red-100' : ''}
            ${isLoading ? 'pr-16' : ''}
          `}
          autoComplete="off"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label="Search airports"
          aria-describedby={displayError ? `${id}-error` : undefined}
        />

        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}

        {/* Clear button */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Error message */}
      {displayError && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600">
          {displayError}
        </p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
          role="listbox"
        >
          {/* Recent Airports */}
          {showRecentSection && (
            <div className="border-b border-gray-100">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                <Clock size={12} className="inline mr-1" />
                Recent
              </div>
              {recentAirports.slice(0, 4).map((code) => {
                const cachedAirport = Object.values(searchCacheRef.current)
                  .flatMap(cache => cache.results)
                  .find(airport => airport.code === code)
                
                return (
                  <div
                    key={`recent-${code}`}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center space-x-3"
                    onClick={() => {
                      if (cachedAirport) {
                        handleSelect(cachedAirport)
                      } else {
                        // Fallback for airports not in cache
                        onChange(code)
                        setQuery(code)
                        setIsOpen(false)
                      }
                    }}
                  >
                    <Plane size={16} className="text-gray-400" />
                    <div>
                      <div className="font-medium text-sm text-gray-900">{code}</div>
                      {cachedAirport && (
                        <div className="text-xs text-gray-500">{cachedAirport.city}, {cachedAirport.country}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Popular Destinations */}
          {showPopularSection && (
            <div className="border-b border-gray-100">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                <Star size={12} className="inline mr-1" />
                Popular Destinations
              </div>
              {popularAirportsData.slice(0, 6).map((airport) => (
                <div
                  key={`popular-${airport.code}`}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center space-x-3"
                  onClick={() => handleSelect(airport)}
                >
                  <MapPin size={16} className="text-gray-400" />
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900">
                      {airport.code} - {airport.name}
                    </div>
                    <div className="text-xs text-gray-500">{airport.city}, {airport.country}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* City Groups (Multi-airport cities) */}
          {cityGroups.map((cityGroup, index) => (
            <div
              key={`city-${cityGroup.city}`}
              className={`px-4 py-3 cursor-pointer ${
                index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSelect(cityGroup.airports[0])}
            >
              <div className="flex items-center space-x-3">
                <MapPin size={16} className="text-blue-500" />
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">
                    {cityGroup.city}, {cityGroup.country}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    <Users size={12} className="inline mr-1" />
                    {cityGroup.airports.length} airports: {cityGroup.airports.map(a => a.code).join(', ')}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Individual Airports */}
          {suggestions.map((airport, index) => {
            const actualIndex = cityGroups.length + index
            return (
              <div
                key={`airport-${airport.code}`}
                className={`px-4 py-3 cursor-pointer ${
                  actualIndex === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleSelect(airport)}
                role="option"
                aria-selected={actualIndex === selectedIndex}
              >
                <div className="flex items-center space-x-3">
                  <Plane size={16} className="text-gray-400" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="font-medium text-sm text-gray-900">
                        {airport.code} - {airport.name}
                      </div>
                      {airport.hub_info?.isHub && (
                        <div className="flex items-center space-x-1">
                          <div className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                            HUB
                          </div>
                          {airport.hub_info.airlines[0]?.alliance && (
                            <div className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                              airport.hub_info.airlines[0].alliance === 'Star Alliance' ? 'bg-yellow-100 text-yellow-800' :
                              airport.hub_info.airlines[0].alliance === 'OneWorld' ? 'bg-red-100 text-red-800' :
                              airport.hub_info.airlines[0].alliance === 'SkyTeam' ? 'bg-indigo-100 text-indigo-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {airport.hub_info.airlines[0].alliance === 'Star Alliance' ? '⭐' :
                               airport.hub_info.airlines[0].alliance === 'OneWorld' ? '🌐' :
                               airport.hub_info.airlines[0].alliance === 'SkyTeam' ? '☁️' : '✈️'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{airport.city}, {airport.country}</div>
                    <div className="flex items-center space-x-4 mt-0.5">
                      {airport.timezone && (
                        <div className="text-xs text-gray-400">
                          <Clock size={10} className="inline mr-1" />
                          {airport.timezone}
                        </div>
                      )}
                      {airport.hub_info?.isHub && airport.hub_info.airlines.length > 0 && (
                        <div className="text-xs text-gray-400">
                          {airport.hub_info.airlines.slice(0, 2).map(airline => airline.name).join(', ')}
                          {airport.hub_info.airlines.length > 2 && ` +${airport.hub_info.airlines.length - 2} more`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Contextual Suggestions */}
          {contextualSuggestions && contextualSuggestions.destinations?.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                <Star size={12} className="inline mr-1" />
                Popular Destinations {contextualSuggestions.alliance && `(${contextualSuggestions.alliance})`}
              </div>
              {contextualSuggestions.destinations.slice(0, 4).map((code: string) => (
                <div
                  key={`suggestion-${code}`}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center space-x-3"
                  onClick={() => {
                    setQuery(code)
                    onChange(code)
                    setIsOpen(false)
                    debouncedSearch(code)
                  }}
                >
                  <Plane size={16} className="text-blue-500" />
                  <div>
                    <div className="font-medium text-sm text-gray-900">{code}</div>
                    <div className="text-xs text-gray-400">Popular destination</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {query.length >= MIN_QUERY_LENGTH && !isLoading && suggestions.length === 0 && cityGroups.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              <Search size={24} className="mx-auto mb-2 text-gray-300" />
              <div className="text-sm">No airports found for &quot;{query}&quot;</div>
              <div className="text-xs text-gray-400 mt-1">Try searching by city name or airport code</div>
              {contextualSuggestions && contextualSuggestions.destinations?.length > 0 && (
                <div className="text-xs text-blue-500 mt-2">
                  ✈️ See popular destinations below
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="px-4 py-6 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
              <div className="text-sm text-gray-500">Searching airports...</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}