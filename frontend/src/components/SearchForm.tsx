import { ValidatedAirportSearch } from './ValidatedAirportSearch'
import { FlightTimeSlider } from './FlightTimeSlider'
import { VerticalThemeSelector } from './VerticalThemeSelector'
import { TripTypeToggle } from './TripTypeToggle'
import { useEffect, useState } from 'react'
import { useSearchForm } from '@/hooks/useSearchForm'
import { getThemeColor, getThemeHoverColor } from '@/lib/theme'

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
  departureDate: string
  returnDate?: string
  passengers: number
  tripType: 'one-way' | 'return'
  maxFlightTime?: number // For backward compatibility
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

export function SearchForm({ 
  themes, 
  onSubmit, 
  isLoading 
}: SearchFormProps) {
  const {
    handleSubmit,
    register,
    setValue,
    formValues,
    errors,
    isValid,
    getFieldError,
    hasFieldError
  } = useSearchForm()

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit(data)
  }

  // Debounced matching count via server route (and density overlay)
  const [matchingCount, setMatchingCount] = useState<number | null>(null)
  const [density, setDensity] = useState<{ hour: number; value: number }[]>([])
  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      const [minH, maxH] = formValues.flightTimeRange || [1, formValues.maxFlightTime || 8]
      try {
        // Compose ETag key to use If-None-Match client-side as well
        const slot = Math.floor(Date.now() / (2 * 60 * 1000))
        const etagKey = `${formValues.departureAirport}|${formValues.departureDate}|${formValues.directFlightsOnly ? '1' : '0'}|${Math.round(minH*2)/2}|${Math.round(maxH*2)/2}|${slot}`
        const res = await fetch('/api/amadeus/destinations/count', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin: formValues.departureAirport,
            minFlightTime: minH,
            maxFlightTime: maxH,
            departureDate: formValues.departureDate,
            nonStop: !!formValues.directFlightsOnly
          }),
          signal: controller.signal,
        })
        const json = await res.json()
        if (res.status === 304) {
          // No change; keep existing state
          return
        }
        if (json.ok) {
          setMatchingCount(json.data.count)
          const hist = json.data.histogram as Array<{ hour: number; count: number }>
          if (Array.isArray(hist) && hist.length > 0) {
            const maxCount = Math.max(...hist.map(h => h.count)) || 1
            setDensity(hist.map(h => ({ hour: h.hour, value: Math.min(1, h.count / maxCount) })))
          } else {
            setDensity([])
          }
        } else {
          setMatchingCount(null)
        }
      } catch {
        setMatchingCount(null)
      }
    }, 250)
    return () => { clearTimeout(timer); controller.abort() }
  }, [formValues.flightTimeRange, formValues.maxFlightTime, formValues.directFlightsOnly, formValues.departureAirport, formValues.departureDate])

  return (
    <div className="h-full grid grid-rows-[auto_1fr] font-muli">
      {/* Form Header */}
      <div className="mb-2 row-start-1 row-end-2">
        <h2 className="text-white font-bold mb-1" style={{ fontSize: '16px' }}>
          WHAT ARE YOU LOOKING FOR?
        </h2>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="row-start-2 row-end-3 grid grid-rows-[1fr_auto] h-full" role="search" aria-label="Travel search form">
        {/* Form Content (scrolls if needed) */}
        <div className="row-start-1 row-end-2 flex flex-col gap-2 overflow-y-auto no-scrollbar pr-1">
          {/* Theme Selection */}
          <VerticalThemeSelector
            themes={themes}
            selectedTheme={formValues.selectedTheme}
            onThemeSelect={(themeId) => setValue('selectedTheme', themeId)}
          />

        {/* Trip Type Toggle */}
        <TripTypeToggle
          tripType={formValues.tripType}
          onTripTypeChange={(tripType) => setValue('tripType', tripType)}
        />

          {/* Origin/Destination Layout - Two columns on desktop, stacked on mobile */
          }
        <div className="flex flex-col sm:flex-row gap-2">
          {/* From Airport */}
          <div className="flex-1">
            <label className="block text-white/90 mb-2 font-muli" style={{ fontSize: '12px' }} htmlFor="departure-airport">
              FROM
            </label>
            <ValidatedAirportSearch
              value={formValues.departureAirport}
              onChange={(code) => setValue('departureAirport', code)}
              placeholder="Type city or airport name"
              error={getFieldError('departureAirport')}
              required
              aria-describedby={hasFieldError('departureAirport') ? 'departure-airport-error' : undefined}
            />
            {hasFieldError('departureAirport') && (
              <div id="departure-airport-error" role="alert" className="text-red-400 text-xs mt-1">
                {getFieldError('departureAirport')}
              </div>
            )}
          </div>

          {/* To Airport - Optional destination for classic search */}
          <div className="flex-1">
            <label className="block text-white/90 mb-2 font-muli" style={{ fontSize: '12px' }} htmlFor="destination-airport">
              TO (optional)
            </label>
            <ValidatedAirportSearch
              value={formValues.destinationAirport || ''}
              onChange={(code) => setValue('destinationAirport', code as any)}
              placeholder="Anywhere"
              aria-label="Destination airport (optional)"
            />
            {/* Inline validation hint when both airports are set to same code */}
            {formValues.destinationAirport && formValues.departureAirport === formValues.destinationAirport && (
              <div className="text-yellow-300 text-[10px] mt-1">Origin and destination cannot be the same.</div>
            )}
          </div>
        </div>

        {/* Dates */}
        <div>
          <label className="block text-white/90 mb-2 font-muli" style={{ fontSize: '12px' }} htmlFor="departure-date">
            DEPARTURE
          </label>
          <input
            id="departure-date"
            type="date"
            {...register('departureDate')}
            className={`w-full bg-white text-black rounded border-0 font-muli transition-colors ${
              hasFieldError('departureDate') 
                ? 'ring-1 ring-red-500' 
                : ''
            }`}
            style={{ 
              height: '32px',
              fontSize: '11px',
              padding: '0 8px'
            }}
          />
          {getFieldError('departureDate') && (
            <div className="text-red-400 mt-1" style={{ fontSize: '10px' }}>
              {getFieldError('departureDate')}
            </div>
          )}
        </div>

        {formValues.tripType === 'return' && (
          <div>
            <label className="block text-white/90 mb-2 font-muli" style={{ fontSize: '12px' }} htmlFor="return-date">
              RETURN
            </label>
            <input
              id="return-date"
              type="date"
              {...register('returnDate')}
              className={`w-full bg-white text-black rounded border-0 font-muli transition-colors ${
                hasFieldError('returnDate') 
                  ? 'ring-1 ring-red-500' 
                  : ''
              }`}
              style={{ 
                height: '32px',
                fontSize: '11px',
                padding: '0 8px'
              }}
            />
            {getFieldError('returnDate') && (
              <div className="text-red-400 mt-1" style={{ fontSize: '10px' }}>
                {getFieldError('returnDate')}
              </div>
            )}
          </div>
        )}

        {/* Passengers */}
        <div>
          <label className="block text-white/90 mb-2 font-muli" style={{ fontSize: '12px' }} htmlFor="passengers">
            PASSENGERS
          </label>
          <select
            id="passengers"
            {...register('passengers', { valueAsNumber: true })}
            className={`w-full bg-white text-black rounded border-0 font-muli transition-colors ${
              hasFieldError('passengers') 
                ? 'ring-1 ring-red-500' 
                : ''
            }`}
            style={{ 
              height: '32px',
              fontSize: '11px',
              padding: '0 8px'
            }}
          >
            {[1,2,3,4,5,6,7,8].map(num => (
              <option key={num} value={num}>{num} {num === 1 ? 'Passenger' : 'Passengers'}</option>
            ))}
          </select>
          {getFieldError('passengers') && (
            <div className="text-red-400 mt-1" style={{ fontSize: '10px' }}>
              {getFieldError('passengers')}
            </div>
          )}
        </div>

        {/* Cabin Class */}
        <div>
          <label className="block text-white/90 mb-2 font-muli" style={{ fontSize: '12px' }} htmlFor="cabin-class">
            CABIN CLASS
          </label>
          <select
            id="cabin-class"
            value={formValues.cabinClass || 'ECONOMY'}
            onChange={(e) => setValue('cabinClass', e.target.value as any)}
            className="w-full bg-white text-black rounded border-0 font-muli"
            style={{ height: '32px', fontSize: '11px', padding: '0 8px' }}
          >
            {['ECONOMY','PREMIUM_ECONOMY','BUSINESS','FIRST'].map(c => (
              <option key={c} value={c}>{c.replace('_',' ')}</option>
            ))}
          </select>
        </div>

          {/* Flight Time Presets + Direct Toggle */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex flex-wrap gap-1">
              {[
                { label: 'Short', range: [0.5, 2] as [number, number] },
                { label: 'Weekend', range: [1, 4] as [number, number] },
                { label: 'Medium', range: [2, 6] as [number, number] },
                { label: 'Long', range: [6, 12] as [number, number] },
                { label: 'Any', range: [0.5, 12] as [number, number] },
              ].map((preset) => {
                const isActive = (formValues.flightTimeRange?.[0] ?? 1) === preset.range[0] && (formValues.flightTimeRange?.[1] ?? (formValues.maxFlightTime || 8)) === preset.range[1]
                return (
                  <button
                    key={preset.label}
                    type="button"
                    className={`px-2 py-0.5 rounded text-[10px] font-muli ${isActive ? 'bg-white text-black' : 'bg-white/20 text-white'} transition-colors`}
                    onClick={() => {
                      setValue('flightTimeRange', preset.range)
                      setValue('minFlightTime', preset.range[0])
                      setValue('maxFlightTimeRange', preset.range[1])
                      setValue('maxFlightTime', preset.range[1])
                    }}
                    aria-pressed={isActive}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
            <label className="flex items-center gap-2 text-white text-[11px] font-muli">
              <input
                type="checkbox"
                checked={!!formValues.directFlightsOnly}
                onChange={(e) => setValue('directFlightsOnly', e.target.checked as any)}
              />
              Only direct
            </label>
          </div>

          {/* Flight Time Slider */}
          <div>
            <FlightTimeSlider
              mode="range"
              rangeValue={formValues.flightTimeRange || [1, formValues.maxFlightTime || 8]}
              onRangeChange={(range) => {
                setValue('flightTimeRange', range)
                setValue('minFlightTime', range[0])
                setValue('maxFlightTimeRange', range[1])
                // Keep backward compatibility
                setValue('maxFlightTime', range[1])
              }}
              min={0.5}
              max={12}
              step={0.5}
              density={density}
            />
            {(getFieldError('flightTimeRange') || getFieldError('maxFlightTime')) && (
              <div className="text-red-400 mt-1" style={{ fontSize: '10px' }}>
                {getFieldError('flightTimeRange') || getFieldError('maxFlightTime')}
              </div>
            )}

            {/* Matching destinations count */}
            {matchingCount !== null && (
              <div className="mt-1 text-white/80 text-[11px] font-muli">
                ~{matchingCount} matching destinations
              </div>
            )}
          </div>
        </div>

        {/* Search Button (always visible) */}
        <div className="row-start-2 row-end-3 mt-3">
          <button
            type="submit"
            disabled={!isValid || isLoading}
            className="w-full text-white font-bold rounded transition-all duration-200 shadow-lg flex items-center justify-center font-muli"
            style={{
              backgroundColor: formValues.selectedTheme ? getThemeColor(formValues.selectedTheme as any) : '#f97316',
              height: '44px',
              fontSize: '18px'
            }}
            onMouseEnter={(e) => {
              if (formValues.selectedTheme && !isLoading && isValid) {
                e.currentTarget.style.backgroundColor = getThemeHoverColor(formValues.selectedTheme as any)
              }
            }}
            onMouseLeave={(e) => {
              if (formValues.selectedTheme) {
                e.currentTarget.style.backgroundColor = getThemeColor(formValues.selectedTheme as any)
              }
            }}
            aria-label={isLoading ? 'Searching for flights' : 'Search for flights'}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" aria-hidden="true"></div>
                SEARCHING...
              </>
            ) : (
              'SEARCH FLIGHTS'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}