'use client'

import { create } from 'zustand'

// Real minimal state management for search flow

export interface DestinationRecommendation {
  id: string
  name: string
  country: string
  airportCode: string
  city: string
  priceRange?: string
  durationMinutes?: number
  theme?: string
  currency?: string
}

interface FormData {
  selectedTheme: string
  departureAirport: string
  destinationAirport?: string
  departureDate: string
  returnDate?: string
  passengers: number
  tripType: 'one-way' | 'return'
  flightTimeRange?: [number, number]
}

interface SearchState {
  // Form data
  formData: FormData
  setFormData: (data: Partial<FormData>) => void
  updateFormField: (field: keyof FormData, value: any) => void

  // Search state
  isSearching: boolean
  results: DestinationRecommendation[]
  error: string | null
  setSearching: (loading: boolean) => void
  setResults: (results: DestinationRecommendation[]) => void
  setError: (error: string | null) => void

  // Navigation state
  currentStep: 'form' | 'theme' | 'destinations' | 'flights' | 'booking'
  setCurrentStep: (step: 'form' | 'theme' | 'destinations' | 'flights' | 'booking') => void
  canGoBack: boolean
  canGoForward: boolean

  // Actions
  resetForm: () => void
  goBack: () => void
  goForward: () => void
}

const initialFormData: FormData = {
  selectedTheme: '',
  departureAirport: '',
  destinationAirport: '',
  departureDate: '',
  returnDate: '',
  passengers: 1,
  tripType: 'return'
}

export const useSearchStore = create<SearchState>((set, get) => ({
  // Initial state
  formData: initialFormData,
  isSearching: false,
  results: [],
  error: null,
  currentStep: 'form',
  canGoBack: false,
  canGoForward: false,

  // Form data actions
  setFormData: (data) => set((state) => ({ 
    formData: { ...state.formData, ...data } 
  })),
  
  updateFormField: (field, value) => set((state) => ({
    formData: { ...state.formData, [field]: value }
  })),

  // Search actions
  setSearching: (isSearching) => set({ isSearching }),
  setResults: (results) => set({ results }),
  setError: (error) => set({ error }),

  // Navigation actions  
  setCurrentStep: (currentStep) => {
    const steps = ['form', 'theme', 'destinations', 'flights', 'booking']
    const currentIndex = steps.indexOf(currentStep)
    set({ 
      currentStep,
      canGoBack: currentIndex > 0,
      canGoForward: currentIndex < steps.length - 1
    })
  },

  goBack: () => {
    const state = get()
    const steps = ['form', 'theme', 'destinations', 'flights', 'booking']
    const currentIndex = steps.indexOf(state.currentStep)
    if (currentIndex > 0) {
      state.setCurrentStep(steps[currentIndex - 1] as any)
    }
  },

  goForward: () => {
    const state = get()
    const steps = ['form', 'theme', 'destinations', 'flights', 'booking']
    const currentIndex = steps.indexOf(state.currentStep)
    if (currentIndex < steps.length - 1) {
      state.setCurrentStep(steps[currentIndex + 1] as any)
    }
  },

  resetForm: () => set({
    formData: initialFormData,
    isSearching: false,
    results: [],
    error: null,
    currentStep: 'form',
    canGoBack: false,
    canGoForward: false
  })
}))

// Hook exports for easier usage
export const useFormData = () => useSearchStore((state) => state.formData)
export const useSearchState = () => useSearchStore((state) => ({ 
  isSearching: state.isSearching, 
  results: state.results, 
  error: state.error 
}))
export const useNavigationState = () => useSearchStore((state) => ({ 
  currentStep: state.currentStep, 
  canGoBack: state.canGoBack, 
  canGoForward: state.canGoForward 
}))
export const useNavigationActions = () => useSearchStore((state) => ({ 
  setCurrentStep: state.setCurrentStep,
  goBack: state.goBack,
  goForward: state.goForward,
  resetForm: state.resetForm
}))