'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'

interface Airport {
  iataCode: string
  name: string
  city: string
  country: string
}

interface AirportSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function AirportSearch({ value, onChange, placeholder = 'Search airports...' }: AirportSearchProps) {
  const [query, setQuery] = useState('')
  const [airports, setAirports] = useState<Airport[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const searchAirports = async () => {
      if (query.length < 2) {
        setAirports([])
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/airports/search?q=${encodeURIComponent(query)}`)
        const data = await response.json()
        setAirports(data.airports || [])
        setIsOpen(true)
      } catch (error) {
        console.error('Airport search error:', error)
        setAirports([])
      } finally {
        setIsLoading(false)
      }
    }

    const debounce = setTimeout(searchAirports, 300)
    return () => clearTimeout(debounce)
  }, [query])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedAirport = airports.find(airport => airport.iataCode === value)

  const handleSelect = (airport: Airport) => {
    onChange(airport.iataCode)
    setQuery(`${airport.city} (${airport.iataCode})`)
    setIsOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    
    if (newQuery.length === 0) {
      onChange('')
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={selectedAirport ? `${selectedAirport.city} (${selectedAirport.iataCode})` : query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(airports.length > 0)}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50"
        />
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          ) : airports.length > 0 ? (
            airports.map((airport) => (
              <button
                key={airport.iataCode}
                onClick={() => handleSelect(airport)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
              >
                <div className="font-medium text-gray-900">
                  {airport.city} ({airport.iataCode})
                </div>
                <div className="text-sm text-gray-500">
                  {airport.name}, {airport.country}
                </div>
              </button>
            ))
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-gray-500">No airports found</div>
          ) : null}
        </div>
      )}
    </div>
  )
}