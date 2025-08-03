export interface SearchSummaryData {
  selectedTheme: string
  departureAirport: string
  departureDate: string
  returnDate?: string
  passengers: number
  tripType: 'one-way' | 'return'
  maxFlightTime?: number // For backward compatibility
  minFlightTime?: number
  maxFlightTimeRange?: number
  flightTimeRange?: [number, number]
  passengerClass?: string
}

export interface FormattedSearchSummary {
  themeDisplay: string
  themeColor: string
  originInfo: string
  dateRange: string
  passengerInfo: string
  travelTimeInfo: string
}