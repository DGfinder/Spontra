'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Users, Calendar, ChevronDown, Plane, Compass, Trees, Wine, Music, Globe, Loader2 } from 'lucide-react'
import { DualRangeSlider } from './DualRangeSlider'

interface SearchFilterBarProps {
  origin: string
  flightTime: string
  theme: string
  originCity?: string
  departureDate?: string
  returnDate?: string
  travelers?: number
  directOnly?: boolean
}

type ExpandedSection = 'dates' | 'travelers' | 'flightTime' | 'theme' | null

const THEMES = [
  { value: 'adventure', label: 'Adventure', icon: Compass, color: '#ffbd0a' },
  { value: 'nature', label: 'Nature', icon: Trees, color: '#02c06d' },
  { value: 'indulge', label: 'Indulge', icon: Wine, color: '#e52b00' },
  { value: 'vibe', label: 'Vibe', icon: Music, color: '#eb5b25' },
  { value: 'discover', label: 'Discover', icon: Globe, color: '#7f6ae4' }
] as const

export function SearchFilterBar({
  origin,
  flightTime,
  theme,
  originCity,
  departureDate,
  returnDate,
  travelers = 2,
  directOnly = false
}: SearchFilterBarProps) {
  const router = useRouter()
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [isNavigating, setIsNavigating] = useState(false)

  const [minTime, maxTime] = flightTime.split('-').map(Number)

  // Temporary state for editing (before applying)
  const [tempDepartureDate, setTempDepartureDate] = useState(departureDate || '')
  const [tempReturnDate, setTempReturnDate] = useState(returnDate || '')
  const [tempTravelers, setTempTravelers] = useState(travelers)
  const [tempMinTime, setTempMinTime] = useState(minTime)
  const [tempMaxTime, setTempMaxTime] = useState(maxTime)
  const [tempTheme, setTempTheme] = useState(theme)

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setExpandedSection(null)
      }
    }

    if (expandedSection) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [expandedSection])

  // Reset temp state when expanding a section
  useEffect(() => {
    if (expandedSection === 'dates') {
      setTempDepartureDate(departureDate || '')
      setTempReturnDate(returnDate || '')
    } else if (expandedSection === 'travelers') {
      setTempTravelers(travelers)
    } else if (expandedSection === 'flightTime') {
      setTempMinTime(minTime)
      setTempMaxTime(maxTime)
    } else if (expandedSection === 'theme') {
      setTempTheme(theme)
    }
  }, [expandedSection, departureDate, returnDate, travelers, minTime, maxTime, theme])

  const applyChanges = (section: ExpandedSection) => {
    // Store scroll position
    const scrollY = window.scrollY
    sessionStorage.setItem('scrollPosition', scrollY.toString())

    const params = new URLSearchParams()
    let newUrl = ''

    switch (section) {
      case 'dates':
        params.set('departure', tempDepartureDate)
        params.set('return', tempReturnDate)
        params.set('travelers', travelers.toString())
        if (directOnly) params.set('directOnly', 'true')
        newUrl = `/from/${origin}/${flightTime}/${theme}?${params.toString()}`
        break

      case 'travelers':
        if (departureDate) params.set('departure', departureDate)
        if (returnDate) params.set('return', returnDate)
        params.set('travelers', tempTravelers.toString())
        if (directOnly) params.set('directOnly', 'true')
        newUrl = `/from/${origin}/${flightTime}/${theme}?${params.toString()}`
        break

      case 'flightTime':
        const newFlightTime = `${tempMinTime}-${tempMaxTime}`
        if (departureDate) params.set('departure', departureDate)
        if (returnDate) params.set('return', returnDate)
        params.set('travelers', travelers.toString())
        if (directOnly) params.set('directOnly', 'true')
        newUrl = `/from/${origin}/${newFlightTime}/${theme}?${params.toString()}`
        break

      case 'theme':
        if (departureDate) params.set('departure', departureDate)
        if (returnDate) params.set('return', returnDate)
        params.set('travelers', travelers.toString())
        if (directOnly) params.set('directOnly', 'true')
        newUrl = `/from/${origin}/${flightTime}/${tempTheme}?${params.toString()}`
        break
    }

    setExpandedSection(null)
    setIsNavigating(true)

    startTransition(() => {
      router.push(newUrl)
    })
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getTripLength = () => {
    if (!departureDate || !returnDate) return null
    const start = new Date(departureDate)
    const end = new Date(returnDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  const tripDays = getTripLength()

  return (
    <>
      {/* Loading Overlay */}
      {(isPending || isNavigating) && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-black/80 backdrop-blur-xl rounded-2xl px-8 py-6 border border-white/20 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-brand-gold animate-spin" />
            <p className="text-white font-medium">Updating results...</p>
          </div>
        </div>
      )}

      <div ref={panelRef} className="relative">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-4">
          <div className="flex items-center justify-center gap-6 flex-wrap">
          {/* Origin - Not editable for now */}
          <div className="flex items-center gap-2 opacity-60">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs text-white/60">From</div>
              <div className="text-sm font-medium text-white">{originCity || origin}</div>
            </div>
          </div>

          {/* Dates - Clickable */}
          {departureDate && returnDate && (
            <button
              onClick={() => setExpandedSection(expandedSection === 'dates' ? null : 'dates')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all
                         hover:bg-white/10 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs text-white/60">Dates</div>
                <div className="text-sm font-medium text-white">
                  {formatDate(departureDate)} - {formatDate(returnDate)}
                  {tripDays && <span className="text-white/60 ml-1">({tripDays}d)</span>}
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-white/60 transition-transform ${
                  expandedSection === 'dates' ? 'rotate-180' : ''
                }`}
              />
            </button>
          )}

          {/* Travelers - Clickable */}
          <button
            onClick={() => setExpandedSection(expandedSection === 'travelers' ? null : 'travelers')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all
                       hover:bg-white/10 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs text-white/60">Travelers</div>
              <div className="text-sm font-medium text-white">{travelers} {travelers === 1 ? 'person' : 'people'}</div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-white/60 transition-transform ${
                expandedSection === 'travelers' ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Flight Time - Clickable */}
          <button
            onClick={() => setExpandedSection(expandedSection === 'flightTime' ? null : 'flightTime')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all
                       hover:bg-white/10 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs text-white/60">Flight Time</div>
              <div className="text-sm font-medium text-white">{flightTime}h</div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-white/60 transition-transform ${
                expandedSection === 'flightTime' ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Theme - Clickable */}
          <button
            onClick={() => setExpandedSection(expandedSection === 'theme' ? null : 'theme')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all
                       hover:bg-white/10 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-lg">{getThemeEmoji(theme)}</span>
            </div>
            <div>
              <div className="text-xs text-white/60">Theme</div>
              <div className="text-sm font-medium text-white capitalize">{theme}</div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-white/60 transition-transform ${
                expandedSection === 'theme' ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Inline Expansion Panels */}
      {expandedSection && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 animate-slideDown">
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-6">
            {expandedSection === 'dates' && (
              <DatesPanel
                departureDate={tempDepartureDate}
                returnDate={tempReturnDate}
                onDepartureChange={setTempDepartureDate}
                onReturnChange={setTempReturnDate}
                onApply={() => applyChanges('dates')}
                onCancel={() => setExpandedSection(null)}
              />
            )}

            {expandedSection === 'travelers' && (
              <TravelersPanel
                travelers={tempTravelers}
                onTravelersChange={setTempTravelers}
                onApply={() => applyChanges('travelers')}
                onCancel={() => setExpandedSection(null)}
              />
            )}

            {expandedSection === 'flightTime' && (
              <FlightTimePanel
                minTime={tempMinTime}
                maxTime={tempMaxTime}
                onRangeChange={(min, max) => {
                  setTempMinTime(min)
                  setTempMaxTime(max)
                }}
                onApply={() => applyChanges('flightTime')}
                onCancel={() => setExpandedSection(null)}
              />
            )}

            {expandedSection === 'theme' && (
              <ThemePanel
                selectedTheme={tempTheme}
                onThemeChange={setTempTheme}
                onApply={() => applyChanges('theme')}
                onCancel={() => setExpandedSection(null)}
              />
            )}
          </div>
        </div>
      )}
      </div>
    </>
  )
}

function getThemeEmoji(theme: string): string {
  const emojis: Record<string, string> = {
    adventure: '🏔️',
    nature: '🌿',
    vibe: '🎉',
    indulge: '🍷',
    discover: '🗺️',
  }
  return emojis[theme] || '✈️'
}

// ========== Panel Components ==========

interface PanelActionsProps {
  onApply: () => void
  onCancel: () => void
}

function PanelActions({ onApply, onCancel }: PanelActionsProps) {
  return (
    <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
      <button
        onClick={onCancel}
        className="flex-1 px-4 py-2 rounded-xl text-sm font-medium
                   bg-transparent border border-white/20 text-white
                   hover:bg-white/5 transition-all"
      >
        Cancel
      </button>
      <button
        onClick={onApply}
        className="flex-1 px-4 py-2 rounded-xl text-sm font-bold
                   bg-white text-black
                   hover:bg-white/90 transition-all"
      >
        Apply
      </button>
    </div>
  )
}

interface DatesPanelProps {
  departureDate: string
  returnDate: string
  onDepartureChange: (date: string) => void
  onReturnChange: (date: string) => void
  onApply: () => void
  onCancel: () => void
}

function DatesPanel({
  departureDate,
  returnDate,
  onDepartureChange,
  onReturnChange,
  onApply,
  onCancel
}: DatesPanelProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Select Dates</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-white/60 mb-2 block">Departure</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60 pointer-events-none" />
            <input
              type="date"
              value={departureDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => onDepartureChange(e.target.value)}
              className="w-full h-12 pl-10 pr-4 rounded-xl text-sm
                         bg-white/5 border border-white/20 text-white
                         focus:outline-none focus:border-white/40 transition-all"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-white/60 mb-2 block">Return</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60 pointer-events-none" />
            <input
              type="date"
              value={returnDate}
              min={departureDate}
              onChange={(e) => onReturnChange(e.target.value)}
              className="w-full h-12 pl-10 pr-4 rounded-xl text-sm
                         bg-white/5 border border-white/20 text-white
                         focus:outline-none focus:border-white/40 transition-all"
            />
          </div>
        </div>
      </div>
      <PanelActions onApply={onApply} onCancel={onCancel} />
    </div>
  )
}

interface TravelersPanelProps {
  travelers: number
  onTravelersChange: (count: number) => void
  onApply: () => void
  onCancel: () => void
}

function TravelersPanel({ travelers, onTravelersChange, onApply, onCancel }: TravelersPanelProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Number of Travelers</h3>
      <div className="flex items-center justify-between bg-white/5 rounded-xl px-6 py-4">
        <span className="text-white font-medium">Passengers</span>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onTravelersChange(Math.max(1, travelers - 1))}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20
                       transition-all flex items-center justify-center text-white text-lg font-semibold"
          >
            −
          </button>
          <span className="text-2xl font-bold text-white w-12 text-center">{travelers}</span>
          <button
            onClick={() => onTravelersChange(Math.min(9, travelers + 1))}
            disabled={travelers >= 9}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20
                       transition-all flex items-center justify-center text-white text-lg font-semibold
                       disabled:opacity-30 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
      </div>
      <PanelActions onApply={onApply} onCancel={onCancel} />
    </div>
  )
}

interface FlightTimePanelProps {
  minTime: number
  maxTime: number
  onRangeChange: (min: number, max: number) => void
  onApply: () => void
  onCancel: () => void
}

function FlightTimePanel({ minTime, maxTime, onRangeChange, onApply, onCancel }: FlightTimePanelProps) {
  const currentTheme = THEMES[0] // Default to adventure color

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Flight Time Range</h3>
      <DualRangeSlider
        min={1}
        max={12}
        minValue={minTime}
        maxValue={maxTime}
        onChange={onRangeChange}
        formatLabel={(v) => `${v}h`}
        themeColor={currentTheme.color}
      />
      <PanelActions onApply={onApply} onCancel={onCancel} />
    </div>
  )
}

interface ThemePanelProps {
  selectedTheme: string
  onThemeChange: (theme: string) => void
  onApply: () => void
  onCancel: () => void
}

function ThemePanel({ selectedTheme, onThemeChange, onApply, onCancel }: ThemePanelProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Select Theme</h3>
      <div className="grid grid-cols-2 gap-3">
        {THEMES.map((theme) => {
          const Icon = theme.icon
          const isSelected = selectedTheme === theme.value
          return (
            <button
              key={theme.value}
              onClick={() => onThemeChange(theme.value)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                         ${isSelected
                           ? 'bg-white/20 border-2'
                           : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                         }`}
              style={isSelected ? { borderColor: theme.color } : {}}
            >
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${theme.color}30` }}
              >
                <Icon className="w-5 h-5" style={{ color: theme.color }} />
              </div>
              <span className="text-white font-medium">{theme.label}</span>
            </button>
          )
        })}
      </div>
      <PanelActions onApply={onApply} onCancel={onCancel} />
    </div>
  )
}
