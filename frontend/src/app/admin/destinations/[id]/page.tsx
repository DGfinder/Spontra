'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader, MapPin, ShieldAlert } from 'lucide-react'

import OverlayEditorModal from '@/components/admin/OverlayEditorModal'\nimport AddReelDialog, { DestinationThemeSlug } from '@/components/admin/AddReelDialog'\nimport ReelList from '@/components/admin/ReelList'

interface ThemeStatus {
  themeSlug: DestinationThemeSlug
  isEnabled: boolean
  min: number
  max: number
  reelCount: number
  isReady: boolean
}

interface DestinationDetail {
  airportCode: string
  name: string
  city: string
  country: string
  description: string
  highlights: string[]
  activities: Record<DestinationThemeSlug, string[]>
  heroImage?: string | null
  themes: ThemeStatus[]
}

const THEME_ORDER: DestinationThemeSlug[] = ['vibe', 'adventure', 'discover', 'indulge', 'nature']

export default function DestinationDetailPage() {
  const params = useParams<{ id: string }>()
  const query = useSearchParams()
  const router = useRouter()

  const iata = (params?.id || '').toUpperCase()

  const [destination, setDestination] = useState<DestinationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'themes' | 'media' | 'analytics'>(
    (query.get('tab') as any) || 'overview'
  )
  const [selectedTheme, setSelectedTheme] = useState<DestinationThemeSlug>(
    (query.get('theme') as DestinationThemeSlug) || 'vibe'
  )
  const [pendingTheme, setPendingTheme] = useState<{
    themeSlug: DestinationThemeSlug
    min: number
    max: number
  } | null>(null)
  const [updatingTheme, setUpdatingTheme] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  const fetchDestination = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/destinations/${encodeURIComponent(iata)}`, { cache: 'no-store' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to load destination')
      }
      const json = await res.json()
      const data = json?.data
      if (!data) throw new Error('Destination not found')
      if (!THEME_ORDER.includes(selectedTheme)) {
        const fallbackTheme = (data.themes?.[0]?.themeSlug as DestinationThemeSlug) || 'vibe'
        setSelectedTheme(fallbackTheme)
      }
      setDestination(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load destination')
    } finally {
      setLoading(false)
    }
  }, [iata, selectedTheme])

  useEffect(() => {
    if (!iata) return
    fetchDestination()
  }, [fetchDestination, iata])


  const handleToggleTheme = async (theme: ThemeStatus) => {
    setError(null)
    const nextEnabled = !theme.isEnabled
    const key = `${theme.themeSlug}`
    setUpdatingTheme(key)

    try {
      const res = await fetch(`/api/admin/destinations/${encodeURIComponent(iata)}/themes/${theme.themeSlug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: nextEnabled }),
      })

      if (res.status === 409) {
        const conflict = await res.json().catch(() => ({}))
        const required = Number(conflict?.required ?? theme.min)
        const current = Number(conflict?.current ?? theme.reelCount)
        const deficit = Math.max(required - current, 1)
        setPendingTheme({ themeSlug: theme.themeSlug, min: deficit, max: theme.max })
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to update theme')
      }

      const json = await res.json()
      const updated = json?.data
      setDestination((prev) =>
        prev
          ? {
              ...prev,
              themes: prev.themes.map((item) =>
                item.themeSlug === theme.themeSlug
                  ? {
                      themeSlug: theme.themeSlug,
                      isEnabled: updated?.isEnabled ?? nextEnabled,
                      min: updated?.min ?? theme.min,
                      max: updated?.max ?? theme.max,
                      reelCount: updated?.reelCount ?? theme.reelCount,
                      isReady: updated?.isReady ?? theme.isReady,
                    }
                  : item
              ),
            }
          : prev
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update theme')
    } finally {
      setUpdatingTheme(null)
    }
  }

  const overviewHighlights = useMemo(() => destination?.highlights ?? [], [destination])

  return (
    <div className="space-y-6 p-6">
      <button
        onClick={() => router.push('/admin/destinations/manage')}
        className="inline-flex items-center gap-2 text-sm text-gray-600"
      >
        <ArrowLeft size={16} /> Back to manage
      </button>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader className="animate-spin" size={16} /> Loading destination…
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : destination ? (
        <>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {destination.city} ({destination.airportCode})
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={14} /> {destination.country}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Edit overview
                </button>
              </div>
            </div>

            <div className="px-6">
              <div className="flex items-center gap-4 border-b border-gray-200 text-sm">
                {['overview', 'themes', 'media', 'analytics'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab as any)
                      router.replace(`/admin/destinations/${iata}?tab=${tab}`)
                    }}
                    className={`border-b-2 px-3 py-3 font-medium capitalize ${
                      activeTab === tab
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-6 py-5">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {destination.heroImage && (
                    <img
                      src={destination.heroImage}
                      alt={`${destination.city} hero`}
                      className="w-full rounded-lg object-cover"
                    />
                  )}
                  <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-gray-900">Description</h2>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{destination.description || 'No description yet.'}</p>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-md font-semibold text-gray-900">Highlights</h3>
                    {overviewHighlights.length === 0 ? (
                      <p className="text-sm text-gray-600">No highlights yet.</p>
                    ) : (
                      <ul className="list-disc pl-6 text-sm text-gray-700">
                        {overviewHighlights.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'themes' && (
                <div className="space-y-4">
                  {destination.themes.map((theme) => {
                    const chipClass = theme.reelCount >= theme.min && theme.reelCount <= theme.max
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                    const updating = updatingTheme === theme.themeSlug
                    return (
                      <div key={theme.themeSlug} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold capitalize text-gray-900">{theme.themeSlug}</h3>
                            <p className="text-xs text-gray-600">
                              {theme.reelCount} active reels • window {theme.min}-{theme.max}
                            </p>
                            <span className={`mt-2 inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${chipClass}`}>
                              {theme.isReady ? 'Ready' : 'Not ready'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="inline-flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={theme.isEnabled}
                                onChange={() => handleToggleTheme(theme)}
                                disabled={updating}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span>{theme.isEnabled ? 'Enabled' : 'Disabled'}</span>
                            </label>
                            <button
                              onClick={() => {
                                setSelectedTheme(theme.themeSlug)
                                setActiveTab('media')
                                router.replace(`/admin/destinations/${iata}?tab=media&theme=${theme.themeSlug}`)
                              }}
                              className="text-sm font-medium text-blue-600 hover:underline"
                            >
                              Manage media
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {activeTab === 'media' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-2">
                    {THEME_ORDER.map((theme) => (
                      <button
                        key={theme}
                        onClick={() => {
                          setSelectedTheme(theme)
                          router.replace(`/admin/destinations/${iata}?tab=media&theme=${theme}`)
                        }}
                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                          selectedTheme === theme ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>

                  <ReelList iata={iata} themeSlug={selectedTheme} />
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
                  Analytics integration coming soon.
                </div>
              )}
            </div>
          </div>

          {destination.themes.some((theme) => theme.isEnabled && !theme.isReady) && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <ShieldAlert size={16} /> Some enabled themes are below the 5 reel threshold.
            </div>
          )}

          <OverlayEditorModal
            open={editing}
            destination={
              destination
                ? {
                    airportCode: destination.airportCode,
                    city: destination.city,
                    description: destination.description,
                    highlights: destination.highlights,
                    heroImage: destination.heroImage,
                  }
                : null
            }
            onClose={() => setEditing(false)}
            onSaved={fetchDestination}
          />

          <AddReelDialog\n        open={Boolean(pendingTheme)}\n        iata={destination?.airportCode ?? ''}
            themeSlug={pendingTheme?.themeSlug ?? 'vibe'}
            minRequired={pendingTheme?.min ?? 5}
            maxAllowed={pendingTheme?.max ?? 10}
            onClose={() => setPendingTheme(null)}
            onCreated={() => fetchDestination()}
          />
        </>
      ) : null}
    </div>
  )
}





