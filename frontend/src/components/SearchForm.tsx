import { ValidatedAirportSearch } from './ValidatedAirportSearch'
import { FlightTimeSlider } from './FlightTimeSlider'
import { VerticalThemeSelector } from './VerticalThemeSelector'
import { TripTypeToggle } from './TripTypeToggle'
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
  departureDate: string
  returnDate?: string
  passengers: number
  tripType: 'one-way' | 'return'
  maxFlightTime: number
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

  return (
    <div className="h-full flex flex-col font-muli min-h-0">
      {/* Form Header */}
      <div className="mb-4 sm:mb-6 flex-shrink-0">
        <h2 className="text-white font-bold mb-1" style={{ fontSize: '18px' }}>
          WHAT ARE YOU LOOKING FOR?
        </h2>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 flex flex-col gap-3 sm:gap-4 min-h-0">
        {/* Form Content - Scrollable */}
        <div className="flex-1 flex flex-col gap-3 sm:gap-4 overflow-y-auto min-h-0">
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

        {/* Origin/Destination Layout - Two columns on desktop, stacked on mobile */}
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
            />
          </div>

          {/* To Airport - Disabled */}
          <div className="flex-1">
            <label className="block text-white/90 mb-2 font-muli" style={{ fontSize: '12px' }} htmlFor="destination">
              TO
            </label>
            <input
              id="destination"
              type="text"
              value="Anywhere"
              disabled
              className="w-full bg-white/20 text-white/60 rounded border-0 font-muli"
              style={{ 
                height: '32px',
                fontSize: '11px',
                padding: '0 8px'
              }}
              aria-label="Destination set to anywhere"
            />
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

          {/* Flight Time Slider */}
          <div>
            <FlightTimeSlider
              value={formValues.maxFlightTime}
              onChange={(value) => setValue('maxFlightTime', value)}
              min={0}
              max={12}
              step={0.5}
            />
            {getFieldError('maxFlightTime') && (
              <div className="text-red-400 mt-1" style={{ fontSize: '10px' }}>
                {getFieldError('maxFlightTime')}
              </div>
            )}
          </div>
        </div>

        {/* Search Button - Fixed at bottom */}
        <div className="flex-shrink-0 mt-4">
          <button
            type="submit"
            disabled={!isValid || isLoading}
            className="w-full text-white font-bold rounded transition-all duration-200 shadow-lg flex items-center justify-center font-muli"
            style={{
              backgroundColor: formValues.selectedTheme ? getThemeColor(formValues.selectedTheme as any) : '#f97316',
              height: '40px',
              fontSize: '18.325px'
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