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
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-white/90">
          FLIGHT TIME
        </label>
        <div className="text-sm text-white font-medium">
          Up to {formatTime(value)}
        </div>
      </div>
      
      <div className="relative pb-8">
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
            className={`w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider ${
              isDragging ? 'active' : ''
            }`}
            style={{
              background: `linear-gradient(to right, #f97316 0%, #f97316 ${getSliderPosition()}%, rgba(255,255,255,0.2) ${getSliderPosition()}%, rgba(255,255,255,0.2) 100%)`
            }}
          />
          
          {/* Custom thumb indicator */}
          <div
            className={`absolute top-1/2 w-5 h-5 bg-orange-500 border-2 border-white rounded-full transform -translate-y-1/2 -translate-x-1/2 shadow-lg transition-all duration-150 ${
              isDragging ? 'scale-110 shadow-xl' : ''
            }`}
            style={{ left: `${getSliderPosition()}%` }}
          />
        </div>
        
        {/* Tick marks */}
        <div className="relative">
          {generateTicks()}
        </div>
        
        {/* Range description */}
        <div className="mt-3 text-xs text-white/60">
          Shows flights from 0 hours up to {formatTime(value)}
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #f97316;
          border: 2px solid white;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          transition: all 0.15s ease;
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #f97316;
          border: 2px solid white;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          transition: all 0.15s ease;
        }
        
        .slider::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .slider.active::-webkit-slider-thumb {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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