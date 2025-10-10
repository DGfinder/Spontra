'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { MapPin, Loader2, X } from 'lucide-react'
import Fuse from 'fuse.js'

export interface City {
  id: string
  cityName: string
  countryName: string
  countryCode: string
  airportCode: string
}

interface CityAutocompleteProps {
  value: string
  onChange: (cityName: string) => void
  placeholder?: string
  label?: string
  showIcon?: boolean
  themeColor?: string
}

// Fuse.js configuration for fuzzy search
const fuseOptions = {
  keys: [
    { name: 'cityName', weight: 2 }, // Prioritize city name matches
    { name: 'countryName', weight: 1 },
    { name: 'airportCode', weight: 0.5 }
  ],
  threshold: 0.3,
  ignoreLocation: true,
  minMatchCharLength: 2
}

export function CityAutocomplete({
  value,
  onChange,
  placeholder = 'Search city...',
  label,
  showIcon = true,
  themeColor = '#7f6ae4'
}: CityAutocompleteProps) {
  const [inputValue, setInputValue] = useState('')
  const [cities, setCities] = useState<City[]>([])
  const [allCities, setAllCities] = useState<City[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedCity, setSelectedCity] = useState<City | null>(null)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fuseRef = useRef<Fuse<City> | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Load cities data on mount
  useEffect(() => {
    async function loadCities() {
      try {
        const response = await fetch('/data/cities.json')
        const data: City[] = await response.json()
        setAllCities(data)
        fuseRef.current = new Fuse(data, fuseOptions)
        setIsLoading(false)
      } catch (error) {
        console.error('[CityAutocomplete] Failed to load cities:', error)
        setIsLoading(false)
      }
    }

    loadCities()
  }, [])

  // Load initial city data when value changes externally
  useEffect(() => {
    if (value && !selectedCity && allCities.length > 0) {
      const city = allCities.find(c => c.cityName.toLowerCase() === value.toLowerCase())
      if (city) {
        setSelectedCity(city)
        setInputValue(`${city.cityName}, ${city.countryName}`)
      }
    }
  }, [value, selectedCity, allCities])

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
      setCities([])
      setIsOpen(false)
      return
    }

    if (!fuseRef.current) {
      return
    }

    debounceRef.current = setTimeout(() => {
      const results = fuseRef.current!.search(inputValue)

      // Sort by score and take top 8
      const matchedCities = results
        .slice(0, 8)
        .map(result => result.item)

      setCities(matchedCities)
      setIsOpen(matchedCities.length > 0)
      setSelectedIndex(0)
    }, 150)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [inputValue])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setSelectedCity(null)
    onChange('') // Clear the value when user types
  }

  const handleSelect = (city: City) => {
    setSelectedCity(city)
    setInputValue(`${city.cityName}, ${city.countryName}`)
    onChange(city.cityName) // Return just the city name for API
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const handleClear = () => {
    setInputValue('')
    setSelectedCity(null)
    onChange('')
    setCities([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || cities.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % cities.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + cities.length) % cities.length)
        break
      case 'Enter':
        e.preventDefault()
        if (cities[selectedIndex]) {
          handleSelect(cities[selectedIndex])
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
          <MapPin
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
            if (cities.length > 0) {
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
      {isOpen && cities.length > 0 && (
        <div
          className="absolute z-50 mt-1 w-full bg-[rgba(11,15,18,0.95)] border rounded-[10px] shadow-xl overflow-hidden backdrop-blur-xl"
          style={{
            borderColor: 'rgba(255,255,255,0.12)',
            top: 'calc(100% + 4px)'
          }}
        >
          <div className="max-h-[280px] overflow-y-auto">
            {cities.map((city, index) => (
              <button
                key={city.id}
                type="button"
                onClick={() => handleSelect(city)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full px-4 py-3 text-left transition-colors flex flex-col gap-1
                           ${index === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="font-semibold text-sm"
                    style={{ color: index === selectedIndex ? themeColor : '#F3F6F9' }}
                  >
                    {city.cityName}
                  </span>
                  {city.airportCode && (
                    <span className="text-xs" style={{ color: '#A7AFB7' }}>
                      ({city.airportCode})
                    </span>
                  )}
                </div>
                <div className="text-xs" style={{ color: '#A7AFB7' }}>
                  {city.countryName}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results message */}
      {isOpen && !isLoading && cities.length === 0 && inputValue.length >= 2 && (
        <div
          className="absolute z-50 mt-1 w-full bg-[rgba(11,15,18,0.95)] border rounded-[10px] shadow-xl p-4"
          style={{
            borderColor: 'rgba(255,255,255,0.12)',
            top: 'calc(100% + 4px)'
          }}
        >
          <p className="text-sm text-center" style={{ color: '#A7AFB7' }}>
            No cities found for "{inputValue}"
          </p>
        </div>
      )}
    </div>
  )
}
