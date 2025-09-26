import React, { useCallback, useMemo, useEffect } from 'react'
import { Mountain, Trees, Sparkles, Music, Compass } from 'lucide-react'
import { ValidatedAirportSearch } from './ValidatedAirportSearch'
import { FlightTimeSlider } from './FlightTimeSlider'
import { TripTypeToggle } from './TripTypeToggle'
import { FormField, FormInput, FormSelect } from './ui/FormField'
import { useOptimizedSearch } from '@/hooks/useOptimizedSearch'
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring'
import { cn } from '@/lib/utils'
import {
  getThemeColor,
  getThemeHoverColor,
  getThemeColorAlpha,
  type ThemeKey,
} from '@/lib/theme'

interface Theme {
  id: string
  label: string
  background: string
  color: string
}

interface FormData {
  selectedTheme: string
  departureAirport: string
  destinationAirport?: string
  destinationAirportDetailed?: string
  departureDate: string
  returnDate?: string
  passengers: number
  tripType: 'one-way' | 'return'
  maxFlightTime?: number
  flightTimeRange?: [number, number]
  minFlightTime?: number
  maxFlightTimeRange?: number
  directFlightsOnly?: boolean
  cabinClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'
}

interface SearchFormProps {
  themes: Theme[]
  onSubmit: (data: FormData) => Promise<void>
  isLoading: boolean
}

const THEME_ICONS: Record<ThemeKey, typeof Mountain> = {
  adventure: Mountain,
  nature: Trees,
  indulge: Sparkles,
  vibe: Music,
  discover: Compass,
}

const THEME_SUBTEXT: Record<ThemeKey, string> = {
  adventure: 'Thrilling adventures with epic treks, canyons, and adrenaline charged escapes.',
  nature: 'Reset in lush forests, hidden lakes, and mindful outdoor sanctuaries.',
  indulge: 'Luxurious stays, spa rituals, and culinary journeys crafted for you.',
  vibe: 'Feel the pulse of nightlife, music discoveries, and social energy worldwide.',
  discover: 'Cultural deep-dives, local flavours, and stories from vibrant city streets.',
}

