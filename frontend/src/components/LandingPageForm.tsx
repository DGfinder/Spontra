'use client'

import { useState, useEffect } from 'react'

interface FormData {
  selectedTheme: string
  departureAirport: string
  departureDate: string
  returnDate: string
  passengers: number
  tripType: 'one-way' | 'return'
  flightRange: { min: number; max: number }
}

const THEMES = [
  { 
    id: 'adventure', 
    label: 'Adventure', 
    icon: '🏔️',
    background: '/adventure-background.jpg',
    color: 'orange'
  },
  { 
    id: 'activities', 
    label: 'Activities', 
    icon: '🎯',
    background: '/adventure-background.jpg',
    color: 'blue'
  },
  { 
    id: 'shopping', 
    label: 'Shopping', 
    icon: '🛍️',
    background: '/shopping-background.jpg',
    color: 'pink'
  },
  { 
    id: 'party', 
    label: 'Party', 
    icon: '🌃',
    background: '/party-background.jpg',
    color: 'purple'
  },
  { 
    id: 'learn', 
    label: 'Learn', 
    icon: '🎭',
    background: '/learn-background.jpg',
    color: 'green'
  }
]

export function LandingPageForm() {
  const [formData, setFormData] = useState<FormData>({
    selectedTheme: 'adventure',
    departureAirport: '',
    departureDate: '',
    returnDate: '',
    passengers: 1,
    tripType: 'return',
    flightRange: { min: 1, max: 4 }
  })

  const currentTheme = THEMES.find(t => t.id === formData.selectedTheme) || THEMES[0]

  // Preload background images for smooth transitions
  useEffect(() => {
    THEMES.forEach(theme => {
      const img = new Image()
      img.src = theme.background
    })
  }, [])

  const handleThemeSelect = (themeId: string) => {
    setFormData(prev => ({ ...prev, selectedTheme: themeId }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Search flights with:', formData)
    // TODO: Implement search logic
  }

  return (
    <div 
      className="h-screen w-full bg-cover bg-center bg-no-repeat relative transition-all duration-1000 overflow-hidden"
      style={{ backgroundImage: `url('${currentTheme.background}')` }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-30 p-6">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <span className="text-2xl font-light">spon</span>
            <span className="text-2xl font-bold">EXPLORE</span>
          </div>
          <div className="text-white/80 text-sm hover:text-white cursor-pointer">
            Sign In
          </div>
        </div>
      </div>

      {/* Left Form Panel with Dark Overlay */}
      <div className="absolute left-0 top-0 bottom-0 w-96 bg-black/80 backdrop-blur-sm z-20">
        <div className="p-6 h-full flex flex-col">
          {/* Form Header */}
          <div className="mb-6 pt-16">
            <h2 className="text-white text-lg font-medium mb-1">
              WHERE ARE YOU LOOKING TO GO?
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            {/* Theme Selection */}
            <div className="mb-6">
              <div className="grid grid-cols-5 gap-2">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleThemeSelect(theme.id)}
                    className={`p-3 rounded text-xs transition-all duration-200 ${
                      formData.selectedTheme === theme.id
                        ? 'bg-white text-black'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">{theme.icon}</div>
                      <div className="text-xs font-medium">{theme.label}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Trip Type Toggle */}
            <div className="mb-4">
              <div className="grid grid-cols-2 gap-1 bg-white/20 rounded p-1">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, tripType: 'return' }))}
                  className={`py-2 px-3 rounded text-sm transition-all ${
                    formData.tripType === 'return'
                      ? 'bg-white text-black'
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  Return
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, tripType: 'one-way' }))}
                  className={`py-2 px-3 rounded text-sm transition-all ${
                    formData.tripType === 'one-way'
                      ? 'bg-white text-black'
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  One way
                </button>
              </div>
            </div>

            {/* From Airport */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-white/90">
                FROM
              </label>
              <input
                type="text"
                placeholder="Airport code (e.g., LHR)"
                value={formData.departureAirport}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  departureAirport: e.target.value.toUpperCase() 
                }))}
                className="w-full px-4 py-3 bg-white text-black rounded text-sm border-0 focus:ring-2 focus:ring-orange-500"
                maxLength={3}
                required
              />
            </div>

            {/* To Airport - Disabled */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-white/90">
                TO
              </label>
              <input
                type="text"
                value="Anywhere"
                disabled
                className="w-full px-4 py-3 bg-white/20 text-white/60 rounded text-sm border-0"
              />
            </div>

            {/* Dates */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-white/90">
                DEPARTURE
              </label>
              <input
                type="date"
                value={formData.departureDate}
                onChange={(e) => setFormData(prev => ({ ...prev, departureDate: e.target.value }))}
                className="w-full px-4 py-3 bg-white text-black rounded text-sm border-0 focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            {formData.tripType === 'return' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-white/90">
                  RETURN
                </label>
                <input
                  type="date"
                  value={formData.returnDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, returnDate: e.target.value }))}
                  className="w-full px-4 py-3 bg-white text-black rounded text-sm border-0 focus:ring-2 focus:ring-orange-500"
                  required={formData.tripType === 'return'}
                />
              </div>
            )}

            {/* Passengers */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-white/90">
                PASSENGERS
              </label>
              <select
                value={formData.passengers}
                onChange={(e) => setFormData(prev => ({ ...prev, passengers: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 bg-white text-black rounded text-sm border-0 focus:ring-2 focus:ring-orange-500"
              >
                {[1,2,3,4,5,6,7,8].map(num => (
                  <option key={num} value={num}>{num} {num === 1 ? 'Passenger' : 'Passengers'}</option>
                ))}
              </select>
            </div>

            {/* Flight Range */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-white/90">
                FLIGHT TIME (HOURS)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="number"
                    placeholder="From"
                    value={formData.flightRange.min}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      flightRange: { ...prev.flightRange, min: parseInt(e.target.value) || 1 }
                    }))}
                    className="w-full px-4 py-3 bg-white text-black rounded text-sm border-0 focus:ring-2 focus:ring-orange-500"
                    min="1"
                    max="12"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="To"
                    value={formData.flightRange.max}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      flightRange: { ...prev.flightRange, max: parseInt(e.target.value) || 4 }
                    }))}
                    className="w-full px-4 py-3 bg-white text-black rounded text-sm border-0 focus:ring-2 focus:ring-orange-500"
                    min="1"
                    max="12"
                  />
                </div>
              </div>
            </div>

            {/* Search Button */}
            <div className="mt-auto">
              <button
                type="submit"
                disabled={!formData.departureAirport}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg text-sm transition-colors duration-200 shadow-lg"
              >
                SEARCH FLIGHTS
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}