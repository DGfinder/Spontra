"use client"

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Search, X, MapPin, Plane } from 'lucide-react'

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

const AirportItem = React.memo(({ airport, searchTerm, onClick }: { airport: Airport; searchTerm: string; onClick: () => void }) => {
  const highlightMatch = useCallback((text: string, term: string) => {
    if (!term) return text
    const index = text.toLowerCase().indexOf(term.toLowerCase())
    if (index === -1) return text
    return (
      <>
        {text.slice(0, index)}
        <span className="bg-yellow-400/20 text-yellow-300">{text.slice(index, index + term.length)}</span>
        {text.slice(index + term.length)}
      </>
    )
  }, [])

  return (
    <button onClick={onClick} className="w-full text-left px-3 py-2 hover:bg-white/10 focus:bg-white/10">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
          <Plane size={14} className="text-white/70" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{highlightMatch(airport.code, searchTerm)}</span>
            <span className="text-white/60">/</span>
            <span className="truncate text-white/80">{highlightMatch(airport.name, searchTerm)}</span>
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
  placeholder = 'Search airports...',
  error,
  disabled = false,
  airports,
}) => {
  const [searchTerm, setSearchTerm] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedOnValueChange = useMemo(() => {
    if (!onValueChange) return null
    let timer: ReturnType<typeof setTimeout> | null = null
    return (next: string) => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => onValueChange(next), 150)
    }
  }, [onValueChange])

  const filteredAirports = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    if (term.length < 2) return []
    const words = term.split(/\s+/)
    return airports
      .filter((airport) => {
        const text = `${airport.code} ${airport.name} ${airport.city} ${airport.country}`.toLowerCase()
        return words.every((word) => text.includes(word))
      })
      .sort((a, b) => {
        if (a.code.toLowerCase() === term) return -1
        if (b.code.toLowerCase() === term) return 1
        if (a.code.toLowerCase().startsWith(term)) return -1
        if (b.code.toLowerCase().startsWith(term)) return 1
        return a.name.localeCompare(b.name)
      })
      .slice(0, 8)
  }, [airports, searchTerm])

  const handleInputChange = useCallback(
    (nextValue: string) => {
      setSearchTerm(nextValue)
      setSelectedIndex(-1)
      if (nextValue.length >= 2) {
        setIsOpen(true)
      }
      debouncedOnValueChange?.(nextValue)
    },
    [debouncedOnValueChange],
  )

  const handleAirportSelect = useCallback(
    (airport: Airport) => {
      setSearchTerm(`${airport.code} - ${airport.city}`)
      setIsOpen(false)
      setSelectedIndex(-1)
      onChange(airport)
    },
    [onChange],
  )

  const handleClear = useCallback(() => {
    setSearchTerm('')
    setIsOpen(false)
    setSelectedIndex(-1)
    onChange(null)
    inputRef.current?.focus()
  }, [onChange])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || filteredAirports.length === 0) return
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex((prev) => (prev < filteredAirports.length - 1 ? prev + 1 : 0))
          break
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredAirports.length - 1))
          break
        case 'Enter':
          event.preventDefault()
          if (selectedIndex >= 0 && filteredAirports[selectedIndex]) {
            handleAirportSelect(filteredAirports[selectedIndex])
          }
          break
        case 'Escape':
          setIsOpen(false)
          setSelectedIndex(-1)
          inputRef.current?.blur()
          break
      }
    },
    [filteredAirports, handleAirportSelect, isOpen, selectedIndex],
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-airport-search]')) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="space-y-2" data-airport-search>
      <label className="mb-1 block text-sm font-medium text-white/80" htmlFor="optimized-airport-search">
        Airport
      </label>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
        <input
          id="optimized-airport-search"
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(event) => handleInputChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => searchTerm.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full rounded-lg border border-white/20 bg-white/10 py-2 pl-9 pr-10 text-sm text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400/40 disabled:cursor-not-allowed disabled:opacity-60"
        />
        {searchTerm ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}

      {isOpen && filteredAirports.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg border border-white/20 bg-black/90 shadow-2xl backdrop-blur">
          <div className="max-h-64 overflow-y-auto">
            {filteredAirports.map((airport, index) => (
              <div key={airport.code} className={index === selectedIndex ? 'bg-white/20' : undefined}>
                <AirportItem airport={airport} searchTerm={searchTerm} onClick={() => handleAirportSelect(airport)} />
              </div>
            ))}
          </div>
          {filteredAirports.length === 8 ? (
            <div className="border-t border-white/10 px-3 py-2 text-xs text-white/60">
              Showing first 8 results. Keep typing to refine...
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
})

OptimizedAirportSearch.displayName = 'OptimizedAirportSearch'
