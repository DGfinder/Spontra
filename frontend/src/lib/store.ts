import { create } from 'zustand'

export interface Destination {
  id: string
  cityName: string
  countryName: string
  airportCode: string
  description?: string | null
  flightDuration?: number
  priceEstimate?: string
}

export interface SearchFilters {
  departureAirport: string
  theme: string
  minFlightTime: number
  maxFlightTime: number
}

export interface SearchState {
  filters: SearchFilters
  destinations: Destination[]
  isLoading: boolean
  error: string | null
  currentStep: 'search' | 'results'
  updateFilter: (key: keyof SearchFilters, value: string | number) => void
  setDestinations: (destinations: Destination[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setCurrentStep: (step: 'search' | 'results') => void
  reset: () => void
}

const initialFilters: SearchFilters = {
  departureAirport: '',
  theme: '',
  minFlightTime: 2,
  maxFlightTime: 8
}

export const useSearchStore = create<SearchState>((set) => ({
  filters: initialFilters,
  destinations: [],
  isLoading: false,
  error: null,
  currentStep: 'search',
  
  updateFilter: (key: keyof SearchFilters, value: string | number) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value }
    })),
  
  setDestinations: (destinations: Destination[]) =>
    set({ destinations }),
  
  setLoading: (isLoading: boolean) =>
    set({ isLoading }),
  
  setError: (error: string | null) =>
    set({ error }),
  
  setCurrentStep: (currentStep: 'search' | 'results') =>
    set({ currentStep }),
  
  reset: () =>
    set({
      filters: initialFilters,
      destinations: [],
      isLoading: false,
      error: null,
      currentStep: 'search'
    })
}))