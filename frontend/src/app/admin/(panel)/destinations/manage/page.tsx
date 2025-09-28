'use client'

import { type ComponentProps, useMemo, useState } from 'react'
import { Calendar, Globe, MapPin, Search } from 'lucide-react'

import { BulkDestinationActions } from '@/components/admin/BulkDestinationActions'
import { DestinationControls } from '@/components/admin/DestinationControls'
import { SearchFilterControls } from '@/components/admin/SearchFilterControls'
import type { AdminDestination } from '@/types/admin'

const SAMPLE_DESTINATIONS: AdminDestination[] = [
  {
    iataCode: 'BCN',
    cityName: 'Barcelona',
    countryName: 'Spain',
    countryCode: 'ES',
    continent: 'Europe',
    coordinates: { lat: 41.3851, lng: 2.1734 },
    isActive: true,
    isPopular: true,
    isVisible: true,
    highlights: ['Beachfront promenade', 'Tapas crawl routes', 'Gaudi architecture'],
    themeScores: { vibe: 9, adventure: 6, discover: 8, indulge: 7, nature: 5 },
    supportedActivities: ['nightlife', 'culture', 'food'],
    metrics: {
      totalBookings: 3420,
      totalRevenue: 289500,
      averageStay: 4,
      popularityScore: 8.9,
      contentCount: 126,
      creatorCount: 48,
    },
    description: 'Mediterranean hub blending food, design, and seaside escapes.',
    imageUrl: '/images/cities/barcelona.jpg',
    lastUpdated: '2025-08-20T10:00:00Z',
    averageFlightTime: 2.4,
    priceRange: 'mid-range',
    bestMonths: ['Apr', 'May', 'Sep', 'Oct'],
  },
  {
    iataCode: 'AMS',
    cityName: 'Amsterdam',
    countryName: 'Netherlands',
    countryCode: 'NL',
    continent: 'Europe',
    coordinates: { lat: 52.3676, lng: 4.9041 },
    isActive: true,
    isPopular: false,
    isVisible: true,
    highlights: ['Canal biking routes', 'Museum district immersion', 'Cafe culture'],
    themeScores: { vibe: 7, adventure: 5, discover: 9, indulge: 6, nature: 6 },
    supportedActivities: ['culture', 'nature', 'nightlife'],
    metrics: {
      totalBookings: 2210,
      totalRevenue: 198750,
      averageStay: 3,
      popularityScore: 7.5,
      contentCount: 98,
      creatorCount: 33,
    },
    description: 'Waterfront escape mixing heritage, cycling, and cafe hopping.',
    imageUrl: '/images/cities/amsterdam.jpg',
    lastUpdated: '2025-08-18T08:30:00Z',
    averageFlightTime: 1.8,
    priceRange: 'mid-range',
    bestMonths: ['Mar', 'Apr', 'Sep'],
  },
  {
    iataCode: 'CPT',
    cityName: 'Cape Town',
    countryName: 'South Africa',
    countryCode: 'ZA',
    continent: 'Africa',
    coordinates: { lat: -33.9249, lng: 18.4241 },
    isActive: false,
    isPopular: false,
    isVisible: false,
    highlights: ['Table Mountain hikes', 'Wineland day trips', 'Atlantic sunsets'],
    themeScores: { vibe: 8, adventure: 9, discover: 7, indulge: 8, nature: 9 },
    supportedActivities: ['adventure', 'nature', 'food'],
    metrics: {
      totalBookings: 890,
      totalRevenue: 142300,
      averageStay: 6,
      popularityScore: 6.1,
      contentCount: 54,
      creatorCount: 21,
    },
    description: 'Outdoor-forward gateway with coastal drives and dramatic scenery.',
    imageUrl: '/images/cities/capetown.jpg',
    lastUpdated: '2025-08-10T14:45:00Z',
    averageFlightTime: 11.2,
    priceRange: 'luxury',
    bestMonths: ['Nov', 'Dec', 'Jan'],
  },
]

type SearchFilters = Parameters<ComponentProps<typeof SearchFilterControls>['onFiltersChange']>[0]
type BulkActionId = Parameters<ComponentProps<typeof BulkDestinationActions>['onBulkAction']>[0]

