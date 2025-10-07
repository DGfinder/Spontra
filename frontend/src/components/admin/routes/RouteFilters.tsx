'use client'

import { Search } from 'lucide-react'

export interface RouteFilterState {
  searchQuery: string
  routeType: 'all' | 'direct' | 'connections' | 'unknown'
  dataSource: 'all' | 'verified' | 'estimated'
  sortBy: 'country' | 'code-asc' | 'code-desc' | 'routes-high' | 'routes-low'
}

interface RouteFiltersProps {
  filters: RouteFilterState
  onFilterChange: (filters: RouteFilterState) => void
}

export function RouteFilters({ filters, onFilterChange }: RouteFiltersProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6 backdrop-blur-xl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) =>
                onFilterChange({ ...filters, searchQuery: e.target.value })
              }
              placeholder="Airport code, city, or country..."
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
            />
          </div>
        </div>

        {/* Route Type Filter */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Route Type</label>
          <select
            value={filters.routeType}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                routeType: e.target.value as RouteFilterState['routeType']
              })
            }
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40 transition-colors"
          >
            <option value="all">All Routes</option>
            <option value="direct">Direct Only</option>
            <option value="connections">Connections Only</option>
            <option value="unknown">Unknown Type</option>
          </select>
        </div>

        {/* Data Source Filter */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Data Source</label>
          <select
            value={filters.dataSource}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                dataSource: e.target.value as RouteFilterState['dataSource']
              })
            }
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40 transition-colors"
          >
            <option value="all">All Sources</option>
            <option value="verified">Verified Only</option>
            <option value="estimated">Estimated Only</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Sort By</label>
          <select
            value={filters.sortBy}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                sortBy: e.target.value as RouteFilterState['sortBy']
              })
            }
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40 transition-colors"
          >
            <option value="country">Country (A-Z)</option>
            <option value="code-asc">Airport Code (A-Z)</option>
            <option value="code-desc">Airport Code (Z-A)</option>
            <option value="routes-high">Most Routes First</option>
            <option value="routes-low">Fewest Routes First</option>
          </select>
        </div>
      </div>
    </div>
  )
}
