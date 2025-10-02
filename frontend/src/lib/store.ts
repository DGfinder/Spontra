import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface Destination {
  id: string
  cityName: string
  country: {
    name: string
    code: string
  }
  airportCode: string
  description?: string | null
  themePOIs?: Array<{
    id: string
    name: string
    description: string | null
    videoUrl: string | null
  }>
  flightDuration?: number
  priceEstimate?: string
}

export interface SearchFilters {
  departureAirport: string
  destinationAirport: string
  theme: string
  minFlightTime: number
  maxFlightTime: number
  passengers: number
  cabin: string
}

interface SearchState {
  // Core state
  filters: SearchFilters
  destinations: Destination[]
  isLoading: boolean
  error: string | null
  currentStep: 'search' | 'results'
  
  // Actions with improved typing
  updateFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void
  setDestinations: (destinations: Destination[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setCurrentStep: (step: 'search' | 'results') => void
  reset: () => void
  
  // Async search action
  search: () => Promise<void>
}

const initialFilters: SearchFilters = {
  departureAirport: '',
  destinationAirport: '',
  theme: 'adventure', // Default to adventure to show background
  minFlightTime: 2,
  maxFlightTime: 8,
  passengers: 1,
  cabin: 'Economy'
}

export const useSearchStore = create<SearchState>()(
  devtools(
    (set, get) => ({
      // Initial state
      filters: initialFilters,
      destinations: [],
      isLoading: false,
      error: null,
      currentStep: 'search',
      
      // Actions
      updateFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value },
          error: null // Clear error when user updates filters
        }), false, `updateFilter/${key}`),
      
      setDestinations: (destinations) =>
        set({ destinations }, false, 'setDestinations'),
      
      setLoading: (isLoading) =>
        set({ isLoading }, false, 'setLoading'),
      
      setError: (error) =>
        set({ error, isLoading: false }, false, 'setError'),
      
      setCurrentStep: (currentStep) =>
        set({ currentStep }, false, 'setCurrentStep'),
      
      reset: () =>
        set({
          filters: initialFilters,
          destinations: [],
          isLoading: false,
          error: null,
          currentStep: 'search'
        }, false, 'reset'),
      
      // Async search action using modern patterns
      search: async () => {
        const { filters } = get()
        
        // Validation
        if (!filters.departureAirport || !filters.theme) {
          set({ error: 'Please select a departure airport and theme' }, false, 'search/validation-error')
          return
        }
        
        set({ isLoading: true, error: null }, false, 'search/start')
        
        try {
          const response = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              departureAirport: filters.departureAirport,
              theme: filters.theme,
              minFlightTime: filters.minFlightTime,
              maxFlightTime: filters.maxFlightTime
            })
          })
          
          const data = await response.json()
          
          if (data.success && Array.isArray(data.destinations)) {
            set({ 
              destinations: data.destinations,
              currentStep: 'results',
              isLoading: false 
            }, false, 'search/success')
          } else {
            set({ 
              error: data.error || 'Search failed',
              isLoading: false 
            }, false, 'search/error')
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Network error occurred',
            isLoading: false 
          }, false, 'search/network-error')
        }
      }
    }),
    {
      name: 'search-store', // Name for devtools
      store: 'search-store'
    }
  )
)