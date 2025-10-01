'use client'

import { create } from 'zustand'

// Core types for our clean MVP
export interface Destination {
  id: string
  cityName: string
  countryName: string
  airportCode: string
  description?: string
  imageUrl?: string
  flightDuration?: number
  priceEstimate?: string
}

export interface SearchFilters {
  departureAirport: string
  theme: 'adventure' | 'culture' | 'nightlife' | 'relaxation' | 'shopping' | 'nature' | ''
  minFlightTime: number
  maxFlightTime: number
  departureDate: string
  returnDate: string
  passengers: number
}

interface SearchState {
  // Search filters
  filters: SearchFilters
  updateFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void
  resetFilters: () => void

  // Search results
  destinations: Destination[]
  isLoading: boolean
  error: string | null
  setDestinations: (destinations: Destination[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // UI state
  currentStep: 'search' | 'results'
  setCurrentStep: (step: 'search' | 'results') => void
}

const initialFilters: SearchFilters = {
  departureAirport: '',
  theme: '',
  minFlightTime: 2,
  maxFlightTime: 8,
  departureDate: '',
  returnDate: '',
  passengers: 1
}

export const useSearchStore = create<SearchState>((set) => ({
  // Initial state
  filters: initialFilters,
  destinations: [],
  isLoading: false,
  error: null,
  currentStep: 'search',

  // Actions
  updateFilter: (key, value) => 
    set((state) => ({
      filters: { ...state.filters, [key]: value }
    })),

  resetFilters: () => 
    set({ 
      filters: initialFilters,
      destinations: [],
      error: null,
      currentStep: 'search'
    }),

  setDestinations: (destinations) => set({ destinations }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setCurrentStep: (currentStep) => set({ currentStep })
}))