'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader, ArrowLeft, CheckCircle } from 'lucide-react'

import { AirportSearch, AirportSearchResult } from '@/components/AirportSearch'
import { DestinationThemeSlug } from '@/components/admin/AddReelDialog'
import { normaliseMediaUrls } from '@/lib/mediaValidation'

const THEME_ORDER: DestinationThemeSlug[] = ['vibe', 'adventure', 'discover', 'indulge', 'nature']

function parseUrls(input: string) {
  return input
    .split(/\r?\n|,|\s/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
}

export default function QuickAddDestinationPage() {
  const router = useRouter()
  const [selectedAirport, setSelectedAirport] = useState<AirportSearchResult | null>(null)
  const [iata, setIata] = useState('')
  const [enabledThemes, setEnabledThemes] = useState<Record<DestinationThemeSlug, boolean>>({
    vibe: false,
    adventure: false,
    discover: false,
    indulge: false,
    nature: false,
  })
  const [themeUrls, setThemeUrls] = useState<Record<DestinationThemeSlug, string>>({
    vibe: '',
    adventure: '',
    discover: '',
    indulge: '',
    nature: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const enabledThemeList = useMemo(() => THEME_ORDER.filter((theme) => enabledThemes[theme]), [enabledThemes])

  const handleAirportSelect = (airport: AirportSearchResult) => {
    setSelectedAirport(airport)
    setIata((airport.code || '').toUpperCase())
  }

  const handleSubmit = async () => {
    setError(null)

    if (iata.length !== 3) {
      setError('Select a valid IATA code.')
      return
    }

    if (enabledThemeList.length === 0) {
      setError('Enable at least one theme.')
      return
    }

    for (const theme of enabledThemeList) {
      const parsed = parseUrls(themeUrls[theme])
      if (parsed.length < 5 || parsed.length > 10) {
        setError(`Theme ${theme} requires between 5 and 10 URLs.`)
        return
      }
      const validation = normaliseMediaUrls(parsed)
      if (!validation.ok) {
        setError(`Theme ${theme}: ${validation.error}`)
        return
      }
    }

    setIsSubmitting(true)
    try {
      for (const theme of enabledThemeList) {
        const validation = normaliseMediaUrls(parseUrls(themeUrls[theme]))
        if (!validation.ok) {
          throw new Error(validation.error)
        }

        const reelsResponse = await fetch(`/api/admin/destinations/${encodeURIComponent(iata)}/themes/${theme}/reels`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: validation.urls }),
        })
        if (!reelsResponse.ok) {
          const data = await reelsResponse.json().catch(() => ({}))
          throw new Error(data?.error || `Failed to create reels for ${theme}`)
        }

        const patchResponse = await fetch(`/api/admin/destinations/${encodeURIComponent(iata)}/themes/${theme}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isEnabled: true, min: 5, max: 10 }),
        })
        if (!patchResponse.ok) {
          const data = await patchResponse.json().catch(() => ({}))
          throw new Error(data?.error || `Failed to enable theme ${theme}`)
        }
      }

      router.push(`/admin/destinations/${iata}?tab=media`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create destination')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <button
        onClick={() => router.push('/admin/destinations/manage')}
        className="inline-flex items-center gap-2 text-sm text-gray-600"
      >
        <ArrowLeft size={16} /> Back to manage
      </button>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Quick theme whitelisting</h1>
          <p className="text-sm text-gray-600">Enable curated themes for an airport by pasting 5–10 media URLs.</p>
        </div>

        <div className="px-6 py-5 space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Select airport</label>
            <AirportSearch
              value={iata}
              onChange={(value) => setIata(value.toUpperCase())}
              onSelect={handleAirportSelect}
              placeholder="Search by city or airport"
            />
            {selectedAirport && (
              <div className="mt-2 text-sm text-gray-600">
                Selected: {selectedAirport.city} ({selectedAirport.code}) – {selectedAirport.country}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Themes</label>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {THEME_ORDER.map((theme) => (
                <label
                  key={theme}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors ${
                    enabledThemes[theme]
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700'
                  }`}
                >
                  <span className="font-medium capitalize">{theme}</span>
                  <input
                    type="checkbox"
                    checked={enabledThemes[theme]}
                    onChange={(event) =>
                      setEnabledThemes((prev) => ({
                        ...prev,
                        [theme]: event.target.checked,
                      }))
                    }
                  />
                </label>
              ))}
            </div>
          </div>

          {enabledThemeList.map((theme) => {
            const urls = parseUrls(themeUrls[theme])
            const status = urls.length >= 5 && urls.length <= 10
            return (
              <div key={theme} className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                  <span className="capitalize">{theme}</span>
                  <span className={status ? 'text-green-600' : 'text-amber-600'}>
                    {urls.length} URL(s) detected
                  </span>
                </div>
                <textarea
                  value={themeUrls[theme]}
                  onChange={(event) =>
                    setThemeUrls((prev) => ({
                      ...prev,
                      [theme]: event.target.value,
                    }))
                  }
                  rows={5}
                  placeholder={`Paste 5-10 URLs for ${theme}`}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            )
          })}

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" /> Each theme must have 5–10 active reels.
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? <Loader className="mr-2 animate-spin" size={16} /> : null}
              {isSubmitting ? 'Saving…' : 'Save theme setup'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

