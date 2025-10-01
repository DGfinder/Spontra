'use client'

import { useState } from 'react'

interface FlightTimeSliderProps {
  minValue: number
  maxValue: number
  onMinChange: (value: number) => void
  onMaxChange: (value: number) => void
}

export function FlightTimeSlider({ minValue, maxValue, onMinChange, onMaxChange }: FlightTimeSliderProps) {
  const [localMin, setLocalMin] = useState(minValue)
  const [localMax, setLocalMax] = useState(maxValue)

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (value <= localMax) {
      setLocalMin(value)
      onMinChange(value)
    }
  }

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (value >= localMin) {
      setLocalMax(value)
      onMaxChange(value)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-white/70 mb-2">Min hours</label>
          <input
            type="range"
            min="1"
            max="12"
            value={localMin}
            onChange={handleMinChange}
            className="w-full accent-white"
          />
          <div className="text-center text-white text-sm mt-1">{localMin}h</div>
        </div>
        <div>
          <label className="block text-sm text-white/70 mb-2">Max hours</label>
          <input
            type="range"
            min="1"
            max="12"
            value={localMax}
            onChange={handleMaxChange}
            className="w-full accent-white"
          />
          <div className="text-center text-white text-sm mt-1">{localMax}h</div>
        </div>
      </div>
      <div className="text-center text-white/60 text-sm">
        Flight time between {localMin} and {localMax} hours
      </div>
    </div>
  )
}