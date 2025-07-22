import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { DestinationRecommendation } from '@/services/apiClient'

export interface FormData {
  selectedTheme: string
  departureAirport: string
  departureDate: string
  returnDate: string
  passengers: number
  tripType: 'one-way' | 'return'
  maxFlightTime: number
}

export interface SearchHistory {
  id: string
  timestamp: string
  formData: FormData
  resultCount: number
  searchDuration: number
}

interface SearchState {
  // Form data
  formData: FormData
  
  // Search state
  isLoading: boolean
  isError: boolean
  error: string | null
  results: DestinationRecommendation[]
  showResults: boolean
  
  // Search history
  searchHistory: SearchHistory[]
  
  // User preferences (persisted)
  preferences: {
    defaultDepartureAirport: string
    defaultPassengers: number
    preferredThemes: string[]
    recentAirports: string[]
  }
}

interface SearchActions {
  // Form actions
  updateFormData: (updates: Partial<FormData>) => void
  resetFormData: () => void
  
  // Search actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setResults: (results: DestinationRecommendation[]) => void
  setShowResults: (show: boolean) => void
  clearResults: () => void
  
  // History actions
  addToHistory: (search: Omit<SearchHistory, 'id' | 'timestamp'>) => void
  clearHistory: () => void
  removeFromHistory: (id: string) => void
  
  // Preferences actions
  updatePreferences: (updates: Partial<SearchState['preferences']>) => void
  addRecentAirport: (airport: string) => void
  addPreferredTheme: (theme: string) => void
  removePreferredTheme: (theme: string) => void
}

type SearchStore = SearchState & SearchActions

const initialFormData: FormData = {
  selectedTheme: 'adventure',
  departureAirport: '',
  departureDate: '',
  returnDate: '',
  passengers: 1,
  tripType: 'return',
  maxFlightTime: 4
}

const initialPreferences = {
  defaultDepartureAirport: '',
  defaultPassengers: 1,
  preferredThemes: ['adventure'],
  recentAirports: []
}

export const useSearchStore = create<SearchStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        formData: initialFormData,
        isLoading: false,
        isError: false,
        error: null,
        results: [],
        showResults: false,
        searchHistory: [],
        preferences: initialPreferences,

        // Form actions
        updateFormData: (updates) =>
          set(
            (state) => ({
              formData: { ...state.formData, ...updates }
            }),
            false,
            'updateFormData'
          ),

        resetFormData: () =>
          set(
            (state) => ({
              formData: {
                ...initialFormData,
                departureAirport: state.preferences.defaultDepartureAirport,
                passengers: state.preferences.defaultPassengers,
                selectedTheme: state.preferences.preferredThemes[0] || 'adventure'
              }
            }),
            false,
            'resetFormData'
          ),

        // Search actions
        setLoading: (loading) =>
          set({ isLoading: loading }, false, 'setLoading'),

        setError: (error) =>
          set({ isError: !!error, error }, false, 'setError'),

        setResults: (results) =>
          set(
            {
              results,
              showResults: true,
              isLoading: false,
              isError: false,
              error: null
            },
            false,
            'setResults'
          ),

        setShowResults: (show) =>
          set({ showResults: show }, false, 'setShowResults'),

        clearResults: () =>
          set(
            {
              results: [],
              showResults: false,
              isLoading: false,
              isError: false,
              error: null
            },
            false,
            'clearResults'
          ),

        // History actions
        addToHistory: (search) => {
          const newSearch: SearchHistory = {
            ...search,
            id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString()
          }

          set(
            (state) => ({
              searchHistory: [newSearch, ...state.searchHistory].slice(0, 50) // Keep last 50 searches
            }),
            false,
            'addToHistory'
          )
        },

        clearHistory: () =>
          set({ searchHistory: [] }, false, 'clearHistory'),

        removeFromHistory: (id) =>
          set(
            (state) => ({
              searchHistory: state.searchHistory.filter(search => search.id !== id)
            }),
            false,
            'removeFromHistory'
          ),

        // Preferences actions
        updatePreferences: (updates) =>
          set(
            (state) => ({
              preferences: { ...state.preferences, ...updates }
            }),
            false,
            'updatePreferences'
          ),

        addRecentAirport: (airport) => {
          const { preferences } = get()
          const recentAirports = [
            airport,
            ...preferences.recentAirports.filter(a => a !== airport)
          ].slice(0, 10) // Keep last 10 airports

          set(
            (state) => ({
              preferences: { ...state.preferences, recentAirports }
            }),
            false,
            'addRecentAirport'
          )
        },

        addPreferredTheme: (theme) => {
          const { preferences } = get()
          if (!preferences.preferredThemes.includes(theme)) {
            set(
              (state) => ({
                preferences: {
                  ...state.preferences,
                  preferredThemes: [...state.preferences.preferredThemes, theme]
                }
              }),
              false,
              'addPreferredTheme'
            )
          }
        },

        removePreferredTheme: (theme) =>
          set(
            (state) => ({
              preferences: {
                ...state.preferences,
                preferredThemes: state.preferences.preferredThemes.filter(t => t !== theme)
              }
            }),
            false,
            'removePreferredTheme'
          )
      }),
      {
        name: 'spontra-search-store',
        partialize: (state) => ({
          searchHistory: state.searchHistory,
          preferences: state.preferences,
          formData: {
            selectedTheme: state.formData.selectedTheme,
            departureAirport: state.formData.departureAirport,
            passengers: state.formData.passengers,
            tripType: state.formData.tripType,
            maxFlightTime: state.formData.maxFlightTime
          }
        })
      }
    ),
    { name: 'search-store' }
  )
)

// Selector hooks for better performance
export const useFormData = () => useSearchStore((state) => state.formData)
export const useSearchState = () => useSearchStore((state) => ({
  isLoading: state.isLoading,
  isError: state.isError,
  error: state.error,
  results: state.results,
  showResults: state.showResults
}))
export const useSearchHistory = () => useSearchStore((state) => state.searchHistory)
export const usePreferences = () => useSearchStore((state) => state.preferences)

// Action selectors
export const useSearchActions = () => useSearchStore((state) => ({
  updateFormData: state.updateFormData,
  resetFormData: state.resetFormData,
  setLoading: state.setLoading,
  setError: state.setError,
  setResults: state.setResults,
  setShowResults: state.setShowResults,
  clearResults: state.clearResults,
  addToHistory: state.addToHistory,
  clearHistory: state.clearHistory,
  removeFromHistory: state.removeFromHistory,
  updatePreferences: state.updatePreferences,
  addRecentAirport: state.addRecentAirport,
  addPreferredTheme: state.addPreferredTheme,
  removePreferredTheme: state.removePreferredTheme
}))