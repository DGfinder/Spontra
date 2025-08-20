'use client'

import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft } from 'lucide-react'
import { ExplorationProgress } from '../ExplorationProgress'
import { CityFilters, type FilterOptions } from './CityFilters'
import { CityGrid } from './CityGrid'
import { type CityOption } from './CityCard'
import { Button } from '@/components/ui'

interface CitySelectionProps {
  country: {
    name: string
    region: string
  }
  originAirport: string
  selectedTheme?: string
  onBack: () => void
  onCitySelect: (city: CityOption) => void
}

export function CitySelectionRefactored({ 
  country, 
  originAirport, 
  selectedTheme, 
  onBack, 
  onCitySelect 
}: CitySelectionProps) {
  const [cities, setCities] = useState<CityOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  
  const [filters, setFilters] = useState<FilterOptions>({
    themes: selectedTheme ? [selectedTheme] : [],
    priceRanges: [],
    flightDurations: [],
    showHiddenGems: false,
    sortBy: 'theme_match'
  })

  // Load cities data
  useEffect(() => {
    loadCities()
  }, [country.name, originAirport])

  const loadCities = async () => {
    try {
      setLoading(true)
      setError(undefined)
      
      // Simulate API call - replace with actual API call
      const response = await fetch('/api/amadeus/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryName: country.name,
          origin: originAirport
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to load cities')
      }
      
      const data = await response.json()
      setCities(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cities')
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort cities
  const filteredAndSortedCities = useMemo(() => {
    let filtered = [...cities]

    // Apply theme filters
    if (filters.themes.length > 0) {
      filtered = filtered.filter(city => 
        filters.themes.includes(city.primary_theme) ||
        city.secondary_themes.some(theme => 
          filters.themes.includes(theme.theme) && theme.strength >= 0.3
        )
      )
    }

    // Apply price range filters
    if (filters.priceRanges.length > 0) {
      filtered = filtered.filter(city => {
        const price = parseInt(city.estimated_price.replace(/[€$,]/g, ''))
        return filters.priceRanges.some(range => 
          price >= range.min && (range.max === Infinity || price <= range.max)
        )
      })
    }

    // Apply flight duration filters
    if (filters.flightDurations.length > 0) {
      filtered = filtered.filter(city => 
        filters.flightDurations.some(duration => 
          duration.max === Infinity || city.flight_duration <= duration.max
        )
      )
    }

    // Apply hidden gems filter
    if (filters.showHiddenGems) {
      filtered = filtered.filter(city => city.is_hidden_gem)
    }

    // Sort cities
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price':
          const priceA = parseInt(a.estimated_price.replace(/[€$,]/g, ''))
          const priceB = parseInt(b.estimated_price.replace(/[€$,]/g, ''))
          return priceA - priceB
          
        case 'duration':
          return a.flight_duration - b.flight_duration
          
        case 'popularity':
          return b.flight_frequency - a.flight_frequency
          
        case 'theme_match':
        default:
          // Sort by theme match relevance
          const getThemeScore = (city: CityOption) => {
            if (!selectedTheme) return 0
            
            let score = 0
            if (city.primary_theme === selectedTheme) score += 10
            
            const secondaryMatch = city.secondary_themes.find(t => t.theme === selectedTheme)
            if (secondaryMatch) score += secondaryMatch.strength * 5
            
            return score
          }
          
          return getThemeScore(b) - getThemeScore(a)
      }
    })

    return filtered
  }, [cities, filters, selectedTheme])

  // Get available themes for filters
  const availableThemes = useMemo(() => {
    const themes = new Set<string>()
    cities.forEach(city => {
      themes.add(city.primary_theme)
      city.secondary_themes.forEach(theme => themes.add(theme.theme))
    })
    return Array.from(themes).sort()
  }, [cities])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                icon={<ArrowLeft size={20} />}
              >
                Back
              </Button>
              
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Cities in {country.name}
                </h1>
                <p className="text-white/60 text-sm">
                  Choose your perfect destination • From {originAirport}
                </p>
              </div>
            </div>
            
            <ExplorationProgress 
              currentStep="cities"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <CityFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableThemes={availableThemes}
          resultsCount={filteredAndSortedCities.length}
        />

        {/* City Grid */}
        <CityGrid
          cities={filteredAndSortedCities}
          selectedTheme={selectedTheme}
          onCitySelect={onCitySelect}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  )
}