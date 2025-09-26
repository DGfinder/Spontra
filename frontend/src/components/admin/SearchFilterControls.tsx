'use client'

import React, { useState } from 'react'
import {
  Filter,
  Search,
  Settings,
  Eye,
  EyeOff,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Globe,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'

interface SearchFilterControlsProps {
  onFiltersChange: (filters: SearchFilters) => void
  initialFilters?: SearchFilters
}

interface SearchFilters {
  // Destination filters
  activeOnly: boolean
  popularOnly: boolean
  minScore: number
  maxScore: number
  
  // Geographic filters
  countries: string[]
  continents: string[]
  
  // Performance filters
  minBookings: number
  minRevenue: number
  
  
  // Time-based filters
  lastUpdatedDays: number
  
  // Search visibility
  visibleInSearch: boolean
  featuredOnly: boolean
}

const defaultFilters: SearchFilters = {
  activeOnly: true,
  popularOnly: false,
  minScore: 0,
  maxScore: 10,
  countries: [],
  continents: [],
  minBookings: 0,
  minRevenue: 0,
  lastUpdatedDays: 365,
  visibleInSearch: true,
  featuredOnly: false
}

const continents = [
  'Europe', 'Asia', 'North America', 'South America', 'Africa', 'Oceania', 'Antarctica'
]


export function SearchFilterControls({ onFiltersChange, initialFilters }: SearchFilterControlsProps) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters || defaultFilters)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedCountries, setSelectedCountries] = useState<string[]>(filters.countries)
  const [selectedContinents, setSelectedContinents] = useState<string[]>(filters.continents)

  const updateFilters = (updates: Partial<SearchFilters>) => {
    const newFilters = { ...filters, ...updates }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleCountryToggle = (country: string) => {
    const newCountries = selectedCountries.includes(country)
      ? selectedCountries.filter(c => c !== country)
      : [...selectedCountries, country]
    
    setSelectedCountries(newCountries)
    updateFilters({ countries: newCountries })
  }

  const handleContinentToggle = (continent: string) => {
    const newContinents = selectedContinents.includes(continent)
      ? selectedContinents.filter(c => c !== continent)
      : [...selectedContinents, continent]
    
    setSelectedContinents(newContinents)
    updateFilters({ continents: newContinents })
  }


  const resetFilters = () => {
    setFilters(defaultFilters)
    setSelectedCountries([])
    setSelectedContinents([])
    onFiltersChange(defaultFilters)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.activeOnly) count++
    if (filters.popularOnly) count++
    if (filters.minScore > 0 || filters.maxScore < 10) count++
    if (filters.countries.length > 0) count++
    if (filters.continents.length > 0) count++
    if (filters.minBookings > 0) count++
    if (filters.minRevenue > 0) count++
    if (filters.lastUpdatedDays < 365) count++
    if (!filters.visibleInSearch) count++
    if (filters.featuredOnly) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Filter size={20} className="text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Search Filters</h3>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              {activeFiltersCount} active
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Settings size={16} className="mr-2" />
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>
          
          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              <XCircle size={16} className="mr-2" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Basic Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Filters */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center">
            <CheckCircle size={16} className="mr-2 text-green-600" />
            Status
          </h4>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.activeOnly}
              onChange={(e) => updateFilters({ activeOnly: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Active only</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.popularOnly}
              onChange={(e) => updateFilters({ popularOnly: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Popular only</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.featuredOnly}
              onChange={(e) => updateFilters({ featuredOnly: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Featured only</span>
          </label>
        </div>

        {/* Score Range */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center">
            <Star size={16} className="mr-2 text-yellow-600" />
            Score Range
          </h4>
          
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Min Score</label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={filters.minScore}
                onChange={(e) => updateFilters({ minScore: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="text-xs text-gray-500">{filters.minScore.toFixed(1)}</div>
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 mb-1">Max Score</label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={filters.maxScore}
                onChange={(e) => updateFilters({ maxScore: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="text-xs text-gray-500">{filters.maxScore.toFixed(1)}</div>
            </div>
          </div>
        </div>

        {/* Performance Filters */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center">
            <Users size={16} className="mr-2 text-blue-600" />
            Performance
          </h4>
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">Min Bookings</label>
            <input
              type="number"
              min="0"
              value={filters.minBookings}
              onChange={(e) => updateFilters({ minBookings: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">Min Revenue (EUR)</label>
            <input
              type="number"
              min="0"
              value={filters.minRevenue}
              onChange={(e) => updateFilters({ minRevenue: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>
        </div>

        {/* Visibility */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center">
            <Eye size={16} className="mr-2 text-purple-600" />
            Visibility
          </h4>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.visibleInSearch}
              onChange={(e) => updateFilters({ visibleInSearch: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Visible in search</span>
          </label>
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">Updated within (days)</label>
            <input
              type="number"
              min="1"
              max="365"
              value={filters.lastUpdatedDays}
              onChange={(e) => updateFilters({ lastUpdatedDays: parseInt(e.target.value) || 365 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t pt-6 space-y-6">
          <h4 className="font-medium text-gray-900">Advanced Filters</h4>
          
          {/* Geographic Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-700 mb-3 flex items-center">
                <MapPin size={16} className="mr-2 text-green-600" />
                Countries
              </h5>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {['United States', 'United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Japan', 'Australia', 'Canada', 'Netherlands'].map(country => (
                  <label key={country} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedCountries.includes(country)}
                      onChange={() => handleCountryToggle(country)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{country}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-700 mb-3 flex items-center">
                <Globe size={16} className="mr-2 text-blue-600" />
                Continents
              </h5>
              <div className="space-y-2">
                {continents.map(continent => (
                  <label key={continent} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedContinents.includes(continent)}
                      onChange={() => handleContinentToggle(continent)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{continent}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Filter Summary */}
      {activeFiltersCount > 0 && (
        <div className="border-t pt-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <AlertTriangle size={16} className="text-orange-600" />
            <span>
              {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} applied. 
              Results will be filtered accordingly.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
