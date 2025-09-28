'use client'

import { useState, useEffect, useRef, ChangeEvent, KeyboardEvent } from 'react'

export interface AirportSearchResult {
  code: string
  name: string
  city: string
  country: string
  countryCode?: string
  timezone?: string
  latitude?: number | null
  longitude?: number | null
}

interface AirportSearchProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (airport: AirportSearchResult) => void
  placeholder?: string
  disabled?: boolean
  apiEndpoint?: string
}

const DEFAULT_ENDPOINT = '/api/admin/reference/airports'
const MIN_QUERY_LENGTH = 2
const MAX_RESULTS = 8

const normalizeMaybeNumber = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : null
}

export function AirportSearch({
  value,
  onChange,
  onSelect,
  placeholder = 'Type city or airport name',
  disabled = false,
  apiEndpoint = DEFAULT_ENDPOINT,
}: AirportSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<AirportSearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [selectedAirport, setSelectedAirport] = useState<AirportSearchResult | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const activeRequest = useRef<AbortController | null>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search for airports
  const searchAirports = async (query: string) => {
    if (query.length < MIN_QUERY_LENGTH) {
      setResults([])
      setIsOpen(false)
      return
    }

    // Cancel any ongoing request
    if (activeRequest.current) {
      activeRequest.current.abort()
    }

    setIsLoading(true)
    setFetchError(null)
    
    // Create new abort controller for this request
    activeRequest.current = new AbortController()

    try {
      const response = await fetch(
        `${apiEndpoint}?q=${encodeURIComponent(query)}&limit=${MAX_RESULTS}`,
        { signal: activeRequest.current.signal }
      )

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.ok && Array.isArray(data.items)) {
        const transformedResults: AirportSearchResult[] = data.items.map((item: any) => ({
          code: item.code || '',
          name: item.name || '',
          city: item.city || '',
          country: item.country || '',
          countryCode: item.countryCode || '',
          timezone: item.timezone || '',
          latitude: normalizeMaybeNumber(item.latitude),
          longitude: normalizeMaybeNumber(item.longitude)
        }))
        
        setResults(transformedResults)
        setIsOpen(transformedResults.length > 0)
        setSelectedIndex(-1)
      } else {
        setResults([])
        setIsOpen(false)
        if (!data.ok) {
          setFetchError(data.error || 'Search failed')
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Airport search error:', error)
        setFetchError(error.message || 'Search failed')
        setResults([])
        setIsOpen(false)
      }
    } finally {
      setIsLoading(false)
      activeRequest.current = null
    }
  }

  // Handle input changes
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value
    setSearchTerm(newValue)
    onChange(newValue)
    
    // Reset selected airport if user is typing
    if (selectedAirport && newValue !== selectedAirport.code) {
      setSelectedAirport(null)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setSelectedIndex(prev => (prev + 1) % results.length)
        break
      case 'ArrowUp':
        event.preventDefault()
        setSelectedIndex(prev => prev <= 0 ? results.length - 1 : prev - 1)
        break
      case 'Enter':
        event.preventDefault()
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // Handle airport selection
  const handleSelect = async (airport: AirportSearchResult) => {
    setSelectedAirport(airport)
    setSearchTerm(airport.code)
    onChange(airport.code)
    setIsOpen(false)
    setSelectedIndex(-1)
    
    if (onSelect) {
      // Fetch detailed airport information
      try {
        const response = await fetch('/api/amadeus/airport', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: airport.code })
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.ok && data.data) {
            // Enhance airport data with API response
            const enhancedAirport: AirportSearchResult = {
              ...airport,
              timezone: data.data.timeZone?.timeZoneId || airport.timezone,
              latitude: normalizeMaybeNumber(data.data.geoCode?.latitude) || airport.latitude,
              longitude: normalizeMaybeNumber(data.data.geoCode?.longitude) || airport.longitude
            }
            onSelect(enhancedAirport)
          } else {
            onSelect(airport)
          }
        } else {
          onSelect(airport)
        }
      } catch (error) {
        console.warn('Failed to fetch detailed airport info:', error)
        onSelect(airport)
      }
    }
  }

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim() !== '') {
        searchAirports(searchTerm.trim())
      } else {
        setResults([])
        setIsOpen(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, apiEndpoint])

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (results.length > 0) {
            setIsOpen(true)
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
        } ${fetchError ? 'border-red-500' : 'border-gray-300'}`}
        autoComplete="off"
      />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}

      {fetchError && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm z-50">
          {fetchError}
        </div>
      )}

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-64 overflow-auto">
          {results.map((airport, index) => (
            <div
              key={airport.code}
              onClick={() => handleSelect(airport)}
              className={`px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                index === selectedIndex ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">
                    {airport.code} - {airport.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {airport.city}, {airport.country}
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {airport.code}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}