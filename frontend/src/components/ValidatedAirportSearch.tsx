import { useState, useEffect, useRef } from 'react'
import { airportCodeSchema } from '@/lib/validations'
import { usePreferences, useSearchActions } from '@/store/searchStore'

interface Airport {
  code: string
  name: string
  city: string
  country: string
}

interface ValidatedAirportSearchProps {
  value: string
  onChange: (code: string) => void
  placeholder?: string
  error?: string
  required?: boolean
  onValidation?: (isValid: boolean, error?: string) => void
}

// Mock airport data - in real app this would come from API
const AIRPORTS: Airport[] = [
  { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom' },
  { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany' },
  { code: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands' },
  { code: 'MAD', name: 'Madrid-Barajas Airport', city: 'Madrid', country: 'Spain' },
  { code: 'FCO', name: 'Leonardo da Vinci Airport', city: 'Rome', country: 'Italy' },
  { code: 'ZUR', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland' },
  { code: 'VIE', name: 'Vienna International Airport', city: 'Vienna', country: 'Austria' },
  { code: 'BRU', name: 'Brussels Airport', city: 'Brussels', country: 'Belgium' },
  { code: 'CPH', name: 'Copenhagen Airport', city: 'Copenhagen', country: 'Denmark' },
  { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States' },
  { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States' },
  { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore' },
  { code: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan' },
  { code: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia' }
]

export function ValidatedAirportSearch({
  value,
  onChange,
  placeholder = 'Type airport name or code',
  error,
  required = false,
  onValidation
}: ValidatedAirportSearchProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Airport[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [validationError, setValidationError] = useState<string>('')
  const [isFocused, setIsFocused] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLUListElement>(null)

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
        const airport = AIRPORTS.find(a => a.code === code)
        if (!airport) {
          return 'Airport not found'
        }
      } catch {
        return 'Invalid airport code format'
      }
    }

    return ''
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setQuery(inputValue)
    setSelectedIndex(-1)

    // Clear current selection if user is typing
    if (inputValue !== query) {
      onChange('')
    }

    // Search for suggestions
    if (inputValue.length >= 1) {
      const filtered = AIRPORTS.filter(airport =>
        airport.code.toLowerCase().includes(inputValue.toLowerCase()) ||
        airport.name.toLowerCase().includes(inputValue.toLowerCase()) ||
        airport.city.toLowerCase().includes(inputValue.toLowerCase()) ||
        airport.country.toLowerCase().includes(inputValue.toLowerCase())
      ).slice(0, 10)

      setSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (airport: Airport) => {
    setQuery(`${airport.code} - ${airport.name}`)
    onChange(airport.code)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    addRecentAirport(airport.code)

    // Validate and notify parent
    const error = validateAirport(airport.code)
    setValidationError(error)
    onValidation?.(error === '', error || undefined)
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
        placeholder={placeholder}
        className={`w-full px-4 py-3 bg-white text-black rounded text-sm border-0 focus:ring-2 transition-colors ${
          displayError 
            ? 'focus:ring-red-500 ring-1 ring-red-500' 
            : 'focus:ring-orange-500'
        }`}
        autoComplete="off"
        aria-expanded={showSuggestions}
        aria-haspopup="listbox"
        aria-label="Search for departure airport"
        aria-describedby={displayError ? 'airport-error' : undefined}
      />

      {/* Error message */}
      {displayError && (
        <div id="airport-error" className="text-red-400 text-xs mt-1">
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
              {preferences.recentAirports.slice(0, 5).map((airportCode) => {
                const airport = AIRPORTS.find(a => a.code === airportCode)
                if (!airport) return null
                
                return (
                  <li
                    key={`recent-${airport.code}`}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    onClick={() => handleSuggestionSelect(airport)}
                    role="option"
                  >
                    <div className="font-medium text-sm">{airport.code} - {airport.name}</div>
                    <div className="text-xs text-gray-500">{airport.city}, {airport.country}</div>
                  </li>
                )
              })}
            </>
          )}

          {/* Search suggestions */}
          {suggestions.map((airport, index) => (
            <li
              key={airport.code}
              className={`px-4 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${
                index === selectedIndex ? 'bg-orange-50' : ''
              }`}
              onClick={() => handleSuggestionSelect(airport)}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className="font-medium text-sm">{airport.code} - {airport.name}</div>
              <div className="text-xs text-gray-500">{airport.city}, {airport.country}</div>
            </li>
          ))}

          {/* No results message */}
          {query.length >= 1 && suggestions.length === 0 && (
            <li className="px-4 py-2 text-sm text-gray-500 text-center">
              No airports found matching "{query}"
            </li>
          )}
        </ul>
      )}
    </div>
  )
}