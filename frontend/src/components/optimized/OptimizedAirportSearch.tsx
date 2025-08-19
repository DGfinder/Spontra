'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Search, X, MapPin, Plane } from 'lucide-react'
import { FormField } from '@/components/ui'
import { debounce } from '@/lib/utils'

interface Airport {
  code: string
  name: string
  city: string
  country: string
  coordinates?: {
    lat: number
    lng: number
  }
}

interface OptimizedAirportSearchProps {
  value: string
  onChange: (airport: Airport | null) => void
  onValueChange?: (value: string) => void
  placeholder?: string
  error?: string
  disabled?: boolean
  airports: Airport[]
}

// Memoized airport item component to prevent unnecessary re-renders
const AirportItem = React.memo(({ 
  airport, 
  searchTerm, 
  onClick 
}: { 
  airport: Airport
  searchTerm: string
  onClick: () => void 
}) => {
  // Highlight matching text
  const highlightMatch = useCallback((text: string, term: string) => {
    if (!term) return text
    
    const index = text.toLowerCase().indexOf(term.toLowerCase())
    if (index === -1) return text
    
    return (
      <>
        {text.slice(0, index)}
        <span className="bg-yellow-400/20 text-yellow-300">
          {text.slice(index, index + term.length)}
        </span>
        {text.slice(index + term.length)}
      </>
    )
  }, [])

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 hover:bg-white/10 transition-colors focus:outline-none focus:bg-white/10"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
          <Plane size={14} className="text-white/70" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">
              {highlightMatch(airport.code, searchTerm)}
            </span>
            <span className="text-white/60">•</span>
            <span className="text-white/80 truncate">
              {highlightMatch(airport.name, searchTerm)}
            </span>
          </div>
          
          <div className="flex items-center gap-1 text-sm text-white/60">
            <MapPin size={12} />
            <span className="truncate">
              {highlightMatch(airport.city, searchTerm)}, {highlightMatch(airport.country, searchTerm)}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
})

AirportItem.displayName = 'AirportItem'

export const OptimizedAirportSearch = React.memo<OptimizedAirportSearchProps>(({ 
  value, 
  onChange, 
  onValueChange,
  placeholder = "Search airports...",
  error,
  disabled = false,
  airports
}) => {
  const [searchTerm, setSearchTerm] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  // Memoized airport filtering with optimized search algorithm
  const filteredAirports = useMemo(() => {
    if (searchTerm.length < 2) return []
    
    const term = searchTerm.toLowerCase().trim()
    const words = term.split(/\s+/)
    
    return airports
      .filter(airport => {
        // Multi-field search with ranking
        const searchableText = `${airport.code} ${airport.name} ${airport.city} ${airport.country}`.toLowerCase()
        
        // All words must match somewhere
        return words.every(word => searchableText.includes(word))
      })
      .sort((a, b) => {
        // Prioritize exact code matches
        if (a.code.toLowerCase() === term) return -1
        if (b.code.toLowerCase() === term) return 1
        
        // Then prioritize code starts with
        if (a.code.toLowerCase().startsWith(term)) return -1
        if (b.code.toLowerCase().startsWith(term)) return 1
        
        // Then city starts with
        if (a.city.toLowerCase().startsWith(term)) return -1
        if (b.city.toLowerCase().startsWith(term)) return 1
        
        // Finally alphabetical by code
        return a.code.localeCompare(b.code)
      })
      .slice(0, 8) // Limit results for performance
  }, [searchTerm, airports])

  // Debounced search term update
  const debouncedOnValueChange = useMemo(
    () => onValueChange ? debounce(onValueChange, 150) : undefined,
    [onValueChange]
  )

  // Handle input change with debouncing
  const handleInputChange = useCallback((newValue: string) => {
    setSearchTerm(newValue)
    setSelectedIndex(-1)
    setIsOpen(newValue.length >= 2)
    
    // Call debounced callback
    if (debouncedOnValueChange) {
      debouncedOnValueChange(newValue)
    }
  }, [debouncedOnValueChange])

  // Handle airport selection
  const handleAirportSelect = useCallback((airport: Airport) => {
    setSearchTerm(`${airport.code} - ${airport.city}`)
    setIsOpen(false)
    setSelectedIndex(-1)
    onChange(airport)
  }, [onChange])

  // Handle clear
  const handleClear = useCallback(() => {
    setSearchTerm('')
    setIsOpen(false)
    setSelectedIndex(-1)
    onChange(null)
    inputRef.current?.focus()
  }, [onChange])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || filteredAirports.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredAirports.length - 1 ? prev + 1 : 0
        )
        break
        
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredAirports.length - 1
        )
        break
        
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < filteredAirports.length) {
          handleAirportSelect(filteredAirports[selectedIndex])
        }
        break
        
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }, [isOpen, filteredAirports, selectedIndex, handleAirportSelect])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-airport-search]')) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" data-airport-search>
      <FormField
        ref={inputRef}
        label="Airport"
        type="text"
        value={searchTerm}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => searchTerm.length >= 2 && setIsOpen(true)}
        placeholder={placeholder}
        error={error}
        disabled={disabled}
        icon={<Search size={16} />}
        suffix={
          searchTerm && (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-300 transition-colors"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )
        }
      />

      {/* Dropdown */}
      {isOpen && filteredAirports.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg shadow-2xl overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {filteredAirports.map((airport, index) => (
              <div
                key={airport.code}
                className={`${
                  index === selectedIndex ? 'bg-white/20' : ''
                }`}
              >
                <AirportItem
                  airport={airport}
                  searchTerm={searchTerm}
                  onClick={() => handleAirportSelect(airport)}
                />
              </div>
            ))}
          </div>
          
          {filteredAirports.length === 8 && (
            <div className="px-3 py-2 text-xs text-white/60 bg-white/5 border-t border-white/10">
              Showing first 8 results. Keep typing to refine...
            </div>
          )}
        </div>
      )}
    </div>
  )
})

OptimizedAirportSearch.displayName = 'OptimizedAirportSearch'