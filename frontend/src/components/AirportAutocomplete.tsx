'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { MapPinIcon, Loader2, X } from 'lucide-react'
import Fuse from 'fuse.js'

export interface Airport {
  id: string
  iataCode: string
  name: string
  city: string
  country: string
  passengerVolume: number // Annual passengers in millions
}

interface AirportAutocompleteProps {
  value: string
  onChange: (iataCode: string) => void
  placeholder?: string
  label?: string
  showIcon?: boolean
  themeColor?: string
}

// Fuse.js configuration for fuzzy search
const fuseOptions = {
  keys: [
    { name: 'iataCode', weight: 2 }, // Prioritize IATA code matches
    { name: 'city', weight: 1.5 },
    { name: 'name', weight: 1 },
    { name: 'country', weight: 0.5 }
  ],
  threshold: 0.3, // Lower = stricter matching
  ignoreLocation: true,
  minMatchCharLength: 2
}

export function AirportAutocomplete({
  value,
  onChange,
  placeholder = 'Search airport...',
  label,
  showIcon = true,
  themeColor = '#FFC83A'
}: AirportAutocompleteProps) {
  const [inputValue, setInputValue] = useState('')
  const [airports, setAirports] = useState<Airport[]>([])
  const [allAirports, setAllAirports] = useState<Airport[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fuseRef = useRef<Fuse<Airport> | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Load airports data on mount (only once)
  useEffect(() => {
    async function loadAirports() {
      try {
        const response = await fetch('/data/airports.json')
        const data: Airport[] = await response.json()
        setAllAirports(data)
        fuseRef.current = new Fuse(data, fuseOptions)
        setIsLoading(false)
      } catch (error) {
        console.error('[AirportAutocomplete] Failed to load airports:', error)
        setIsLoading(false)
      }
    }

    loadAirports()
  }, [])

  // Load initial airport data when value changes externally
  useEffect(() => {
    if (value && value.length === 3 && !selectedAirport && allAirports.length > 0) {
      const airport = allAirports.find(a => a.iataCode === value.toUpperCase())
      if (airport) {
        setSelectedAirport(airport)
        setInputValue(`${airport.iataCode} - ${airport.city}, ${airport.country}`)
      }
    }
  }, [value, selectedAirport, allAirports])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced client-side fuzzy search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (inputValue.length < 2) {
      setAirports([])
      setIsOpen(false)
      return
    }

    if (!fuseRef.current) {
      return
    }

    // Instant client-side search with minimal debounce for smooth UX
    debounceRef.current = setTimeout(() => {
      const results = fuseRef.current!.search(inputValue)
      const queryLower = inputValue.toLowerCase().trim()
      const queryLength = queryLower.length

      // Adaptive weights based on query length
      const weights = queryLength <= 2
        ? { fuzzy: 5, iata: 100, position: 10, volume: 2 }   // Short: favor exact matches
        : { fuzzy: 15, iata: 20, position: 8, volume: 5 }    // Long: favor relevance

      // 2025-level smart ranking: Multi-factor scoring
      const scoredResults = results.map(result => {
        const airport = result.item
        const fuzzyScore = 1 - (result.score || 0) // Fuse returns 0-1 where 0 is perfect match

        // 1. IATA exact match (3-char queries) - instant top result
        const iataLower = airport.iataCode.toLowerCase()
        const iataBoost = iataLower === queryLower && queryLength === 3
          ? weights.iata
          : iataLower.startsWith(queryLower) ? weights.iata * 0.5 : 0

        // 2. Position-weighted city matching
        const cityLower = airport.city.toLowerCase()
        let positionBoost = 0
        if (cityLower === queryLower) {
          positionBoost = weights.position * 1.5  // Exact city match
        } else if (cityLower.startsWith(queryLower)) {
          positionBoost = weights.position  // Starts with query (e.g., "lon" → "London")
        } else if (cityLower.includes(` ${queryLower}`)) {
          positionBoost = weights.position * 0.5  // Word boundary match
        } else if (cityLower.includes(queryLower)) {
          positionBoost = weights.position * 0.25  // Contains anywhere
        }

        // 3. Logarithmic passenger volume (realistic scaling)
        // log10(100M) = 2 → ~5pts, log10(10M) = 1 → ~2.5pts, log10(1M) = 0 → ~0pts
        const volumeBoost = Math.log10(airport.passengerVolume + 1) * 2.5 * (weights.volume / 5)

        // 4. Combined score with adaptive weighting
        const finalScore = (fuzzyScore * weights.fuzzy) + iataBoost + positionBoost + volumeBoost

        return { airport, finalScore }
      })

      // Sort by final score (descending) and take top 8
      const matchedAirports = scoredResults
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, 8)
        .map(item => item.airport)

      setAirports(matchedAirports)
      setIsOpen(matchedAirports.length > 0)
      setSelectedIndex(0)
    }, 150) // Reduced from 300ms to 150ms for faster feel

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [inputValue])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setSelectedAirport(null)
    onChange('') // Clear the value when user types
  }

  const handleSelect = (airport: Airport) => {
    setSelectedAirport(airport)
    setInputValue(`${airport.iataCode} - ${airport.city}, ${airport.country}`)
    onChange(airport.iataCode)
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const handleClear = () => {
    setInputValue('')
    setSelectedAirport(null)
    onChange('')
    setAirports([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || airports.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % airports.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + airports.length) % airports.length)
        break
      case 'Enter':
        e.preventDefault()
        if (airports[selectedIndex]) {
          handleSelect(airports[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  return (
    <div ref={wrapperRef} className="relative flex flex-col gap-1">
      {label && (
        <label className="text-xs font-normal uppercase" style={{ color: '#C9CFD6' }}>
          {label}
        </label>
      )}

      <div className="relative">
        {showIcon && (
          <MapPinIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
            style={{ color: '#C9CFD6' }}
          />
        )}

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (airports.length > 0) {
              setIsOpen(true)
            }
          }}
          placeholder={placeholder}
          disabled={isLoading}
          className={`w-full h-[47px] ${showIcon ? 'pl-10' : 'pl-4'} pr-10 rounded-[10px] text-sm
                     bg-transparent border border-[rgba(255,255,255,0.12)]
                     text-white placeholder:text-[#A7AFB7]
                     focus:outline-none focus:border-[rgba(255,255,255,0.24)]
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        />

        {/* Loading / Clear button */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: '#C9CFD6' }} />
          ) : inputValue ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-[#C9CFD6] hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && airports.length > 0 && (
        <div
          className="absolute z-50 mt-1 w-full bg-[rgba(11,15,18,0.95)] border rounded-[10px] shadow-xl overflow-hidden backdrop-blur-xl"
          style={{
            borderColor: 'rgba(255,255,255,0.12)',
            top: 'calc(100% + 4px)'
          }}
        >
          <div className="max-h-[280px] overflow-y-auto">
            {airports.map((airport, index) => (
              <button
                key={airport.id}
                type="button"
                onClick={() => handleSelect(airport)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full px-4 py-3 text-left transition-colors flex flex-col gap-1
                           ${index === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="font-bold text-sm"
                    style={{ color: index === selectedIndex ? themeColor : '#F3F6F9' }}
                  >
                    {airport.iataCode}
                  </span>
                  <span className="text-sm" style={{ color: '#C9CFD6' }}>
                    {airport.name}
                  </span>
                </div>
                <div className="text-xs" style={{ color: '#A7AFB7' }}>
                  {airport.city}, {airport.country}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results message */}
      {isOpen && !isLoading && airports.length === 0 && inputValue.length >= 2 && (
        <div
          className="absolute z-50 mt-1 w-full bg-[rgba(11,15,18,0.95)] border rounded-[10px] shadow-xl p-4"
          style={{
            borderColor: 'rgba(255,255,255,0.12)',
            top: 'calc(100% + 4px)'
          }}
        >
          <p className="text-sm text-center" style={{ color: '#A7AFB7' }}>
            No airports found for "{inputValue}"
          </p>
        </div>
      )}
    </div>
  )
}
