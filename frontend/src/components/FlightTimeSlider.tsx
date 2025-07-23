'use client'

import { useState, useEffect } from 'react'

interface FlightTimeSliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}

export function FlightTimeSlider({ 
  value, 
  onChange, 
  min = 0, 
  max = 12, 
  step = 0.5 
}: FlightTimeSliderProps) {
  const [isDragging, setIsDragging] = useState(false)

  const formatTime = (hours: number) => {
    if (hours === 0) return '0h'
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)
    
    if (minutes === 0) {
      return `${wholeHours}h`
    } else {
      return `${wholeHours}h ${minutes}m`
    }
  }

  const getSliderPosition = () => {
    return ((value - min) / (max - min)) * 100
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)
    onChange(newValue)
  }

  // Generate tick marks for major hour intervals
  const generateTicks = () => {
    const ticks = []
    for (let i = min; i <= max; i += 2) {
      const position = ((i - min) / (max - min)) * 100
      ticks.push(
        <div
          key={i}
          className="absolute top-6 transform -translate-x-1/2 text-xs text-white/70"
          style={{ left: `${position}%` }}
        >
          {i}h
        </div>
      )
    }
    return ticks
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-white/90 font-muli" style={{ fontSize: '12px' }}>
          FLIGHT TIME
        </label>
        <div className="text-white font-muli" style={{ fontSize: '11px' }}>
          Up to {formatTime(value)}
        </div>
      </div>
      
      <div className="relative pb-6">
        {/* Custom styled range input */}
        <div className="relative">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleSliderChange}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            className={`w-full h-1 bg-white/20 rounded appearance-none cursor-pointer slider ${
              isDragging ? 'active' : ''
            }`}
            style={{
              background: `linear-gradient(to right, rgb(230, 230, 230) 0%, rgb(230, 230, 230) ${getSliderPosition()}%, rgba(255,255,255,0.2) ${getSliderPosition()}%, rgba(255,255,255,0.2) 100%)`
            }}
          />
        </div>
        
        {/* Tick marks */}
        <div className="relative">
          {generateTicks()}
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgb(230, 230, 230);
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        
        .slider::-webkit-slider-thumb:hover {
          background: rgb(220, 220, 220);
        }
        
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgb(230, 230, 230);
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        
        .slider::-moz-range-thumb:hover {
          background: rgb(220, 220, 220);
        }
        
        .slider.active::-webkit-slider-thumb {
          background: rgb(220, 220, 220);
        }
        
        .slider::-webkit-slider-track {
          background: transparent;
        }
        
        .slider::-moz-range-track {
          background: transparent;
          border: none;
        }
      `}</style>
    </div>
  )
}