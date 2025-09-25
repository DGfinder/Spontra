'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Edit, Loader, MapPin, Plane, Search, ShieldAlert } from 'lucide-react'

import AddReelDialog, { DestinationThemeSlug } from '@/components/admin/AddReelDialog'
import OverlayEditorModal from '@/components/admin/OverlayEditorModal'
import { getThemeColor, getThemeTextClass, type ThemeKey } from '@/lib/theme'

interface ThemeStatus {
  themeSlug: DestinationThemeSlug
  isEnabled: boolean
  min: number
  max: number
  reelCount: number
  isReady: boolean
}

interface DestinationRow {
  airportCode: string
  name: string
  city: string
  country: string
  countryCode: string
  latitude: number | null
  longitude: number | null
  isActive: boolean
  flightCount: number
  themes: ThemeStatus[]
  description: string
  highlights: string[]
  activities: Record<DestinationThemeSlug, string[]>
  heroImage?: string | null
}

const THEME_ORDER: DestinationThemeSlug[] = ['vibe', 'adventure', 'discover', 'indulge', 'nature']

export default function DestinationsManagePage() {
  const router = useRouter()
  const [destinations, setDestinations] = useState<DestinationRow[]>([])
  const [filteredDestinations, setFilteredDestinations] = useState<DestinationRow[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingTheme, setPendingTheme] = useState<{
    iata: string
    themeSlug: DestinationThemeSlug
    min: number
    max: number
  } | null>(null)
  const [editing, setEditing] = useState<DestinationRow | null>(null)
  const [updatingTheme, setUpdatingTheme] = useState<string | null>(null)\r\n  const [countryFilter, setCountryFilter] = useState<string>('')\r\n  const [cityFilter, setCityFilter] = useState<string>('')

  const loadDestinations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/destinations/list-from-airports', { cache: 'no-store' })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to load destinations')
      }
      const json = await response.json()
      const mapped: DestinationRow[] = (json?.data ?? []).map((row: any) => ({
        airportCode: row.airport_code,
        name: row.name,
        city: row.city,
        country: row.country,
        countryCode: row.country_code,
        latitude: row.latitude,
        longitude: row.longitude,
        isActive: row.is_active,
        flightCount: row.flight_count,
        themes: (row.themes ?? []).map((theme: any) => ({
          themeSlug: theme.themeSlug || theme.theme_slug,
          isEnabled: Boolean(theme.isEnabled ?? theme.is_enabled),
          min: Number(theme.min ?? theme.min_media_required ?? 5),
          max: Number(theme.max ?? theme.max_media_allowed ?? 10),
          reelCount: Number(theme.reelCount ?? theme.reel_count ?? 0),
          isReady: Boolean(theme.isReady ?? theme.is_ready ?? false),
        })),
        description: row.description ?? '',
        highlights: row.highlights ?? [],
        activities: row.activities ?? { vibe: [], adventure: [], discover: [], indulge: [], nature: [] },
        heroImage: row.hero_image ?? null,
      }))
      setDestinations(mapped)
      setFilteredDestinations(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load destinations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDestinations()
  }, [loadDestinations])

  useEffect(() => {
    const countryParam = searchParams.get('country')
    const cityParam = searchParams.get('city')
    const normalisedCountry = countryParam ? countryParam.toUpperCase() : ''
    const nextCity = cityParam ?? ''
    setCountryFilter((prev) => (prev === normalisedCountry ? prev : normalisedCountry))
    setCityFilter((prev) => (prev === nextCity ? prev : nextCity))
  }, [searchParams])

  useEffect(() => {
    let working = destinations

    if (countryFilter) {
      working = working.filter((dest) => {
        const codeMatch = dest.countryCode ? dest.countryCode.toUpperCase() === countryFilter : false
        const nameMatch = dest.country.toUpperCase() === countryFilter
        return codeMatch || nameMatch
      })
    }

    if (cityFilter) {
      const cityValue = cityFilter.toLowerCase()
      working = working.filter((dest) => dest.city.toLowerCase() === cityValue)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      working = working.filter((dest) =>
        dest.city.toLowerCase().includes(term) ||
        dest.country.toLowerCase().includes(term) ||
        dest.airportCode.toLowerCase().includes(term)
      )
    }

    setFilteredDestinations(working)
  }, [destinations, searchTerm, countryFilter, cityFilter])

  const handleToggleTheme = async (destination: DestinationRow, status: ThemeStatus) => {
    const nextEnabled = !status.isEnabled
    const updateKey = `${destination.airportCode}-${status.themeSlug}`
    setUpdatingTheme(updateKey)
    setError(null)
    try {
      const response = await fetch(
        `/api/admin/destinations/${encodeURIComponent(destination.airportCode)}/themes/${status.themeSlug}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isEnabled: nextEnabled }),
        }
      )

      if (response.status === 409) {
        const conflict = await response.json().catch(() => ({}))
        const required = Number(conflict?.required ?? status.min)
        const current = Number(conflict?.current ?? status.reelCount)
        const deficit = Math.max(required - current, 1)
        setPendingTheme({
          iata: destination.airportCode,
          themeSlug: status.themeSlug,
          min: deficit,
          max: status.max,
        })
        return
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to update theme')
      }

      const json = await response.json()
      const updated = json?.data
      setDestinations((prev) =>
        prev.map((item) =>
          item.airportCode === destination.airportCode
            ? {
                ...item,
                themes: item.themes.map((theme) =>
                  theme.themeSlug === status.themeSlug
                    ? {
                        themeSlug: status.themeSlug,
                        isEnabled: updated?.isEnabled ?? nextEnabled,
                        min: updated?.min ?? status.min,
                        max: updated?.max ?? status.max,
                        reelCount: updated?.reelCount ?? status.reelCount,
                        isReady: updated?.isReady ?? status.isReady,
                      }
                    : theme
                ),
              }
            : item
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update theme')
    } finally {
      setUpdatingTheme(null)
    }
  }

  const clearLocationFilters = () => {
    setCountryFilter('')
    setCityFilter('')
    router.replace('/admin/destinations/manage')
  }

  const totalDestinations = useMemo(() => filteredDestinations.length, [filteredDestinations])

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Destinations curation</h1>
          <p className="text-sm text-gray-600">
            Enable a theme only after 5�10 active reels exist for that destination.
          </p>
        </div>
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search city, country, or IATA"
            className="w-64 rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {(countryFilter || cityFilter) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-medium">Active filters:</span>
            {countryFilter ? <span>Country: {countryFilter}</span> : null}
            {cityFilter ? <span>City: {cityFilter}</span> : null}
          </div>
          <button
            type="button"
            onClick={clearLocationFilters}
            className="rounded-md border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
          >
            Clear filters
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader className="animate-spin" size={16} /> Loading destinations�
        </div>
      ) : totalDestinations === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
          No destinations match your filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Destination</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Flights</th>
                {THEME_ORDER.map((theme) => (
                  <th key={theme} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    <span className={`${getThemeTextClass(theme as ThemeKey)} font-bold`}>
                      {theme}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredDestinations.map((destination) => (
                <tr key={destination.airportCode} className="hover:bg-gray-50">
                  <td className="px-4 py-4 align-top">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-semibold text-white">
                        {destination.airportCode}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{destination.city}</span>
                          {!destination.isActive && (
                            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700">Inactive</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <MapPin size={12} /> {destination.country}
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => setEditing(destination)}
                            className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                          >
                            <Edit size={12} />
                            Edit overview
                          </button>
                          <button
                            onClick={() => router.push(`/admin/destinations/${destination.airportCode}`)}
                            className="inline-flex items-center gap-1 rounded border border-blue-500 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                          >
                            View detail
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Plane size={14} />
                      {destination.flightCount}
                    </div>
                  </td>
                  {THEME_ORDER.map((theme) => {
                    const themeStatus = destination.themes.find((item) => item.themeSlug === theme) ?? {
                      themeSlug: theme,
                      isEnabled: false,
                      min: 5,
                      max: 10,
                      reelCount: 0,
                      isReady: false,
                    }
                    const chipClass = themeStatus.reelCount >= themeStatus.min && themeStatus.reelCount <= themeStatus.max
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                    const isUpdating = updatingTheme === `${destination.airportCode}-${theme}`
                    return (
                      <td key={theme} className="px-4 py-4 align-top text-sm text-gray-700">
                        <div className="flex flex-col gap-2">
                          <label className="inline-flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={themeStatus.isEnabled}
                              onChange={() => handleToggleTheme(destination, themeStatus)}
                              disabled={isUpdating}
                              className={`h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-offset-1 ${getThemeTextClass(theme as ThemeKey)}`}
                              style={{ accentColor: getThemeColor(theme as ThemeKey) }}
                            />
                            <span className={themeStatus.isEnabled ? getThemeTextClass(theme as ThemeKey) : 'text-gray-600'}>
                              {themeStatus.isEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </label>
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${chipClass}`}>
                            {themeStatus.reelCount} / {themeStatus.min}-{themeStatus.max}
                          </span>
                          <span className={`text-xs font-medium ${themeStatus.isReady ? 'text-green-700' : 'text-amber-600'}`}>
                            {themeStatus.isReady ? 'Ready' : 'Not ready'}
                          </span>
                          <button
                            onClick={() => router.push(`/admin/destinations/${destination.airportCode}?tab=media&theme=${theme}`)}
                            className={`text-xs font-medium hover:underline ${getThemeTextClass(theme as ThemeKey)}`}
                          >
                            Manage reels
                          </button>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredDestinations.some((dest) => dest.themes.some((theme) => theme.isEnabled && !theme.isReady)) && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <ShieldAlert size={16} /> Themes marked enabled must have between five and ten active reels.
        </div>
      )}

      <OverlayEditorModal
        open={Boolean(editing)}
        destination={
          editing
            ? {
                airportCode: editing.airportCode,
                city: editing.city,
                description: editing.description,
                highlights: editing.highlights,
                heroImage: editing.heroImage,
              }
            : null
        }
        onClose={() => setEditing(null)}
        onSaved={loadDestinations}
      />

      <AddReelDialog
        open={Boolean(pendingTheme)}
        iata={pendingTheme?.iata ?? ''}
        themeSlug={pendingTheme?.themeSlug ?? 'vibe'}
        minRequired={pendingTheme?.min ?? 5}
        maxAllowed={pendingTheme?.max ?? 10}
        onClose={() => setPendingTheme(null)}
        onCreated={() => loadDestinations()}
      />
    </div>
  )
}
