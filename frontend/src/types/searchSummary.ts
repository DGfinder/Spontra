export interface SearchSummaryData {
  selectedTheme: string
  departureAirport: string
  departureDate: string
  returnDate?: string
  passengers: number
  tripType: 'one-way' | 'return'
  maxFlightTime: number
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