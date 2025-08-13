import { useEffect, useMemo, useRef, useState } from 'react'
import { airportCodeSchema } from '@/lib/validations'
import { usePreferences, useSearchActions } from '@/store/searchStore'

interface Airport {
  code: string
  name: string
  city: string
  country: string
}
type Suggestion = Airport & { type: 'AIRPORT' | 'CITY' }

interface ValidatedAirportSearchProps {
  value: string
  onChange: (code: string) => void
  placeholder?: string
  error?: string
  required?: boolean
  onValidation?: (isValid: boolean, error?: string) => void
}

  // Use richer list from data file (still static client-side, but more options)
  // Falls back to minimal set if import fails for any reason
  const AIRPORTS: Airport[] = (() => {
    try {
      const json = require('@/data/airports.json') as Array<{code:string,name:string,city:string,country:string}>
      return json.map(a => ({ code: a.code, name: a.name, city: a.city, country: a.country }))
    } catch {
      return [
        { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom' },
        { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' },
        { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States' },
        { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States' },
        { code: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia' }
      ]
    }
  })()

// Map legacy/closed airport codes to their modern replacements
const LEGACY_CODE_MAPPING: Record<string, { code: string; note?: string }> = {
  TXL: { code: 'BER', note: 'formerly TXL' },
  THF: { code: 'BER', note: 'formerly THF' },
  SXF: { code: 'BER', note: 'formerly SXF' },
}

function normalize(text: string): string {
  const lower = text.toLowerCase()
  try {
    return lower
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  } catch {
    return lower.replace(/\s+/g, ' ').trim()
  }
}

export function ValidatedAirportSearch({
  value,
  onChange,
  placeholder = 'Type airport name or code',
  error,
  required = false,
  onValidation
}: ValidatedAirportSearchProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [validationError, setValidationError] = useState<string>('')
  const [isFocused, setIsFocused] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLUListElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const preferences = usePreferences()
  const { addRecentAirport } = useSearchActions()

  // Get current airport details if valid code
  const currentAirport = AIRPORTS.find(airport => airport.code === value)

  // Update query when value changes externally
  useEffect(() => {
    if (value && currentAirport) {
      setQuery(`${currentAirport.code} - ${currentAirport.name}`)
    } else if (value) {
      setQuery(value)
    } else {
      setQuery('')
    }
  }, [value, currentAirport])

  // Validate airport code
  const validateAirport = (code: string): string => {
    if (!code && required) {
      return 'Airport is required'
    }
    
    if (code) {
      try {
        airportCodeSchema.parse(code)
        // Accept any valid IATA code (airport or city)
      } catch {
        return 'Invalid airport code format'
      }
    }

    return ''
  }

  // Precompute a normalized index for faster client-side fuzzy search
  const indexedAirports = useMemo(
    () =>
      AIRPORTS.map((a) => ({
        raw: a,
        n: {
          code: normalize(a.code),
          name: normalize(a.name),
          city: normalize(a.city),
          country: normalize(a.country),
        },
      })),
    [AIRPORTS]
  )

  // Client + server-backed search with debounce and legacy mapping
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setQuery(inputValue)
    setSelectedIndex(-1)

    // Avoid clearing valid entered code on every keystroke; clear only when user deletes entirely
    if (inputValue.length === 0) {
      onChange('')
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const normalized = normalize(inputValue)

    // If the user types a 3-letter code, handle legacy mapping immediately
    if (/^[a-zA-Z]{3}$/.test(inputValue)) {
      const upper = inputValue.toUpperCase()
      const mapped = LEGACY_CODE_MAPPING[upper]
      if (mapped) {
        const airport = AIRPORTS.find((a) => a.code === mapped.code)
        if (airport) {
          const suggestion: Suggestion = { ...airport, type: 'AIRPORT' }
          setSuggestions([suggestion])
          setShowSuggestions(true)
          return
        }
      }
    }

    // Local fuzzy search first
    const local = indexedAirports
      .filter(({ n }) =>
        n.code.includes(normalized) ||
        n.name.includes(normalized) ||
        n.city.includes(normalized) ||
        n.country.includes(normalized)
      )
      .slice(0, 10)
      .map(({ raw }) => ({ ...raw, type: 'AIRPORT' as const }))

    setSuggestions(local)
    setShowSuggestions(true)

    // Remote fallback to improve coverage (Amadeus locations API)
    if (normalized.length >= 2) {
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setIsFetching(true)
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/amadeus/locations?keyword=${encodeURIComponent(inputValue)}&subType=AIRPORT,CITY`, {
            signal: controller.signal,
          })
          if (!res.ok) throw new Error('remote search failed')
          const json = await res.json()
          const remote: Suggestion[] = Array.isArray(json.data)
            ? json.data.map((d: any) => ({
                code: d.iataCode,
                name: d.name,
                city: d.address?.cityName || d.name,
                country: d.address?.countryName || '',
                type: (d.subType === 'CITY' ? 'CITY' : 'AIRPORT') as 'AIRPORT' | 'CITY',
              }))
            : []

          // Apply legacy mapping to remote results too
          const mappedRemote = remote.map((a) => {
            const legacy = Object.entries(LEGACY_CODE_MAPPING).find(([, v]) => v.code === a.code)
            if (legacy?.[0]) {
              return { ...a }
            }
            return a
          })

          // Merge and de-duplicate by code
          const mergedByCode = new Map<string, Suggestion>()
          ;[...local, ...mappedRemote].forEach((a) => {
            if (!mergedByCode.has(a.code)) mergedByCode.set(a.code, a)
          })
          const merged = Array.from(mergedByCode.values())
          merged.sort((a, b) => (a.type === b.type ? 0 : a.type === 'CITY' ? -1 : 1))
          setSuggestions(merged.slice(0, 10))
        } catch {
          // ignore network errors; keep local results
        } finally {
          setIsFetching(false)
        }
      }, 200)

      // Cleanup timer if user keeps typing
      return () => clearTimeout(timer)
    }
  }

  // Handle suggestion selection
  const handleSuggestionSelect = async (item: Suggestion) => {
    setQuery(`${item.code} - ${item.name}`)
    onChange(item.code)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    addRecentAirport(item.code)

    // Validate and notify parent
    const error = validateAirport(item.code)
    setValidationError(error)
    onValidation?.(error === '', error || undefined)

    // Fetch detailed airport info to display human-friendly origin in summary
    try {
      const res = await fetch('/api/amadeus/airport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: item.code })
      })
      const json = await res.json()
      if (json.ok) {
        const detailed = json.data?.detailedName || `${json.data?.address?.cityName || item.city}${item.name ? ' - ' + item.name : ''}`
        const { useSearchStore } = await import('@/store/searchStore')
        useSearchStore.getState().updateFormData({ departureAirportDetailed: detailed })
      }
    } catch {
      // ignore
    }
  }

  // Quick-select via recent chips
  const handleRecentChipClick = (code: string) => {
    setQuery(code)
    onChange(code)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    addRecentAirport(code)
    const err = validateAirport(code)
    setValidationError(err)
    onValidation?.(err === '', err || undefined)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Handle focus and blur
  const handleFocus = () => {
    setIsFocused(true)
    if (query.length >= 1) {
      setShowSuggestions(true)
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false)
      setSelectedIndex(-1)

      // Validate on blur
      const error = validateAirport(value)
      setValidationError(error)
      onValidation?.(error === '', error || undefined)
    }, 200)
  }

  // Show recent airports when focused and empty
  const showRecentAirports = isFocused && query === '' && preferences.recentAirports.length > 0

  const displayError = error || validationError

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder || 'City, airport name or code'}
        className={`w-full bg-white text-black rounded border-0 font-muli transition-colors ${
          displayError 
            ? 'ring-1 ring-red-500' 
            : ''
        }`}
        style={{ 
          height: '32px',
          fontSize: '11px',
          padding: '0 8px'
        }}
        autoComplete="off"
        aria-expanded={showSuggestions}
        aria-haspopup="listbox"
        aria-label="Search for departure airport"
        aria-describedby={displayError ? 'airport-error' : undefined}
      />

      {/* Error message */}
      {displayError && (
        <div id="airport-error" className="text-red-400 mt-1 font-muli" style={{ fontSize: '10px' }}>
          {displayError}
        </div>
      )}

      {/* Suggestions dropdown */}
      {(showSuggestions || showRecentAirports) && (
        <ul
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
          role="listbox"
        >
          {/* Recent airports section */}
          {showRecentAirports && (
            <>
              <li className="px-4 py-2 text-xs font-medium text-gray-500 border-b">
                Recent Airports
              </li>
              {preferences.recentAirports
                .slice(0, 5)
                .map((airportCode) => AIRPORTS.find(a => a.code === airportCode))
                .filter((airport): airport is NonNullable<typeof airport> => airport !== undefined)
                .map((airport) => {
                
                return (
                  <li
                    key={`recent-${airport.code}`}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    onClick={() => handleSuggestionSelect({...airport, type: 'AIRPORT'})}
                    role="option"
                  >
                    <div className="font-medium text-sm">{airport.code} - {airport.name}</div>
                    <div className="text-xs text-gray-500">{airport.city}, {airport.country}</div>
                  </li>
                )
              })}
            </>
          )}

          {/* Grouped suggestions: Cities then Airports */}
          {(() => {
            const indexMap = new Map(suggestions.map((s, i) => [`${s.type}:${s.code}`, i]))
            const cities = suggestions.filter(s => s.type === 'CITY')
            const airports = suggestions.filter(s => s.type === 'AIRPORT')
            const blocks: JSX.Element[] = []
            if (cities.length) {
              blocks.push(<li key="hdr-cities" className="px-4 py-1 text-[11px] font-semibold text-gray-600 bg-gray-50 sticky top-0">Cities</li>)
              cities.forEach((item) => {
                const idx = indexMap.get(`CITY:${item.code}`) ?? -1
                blocks.push(
                  <li
                    key={`city-${item.code}`}
                    className={`px-4 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${idx === selectedIndex ? 'bg-orange-50' : ''}`}
                    onClick={() => handleSuggestionSelect(item)}
                    role="option"
                    aria-selected={idx === selectedIndex}
                  >
                    <div className="font-medium text-sm">{item.code} - {item.city}</div>
                    <div className="text-xs text-gray-500">{item.name}{item.country ? ` • ${item.country}` : ''}</div>
                  </li>
                )
              })
            }
            if (airports.length) {
              blocks.push(<li key="hdr-airports" className="px-4 py-1 text-[11px] font-semibold text-gray-600 bg-gray-50 sticky top-0">Airports</li>)
              airports.forEach((item) => {
                const idx = indexMap.get(`AIRPORT:${item.code}`) ?? -1
                blocks.push(
                  <li
                    key={`apt-${item.code}`}
                    className={`px-4 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${idx === selectedIndex ? 'bg-orange-50' : ''}`}
                    onClick={() => handleSuggestionSelect(item)}
                    role="option"
                    aria-selected={idx === selectedIndex}
                  >
                    <div className="font-medium text-sm">{item.code} - {item.name}</div>
                    <div className="text-xs text-gray-500">{item.city}, {item.country}</div>
                  </li>
                )
              })
            }
            return blocks
          })()}

          {/* No results message */}
          {query.length >= 1 && suggestions.length === 0 && (
            <li className="px-4 py-2 text-sm text-gray-500 text-center">
              No airports found matching "{query}"
            </li>
          )}

          {/* Loading state for remote search */}
          {isFetching && (
            <li className="px-4 py-2 text-xs text-gray-500 text-center">Searching…</li>
          )}
        </ul>
      )}

      {/* Inline recent chips */}
      {preferences.recentAirports.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {preferences.recentAirports.slice(0, 6).map((code) => (
            <button
              type="button"
              key={`chip-${code}`}
              className="px-2 py-0.5 rounded-full text-[10px] bg-white/80 text-black hover:bg-white shadow-sm border border-black/5"
              onClick={() => handleRecentChipClick(code)}
              aria-label={`Use recent origin ${code}`}
            >
              {code}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}