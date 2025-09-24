'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader, MapPin, ArrowLeft, CheckCircle, XCircle } from 'lucide-react'

import { AirportSearch, AirportSearchResult } from '@/components/AirportSearch'
import { DestinationThemeSlug } from '@/components/admin/AddReelDialog'\nimport { normaliseMediaUrls } from '@/lib/mediaValidation'

const THEME_ORDER: DestinationThemeSlug[] = ['vibe', 'adventure', 'discover', 'indulge', 'nature']

function parseUrls(input: string) {
  return input
    .split(/\r?\n|,|\s/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
}

export default function AddDestinationPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedAirport, setSelectedAirport] = useState<AirportSearchResult | null>(null)
  const [iataCode, setIataCode] = useState('')
  const [cityName, setCityName] = useState('')
  const [countryName, setCountryName] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [description, setDescription] = useState('')
  const [heroImage, setHeroImage] = useState('')
  const [highlightsText, setHighlightsText] = useState('')
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enabledThemeList = useMemo(() => THEME_ORDER.filter((theme) => enabledThemes[theme]), [enabledThemes])

  const canContinueStep1 = iataCode.length === 3 && cityName && countryName
  const canContinueStep2 = enabledThemeList.length > 0

  const handleAirportSelect = (airport: AirportSearchResult) => {
    setSelectedAirport(airport)
    setIataCode((airport.code || '').toUpperCase())
    setCityName(airport.city || '')
    setCountryName(airport.country || '')
    setCountryCode((airport.countryCode || '').toUpperCase())
  }

  const handleSubmit = async () => {
    setError(null)

    for (const theme of enabledThemeList) {
      const parsed = parseUrls(themeUrls[theme])
      if (parsed.length < 5 || parsed.length > 10) {
        setError(`Theme ${theme} requires between 5 and 10 URLs. Currently ${parsed.length}.`)
        setCurrentStep(3)
        return
      }
      const validation = normaliseMediaUrls(parsed)
      if (!validation.ok) {
        setError(`Theme ${theme}: ${validation.error}`)
        setCurrentStep(3)
        return
      }
    }

    setIsSubmitting(true)
    try {
      if (description || heroImage || highlightsText) {
        await fetch('/api/admin/destinations/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            airport_code: iataCode,
            city: cityName,
            country: countryName,
            country_code: countryCode,
            description: description || undefined,
            hero_image: heroImage || undefined,
            highlights: highlightsText
              .split(/\r?\n/)
              .map((line) => line.trim())
              .filter(Boolean),
          }),
        })
      }

      for (const theme of enabledThemeList) {
        const urls = parseUrls(themeUrls[theme])
        const validation = normaliseMediaUrls(urls)
        if (!validation.ok) {
          throw new Error(`Theme ${theme}: ${validation.error}`)
        }

        const reelsResponse = await fetch(`/api/admin/destinations/${encodeURIComponent(iataCode)}/themes/${theme}/reels`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: validation.urls }),
        })
        if (!reelsResponse.ok) {
          const data = await reelsResponse.json().catch(() => ({}))
          throw new Error(data?.error || `Failed to create reels for ${theme}`)
        }

        const patchResponse = await fetch(`/api/admin/destinations/${encodeURIComponent(iataCode)}/themes/${theme}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isEnabled: true, min: 5, max: 10 }),
        })
        if (!patchResponse.ok) {
          const data = await patchResponse.json().catch(() => ({}))
          throw new Error(data?.error || `Failed to enable ${theme}`)
        }
      }

      router.push(`/admin/destinations/${iataCode}?tab=media`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create destination')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <ArrowLeft className="cursor-pointer" size={18} onClick={() => router.push('/admin/destinations/manage')} />
        <span>Add Destination</span>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Reels-first destination setup</h1>
          <p className="text-sm text-gray-600">Select a city, enable themes, and paste 5–10 media URLs per theme.</p>
        </div>

        <div className="px-6 py-5 space-y-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    step === currentStep
                      ? 'bg-blue-600 text-white'
                      : step < currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step < currentStep ? <CheckCircle size={16} /> : step}
                </div>
                {step < 3 && <div className="h-0.5 w-16 bg-gray-200" />}
              </div>
            ))}
          </div>

          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Search city or airport</label>
                <AirportSearch
                  value={iataCode}
                  onChange={(value) => setIataCode(value.toUpperCase())}
                  onSelect={handleAirportSelect}
                  placeholder="Start typing a city or airport name"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">City</label>
                  <input
                    value={cityName}
                    onChange={(event) => setCityName(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Country</label>
                  <input
                    value={countryName}
                    onChange={(event) => setCountryName(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Country code</label>
                  <input
                    value={countryCode}
                    onChange={(event) => setCountryCode(event.target.value.toUpperCase())}
                    maxLength={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              <div className="space-y-4 border-t border-gray-200 pt-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Hero image URL</label>
                  <input
                    value={heroImage}
                    onChange={(event) => setHeroImage(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="https://cdn.spontra.com/media/..."
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Highlights (one per line)</label>
                  <textarea
                    value={highlightsText}
                    onChange={(event) => setHighlightsText(event.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!canContinueStep1}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
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

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Select at least one theme to curate.</span>
                <div className="space-x-2">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    disabled={!canContinueStep2}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
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
                      rows={6}
                      placeholder={`Paste 5-10 media URLs for ${theme}`}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                )
              })}

              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" /> Minimum 5, maximum 10 URLs per theme.
                </div>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={() => router.push('/admin/destinations/manage')}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={currentStep !== 3 || isSubmitting}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? <Loader className="mr-2 animate-spin" size={16} /> : null}
            {isSubmitting ? 'Creating…' : 'Create destination'}
          </button>
        </div>
      </div>
    </div>
  )
}