const DEFAULT_FILTERS: SearchFilters = {
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
  featuredOnly: false,
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const formatDateLabel = (isoDate: string) => {
  const timestamp = Date.parse(isoDate)
  if (Number.isNaN(timestamp)) return 'Unknown'
  const date = new Date(timestamp)
  return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`
}

export default function ManageDestinationsPage() {
  const [destinations, setDestinations] = useState<AdminDestination[]>(SAMPLE_DESTINATIONS)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS)
  const [query, setQuery] = useState('')

  const filteredDestinations = useMemo(() => {
    return destinations.filter((destination) => {
      if (filters.activeOnly && !destination.isActive) return false
      if (filters.popularOnly && !destination.isPopular) return false
      if (filters.visibleInSearch && destination.isVisible === false) return false
      if (filters.featuredOnly && !destination.isPopular) return false

      if (filters.countries.length > 0 && !filters.countries.includes(destination.countryName)) {
        return false
      }

      if (filters.continents.length > 0 && !filters.continents.includes(destination.continent)) {
        return false
      }

      if (destination.metrics.popularityScore < filters.minScore) return false
      if (destination.metrics.popularityScore > filters.maxScore) return false
      if (destination.metrics.totalBookings < filters.minBookings) return false
      if (destination.metrics.totalRevenue < filters.minRevenue) return false

      if (filters.lastUpdatedDays < 365) {
        const cutoff = Date.now() - filters.lastUpdatedDays * 24 * 60 * 60 * 1000
        if (Date.parse(destination.lastUpdated) < cutoff) return false
      }

      if (!query.trim()) return true
      const haystack = `${destination.cityName} ${destination.countryName} ${destination.iataCode}`.toLowerCase()
      return haystack.includes(query.trim().toLowerCase())
    })
  }, [destinations, filters, query])

  const handleUpdateDestination = async (iata: string, updates: Partial<AdminDestination>) => {
    setDestinations((previous) =>
      previous.map((destination) => {
        if (destination.iataCode !== iata) return destination
        const mergedMetrics = updates.metrics ? { ...destination.metrics, ...updates.metrics } : destination.metrics
        return { ...destination, ...updates, metrics: mergedMetrics }
      }),
    )
  }

  const handleBulkAction = async (action: BulkActionId, ids: string[]) => {
    if (action === 'delete') {
      setDestinations((previous) => previous.filter((destination) => !ids.includes(destination.iataCode)))
      setSelectedIds((previous) => previous.filter((id) => !ids.includes(id)))
      return
    }

    setDestinations((previous) =>
      previous.map((destination) => {
        if (!ids.includes(destination.iataCode)) return destination

        switch (action) {
          case 'activate':
            return { ...destination, isActive: true, isVisible: destination.isVisible ?? true }
          case 'deactivate':
            return { ...destination, isActive: false }
          case 'mark_popular':
            return { ...destination, isPopular: true }
          case 'unmark_popular':
            return { ...destination, isPopular: false }
          case 'show':
            return { ...destination, isVisible: true }
          case 'hide':
            return { ...destination, isVisible: false }
          default:
            return destination
        }
      }),
    )
  }

  const handleExport = (rows: AdminDestination[]) => {
    const csvRows = rows.map((destination) => [
      destination.iataCode,
      destination.cityName,
      destination.countryName,
      destination.isActive,
      destination.isPopular,
      destination.isVisible !== false,
    ].join(','))
    const csv = ['iataCode,cityName,countryName,isActive,isPopular,isVisible', ...csvRows].join('\n')
    console.info('Admin export sample:\n', csv)
  }

  const handleImport = async (file: File) => {
    const text = await file.text()
    console.info('Import preview (first 200 chars):', text.slice(0, 200))
  }

  return (
    <div className='space-y-8'>
      <header className='space-y-2'>
        <h1 className='text-2xl font-semibold text-slate-900'>Destinations</h1>
        <p className='text-sm text-slate-600'>Audit readiness, toggle visibility, and jump into detailed editors.</p>
      </header>

      <section className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='relative w-full max-w-md'>
            <Search size={18} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder='Filter by city, country, or IATA code'
              className='w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
            />
          </div>
          <div className='text-sm text-slate-500'>
            Showing {filteredDestinations.length} of {destinations.length} destinations
          </div>
        </div>
      </section>

      <SearchFilterControls onFiltersChange={setFilters} initialFilters={filters} />

      <BulkDestinationActions
        destinations={filteredDestinations}
        selectedDestinations={selectedIds}
        onSelectionChange={setSelectedIds}
        onBulkAction={handleBulkAction}
        onExport={handleExport}
        onImport={handleImport}
      />

      <section className='grid gap-6 lg:grid-cols-2'>
        {filteredDestinations.map((destination) => {
          const bestMonths = destination.bestMonths?.join(', ') ?? 'Unspecified'
          return (
            <article key={destination.iataCode} className='space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
              <header className='flex flex-wrap items-center justify-between gap-3'>
                <div>
                  <h2 className='text-lg font-semibold text-slate-900'>
                    {destination.cityName}
                    <span className='ml-2 text-sm font-normal text-slate-500'>({destination.iataCode})</span>
                  </h2>
                  <p className='mt-1 flex items-center gap-2 text-sm text-slate-600'>
                    <MapPin size={16} className='text-blue-500' />
                    {destination.countryName} / {destination.continent}
                  </p>
                </div>
                <div className='text-xs text-slate-500'>Last updated {formatDateLabel(destination.lastUpdated)}</div>
              </header>

              <div className='grid gap-3 md:grid-cols-2'>
                <div className='rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600'>
                  <p><strong>Total bookings:</strong> {destination.metrics.totalBookings.toLocaleString()}</p>
                  <p><strong>Revenue:</strong> EUR {destination.metrics.totalRevenue.toLocaleString()}</p>
                  <p><strong>Popularity:</strong> {destination.metrics.popularityScore.toFixed(1)}</p>
                </div>
                <div className='rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600'>
                  <p className='flex items-center gap-2'>
                    <Globe size={16} className='text-emerald-500' />
                    Themes: vibe {destination.themeScores.vibe}, adventure {destination.themeScores.adventure}, nature {destination.themeScores.nature}
                  </p>
                  <p className='mt-2 flex items-center gap-2'>
                    <Calendar size={16} className='text-amber-500' />
                    Best months: {bestMonths}
                  </p>
                </div>
              </div>

              <p className='text-sm text-slate-600'>{destination.description}</p>

              <DestinationControls
                destination={destination}
                onUpdate={(updates) => handleUpdateDestination(destination.iataCode, updates)}
              />
            </article>
          )
        })}
        {filteredDestinations.length === 0 ? (
          <div className='rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500'>
            No destinations match the current filters. Adjust the filters or import seed data.
          </div>
        ) : null}
      </section>
    </div>
  )
}