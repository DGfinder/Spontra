'use client'

import { useState, useEffect, useMemo } from 'react'
import { getDestinations } from '@/actions/destinationActions'
import { ManagePOIModal } from '@/components/admin/poi/ManagePOIModal'
import { DestinationStats } from '@/components/admin/destinations/DestinationStats'
import { DestinationFilters, type FilterState } from '@/components/admin/destinations/DestinationFilters'
import { ContinentGroup } from '@/components/admin/destinations/ContinentGroup'
import { getContinentName, CONTINENTS } from '@/lib/constants/continents'

interface Destination {
  id: string
  cityName: string
  airportCode: string | null
  country: {
    id: string
    name: string
    code: string
    createdAt: string
    updatedAt: string
  } | null
  airports: Array<{
    isPrimary: boolean
    createdAt: string
    airport: {
      iataCode: string
      name: string
    }
  }>
  _count: {
    themePOIs: number
  }
}

interface GroupedDestinations {
  [countryName: string]: Destination[]
}

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    poiFilter: 'all',
    sortBy: 'country'
  })

  useEffect(() => {
    loadDestinations()
  }, [])

  async function loadDestinations() {
    setIsLoading(true)
    const result = await getDestinations()
    console.log('[Destinations] Load result:', result)
    if (result.success && result.data) {
      console.log('[Destinations] Setting data:', result.data.length, 'destinations')
      setDestinations(result.data)
    } else {
      console.error('[Destinations] Failed to load:', result.error)
    }
    setIsLoading(false)
  }

  // Filter and sort destinations
  const filteredAndSortedDestinations = useMemo(() => {
    let filtered = destinations

    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(
        (d) =>
          d.cityName.toLowerCase().includes(query) ||
          d.country?.name.toLowerCase().includes(query)
      )
    }

    // Apply POI filter
    if (filters.poiFilter === 'has-pois') {
      filtered = filtered.filter((d) => d._count.themePOIs > 0)
    } else if (filters.poiFilter === 'missing-pois') {
      filtered = filtered.filter((d) => d._count.themePOIs === 0)
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (filters.sortBy) {
        case 'city-asc':
          return a.cityName.localeCompare(b.cityName)
        case 'city-desc':
          return b.cityName.localeCompare(a.cityName)
        case 'country':
          return (a.country?.name || 'Unknown').localeCompare(b.country?.name || 'Unknown')
        case 'pois-high':
          return b._count.themePOIs - a._count.themePOIs
        case 'pois-low':
          return a._count.themePOIs - b._count.themePOIs
        default:
          return 0
      }
    })

    return sorted
  }, [destinations, filters])

  // Group destinations by continent, then by country
  const groupedByContinent = useMemo(() => {
    // First group by country
    const byCountry: GroupedDestinations = {}
    filteredAndSortedDestinations.forEach((dest) => {
      const countryName = dest.country?.name || 'Unknown Country'
      if (!byCountry[countryName]) {
        byCountry[countryName] = []
      }
      byCountry[countryName].push(dest)
    })

    // Then group countries by continent
    const byContinent: { [continentName: string]: GroupedDestinations } = {}
    Object.entries(byCountry).forEach(([countryName, destinations]) => {
      const continentName = getContinentName(countryName)
      if (!byContinent[continentName]) {
        byContinent[continentName] = {}
      }
      byContinent[continentName][countryName] = destinations
    })

    // Sort continents by predefined order, then sort countries within each continent
    const continentOrder = [...CONTINENTS.map(c => c.name), 'Other']
    const sorted = continentOrder
      .filter(continentName => byContinent[continentName]) // Only include continents that have data
      .reduce((acc, continentName) => {
        const countries = byContinent[continentName]
        // Sort countries alphabetically within each continent
        const sortedCountries = Object.keys(countries)
          .sort()
          .reduce((countryAcc, countryName) => {
            countryAcc[countryName] = countries[countryName]
            return countryAcc
          }, {} as GroupedDestinations)

        acc[continentName] = sortedCountries
        return acc
      }, {} as { [continentName: string]: GroupedDestinations })

    return sorted
  }, [filteredAndSortedDestinations])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Destinations</h1>
        <p className="text-white/70 mt-1">Manage destination content and theme POIs</p>
      </div>

      {/* Statistics Dashboard */}
      <DestinationStats destinations={destinations} />

      {/* Filters */}
      <DestinationFilters filters={filters} onFilterChange={setFilters} />

      {/* Grouped Destinations by Continent */}
      {Object.keys(groupedByContinent).length === 0 ? (
        <div className="text-center py-16 bg-white/5 border border-white/10 rounded-xl">
          <p className="text-white/60">No destinations found matching your filters</p>
          <button
            onClick={() =>
              setFilters({ searchQuery: '', poiFilter: 'all', sortBy: 'country' })
            }
            className="mt-4 text-blue-300 hover:text-blue-200 text-sm"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByContinent).map(([continentName, countryGroups]) => {
            const continentConfig = CONTINENTS.find(c => c.name === continentName) || {
              name: continentName,
              emoji: '🌐',
              color: '#6b7280',
              countries: []
            }

            return (
              <ContinentGroup
                key={continentName}
                continent={continentConfig}
                groupedDestinations={countryGroups}
                onManageDestination={setSelectedDestinationId}
              />
            )
          })}
        </div>
      )}

      {/* POI Management Modal */}
      <ManagePOIModal
        destinationId={selectedDestinationId}
        isOpen={selectedDestinationId !== null}
        onClose={() => setSelectedDestinationId(null)}
        onSuccess={loadDestinations}
      />
    </div>
  )
}
