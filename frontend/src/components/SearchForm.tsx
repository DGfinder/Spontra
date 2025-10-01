'use client'

import { useState } from 'react'
import { useSearchStore } from '@/lib/store'
import { AirportSearch } from './AirportSearch'
import { ThemeSelector } from './ThemeSelector'
import { FlightTimeSlider } from './FlightTimeSlider'
import { Button } from './ui/Button'

export function SearchForm() {
  const { filters, updateFilter, setCurrentStep, setLoading, setDestinations, setError } = useSearchStore()
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    if (!filters.departureAirport || !filters.theme) {
      setError('Please select a departure airport and theme')
      return
    }

    setIsSearching(true)
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/destinations/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departureAirport: filters.departureAirport,
          theme: filters.theme,
          minFlightTime: filters.minFlightTime,
          maxFlightTime: filters.maxFlightTime
        })
      })

      const data = await response.json()

      if (data.success) {
        setDestinations(data.destinations)
        setCurrentStep('results')
      } else {
        setError(data.error || 'Search failed')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setIsSearching(false)
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Spontra
          </h1>
          <p className="text-xl text-white/80 mb-2">
            Discover your next adventure
          </p>
          <p className="text-white/60">
            Find destinations based on flight time and your travel style
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 space-y-8">
          <div className="space-y-6">
            <div>
              <label className="block text-white text-sm font-medium mb-3">
                Where are you flying from?
              </label>
              <AirportSearch
                value={filters.departureAirport}
                onChange={(value) => updateFilter('departureAirport', value)}
                placeholder="Search airports..."
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-3">
                What type of adventure?
              </label>
              <ThemeSelector
                value={filters.theme}
                onChange={(value) => updateFilter('theme', value)}
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-3">
                Flight time: {filters.minFlightTime}h - {filters.maxFlightTime}h
              </label>
              <FlightTimeSlider
                minValue={filters.minFlightTime}
                maxValue={filters.maxFlightTime}
                onMinChange={(value) => updateFilter('minFlightTime', value)}
                onMaxChange={(value) => updateFilter('maxFlightTime', value)}
              />
            </div>

            <Button
              onClick={handleSearch}
              disabled={isSearching || !filters.departureAirport || !filters.theme}
              className="w-full"
            >
              {isSearching ? 'Searching...' : 'Find Destinations'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}