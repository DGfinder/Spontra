import React, { useCallback, useMemo, useEffect, useState, useRef } from 'react'
import { Mountain, Trees, Sparkles, Music, Compass, Users, ChevronDown, Minus, Plus } from 'lucide-react'
import { WorldClassAirportSearch } from './WorldClassAirportSearch'
import { FlightTimeSlider } from './FlightTimeSlider'
import { TripTypeToggle } from './TripTypeToggle'
import { FormField, FormInput } from './ui/FormField'
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

const CABIN_LABELS: Record<'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST', string> = {
  ECONOMY: 'Economy',
  PREMIUM_ECONOMY: 'Premium',
  BUSINESS: 'Business',
  FIRST: 'First',
}

export const SearchForm = React.memo<SearchFormProps>(({ themes, onSubmit, isLoading }) => {
  usePerformanceMonitoring('SearchForm')

  const [travelersOpen, setTravelersOpen] = useState(false)
  const travelersRef = useRef<HTMLDivElement | null>(null)

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

  useEffect(() => {
    if (!travelersOpen) return

    const handlePointer = (event: MouseEvent | TouchEvent) => {
      if (travelersRef.current && !travelersRef.current.contains(event.target as Node)) {
        setTravelersOpen(false)
      }
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setTravelersOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('touchstart', handlePointer)
    window.addEventListener('keydown', handleKey)

    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('touchstart', handlePointer)
      window.removeEventListener('keydown', handleKey)
    }
  }, [travelersOpen])

  const handleFormSubmit = useCallback(async (data: FormData) => {
    await onSubmit(data)
  }, [onSubmit])

  const themeKey = (formValues.selectedTheme || themes[0]?.id || 'adventure') as ThemeKey
  const themeColor = getThemeColor(themeKey)
  const themeHover = getThemeHoverColor(themeKey)
  const themeSurface = getThemeColorAlpha(themeKey, 0.12)

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
  const passengerCount = formValues.passengers && formValues.passengers > 0 ? formValues.passengers : 1
  const cabinSelection = (formValues.cabinClass || 'ECONOMY') as keyof typeof CABIN_LABELS
  const passengerLabel = passengerCount === 1 ? '1 passenger' : `${passengerCount} passengers`
  const travelerSummary = `${passengerLabel} - ${CABIN_LABELS[cabinSelection]}`
  const cabinOptions: Array<'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'> = ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']
  
  // Determine search mode and button text
  const isDirectSearch = formValues.destinationAirport && formValues.destinationAirport !== formValues.departureAirport
  const submitButtonText = isDirectSearch ? 'Search flights' : 'Explore destinations'

  const adjustPassengers = (delta: number) => {
    const next = Math.min(8, Math.max(1, passengerCount + delta))
    setValue('passengers', next as any)
  }

  const handleCabinSelection = (option: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST') => {
    setValue('cabinClass', option as any)
  }


  return (
    <div className="relative flex w-full">
      <div
        className="relative w-full overflow-hidden rounded-[28px] border backdrop-blur-xl"
        style={{
          borderColor: 'rgba(255,255,255,0.08)',
          boxShadow: '0 28px 48px rgba(0,0,0,0.45), 0 12px 28px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04)',
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
          className="relative z-10 flex flex-col"
          role="search"
          aria-label="Travel search form"
        >
          <div>
            <div className="space-y-6 px-7 pt-7 pb-4 md:pb-6">
              <header className="space-y-2">
                <h2 className="text-[26px] font-semibold leading-tight text-white">What are you looking for?</h2>
              </header>

              <section className="space-y-3">
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
                          'flex items-center gap-2.5 rounded-full px-4 py-2.5 text-[13px] font-semibold tracking-wide transition-all duration-300 ease-out',
                          selected
                            ? 'text-black shadow-lg scale-105'
                            : 'text-white/80 hover:text-white hover:scale-[1.03]',
                        )}
                        style={selected
                          ? {
                              backgroundColor: chipColor,
                              boxShadow: `0 4px 20px ${chipColor}66`,
                              border: 'none',
                            }
                          : {
                              background: 'rgba(255,255,255,0.07)',
                              border: '1px solid rgba(255,255,255,0.15)',
                              backdropFilter: 'blur(8px)',
                            }
                        }
                        role="radio"
                        aria-checked={selected}
                        aria-label={`Select ${theme.label} theme`}
                      >
                        <Icon
                          className="h-4 w-4 shrink-0"
                          style={{ color: selected ? 'rgba(0,0,0,0.65)' : chipColor }}
                        />
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
                    <WorldClassAirportSearch
                      id="departure-airport"
                      value={formValues.departureAirport}
                      onChange={(code) => setValue('departureAirport', code)}
                      placeholder="Search departure airport or city"
                      required
                      showRecentAirports={true}
                      showPopularDestinations={true}
                      groupMultiAirportCities={true}
                      className="text-sm"
                    />
                  </FormField>

                  <FormField
                    label="To (optional)"
                    htmlFor="destination-airport"
                    theme={formValues.selectedTheme}
                  >
                    <WorldClassAirportSearch
                      id="destination-airport"
                      value={formValues.destinationAirport || ''}
                      onChange={async (code, airport) => {
                        setValue('destinationAirport', code as any)
                        if (code && airport) {
                          // Use airport data from the new component for better performance
                          const detailed = `${airport.city}${airport.name ? ' - ' + airport.name : ''}`
                          setValue('destinationAirportDetailed', detailed as any)
                        } else if (code) {
                          // Fallback for legacy compatibility
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
                      placeholder="Anywhere (optional specific destination)"
                      showRecentAirports={true}
                      showPopularDestinations={true}
                      groupMultiAirportCities={true}
                      className="text-sm"
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

                <FormField
                  label="Travelers"
                  htmlFor="travelers"
                  theme={formValues.selectedTheme}
                >
                  <div ref={travelersRef} className="relative">
                    <button
                      id="travelers"
                      type="button"
                      onClick={() => setTravelersOpen((prev) => !prev)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-all duration-200',
                        travelersOpen
                          ? 'border-[#f6c96f] bg-white/[0.08] text-white'
                          : 'border-white/12 bg-white/[0.04] text-white/80 hover:border-white/25 hover:text-white',
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-white/70" aria-hidden="true" />
                        <span>{travelerSummary}</span>
                      </span>
                      <ChevronDown
                        aria-hidden="true"
                        className={cn('h-4 w-4 text-white/60 transition-transform', travelersOpen && 'rotate-180')}
                      />
                    </button>

                    {travelersOpen ? (
                      <div className="absolute left-0 right-0 mt-3 space-y-4 rounded-2xl border border-white/10 bg-[#0b0f12]/95 p-4 shadow-[0_20px_45px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Passengers</span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => adjustPassengers(-1)}
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-40"
                              disabled={passengerCount <= 1}
                              aria-label="Decrease passengers"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="text-sm font-semibold text-white">{passengerCount}</span>
                            <button
                              type="button"
                              onClick={() => adjustPassengers(1)}
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-40"
                              disabled={passengerCount >= 8}
                              aria-label="Increase passengers"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Cabin class</span>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {cabinOptions.map((option) => {
                              const selected = cabinSelection === option
                              return (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() => handleCabinSelection(option)}
                                  className={cn(
                                    'rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-200',
                                    selected
                                      ? 'border-[#f6c96f] bg-[#f6c96f] text-slate-900 shadow-[0_12px_30px_rgba(0,0,0,0.4)]'
                                      : 'border-white/12 bg-white/[0.05] text-white/70 hover:border-white/25 hover:text-white',
                                  )}
                                >
                                  {CABIN_LABELS[option]}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </FormField>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                      Flight duration
                    </span>
                    
                    {/* Direct only — advanced option, hidden from main form */}
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
                canSubmit ? 'text-slate-900 hover:brightness-110 active:scale-[0.99]' : 'text-slate-900 opacity-75 hover:brightness-110',
              )}
              style={{
                background: `linear-gradient(135deg, ${themeColor} 0%, ${themeHover} 100%)`,
              }}
              aria-label={isLoading ? 'Searching...' : submitButtonText}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-slate-900" aria-hidden="true" />
                  Searching...
                </>
              ) : (
                submitButtonText
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


