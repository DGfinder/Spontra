'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Loader,
  MapPin,
  RefreshCw,
  ShieldAlert
} from 'lucide-react'

import type { DestinationThemeSlug } from '@/components/admin/AddReelDialog'
import ReelList from '@/components/admin/ReelList'
import { getThemeColor, type ThemeKey } from '@/lib/theme'
import { useToast } from '@/components/Toast'

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

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'themes', label: 'Themes & Activities' },
  { value: 'media', label: 'Media' },
] as const

type TabKey = (typeof TABS)[number]['value']

type ReadinessBreakdown = {
  ready: number
  needsMedia: number
  disabled: number
}

const deriveReadiness = (destination: DestinationDetail): ReadinessBreakdown => {
  return destination.themes.reduce(
    (acc, theme) => {
      if (!theme.isEnabled) {
        acc.disabled += 1
      } else if (theme.isReady) {
        acc.ready += 1
      } else {
        acc.needsMedia += 1
      }
      return acc
    },
    { ready: 0, needsMedia: 0, disabled: 0 },
  )
}

const normaliseTextarea = (text: string) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

interface PageProps {
  params: { iata: string }
}

export default function DestinationDetailPage({ params }: PageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToast } = useToast()

  const [destination, setDestination] = useState<DestinationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [overviewSaving, setOverviewSaving] = useState(false)
  const [activitiesSaving, setActivitiesSaving] = useState(false)
  const [themeUpdating, setThemeUpdating] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [heroImage, setHeroImage] = useState('')
  const [highlightsText, setHighlightsText] = useState('')
  const [activitiesText, setActivitiesText] = useState<Record<DestinationThemeSlug, string>>({
    vibe: '',
    adventure: '',
    discover: '',
    indulge: '',
    nature: '',
  })

  const initialTab = useMemo<TabKey>(() => {
    const requested = searchParams.get('tab') as TabKey | null
    return requested && ['overview', 'themes', 'media'].includes(requested) ? requested : 'overview'
  }, [searchParams])

  const [selectedTab, setSelectedTab] = useState<TabKey>(initialTab)
  const [focusTheme, setFocusTheme] = useState<DestinationThemeSlug | null>(() => {
    const t = searchParams.get('theme') as DestinationThemeSlug | null
    return t && ['vibe', 'adventure', 'discover', 'indulge', 'nature'].includes(t) ? t : null
  })

  useEffect(() => {
    setSelectedTab(initialTab)
    const t = searchParams.get('theme') as DestinationThemeSlug | null
    if (t && ['vibe', 'adventure', 'discover', 'indulge', 'nature'].includes(t)) {
      setFocusTheme(t)
    }
  }, [initialTab, searchParams])

  const fetchDestination = useCallback(
    async (withLoader = true) => {
      if (withLoader) setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/admin/destinations/${encodeURIComponent(params.iata)}`, {
          cache: 'no-store',
        })
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data?.error || 'Failed to load destination')
        }
        const json = await response.json()
        const record: DestinationDetail = json?.data
        setDestination(record)
        setDescription(record.description ?? '')
        setHeroImage(record.heroImage ?? '')
        setHighlightsText((record.highlights ?? []).join('\n'))
        setActivitiesText({
          vibe: (record.activities?.vibe ?? []).join('\n'),
          adventure: (record.activities?.adventure ?? []).join('\n'),
          discover: (record.activities?.discover ?? []).join('\n'),
          indulge: (record.activities?.indulge ?? []).join('\n'),
          nature: (record.activities?.nature ?? []).join('\n'),
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load destination')
      } finally {
        if (withLoader) setLoading(false)
      }
    },
    [params.iata],
  )

  useEffect(() => {
    fetchDestination()
  }, [fetchDestination])

  const readiness = destination ? deriveReadiness(destination) : { ready: 0, needsMedia: 0, disabled: 0 }

  const handleSelectTab = (tab: TabKey) => {
    setSelectedTab(tab)
    const paramsCopy = new URLSearchParams(searchParams)
    paramsCopy.set('tab', tab)
    if (tab !== 'media') {
      paramsCopy.delete('theme')
      setFocusTheme(null)
    }
    router.replace(`/admin/destinations/${params.iata}?${paramsCopy.toString()}`, { scroll: false })
  }

  const handleSaveOverview = async () => {
    if (!destination) return
    setOverviewSaving(true)
    try {
      const payload = {
        airport_code: destination.airportCode,
        description,
        hero_image: heroImage || null,
        highlights: normaliseTextarea(highlightsText),
      }
      const response = await fetch('/api/admin/destinations/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to save overview')
      }
      addToast({ type: 'success', title: 'Overview updated', message: 'Destination overview saved successfully.' })
      fetchDestination(false)
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to save overview', message: err instanceof Error ? err.message : 'An unexpected error occurred.' })
    } finally {
      setOverviewSaving(false)
    }
  }

  const handleSaveActivities = async () => {
    if (!destination) return
    setActivitiesSaving(true)
    try {
      const activitiesPayload: Record<DestinationThemeSlug, string[]> = {
        vibe: normaliseTextarea(activitiesText.vibe || ''),
        adventure: normaliseTextarea(activitiesText.adventure || ''),
        discover: normaliseTextarea(activitiesText.discover || ''),
        indulge: normaliseTextarea(activitiesText.indulge || ''),
        nature: normaliseTextarea(activitiesText.nature || ''),
      }

      const response = await fetch('/api/admin/destinations/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          airport_code: destination.airportCode,
          activities: activitiesPayload,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to save activities')
      }
      addToast({ type: 'success', title: 'Activities updated', message: 'Theme activities saved successfully.' })
      fetchDestination(false)
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to save activities', message: err instanceof Error ? err.message : 'An unexpected error occurred.' })
    } finally {
      setActivitiesSaving(false)
    }
  }

  const handleToggleTheme = async (theme: ThemeStatus) => {
    if (!destination) return
    const updateKey = `${destination.airportCode}-${theme.themeSlug}`
    setThemeUpdating(updateKey)
    try {
      const response = await fetch(
        `/api/admin/destinations/${encodeURIComponent(destination.airportCode)}/themes/${theme.themeSlug}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isEnabled: !theme.isEnabled }),
        },
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        if (response.status === 409) {
          throw new Error(data?.error || 'Theme needs more approved media before enabling')
        }
        throw new Error(data?.error || 'Failed to update theme')
      }

      const json = await response.json()
      const updated = json?.data
      setDestination((prev) =>
        prev
          ? {
              ...prev,
              themes: prev.themes.map((item) =>
                item.themeSlug === theme.themeSlug
                  ? {
                      themeSlug: theme.themeSlug,
                      isEnabled: updated?.isEnabled ?? !theme.isEnabled,
                      min: updated?.min ?? theme.min,
                      max: updated?.max ?? theme.max,
                      reelCount: updated?.reelCount ?? theme.reelCount,
                      isReady: updated?.isReady ?? theme.isReady,
                    }
                  : item,
              ),
            }
          : prev,
      )
      addToast({
        type: 'success',
        title: 'Theme updated',
        message: `Theme ${theme.themeSlug} ${theme.isEnabled ? 'disabled' : 'enabled'}.`,
      })
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to update theme', message: err instanceof Error ? err.message : 'An unexpected error occurred.' })
    } finally {
      setThemeUpdating(null)
    }
  }

  const handleMediaChange = () => {
    fetchDestination(false)
  }

  if (loading) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center text-sm text-slate-600'>
        <Loader className='mr-2 animate-spin' size={16} /> Loading destination...
      </div>
    )
  }

  if (error || !destination) {
    return (
      <div className='space-y-4 p-10'>
        <button
          type='button'
          onClick={() => router.push('/admin/destinations/manage')}
          className='inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700'
        >
          <ArrowLeft size={16} /> Back to destinations
        </button>
        <div className='rounded-xl border border-red-200 bg-red-50 p-6'>
          <div className='flex items-center gap-3 text-red-700'>
            <ShieldAlert size={20} />
            <div>
              <p className='text-sm font-medium'>Unable to load destination</p>
              <p className='text-sm'>{error ?? 'Destination record not found.'}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const readinessBreakdown = deriveReadiness(destination)

  return (
    <div className='space-y-6 p-6'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div className='space-y-1'>
          <button
            type='button'
            onClick={() => router.push('/admin/destinations/manage')}
            className='inline-flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-700'
          >
            <ArrowLeft size={14} /> Back to directory
          </button>
          <div className='flex flex-wrap items-center gap-3'>
            <h1 className='text-2xl font-semibold text-slate-900'>
              {destination.city} ({destination.airportCode})
            </h1>
            <span className='rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600'>
              {destination.country}
            </span>
          </div>
          <p className='text-sm text-slate-600'>{destination.name}</p>
        </div>
        <div className='grid gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm sm:grid-cols-3'>
          <div>
            <p className='text-xs uppercase tracking-wide text-slate-500'>Ready themes</p>
            <p className='mt-1 text-xl font-semibold text-emerald-600'>{readinessBreakdown.ready}</p>
          </div>
          <div>
            <p className='text-xs uppercase tracking-wide text-slate-500'>Needs media</p>
            <p className='mt-1 text-xl font-semibold text-amber-600'>{readinessBreakdown.needsMedia}</p>
          </div>
          <div>
            <p className='text-xs uppercase tracking-wide text-slate-500'>Disabled</p>
            <p className='mt-1 text-xl font-semibold text-slate-900'>{readinessBreakdown.disabled}</p>
          </div>
        </div>
      </div>

      <div className='flex flex-wrap gap-2 text-sm'>
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type='button'
            onClick={() => handleSelectTab(tab.value)}
            className={`rounded-full border px-3 py-1 font-medium transition ${
              selectedTab === tab.value
                ? 'border-blue-200 bg-blue-100 text-blue-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button
          type='button'
          onClick={() => fetchDestination()}
          className='ml-auto inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-100'
        >
          <RefreshCw size={14} className='opacity-70' /> Refresh
        </button>
      </div>

      {selectedTab === 'overview' && (
        <div className='grid gap-6 lg:grid-cols-[1.5fr_1fr]'>
          <div className='space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
            <h2 className='text-lg font-semibold text-slate-900'>Destination overview</h2>
            <label className='space-y-2 text-sm'>
              <span className='font-medium text-slate-700'>Description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={6}
                className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              />
            </label>
            <label className='space-y-2 text-sm'>
              <span className='font-medium text-slate-700'>Hero image URL</span>
              <input
                value={heroImage}
                onChange={(event) => setHeroImage(event.target.value)}
                type='url'
                placeholder='https://cdn.spontra.com/media/...'
                className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              />
            </label>
            <label className='space-y-2 text-sm'>
              <span className='font-medium text-slate-700'>Highlights (one per line)</span>
              <textarea
                value={highlightsText}
                onChange={(event) => setHighlightsText(event.target.value)}
                rows={4}
                className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              />
            </label>
            <div className='flex items-center justify-end'>
              <button
                type='button'
                onClick={handleSaveOverview}
                disabled={overviewSaving}
                className='inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50'
              >
                {overviewSaving ? <Loader size={16} className='animate-spin' /> : <FileText size={16} />} Save overview
              </button>
            </div>
          </div>
          <div className='space-y-4'>
            {heroImage ? (
              <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm'>
                <img src={heroImage} alt={`${destination.city} hero`} className='h-48 w-full object-cover' />
              </div>
            ) : (
              <div className='flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500'>
                <ImageIcon size={18} className='mr-2' /> Add a hero image to improve curator context
              </div>
            )}
            <div className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
              <h3 className='text-sm font-semibold text-slate-800'>Highlights preview</h3>
              <ul className='mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600'>
                {normaliseTextarea(highlightsText).map((item) => (
                  <li key={item}>{item}</li>
                ))}
                {normaliseTextarea(highlightsText).length === 0 && (
                  <li className='list-none text-slate-400'>No highlights yet.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'themes' && (
        <div className='space-y-6'>
          <div className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
            <h2 className='text-lg font-semibold text-slate-900'>Theme readiness</h2>
            <div className='mt-4 grid gap-4 sm:grid-cols-2'>
              {destination.themes.map((theme) => {
                const themeColor = getThemeColor(theme.themeSlug as ThemeKey)
                return (
                  <div
                    key={theme.themeSlug}
                    className={`rounded-xl border border-slate-200 p-4 ${focusTheme === theme.themeSlug ? 'ring-2 ring-blue-300' : ''}`}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <span className='h-2.5 w-2.5 rounded-full' style={{ backgroundColor: themeColor }} />
                        <h3 className='text-sm font-semibold text-slate-900'>{theme.themeSlug}</h3>
                      </div>
                      <button
                        type='button'
                        onClick={() => handleToggleTheme(theme)}
                        disabled={themeUpdating === `${destination.airportCode}-${theme.themeSlug}`}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                          theme.isEnabled
                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {themeUpdating === `${destination.airportCode}-${theme.themeSlug}` ? (
                          <Loader size={14} className='animate-spin' />
                        ) : theme.isEnabled ? (
                          'Enabled'
                        ) : (
                          'Disabled'
                        )}
                      </button>
                    </div>
                    <div className='mt-3 space-y-2 text-xs text-slate-600'>
                      <p>
                        <strong className='font-medium text-slate-700'>Media:</strong> {theme.reelCount} / {theme.min} required (max {theme.max})
                      </p>
                      <p className='flex items-center gap-1'>
                        {theme.isReady ? (
                          <CheckCircle2 size={14} className='text-emerald-500' />
                        ) : (
                          <ShieldAlert size={14} className='text-amber-500' />
                        )}
                        {theme.isReady ? 'Ready to serve' : 'Needs additional media'}
                      </p>
                    </div>
                    <button
                      type='button'
                      onClick={() => {
                        setSelectedTab('media')
                        setFocusTheme(theme.themeSlug)
                        const paramsCopy = new URLSearchParams(searchParams)
                        paramsCopy.set('tab', 'media')
                        paramsCopy.set('theme', theme.themeSlug)
                        router.replace(`/admin/destinations/${destination.airportCode}?${paramsCopy.toString()}`, { scroll: false })
                      }}
                      className='mt-3 inline-flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-700'
                    >
                      Manage reels <ArrowUpRight size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          <div className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
            <div className='flex items-center justify-between'>
              <h2 className='text-lg font-semibold text-slate-900'>Activities by theme</h2>
              <button
                type='button'
                onClick={handleSaveActivities}
                disabled={activitiesSaving}
                className='inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50'
              >
                {activitiesSaving ? <Loader size={16} className='animate-spin' /> : <FileText size={16} />} Save activities
              </button>
            </div>
            <div className='mt-4 grid gap-4 md:grid-cols-2'>
              {['vibe', 'adventure', 'discover', 'indulge', 'nature'].map((theme) => (
                <label key={theme} className='space-y-2 text-sm'>
                  <span className='font-medium text-slate-700 capitalize'>{theme}</span>
                  <textarea
                    value={activitiesText[theme as DestinationThemeSlug] ?? ''}
                    onChange={(event) =>
                      setActivitiesText((prev) => ({
                        ...prev,
                        [theme]: event.target.value,
                      }))
                    }
                    rows={5}
                    placeholder='One activity per line'
                    className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'media' && (
        <div className='space-y-4'>
          <div className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
            <h2 className='text-lg font-semibold text-slate-900'>Media library</h2>
            <p className='mt-1 text-sm text-slate-600'>Add or curate reels per theme. Changes refresh readiness metrics automatically.</p>
          </div>
          {destination.themes.map((theme) => (
            <div
              key={theme.themeSlug}
              id={`media-${theme.themeSlug}`}
              className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${focusTheme === theme.themeSlug ? 'ring-2 ring-blue-300' : ''}`}
            >
              <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
                <div className='flex items-center gap-3'>
                  <span className='h-2.5 w-2.5 rounded-full' style={{ backgroundColor: getThemeColor(theme.themeSlug as ThemeKey) }} />
                  <div>
                    <h3 className='text-sm font-semibold text-slate-900 capitalize'>{theme.themeSlug}</h3>
                    <p className='text-xs text-slate-500'>
                      {theme.reelCount} reel(s) / min {theme.min} / max {theme.max}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-2 text-xs text-slate-500'>
                  {theme.isReady ? (
                    <span className='inline-flex items-center gap-1 text-emerald-600'>
                      <CheckCircle2 size={14} /> Ready
                    </span>
                  ) : (
                    <span className='inline-flex items-center gap-1 text-amber-600'>
                      <ShieldAlert size={14} /> Needs media
                    </span>
                  )}
                  <span>/</span>
                  <span>{theme.isEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
              <ReelList
                key={`${destination.airportCode}-${theme.themeSlug}-${focusTheme === theme.themeSlug ? 'focus' : 'default'}`}
                iata={destination.airportCode}
                themeSlug={theme.themeSlug}
                onChange={handleMediaChange}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}











