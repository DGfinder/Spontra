'use client'

import React, { useState, useEffect, useRef } from 'react'

interface DualRangeSliderProps {
  min: number
  max: number
  minValue: number
  maxValue: number
  step?: number
  onChange: (min: number, max: number) => void
  formatLabel?: (value: number) => string
  themeColor: string
}

export function DualRangeSlider({
  min,
  max,
  minValue,
  maxValue,
  step = 1,
  onChange,
  formatLabel = (v) => `${v}`,
  themeColor
}: DualRangeSliderProps) {
  const [localMin, setLocalMin] = useState(minValue)
  const [localMax, setLocalMax] = useState(maxValue)
  const trackRef = useRef<HTMLDivElement>(null)

  // Sync with external changes
  useEffect(() => {
    setLocalMin(minValue)
    setLocalMax(maxValue)
  }, [minValue, maxValue])

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (value < localMax) {
      setLocalMin(value)
      onChange(value, localMax)
    }
  }

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (value > localMin) {
      setLocalMax(value)
      onChange(localMin, value)
    }
  }

  // Calculate percentages for positioning
  const minPercent = ((localMin - min) / (max - min)) * 100
  const maxPercent = ((localMax - min) / (max - min)) * 100

  return (
    <div className="space-y-3">
      {/* Value Display */}
      <div className="flex justify-between items-center">
        <span className="text-sm" style={{ color: '#F3F6F9' }}>
          {formatLabel(localMin)} – {formatLabel(localMax)}
        </span>
      </div>

      {/* Slider Container */}
      <div className="relative h-8 flex items-center">
        {/* Track Background */}
        <div
          ref={trackRef}
          className="absolute w-full h-2 rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
        />

        {/* Active Track (between handles) */}
        <div
          className="absolute h-2 rounded-full transition-all"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
            backgroundColor: themeColor
          }}
        />

        {/* Min Range Input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localMin}
          onChange={handleMinChange}
          className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none
                     [&::-webkit-slider-thumb]:pointer-events-auto
                     [&::-moz-range-thumb]:pointer-events-auto
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-5
                     [&::-webkit-slider-thumb]:h-5
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:shadow-lg
                     [&::-webkit-slider-thumb]:transition-transform
                     [&::-webkit-slider-thumb]:hover:scale-110
                     [&::-moz-range-thumb]:appearance-none
                     [&::-moz-range-thumb]:w-5
                     [&::-moz-range-thumb]:h-5
                     [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:border-0
                     [&::-moz-range-thumb]:cursor-pointer
                     [&::-moz-range-thumb]:shadow-lg
                     [&::-moz-range-thumb]:transition-transform
                     [&::-moz-range-thumb]:hover:scale-110
                     focus:outline-none
                     z-10"
          style={{
            // @ts-ignore
            '--thumb-color': themeColor
          }}
          aria-label="Minimum value"
        />

        {/* Max Range Input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localMax}
          onChange={handleMaxChange}
          className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none
                     [&::-webkit-slider-thumb]:pointer-events-auto
                     [&::-moz-range-thumb]:pointer-events-auto
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-5
                     [&::-webkit-slider-thumb]:h-5
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:shadow-lg
                     [&::-webkit-slider-thumb]:transition-transform
                     [&::-webkit-slider-thumb]:hover:scale-110
                     [&::-moz-range-thumb]:appearance-none
                     [&::-moz-range-thumb]:w-5
                     [&::-moz-range-thumb]:h-5
                     [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:border-0
                     [&::-moz-range-thumb]:cursor-pointer
                     [&::-moz-range-thumb]:shadow-lg
                     [&::-moz-range-thumb]:transition-transform
                     [&::-moz-range-thumb]:hover:scale-110
                     focus:outline-none
                     z-20"
          style={{
            // @ts-ignore
            '--thumb-color': themeColor
          }}
          aria-label="Maximum value"
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs" style={{ color: '#A7AFB7' }}>
        <span>{formatLabel(min)}</span>
        <span>{formatLabel(max)}</span>
      </div>
    </div>
  )
}
