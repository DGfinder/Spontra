'use client'

import { useState, useEffect } from 'react'

interface FlightTimeSliderProps {
  value?: number // For backward compatibility
  onChange?: (value: number) => void // For backward compatibility
  rangeValue?: [number, number]
  onRangeChange?: (range: [number, number]) => void
  min?: number
  max?: number
  step?: number
  mode?: 'single' | 'range'
}

export function FlightTimeSlider({ 
  value, 
  onChange, 
  rangeValue,
  onRangeChange,
  min = 0, 
  max = 12, 
  step = 0.5,
  mode = 'range'
}: FlightTimeSliderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [activeThumb, setActiveThumb] = useState<'min' | 'max' | null>(null)
  
  // Internal state for range mode
  const [internalRange, setInternalRange] = useState<[number, number]>([
    rangeValue?.[0] ?? 1,
    rangeValue?.[1] ?? value ?? 8
  ])
  
  // Update internal range when props change
  useEffect(() => {
    if (rangeValue) {
      setInternalRange(rangeValue)
    } else if (value !== undefined) {
      setInternalRange([1, value])
    }
  }, [rangeValue, value])
  
  const currentRange = rangeValue ?? internalRange
  const isRangeMode = mode === 'range'

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

  const getSliderPosition = (val: number) => {
    return ((val - min) / (max - min)) * 100
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)
    if (!isRangeMode) {
      onChange?.(newValue)
    }
  }

  const handleRangeChange = (newMin: number, newMax: number) => {
    const clampedMin = Math.max(min, Math.min(newMin, newMax - step))
    const clampedMax = Math.min(max, Math.max(newMax, newMin + step))
    const newRange: [number, number] = [clampedMin, clampedMax]
    
    setInternalRange(newRange)
    onRangeChange?.(newRange)
  }

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = parseFloat(e.target.value)
    handleRangeChange(newMin, currentRange[1])
  }

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = parseFloat(e.target.value)
    handleRangeChange(currentRange[0], newMax)
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
          {isRangeMode 
            ? `${formatTime(currentRange[0])} - ${formatTime(currentRange[1])}`
            : `Up to ${formatTime(value ?? currentRange[1])}`
          }
        </div>
      </div>
      
      <div className="relative pb-6">
        {isRangeMode ? (
          /* Dual range slider */
          <div className="relative">
            {/* Track background */}
            <div className="w-full h-1 bg-white/20 rounded absolute top-0"></div>
            
            {/* Active range track */}
            <div 
              className="h-1 bg-white rounded absolute top-0"
              style={{
                left: `${getSliderPosition(currentRange[0])}%`,
                width: `${getSliderPosition(currentRange[1]) - getSliderPosition(currentRange[0])}%`
              }}
            ></div>
            
            {/* Minimum value slider */}
            <input
              type="range"
              min={min}
              max={currentRange[1] - step}
              step={step}
              value={currentRange[0]}
              onChange={handleMinChange}
              onMouseDown={() => { setIsDragging(true); setActiveThumb('min') }}
              onMouseUp={() => { setIsDragging(false); setActiveThumb(null) }}
              onTouchStart={() => { setIsDragging(true); setActiveThumb('min') }}
              onTouchEnd={() => { setIsDragging(false); setActiveThumb(null) }}
              className={`absolute w-full h-1 bg-transparent appearance-none cursor-pointer slider z-10 ${
                isDragging && activeThumb === 'min' ? 'active' : ''
              }`}
            />
            
            {/* Maximum value slider */}
            <input
              type="range"
              min={currentRange[0] + step}
              max={max}
              step={step}
              value={currentRange[1]}
              onChange={handleMaxChange}
              onMouseDown={() => { setIsDragging(true); setActiveThumb('max') }}
              onMouseUp={() => { setIsDragging(false); setActiveThumb(null) }}
              onTouchStart={() => { setIsDragging(true); setActiveThumb('max') }}
              onTouchEnd={() => { setIsDragging(false); setActiveThumb(null) }}
              className={`absolute w-full h-1 bg-transparent appearance-none cursor-pointer slider z-10 ${
                isDragging && activeThumb === 'max' ? 'active' : ''
              }`}
            />
          </div>
        ) : (
          /* Single value slider (backward compatibility) */
          <div className="relative">
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value ?? currentRange[1]}
              onChange={handleSliderChange}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onTouchStart={() => setIsDragging(true)}
              onTouchEnd={() => setIsDragging(false)}
              className={`w-full h-1 bg-white/20 rounded appearance-none cursor-pointer slider ${
                isDragging ? 'active' : ''
              }`}
              style={{
                background: `linear-gradient(to right, rgb(230, 230, 230) 0%, rgb(230, 230, 230) ${getSliderPosition(value ?? currentRange[1])}%, rgba(255,255,255,0.2) ${getSliderPosition(value ?? currentRange[1])}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
          </div>
        )}
        
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