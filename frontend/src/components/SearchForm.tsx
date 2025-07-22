import { ValidatedAirportSearch } from './ValidatedAirportSearch'
import { FlightTimeSlider } from './FlightTimeSlider'
import { ThemeSelector } from './ThemeSelector'
import { TripTypeToggle } from './TripTypeToggle'
import { useSearchForm } from '@/hooks/useSearchForm'

interface Theme {
  id: string
  label: string
  icon: string
  background: string
  color: string
}

interface FormData {
  selectedTheme: string
  departureAirport: string
  departureDate: string
  returnDate: string
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
    <div className="p-4 md:p-6 h-full flex flex-col">
      {/* Form Header */}
      <div className="mb-4 md:mb-6 pt-12 md:pt-16">
        <h2 className="text-white text-base md:text-lg font-medium mb-1">
          WHERE ARE YOU LOOKING TO GO?
        </h2>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 flex flex-col">
        {/* Theme Selection */}
        <ThemeSelector
          themes={themes}
          selectedTheme={formValues.selectedTheme}
          onThemeSelect={(themeId) => setValue('selectedTheme', themeId)}
        />

        {/* Trip Type Toggle */}
        <TripTypeToggle
          tripType={formValues.tripType}
          onTripTypeChange={(tripType) => setValue('tripType', tripType)}
        />

        {/* From Airport */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-white/90" htmlFor="departure-airport">
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
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-white/90" htmlFor="destination">
            TO
          </label>
          <input
            id="destination"
            type="text"
            value="Anywhere"
            disabled
            className="w-full px-4 py-3 bg-white/20 text-white/60 rounded text-sm border-0"
            aria-label="Destination set to anywhere"
          />
        </div>

        {/* Dates */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-white/90" htmlFor="departure-date">
            DEPARTURE
          </label>
          <input
            id="departure-date"
            type="date"
            {...register('departureDate')}
            className={`w-full px-4 py-3 bg-white text-black rounded text-sm border-0 focus:ring-2 transition-colors ${
              hasFieldError('departureDate') 
                ? 'focus:ring-red-500 ring-1 ring-red-500' 
                : 'focus:ring-orange-500'
            }`}
          />
          {getFieldError('departureDate') && (
            <div className="text-red-400 text-xs mt-1">
              {getFieldError('departureDate')}
            </div>
          )}
        </div>

        {formValues.tripType === 'return' && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-white/90" htmlFor="return-date">
              RETURN
            </label>
            <input
              id="return-date"
              type="date"
              {...register('returnDate')}
              className={`w-full px-4 py-3 bg-white text-black rounded text-sm border-0 focus:ring-2 transition-colors ${
                hasFieldError('returnDate') 
                  ? 'focus:ring-red-500 ring-1 ring-red-500' 
                  : 'focus:ring-orange-500'
              }`}
            />
            {getFieldError('returnDate') && (
              <div className="text-red-400 text-xs mt-1">
                {getFieldError('returnDate')}
              </div>
            )}
          </div>
        )}

        {/* Passengers */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-white/90" htmlFor="passengers">
            PASSENGERS
          </label>
          <select
            id="passengers"
            {...register('passengers', { valueAsNumber: true })}
            className={`w-full px-4 py-3 bg-white text-black rounded text-sm border-0 focus:ring-2 transition-colors ${
              hasFieldError('passengers') 
                ? 'focus:ring-red-500 ring-1 ring-red-500' 
                : 'focus:ring-orange-500'
            }`}
          >
            {[1,2,3,4,5,6,7,8].map(num => (
              <option key={num} value={num}>{num} {num === 1 ? 'Passenger' : 'Passengers'}</option>
            ))}
          </select>
          {getFieldError('passengers') && (
            <div className="text-red-400 text-xs mt-1">
              {getFieldError('passengers')}
            </div>
          )}
        </div>

        {/* Flight Time Slider */}
        <div className="mb-6">
          <FlightTimeSlider
            value={formValues.maxFlightTime}
            onChange={(value) => setValue('maxFlightTime', value)}
            min={0}
            max={12}
            step={0.5}
          />
          {getFieldError('maxFlightTime') && (
            <div className="text-red-400 text-xs mt-1">
              {getFieldError('maxFlightTime')}
            </div>
          )}
        </div>

        {/* Search Button */}
        <div className="mt-auto">
          <button
            type="submit"
            disabled={!isValid || isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg text-sm transition-colors duration-200 shadow-lg flex items-center justify-center"
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