'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { MapPinIcon, Loader2, X } from 'lucide-react'
import { searchAirports, type Airport } from '@/actions/airportActions'

interface AirportAutocompleteProps {
  value: string
  onChange: (iataCode: string) => void
  placeholder?: string
  label?: string
  showIcon?: boolean
  themeColor?: string
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
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Load initial airport data when value changes externally
  useEffect(() => {
    if (value && value.length === 3 && !selectedAirport) {
      searchAirports(value).then(result => {
        if (result.success && result.data && result.data.length > 0) {
          const airport = result.data.find(a => a.iataCode === value.toUpperCase())
          if (airport) {
            setSelectedAirport(airport)
            setInputValue(`${airport.iataCode} - ${airport.city}, ${airport.country}`)
          }
        }
      })
    }
  }, [value, selectedAirport])

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

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (inputValue.length < 2) {
      setAirports([])
      setIsOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      const result = await searchAirports(inputValue)
      if (result.success && result.data) {
        setAirports(result.data)
        setIsOpen(result.data.length > 0)
        setSelectedIndex(0)
      }
      setIsLoading(false)
    }, 300)

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
          className={`w-full h-[47px] ${showIcon ? 'pl-10' : 'pl-4'} pr-10 rounded-[10px] text-sm
                     bg-transparent border border-[rgba(255,255,255,0.12)]
                     text-white placeholder:text-[#A7AFB7]
                     focus:outline-none focus:border-[rgba(255,255,255,0.24)]
                     transition-colors`}
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
          className="absolute z-50 mt-1 w-full bg-[rgba(11,15,18,0.95)] border rounded-[10px] shadow-xl overflow-hidden"
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