export const SearchForm = React.memo<SearchFormProps>(({ themes, onSubmit, isLoading }) => {
  usePerformanceMonitoring('SearchForm')

  const {
    handleSubmit,
    register,
    setValue,
    formValues,
    isValid,
    getFieldError,
    hasFieldError,
    cleanup,
  } = useOptimizedSearch()

  useEffect(() => cleanup, [cleanup])

  const handleFormSubmit = useCallback(async (data: FormData) => {
    await onSubmit(data)
  }, [onSubmit])

  const themeKey = (formValues.selectedTheme || themes[0]?.id || 'adventure') as ThemeKey
  const themeColor = getThemeColor(themeKey)
  const themeHover = getThemeHoverColor(themeKey)
  const themeSurface = getThemeColorAlpha(themeKey, 0.12)
  const themeSubtitle = THEME_SUBTEXT[themeKey] ?? 'Discover destinations tailored to your mood.'

  const { matchingCount, density } = useMemo(() => {
    return { matchingCount: null as number | null, density: [] as Array<{ hour: number; value: number }> }
  }, [
    formValues.flightTimeRange,
    formValues.maxFlightTime,
    formValues.directFlightsOnly,
    formValues.departureAirport,
    formValues.departureDate,
  ])

  const canSubmit = isValid && !isLoading

  return (
    <div className="relative flex h-full w-full">
      <div
        className="relative h-full w-full overflow-hidden rounded-[28px] border backdrop-blur-xl"
        style={{
          borderColor: `${themeColor}33`,
          boxShadow: `0 32px 64px rgba(0,0,0,0.45), 0 14px 32px rgba(0,0,0,0.35), 0 0 0 1px ${themeColor}1f`,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(150deg, rgba(11,15,18,0.92) 0%, rgba(11,15,18,0.86) 55%, rgba(11,15,18,0.82) 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background: `radial-gradient(115% 140% at 0% 0%, ${themeSurface} 0%, transparent 70%)`,
          }}
        />

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="relative z-10 flex h-full flex-col"
          role="search"
          aria-label="Travel search form"
        >
          <div className="flex-1 overflow-y-auto pr-1 md:overflow-visible md:pr-0">
            <div className="space-y-5 px-6 pt-6 pb-3 md:pb-5">
              <header className="space-y-3">
                                <div className="space-y-2">
                  <h2 className="text-[26px] font-semibold leading-tight text-white">What are you looking for?</h2>
                  <p className="text-sm text-white/70">{themeSubtitle}</p>
                </div>
              </header>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">Theme</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {themes.map((theme) => {
                    const key = (theme.id || 'adventure') as ThemeKey
                    const Icon = THEME_ICONS[key] ?? Mountain
                    const selected = formValues.selectedTheme === theme.id
                    const chipColor = getThemeColor(key)

                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setValue('selectedTheme', theme.id)}
                        className={cn(
                          'flex items-center gap-3 rounded-full border px-4 py-3 text-sm font-semibold transition-all duration-200 shadow-sm',
                          selected
                            ? 'text-slate-900 shadow-[0_18px_38px_rgba(0,0,0,0.45)]'
                            : 'text-white/80 border-white/15 bg-white/[0.05] hover:border-white/30 hover:text-white',
                        )}
                        style={selected ? { backgroundColor: chipColor, borderColor: chipColor } : undefined}
                        role="radio"
                        aria-checked={selected}
                        aria-label={`Select ${theme.label} theme`}
                      >
                        <Icon className={cn('h-5 w-5', selected ? 'text-slate-900/80' : 'text-white/70')} />
                        <span className="whitespace-nowrap">{theme.label}</span>
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="space-y-5">
                <TripTypeToggle
                  tripType={formValues.tripType}
                  onTripTypeChange={(tripType) => setValue('tripType', tripType)}
                  accentColor={themeColor}
                />

                <div className="grid gap-3 md:grid-cols-2">
                  <FormField
                    label="From"
                    htmlFor="departure-airport"
                    error={getFieldError('departureAirport')}
                    required
                    theme={formValues.selectedTheme}
                  >
                    <ValidatedAirportSearch
                      id="departure-airport"
                      value={formValues.departureAirport}
                      onChange={(code) => setValue('departureAirport', code)}
                      placeholder="Type city or airport"
                      showInlineChips={false}
                      />
                  </FormField>

                  <FormField
                    label="To (optional)"
                    htmlFor="destination-airport"
                    theme={formValues.selectedTheme}
                  >
                    <ValidatedAirportSearch
                      id="destination-airport"
                      value={formValues.destinationAirport || ''}
                      onChange={async (code) => {
                        setValue('destinationAirport', code as any)
                        if (code) {
                          try {
                            const res = await fetch('/api/amadeus/airport', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ code }),
                            })
                            const json = await res.json()
                            if (json.ok) {
                              const detailed = json.data?.detailedName || `${json.data?.address?.cityName || ''}${json.data?.name ? ' - ' + json.data?.name : ''}`
                              setValue('destinationAirportDetailed', detailed as any)
                            }
                          } catch {
                            // Ignore fetch silently for now
                          }
                        } else {
                          setValue('destinationAirportDetailed', '' as any)
                        }
                      }}
                      placeholder="Anywhere"
                      showInlineChips={false}
                      aria-label="Destination airport (optional)"
                      />
                  </FormField>

                  {formValues.destinationAirport && formValues.departureAirport === formValues.destinationAirport && (
                    <div className="md:col-span-2 text-xs text-yellow-300/80">
                      Origin and destination cannot be the same.
                    </div>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <FormField
                    label="Departure"
                    htmlFor="departure-date"
                    error={getFieldError('departureDate')}
                    required
                    theme={formValues.selectedTheme}
                  >
                    <FormInput
                      id="departure-date"
                      type="date"
                      {...register('departureDate')}
                      variant={hasFieldError('departureDate') ? 'error' : 'default'}
                      />
                  </FormField>

                  {formValues.tripType === 'return' ? (
                    <FormField
                      label="Return"
                      htmlFor="return-date"
                      error={getFieldError('returnDate')}
                      theme={formValues.selectedTheme}
                    >
                      <FormInput
                        id="return-date"
                        type="date"
                        {...register('returnDate')}
                        variant={hasFieldError('returnDate') ? 'error' : 'default'}
                        />
                    </FormField>
                  ) : null}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <FormField
                    label="Passengers"
                    htmlFor="passengers"
                    error={getFieldError('passengers')}
                    required
                    theme={formValues.selectedTheme}
                  >
                    <FormSelect
                      id="passengers"
                      {...register('passengers', { valueAsNumber: true })}
                      variant={hasFieldError('passengers') ? 'error' : 'default'}
                      >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'Passenger' : 'Passengers'}
                        </option>
                      ))}
                    </FormSelect>
                  </FormField>

                  <FormField
                    label="Cabin class"
                    htmlFor="cabin-class"
                    theme={formValues.selectedTheme}
                  >
                    <FormSelect
                      id="cabin-class"
                      value={formValues.cabinClass || 'ECONOMY'}
                      onChange={(event) => setValue('cabinClass', event.target.value as any)}
                      >
                      {['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'].map((option) => (
                        <option key={option} value={option}>
                          {option.replace('_', ' ')}
                        </option>
                      ))}
                    </FormSelect>
                  </FormField>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                      Flight duration
                    </span>
                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                      <input
                        type="checkbox"
                        checked={!!formValues.directFlightsOnly}
                        onChange={(event) => setValue('directFlightsOnly', event.target.checked as any)}
                        className="h-4 w-4 rounded border-white/25 bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)] focus:ring-offset-0"
                        />
                      Only direct flights
                    </label>
                  </div>

                  <FlightTimeSlider
                    mode="range"
                    rangeValue={formValues.flightTimeRange || [1, formValues.maxFlightTime || 8]}
                    onRangeChange={(range) => {
                      setValue('flightTimeRange', range)
                      setValue('minFlightTime', range[0])
                      setValue('maxFlightTimeRange', range[1])
                      setValue('maxFlightTime', range[1])
                    }}
                    min={0.5}
                    max={12}
                    step={0.5}
                    density={density}
                  />

                  {(getFieldError('flightTimeRange') || getFieldError('maxFlightTime')) && (
                    <div className="text-[11px] text-red-300">
                      {getFieldError('flightTimeRange') || getFieldError('maxFlightTime')}
                    </div>
                  )}

                  {matchingCount !== null ? (
                    <div className="text-[11px] uppercase tracking-[0.18em] text-white/50">
                      ~{matchingCount} matching destinations
                    </div>
                  ) : null}
                </div>
              </section>
            </div>
          </div>

          <div className="border-t border-white/10 px-6 pb-6 pt-4 space-y-3">
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                'flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold uppercase tracking-[0.28em]',
                'transition-all duration-200 shadow-[0_18px_48px_rgba(0,0,0,0.45)]',
                canSubmit ? 'text-slate-900 hover:brightness-110 active:scale-[0.99]' : 'cursor-not-allowed opacity-60 text-slate-200',
              )}
              style={{
                background: `linear-gradient(135deg, ${themeColor} 0%, ${themeHover} 100%)`,
              }}
              aria-label={isLoading ? 'Searching for flights' : 'Search for flights'}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-slate-900" aria-hidden="true" />
                  Searching...
                </>
              ) : (
                'Search flights'
              )}
            </button>

            <button
              type="button"
              className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60 transition-colors duration-200 hover:text-white"
            >
              Explore map
            </button>
          </div>
        </form>
      </div>
    </div>
  )
})

SearchForm.displayName = 'SearchForm'


