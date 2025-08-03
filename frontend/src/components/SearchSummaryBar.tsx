import { getThemeColor, THEME_COLORS } from '@/lib/theme'
import { SearchSummaryData, FormattedSearchSummary } from '@/types/searchSummary'

interface SearchSummaryBarProps {
  searchData: SearchSummaryData
}

export function SearchSummaryBar({ searchData }: SearchSummaryBarProps) {
  // Format the search data for display
  const formatSearchSummary = (data: SearchSummaryData): FormattedSearchSummary => {
    const themeEntry = Object.entries(THEME_COLORS).find(([key]) => key === data.selectedTheme)
    const themeName = themeEntry ? themeEntry[1].name : data.selectedTheme
    const themeColor = getThemeColor(data.selectedTheme as any)

    // Format dates
    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      }).replace(/\//g, '/')
    }

    // Format flight time info
    const formatFlightTime = () => {
      if (data.flightTimeRange) {
        const [min, max] = data.flightTimeRange
        return `${min}h - ${max}h flight time`
      } else if (data.minFlightTime && data.maxFlightTimeRange) {
        return `${data.minFlightTime}h - ${data.maxFlightTimeRange}h flight time`
      } else if (data.maxFlightTime) {
        return `Up to ${data.maxFlightTime}h flight time`
      }
      return '1h - 8h flight time' // fallback
    }

    const departureFormatted = formatDate(data.departureDate)
    const dateRange = data.tripType === 'return' && data.returnDate
      ? `Departure Date: ${departureFormatted} Return Date: ${formatDate(data.returnDate)}`
      : `Departure Date: ${departureFormatted}`

    const flightTimeDisplay = formatFlightTime()

    return {
      themeDisplay: themeName,
      themeColor,
      originInfo: `Origin: ${data.departureAirport} Ideal travel Time: ${flightTimeDisplay.replace(' flight time', 'h')}`,
      dateRange,
      passengerInfo: `${data.passengers} ${data.passengers === 1 ? 'Adult' : 'Adults'}, Economy`,
      travelTimeInfo: flightTimeDisplay
    }
  }

  const summary = formatSearchSummary(searchData)

  return (
    <>
      {/* Desktop Layout - Responsive positioning */}
      <div className="hidden lg:block absolute inset-x-0 top-0 z-30">
        <div className="flex items-center justify-center pt-20 xl:pt-24">
          <div className="bg-black/40 backdrop-blur-sm rounded-lg px-6 py-3 mx-4">
            <div className="flex items-center gap-6 xl:gap-8">
              {/* Selected theme */}
              <div 
                className="font-muli font-bold text-lg xl:text-xl"
                style={{ color: summary.themeColor }}
              >
                {summary.themeDisplay}
              </div>

              {/* Separator */}
              <div className="w-px h-6 bg-gray-300" />

              {/* Origin and travel time info */}
              <div className="font-muli text-xs xl:text-sm text-gray-300">
                {summary.originInfo}
              </div>

              {/* Date range */}
              <div className="font-muli text-xs xl:text-sm text-gray-300 uppercase">
                {summary.dateRange}
              </div>

              {/* Passenger info */}
              <div className="font-muli font-bold text-xs xl:text-sm text-gray-300">
                {summary.passengerInfo}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Layout - Improved compact layout */}
      <div className="lg:hidden fixed top-14 sm:top-16 md:top-20 left-0 right-0 bg-black/60 backdrop-blur-sm border-b border-white/20 px-3 py-2 z-40">
        <div className="flex flex-col gap-1.5">
          {/* Theme and Origin row */}
          <div className="flex items-center justify-between">
            <div 
              className="font-muli font-bold text-sm sm:text-base"
              style={{ color: summary.themeColor }}
            >
              {summary.themeDisplay}
            </div>
            <div className="font-muli text-xs text-gray-300">
              From {searchData.departureAirport}
            </div>
          </div>

          {/* Details row */}
          <div className="flex items-center justify-between text-xs">
            <div className="font-muli text-gray-300">
              {summary.passengerInfo}
            </div>
            <div className="font-muli text-gray-300">
              Max {searchData.maxFlightTime}h flight
            </div>
          </div>
        </div>
      </div>
    </>
  )
}