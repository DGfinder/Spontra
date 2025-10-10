'use client'

import { useState, useEffect } from 'react'
import { Hotel, Calendar, Users } from 'lucide-react'
import { CityAutocomplete } from '@/components/CityAutocomplete'
import type { HotelSearchFilters } from '@/app/hotels/HotelsPageClient'

interface HotelSearchPanelProps {
  onSearch: (filters: HotelSearchFilters) => void
  isLoading: boolean
  initialCity?: string
}

export function HotelSearchPanel({ onSearch, isLoading, initialCity }: HotelSearchPanelProps) {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 8)

  const [city, setCity] = useState(initialCity || '')
  const [checkIn, setCheckIn] = useState(tomorrow.toISOString().split('T')[0])
  const [checkOut, setCheckOut] = useState(nextWeek.toISOString().split('T')[0])
  const [adults, setAdults] = useState(2)

  // Update city if initialCity changes (from destination link)
  useEffect(() => {
    if (initialCity) {
      setCity(initialCity)
    }
  }, [initialCity])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!city || !checkIn || !checkOut) {
      return
    }

    onSearch({
      city,
      checkIn,
      checkOut,
      adults
    })
  }

  // Auto-adjust checkout if checkin changes
  const handleCheckInChange = (newCheckIn: string) => {
    setCheckIn(newCheckIn)

    // If checkout is before or same as new checkin, set it to +3 days
    if (!checkOut || checkOut <= newCheckIn) {
      const checkInDate = new Date(newCheckIn)
      checkInDate.setDate(checkInDate.getDate() + 3)
      setCheckOut(checkInDate.toISOString().split('T')[0])
    }
  }

  const themeColor = '#7f6ae4' // Purple/discover theme for hotels

  return (
    <div className="w-full
                    max-w-[clamp(300px,90vw,340px)]
                    sm:max-w-[clamp(320px,80vw,360px)]
                    md:max-w-[clamp(340px,36vw,380px)]
                    lg:max-w-[clamp(360px,26vw,400px)]
                    xl:max-w-[clamp(380px,22vw,420px)]
                    2xl:max-w-[clamp(400px,20vw,440px)]">
      <form onSubmit={handleSubmit}>
        <div
          className="bg-[rgba(11,15,18,0.84)] backdrop-blur-sm rounded-2xl p-3 pb-1
                     sm:p-3.5 md:p-4 lg:p-4.5 xl:p-5 border transition-colors duration-500"
          style={{
            fontFamily: 'var(--font-arimo)',
            borderColor: `${themeColor}33`,
            boxShadow: `0 24px 48px rgba(0,0,0,0.3), 0 8px 16px rgba(0,0,0,0.2), 0 0 0 1px ${themeColor}22`
          }}
        >
          <div className="space-y-1.5 sm:space-y-2 md:space-y-2.5 lg:space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <Hotel className="w-5 h-5" style={{ color: themeColor }} />
              <h1 className="font-bold" style={{
                color: '#F3F6F9',
                fontSize: 'clamp(1.2rem, 1.6vw, 1.5rem)',
                lineHeight: '1.2'
              }}>
                Find Your Stay
              </h1>
            </div>

            {/* City/Location with Autocomplete */}
            <CityAutocomplete
              value={city}
              onChange={(cityName) => setCity(cityName)}
              label="City or Destination"
              placeholder="e.g., Paris, Tokyo, New York"
              showIcon={true}
              themeColor={themeColor}
            />

            {/* Check-in / Check-out */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-normal uppercase" style={{ color: '#C9CFD6' }}>
                Dates
              </label>

              <div className="grid grid-cols-2 gap-3">
                {/* Check-in */}
                <div className="flex flex-col gap-1">
                  <label style={{
                    color: '#A7AFB7',
                    fontSize: 'clamp(0.68rem, 0.85vw, 0.72rem)'
                  }}>
                    Check-in
                  </label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                      style={{ color: '#C9CFD6' }}
                    />
                    <input
                      type="date"
                      value={checkIn}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => handleCheckInChange(e.target.value)}
                      required
                      className="w-full h-[47px] pl-10 pr-4 rounded-[10px]
                               bg-transparent border border-[rgba(255,255,255,0.12)]
                               text-white
                               focus:outline-none focus:border-[rgba(255,255,255,0.24)]
                               transition-colors"
                      style={{ fontSize: 'clamp(0.78rem, 0.95vw, 0.82rem)' }}
                    />
                  </div>
                </div>

                {/* Check-out */}
                <div className="flex flex-col gap-1">
                  <label style={{
                    color: '#A7AFB7',
                    fontSize: 'clamp(0.68rem, 0.85vw, 0.72rem)'
                  }}>
                    Check-out
                  </label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                      style={{ color: '#C9CFD6' }}
                    />
                    <input
                      type="date"
                      value={checkOut}
                      min={checkIn}
                      onChange={(e) => setCheckOut(e.target.value)}
                      required
                      className="w-full h-[47px] pl-10 pr-4 rounded-[10px]
                               bg-transparent border border-[rgba(255,255,255,0.12)]
                               text-white
                               focus:outline-none focus:border-[rgba(255,255,255,0.24)]
                               transition-colors"
                      style={{ fontSize: 'clamp(0.78rem, 0.95vw, 0.82rem)' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Adults */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-normal uppercase" style={{ color: '#C9CFD6' }}>
                Guests
              </label>
              <div className="flex items-center justify-between gap-3 h-[47px] px-4 rounded-[10px]
                            bg-transparent border border-[rgba(255,255,255,0.12)]">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" style={{ color: '#C9CFD6' }} />
                  <span style={{
                    color: '#F3F6F9',
                    fontSize: 'clamp(0.78rem, 0.95vw, 0.82rem)'
                  }}>
                    {adults} adult{adults !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAdults(Math.max(1, adults - 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center
                             transition-colors bg-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.18)]"
                    style={{
                      color: '#F3F6F9',
                      fontSize: 'clamp(0.78rem, 0.95vw, 0.82rem)'
                    }}
                  >
                    -
                  </button>
                  <span className="w-8 text-center" style={{
                    color: '#F3F6F9',
                    fontSize: 'clamp(0.78rem, 0.95vw, 0.82rem)'
                  }}>
                    {adults}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAdults(Math.min(8, adults + 1))}
                    disabled={adults >= 8}
                    className="w-8 h-8 rounded-full flex items-center justify-center
                             transition-colors bg-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.18)]
                             disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                      color: '#F3F6F9',
                      fontSize: 'clamp(0.78rem, 0.95vw, 0.82rem)'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Search Button */}
            <div className="pt-3 border-t border-[rgba(255,255,255,0.08)]">
              <button
                type="submit"
                disabled={!city || !checkIn || !checkOut || isLoading}
                className="w-full h-11 sm:h-11 md:h-12 rounded-[10px] font-bold text-white
                         transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                         hover:opacity-90 active:scale-[0.98] shadow-lg"
                style={{
                  backgroundColor: themeColor,
                  fontSize: 'clamp(0.88rem, 1.05vw, 0.94rem)'
                }}
              >
                {isLoading ? 'Searching...' : 'Search Hotels'}
              </button>

              {/* Validation feedback */}
              {!isLoading && !city && (
                <p className="text-center mt-2" style={{
                  color: '#A7AFB7',
                  fontSize: 'clamp(0.68rem, 0.85vw, 0.72rem)'
                }}>
                  Enter a city or destination to continue
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
