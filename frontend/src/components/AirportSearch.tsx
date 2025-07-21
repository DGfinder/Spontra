'use client'

import { useState, useEffect, useRef } from 'react'
import airportsData from '@/data/airports.json'

interface Airport {
  code: string
  name: string
  city: string
  country: string
}

interface AirportSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function AirportSearch({ value, onChange, placeholder = "Type city or airport name", disabled = false }: AirportSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredAirports, setFilteredAirports] = useState<Airport[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter airports based on search term
  useEffect(() => {
    if (searchTerm.length < 2) {
      setFilteredAirports([])
      return
    }

    const filtered = airportsData.filter(airport => {
      const term = searchTerm.toLowerCase()
      return (
        airport.city.toLowerCase().includes(term) ||
        airport.name.toLowerCase().includes(term) ||
        airport.code.toLowerCase().includes(term) ||
        airport.country.toLowerCase().includes(term)
      )
    }).slice(0, 8) // Limit to 8 results

    setFilteredAirports(filtered)
    setSelectedIndex(-1)
  }, [searchTerm])

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

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredAirports.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && filteredAirports[selectedIndex]) {
          selectAirport(filteredAirports[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  const selectAirport = (airport: Airport) => {
    onChange(airport.code)
    setSearchTerm(`${airport.city} (${airport.code})`)
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setSearchTerm(inputValue)
    setIsOpen(true)
    
    // If user is typing a 3-letter code directly
    if (inputValue.length === 3) {
      const airport = airportsData.find(a => a.code.toLowerCase() === inputValue.toLowerCase())
      if (airport) {
        onChange(airport.code)
      }
    }
  }

  const handleInputFocus = () => {
    if (searchTerm.length >= 2) {
      setIsOpen(true)
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
      
      {isOpen && filteredAirports.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-64 overflow-y-auto">
          {filteredAirports.map((airport, index) => (
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
                  <div className="font-medium">{airport.city}</div>
                  <div className="text-xs text-gray-500">{airport.name}</div>
                </div>
                <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                  {airport.code}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}