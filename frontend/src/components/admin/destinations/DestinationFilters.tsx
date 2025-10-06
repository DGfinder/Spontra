'use client'

import { Search, X } from 'lucide-react'

export interface FilterState {
  searchQuery: string
  poiFilter: 'all' | 'has-pois' | 'missing-pois'
  sortBy: 'city-asc' | 'city-desc' | 'country' | 'pois-high' | 'pois-low'
}

interface DestinationFiltersProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
}

export function DestinationFilters({ filters, onFilterChange }: DestinationFiltersProps) {
  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    onFilterChange({ ...filters, [key]: value })
  }

  const clearSearch = () => {
    updateFilter('searchQuery', '')
  }

  const hasActiveFilters =
    filters.searchQuery || filters.poiFilter !== 'all' || filters.sortBy !== 'country'

  const resetFilters = () => {
    onFilterChange({
      searchQuery: '',
      poiFilter: 'all',
      sortBy: 'country'
    })
  }

  return (
    <div className="mb-6 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => updateFilter('searchQuery', e.target.value)}
          placeholder="Search by city or country name..."
          className="w-full pl-12 pr-12 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
        />
        {filters.searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/70 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* POI Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-white/60 font-medium">POIs:</label>
          <select
            value={filters.poiFilter}
            onChange={(e) => updateFilter('poiFilter', e.target.value as FilterState['poiFilter'])}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-white/40 transition-colors"
          >
            <option value="all">All Destinations</option>
            <option value="has-pois">Has POIs</option>
            <option value="missing-pois">Missing POIs</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-white/60 font-medium">Sort:</label>
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value as FilterState['sortBy'])}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-white/40 transition-colors"
          >
            <option value="country">Country</option>
            <option value="city-asc">City (A-Z)</option>
            <option value="city-desc">City (Z-A)</option>
            <option value="pois-high">POIs (High to Low)</option>
            <option value="pois-low">POIs (Low to High)</option>
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="ml-auto text-sm text-white/60 hover:text-white transition-colors underline"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  )
}
