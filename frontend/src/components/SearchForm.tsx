'use client'

import { useState } from 'react'
import { useSearchStore } from '@/lib/store'
import { Button } from './ui/Button'

export function SearchForm(): JSX.Element {
  const { filters, updateFilter, setCurrentStep, setLoading, setDestinations, setError } = useSearchStore()
  const [isSearching, setIsSearching] = useState<boolean>(false)

  const handleSearch = async (): Promise<void> => {
    if (!filters.departureAirport || !filters.theme) {
      setError('Please select a departure airport and theme')
      return
    }

    setIsSearching(true)
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departureAirport: filters.departureAirport,
          theme: filters.theme,
          minFlightTime: filters.minFlightTime,
          maxFlightTime: filters.maxFlightTime
        })
      })

      const data: { success: boolean; destinations: any[]; error?: string } = await response.json()

      if (data.success) {
        setDestinations(data.destinations)
        setCurrentStep('results')
      } else {
        setError(data.error || 'Search failed')
      }
    } catch (error: unknown) {
      setError('Network error occurred')
    } finally {
      setIsSearching(false)
      setLoading(false)
    }
  }

  const themes: Array<{ value: string; label: string }> = [
    { value: 'adventure', label: '🏔️ Adventure' },
    { value: 'beach', label: '🏖️ Beach' },
    { value: 'city', label: '🏙️ City Break' },
    { value: 'culture', label: '🏛️ Culture' },
    { value: 'nature', label: '🌲 Nature' }
  ]

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
              <input
                type="text"
                value={filters.departureAirport}
                onChange={(e) => updateFilter('departureAirport', e.target.value)}
                placeholder="e.g. LAX, JFK, LHR"
                className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:border-white/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-3">
                What type of adventure?
              </label>
              <select
                value={filters.theme}
                onChange={(e) => updateFilter('theme', e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/20 text-white border border-white/30 focus:border-white/60 focus:outline-none"
              >
                <option value="">Select a theme</option>
                {themes.map((theme) => (
                  <option key={theme.value} value={theme.value} className="text-black">
                    {theme.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-3">
                Flight time: {filters.minFlightTime}h - {filters.maxFlightTime}h
              </label>
              <div className="space-y-2">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-white/70 text-xs mb-1">Min hours</label>
                    <input
                      type="range"
                      min="1"
                      max="12"
                      value={filters.minFlightTime}
                      onChange={(e) => updateFilter('minFlightTime', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-white/70 text-xs mb-1">Max hours</label>
                    <input
                      type="range"
                      min="1"
                      max="12"
                      value={filters.maxFlightTime}
                      onChange={(e) => updateFilter('maxFlightTime', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
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