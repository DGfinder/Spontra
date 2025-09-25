import React, { useCallback, useMemo } from 'react'
import { ValidatedAirportSearch } from './ValidatedAirportSearch'
import { FlightTimeSlider } from './FlightTimeSlider'
import { VerticalThemeSelector } from './VerticalThemeSelector'
import { TripTypeToggle } from './TripTypeToggle'
import { FlightTimePresets } from './FlightTimePresets'
import { FormField, FormInput, FormSelect } from './ui/FormField'
import { useOptimizedSearch } from '@/hooks/useOptimizedSearch'
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring'
import { getThemeColor, getThemeHoverColor } from '@/lib/theme'
import { FORM_DESIGN_TOKENS } from '@/lib/formDesignTokens'

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

export const SearchForm = React.memo<SearchFormProps>(({ 
  themes, 
  onSubmit, 
  isLoading 
}) => {
  // Performance monitoring
  usePerformanceMonitoring('SearchForm')

  // Use optimized search hook instead of manual logic
  const {
    handleSubmit,
    register,
    setValue,
    formValues,
    errors,
    isValid,
    getFieldError,
    hasFieldError,
    handleOptimizedSubmit,
    cleanup
  } = useOptimizedSearch()

  // Memoized form submit handler
  const handleFormSubmit = useCallback(async (data: FormData) => {
    await onSubmit(data)
  }, [onSubmit])

  // Memoized destination count computation
  const { matchingCount, density } = useMemo(() => {
    // This will be handled by the optimized search hook
    // For now, return placeholder values since useOptimizedSearch doesn't expose these yet
    return { matchingCount: null, density: [] }
  }, [formValues.flightTimeRange, formValues.maxFlightTime, formValues.directFlightsOnly, formValues.departureAirport, formValues.departureDate])

  return (
    <div className="h-full grid grid-rows-[auto_1fr] font-muli">
      {/* Form Header */}
      <div className="mb-3 row-start-1 row-end-2">
        <h2 className="text-white font-bold mb-1 text-base">
          WHAT ARE YOU LOOKING FOR?
        </h2>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="row-start-2 row-end-3 grid grid-rows-[1fr_auto] h-full" role="search" aria-label="Travel search form">
        {/* Form Content (scrolls if needed) */}
        <div className={`row-start-1 row-end-2 flex flex-col ${FORM_DESIGN_TOKENS.sectionGap} overflow-y-auto no-scrollbar pr-1 pb-4`}>
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

          {/* Origin/Destination Layout - Responsive for desktop/tablet */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* From Airport */}
            <div className="flex-1">
              <FormField
                label="FROM"
                htmlFor="departure-airport"
                error={getFieldError('departureAirport')}
                required
                theme={formValues.selectedTheme}
              >
                <ValidatedAirportSearch
                  id="departure-airport"
                  value={formValues.departureAirport}
                  onChange={(code) => setValue('departureAirport', code)}
                  placeholder="Type city or airport name"
                  showInlineChips={false}
                />
              </FormField>
            </div>

            {/* To Airport - Optional destination for classic search */}
            <div className="flex-1">
              <FormField
                label="TO (optional)"
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
                        const res = await fetch('/api/amadeus/airport', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) })
                        const json = await res.json()
                        if (json.ok) {
                          const detailed = json.data?.detailedName || `${json.data?.address?.cityName || ''}${json.data?.name ? ' - ' + json.data?.name : ''}`
                          setValue('destinationAirportDetailed', detailed as any)
                        }
                      } catch {}
                    } else {
                      setValue('destinationAirportDetailed', '' as any)
                    }
                  }}
                  placeholder="Anywhere"
                  showInlineChips={false}
                  aria-label="Destination airport (optional)"
                />
              </FormField>
              
              {/* Inline validation hint when both airports are set to same code */}
              {formValues.destinationAirport && formValues.departureAirport === formValues.destinationAirport && (
                <div className={`${FORM_DESIGN_TOKENS.warningColor} text-xs mt-1`}>
                  Origin and destination cannot be the same.
                </div>
              )}
            </div>
        </div>

        {/* Dates */}
        <FormField
          label="DEPARTURE"
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

        {formValues.tripType === 'return' && (
          <FormField
            label="RETURN"
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
        )}

        {/* Passengers */}
        <FormField
          label="PASSENGERS"
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
            {[1,2,3,4,5,6,7,8].map(num => (
              <option key={num} value={num}>{num} {num === 1 ? 'Passenger' : 'Passengers'}</option>
            ))}
          </FormSelect>
        </FormField>

        {/* Cabin Class */}
        <FormField
          label="CABIN CLASS"
          htmlFor="cabin-class"
          theme={formValues.selectedTheme}
        >
          <FormSelect
            id="cabin-class"
            value={formValues.cabinClass || 'ECONOMY'}
            onChange={(e) => setValue('cabinClass', e.target.value as any)}
          >
            {['ECONOMY','PREMIUM_ECONOMY','BUSINESS','FIRST'].map(c => (
              <option key={c} value={c}>{c.replace('_',' ')}</option>
            ))}
          </FormSelect>
        </FormField>

          {/* Flight Time Presets + Direct Toggle */}
          <div className="flex items-center justify-between mb-1">
            <FlightTimePresets
              currentRange={formValues.flightTimeRange || [1, formValues.maxFlightTime || 8]}
              onPresetSelect={(range) => {
                setValue('flightTimeRange', range)
                setValue('minFlightTime', range[0])
                setValue('maxFlightTimeRange', range[1])
                setValue('maxFlightTime', range[1])
              }}
            />
            <label className="flex items-center gap-2 text-white text-sm font-muli">
              <input
                type="checkbox"
                checked={!!formValues.directFlightsOnly}
                onChange={(e) => setValue('directFlightsOnly', e.target.checked as any)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
        <div className="row-start-2 row-end-3 mt-4">
          <button
            type="submit"
            disabled={!isValid || isLoading}
            className={`w-full text-white font-bold rounded transition-all duration-200 shadow-lg flex items-center justify-center font-muli ${FORM_DESIGN_TOKENS.buttonHeight} ${FORM_DESIGN_TOKENS.buttonPadding}`}
            style={{
              backgroundColor: formValues.selectedTheme ? getThemeColor(formValues.selectedTheme as any) : '#f97316',
              fontSize: FORM_DESIGN_TOKENS.buttonFontSize.replace('text-', '').replace('px', '') + 'px'
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
})

SearchForm.displayName = 'SearchForm'