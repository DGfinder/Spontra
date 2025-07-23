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

    const departureFormatted = formatDate(data.departureDate)
    const dateRange = data.tripType === 'return' && data.returnDate
      ? `Departure Date: ${departureFormatted} Return Date: ${formatDate(data.returnDate)}`
      : `Departure Date: ${departureFormatted}`

    return {
      themeDisplay: themeName,
      themeColor,
      originInfo: `Origin: ${data.departureAirport} Ideal travel Time: ${data.maxFlightTime}h`,
      dateRange,
      passengerInfo: `${data.passengers} ${data.passengers === 1 ? 'Adult' : 'Adults'}, Economy`,
      travelTimeInfo: `${data.maxFlightTime}h max flight time`
    }
  }

  const summary = formatSearchSummary(searchData)

  return (
    <>
      {/* Desktop Layout - Exact positioning from 2015 design */}
      <div 
        className="hidden lg:block absolute"
        style={{
          left: '0px',
          top: '0px',
          width: '1920px',
          height: '1080px',
          zIndex: 69
        }}
      >
        {/* Small gray rectangle separator */}
        <div
          className="absolute"
          style={{
            backgroundColor: 'rgb(246, 246, 246)',
            left: '387px',
            top: '129px',
            width: '7px',
            height: '13px',
            zIndex: 68
          }}
        />

        {/* Origin and travel time info */}
        <div
          className="absolute font-muli"
          style={{
            fontSize: '12px',
            color: 'rgb(220, 220, 220)',
            lineHeight: 1.5,
            textAlign: 'left',
            left: '680.402px',
            top: '141.742px',
            width: '139.071px',
            height: '28.099px',
            zIndex: 67
          }}
        >
          {summary.originInfo}
        </div>

        {/* Passenger info */}
        <div
          className="absolute font-muli font-bold"
          style={{
            fontSize: '12px',
            color: 'rgb(220, 220, 220)',
            lineHeight: 1.5,
            textAlign: 'left',
            left: '1076.202px',
            top: '140.791px',
            width: '98.909px',
            height: '12.875px',
            zIndex: 66
          }}
        >
          {summary.passengerInfo}
        </div>

        {/* Date range */}
        <div
          className="absolute font-muli uppercase"
          style={{
            fontSize: '12px',
            color: 'rgb(220, 220, 220)',
            lineHeight: 1.5,
            textAlign: 'left',
            left: '878.451px',
            top: '140.736px',
            width: '145.972px',
            height: '28.984px',
            zIndex: 65
          }}
        >
          {summary.dateRange}
        </div>

        {/* Selected theme */}
        <div
          className="absolute font-muli font-bold"
          style={{
            fontSize: '18px',
            color: summary.themeColor,
            lineHeight: 1.667,
            textAlign: 'left',
            left: '524.221px',
            top: '157.59px',
            width: '88.559px',
            height: '13px',
            zIndex: 63
          }}
        >
          {summary.themeDisplay}
        </div>
      </div>

      {/* Mobile/Tablet Layout - Compact horizontal summary */}
      <div className="lg:hidden bg-black/60 border-b border-white/20 p-3 z-50">
        <div className="flex flex-col gap-2">
          {/* Theme and Origin row */}
          <div className="flex items-center justify-between">
            <div 
              className="font-muli font-bold"
              style={{
                fontSize: '16px',
                color: summary.themeColor
              }}
            >
              {summary.themeDisplay}
            </div>
            <div 
              className="font-muli text-xs"
              style={{ color: 'rgb(220, 220, 220)' }}
            >
              From {searchData.departureAirport}
            </div>
          </div>

          {/* Details row */}
          <div className="flex items-center justify-between text-xs">
            <div 
              className="font-muli"
              style={{ color: 'rgb(220, 220, 220)' }}
            >
              {summary.passengerInfo}
            </div>
            <div 
              className="font-muli"
              style={{ color: 'rgb(220, 220, 220)' }}
            >
              Max {searchData.maxFlightTime}h flight
            </div>
          </div>
        </div>
      </div>
    </>
  )
}