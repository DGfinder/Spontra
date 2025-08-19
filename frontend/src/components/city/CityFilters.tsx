'use client'

import { useState } from 'react'
import { Filter, ChevronDown, X } from 'lucide-react'
import { Button, Badge } from '@/components/ui'

export interface FilterOptions {
  themes: string[]
  priceRanges: Array<{ label: string; min: number; max: number }>
  flightDurations: Array<{ label: string; max: number }>
  showHiddenGems: boolean
  sortBy: 'price' | 'duration' | 'popularity' | 'theme_match'
}

interface CityFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  availableThemes: string[]
  resultsCount: number
}

export function CityFilters({ 
  filters, 
  onFiltersChange, 
  availableThemes,
  resultsCount 
}: CityFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const updateFilter = <K extends keyof FilterOptions>(
    key: K, 
    value: FilterOptions[K]
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const toggleTheme = (theme: string) => {
    const newThemes = filters.themes.includes(theme)
      ? filters.themes.filter(t => t !== theme)
      : [...filters.themes, theme]
    updateFilter('themes', newThemes)
  }

  const clearAllFilters = () => {
    onFiltersChange({
      themes: [],
      priceRanges: [],
      flightDurations: [],
      showHiddenGems: false,
      sortBy: 'theme_match'
    })
  }

  const activeFiltersCount = 
    filters.themes.length + 
    filters.priceRanges.length + 
    filters.flightDurations.length + 
    (filters.showHiddenGems ? 1 : 0)

  const defaultPriceRanges = [
    { label: 'Budget (€0-200)', min: 0, max: 200 },
    { label: 'Mid-range (€200-500)', min: 200, max: 500 },
    { label: 'Premium (€500+)', min: 500, max: Infinity }
  ]

  const defaultFlightDurations = [
    { label: 'Short (< 3h)', max: 3 },
    { label: 'Medium (3-6h)', max: 6 },
    { label: 'Long (6h+)', max: Infinity }
  ]

  return (
    <div className="bg-black/20 backdrop-blur-sm border border-white/20 rounded-xl p-4 mb-6">
      {/* Filter Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-white">
            <Filter size={16} />
            <span className="font-medium">Filters</span>
            {activeFiltersCount > 0 && (
              <Badge variant="info" size="sm" rounded>
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          
          <div className="text-white/60 text-sm">
            {resultsCount} cities found
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              icon={<X size={14} />}
            >
              Clear all
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            icon={<ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />}
          >
            {isExpanded ? 'Less' : 'More'}
          </Button>
        </div>
      </div>

      {/* Quick Theme Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {availableThemes.slice(0, 5).map((theme) => (
          <Button
            key={theme}
            variant="toggle"
            size="sm"
            selected={filters.themes.includes(theme)}
            onClick={() => toggleTheme(theme)}
          >
            {theme}
          </Button>
        ))}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-white/10">
          {/* All Themes */}
          {availableThemes.length > 5 && (
            <div>
              <h4 className="text-white/80 text-sm font-medium mb-2">All Themes</h4>
              <div className="flex flex-wrap gap-2">
                {availableThemes.slice(5).map((theme) => (
                  <Button
                    key={theme}
                    variant="toggle"
                    size="sm"
                    selected={filters.themes.includes(theme)}
                    onClick={() => toggleTheme(theme)}
                  >
                    {theme}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Price Range */}
          <div>
            <h4 className="text-white/80 text-sm font-medium mb-2">Price Range</h4>
            <div className="flex flex-wrap gap-2">
              {defaultPriceRanges.map((range) => (
                <Button
                  key={range.label}
                  variant="toggle"
                  size="sm"
                  selected={filters.priceRanges.some(p => p.label === range.label)}
                  onClick={() => {
                    const newRanges = filters.priceRanges.some(p => p.label === range.label)
                      ? filters.priceRanges.filter(p => p.label !== range.label)
                      : [...filters.priceRanges, range]
                    updateFilter('priceRanges', newRanges)
                  }}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Flight Duration */}
          <div>
            <h4 className="text-white/80 text-sm font-medium mb-2">Flight Duration</h4>
            <div className="flex flex-wrap gap-2">
              {defaultFlightDurations.map((duration) => (
                <Button
                  key={duration.label}
                  variant="toggle"
                  size="sm"
                  selected={filters.flightDurations.some(d => d.label === duration.label)}
                  onClick={() => {
                    const newDurations = filters.flightDurations.some(d => d.label === duration.label)
                      ? filters.flightDurations.filter(d => d.label !== duration.label)
                      : [...filters.flightDurations, duration]
                    updateFilter('flightDurations', newDurations)
                  }}
                >
                  {duration.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Special Options */}
          <div>
            <h4 className="text-white/80 text-sm font-medium mb-2">Special</h4>
            <div className="flex gap-2">
              <Button
                variant="toggle"
                size="sm"
                selected={filters.showHiddenGems}
                onClick={() => updateFilter('showHiddenGems', !filters.showHiddenGems)}
                icon={<span>💎</span>}
              >
                Hidden Gems Only
              </Button>
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <h4 className="text-white/80 text-sm font-medium mb-2">Sort By</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'theme_match', label: 'Theme Match' },
                { key: 'price', label: 'Price' },
                { key: 'duration', label: 'Flight Time' },
                { key: 'popularity', label: 'Popularity' }
              ].map(({ key, label }) => (
                <Button
                  key={key}
                  variant="toggle"
                  size="sm"
                  selected={filters.sortBy === key}
                  onClick={() => updateFilter('sortBy', key as FilterOptions['sortBy'])}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}