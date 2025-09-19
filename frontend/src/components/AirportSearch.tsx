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
const MAX_RESULTS = 8\n\nconst normalizeMaybeNumber = (value: any): number | null => {\n  if (value === null || value === undefined || value === '') return null\n  const num = typeof value === 'number' ? value : Number(value)\n  return Number.isFinite(num) ? num : null\n}\n\nexport function AirportSearch({
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
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch suggestions when the user types
  useEffect(() => {
    if (!isOpen || searchTerm.trim().length < MIN_QUERY_LENGTH) {
      setResults([])
      setSelectedIndex(-1)
      activeRequest.current?.abort()
      return
    }

    const controller = new AbortController()
    activeRequest.current?.abort()
    activeRequest.current = controller

    const fetchSuggestions = async () => {
      setIsLoading(true)
      setFetchError(null)
      try {
        const url = `${apiEndpoint}?q=${encodeURIComponent(searchTerm.trim())}&limit=${MAX_RESULTS}`
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) {
          throw new Error(`Search failed (${res.status})`)
        }
        const data = await res.json()
        const items = Array.isArray(data?.items) ? data.items : []
        const mapped: AirportSearchResult[] = items.map((item: any) => ({
          code: (item.code || '').toUpperCase(),
          name: item.name || '',
          city: item.city || '',
          country: item.country || '',
          countryCode: (item.countryCode || item.country_code || '').toUpperCase() || undefined,
          timezone: item.timezone || undefined,
          latitude: item.latitude === undefined ? null : item.latitude,
          longitude: item.longitude === undefined ? null : item.longitude,
        }))
        setResults(mapped)
        setSelectedIndex(-1)
      } catch (error: any) {
        if (controller.signal.aborted) return
        setResults([])
        setFetchError(error?.message || 'Search failed')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchSuggestions()

    return () => {
      controller.abort()
    }
  }, [searchTerm, isOpen, apiEndpoint])

  // Sync external value to the input display
  useEffect(() => {
    if (!value) {
      setSelectedAirport(null)
      setSearchTerm('')
      return
    }

    if (selectedAirport && selectedAirport.code === value.toUpperCase()) {
      setSearchTerm(formatAirportLabel(selectedAirport))
      return
    }

    if (value.length === 3) {
      void fetchAirportDetails(value)
    } else {
      setSearchTerm(value)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const fetchAirportDetails = async (code: string) => {
    try {
      const url = `${apiEndpoint}?q=${encodeURIComponent(code)}&limit=1`
      const res = await fetch(url)
      if (!res.ok) return
      const data = await res.json()
      const match = Array.isArray(data?.items)
        ? data.items.find((item: any) => (item.code || '').toUpperCase() === code.toUpperCase())
        : null
      if (match) {
        const airport: AirportSearchResult = {
          code: (match.code || '').toUpperCase(),
          name: match.name || '',
          city: match.city || '',
          country: match.country || '',
          countryCode: (match.countryCode || match.country_code || '').toUpperCase() || undefined,
          timezone: match.timezone || undefined,
          latitude: match.latitude === undefined ? null : match.latitude,
          longitude: match.longitude === undefined ? null : match.longitude,
        }
        setSelectedAirport(airport)
        setSearchTerm(formatAirportLabel(airport))
        onChange(airport.code)
        onSelect?.(airport)
      }
    } catch {
      // ignore detail fetch errors; they will be handled by manual selection
    }
  }

  const formatAirportLabel = (airport: AirportSearchResult) => {
    const city = airport.city || airport.name
    return city ? `${city} (${airport.code})` : airport.code
  }

  const selectAirport = (airport: AirportSearchResult) => {
    setSelectedAirport(airport)
    setSearchTerm(formatAirportLabel(airport))
    setIsOpen(false)
    setSelectedIndex(-1)
    onChange(airport.code)
    onSelect?.(airport)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setSearchTerm(inputValue)
    setIsOpen(true)
    setFetchError(null)

    if (inputValue.length === 3) {
      void fetchAirportDetails(inputValue.toUpperCase())
    }
  }

  const handleInputFocus = () => {
    if (searchTerm.length >= MIN_QUERY_LENGTH) {
      setIsOpen(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && results[selectedIndex]) {
          selectAirport(results[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-3 bg-white text-black rounded text-sm border-0 focus:ring-2 focus:ring-orange-500 transition-all duration-200"
      />

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-64 overflow-y-auto">
          {isLoading && (
            <div className="px-4 py-3 text-sm text-gray-500">Searching…</div>
          )}

          {!isLoading && fetchError && (
            <div className="px-4 py-3 text-sm text-red-600">{fetchError}</div>
          )}

          {!isLoading && !fetchError && results.length === 0 && searchTerm.length >= MIN_QUERY_LENGTH && (
            <div className="px-4 py-3 text-sm text-gray-500">No airports found</div>
          )}

          {!isLoading && !fetchError && results.map((airport, index) => (
            <button
              key={airport.code}
              type="button"
              onClick={() => selectAirport(airport)}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-orange-50 border-b border-gray-100 last:border-b-0 transition-colors duration-150 ${
                index === selectedIndex ? 'bg-orange-50 text-orange-700' : 'text-gray-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{airport.city || airport.name}</div>
                  <div className="text-xs text-gray-500">{airport.name}</div>
                </div>
                <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                  {airport.code}
                </div>
              </div>
              <div className="mt-1 text-[11px] text-gray-500">
                {airport.country}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


