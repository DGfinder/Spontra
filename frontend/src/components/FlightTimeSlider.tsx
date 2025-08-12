'use client'

import { useState, useEffect, useMemo } from 'react'

interface FlightTimeSliderProps {
  value?: number // For backward compatibility
  onChange?: (value: number) => void // For backward compatibility
  rangeValue?: [number, number]
  onRangeChange?: (range: [number, number]) => void
  min?: number
  max?: number
  step?: number
  mode?: 'single' | 'range'
  // Optional density overlay: array of { hour, value(0..1) }
  density?: { hour: number; value: number }[]
}

export function FlightTimeSlider({ 
  value, 
  onChange, 
  rangeValue,
  onRangeChange,
  min = 0, 
  max = 12, 
  step = 0.5,
  mode = 'range',
  density
}: FlightTimeSliderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [activeThumb, setActiveThumb] = useState<'min' | 'max' | null>(null)
  const [isFocused, setIsFocused] = useState<'min' | 'max' | null>(null)
  
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

  const keyboardStep = (e: React.KeyboardEvent) => {
    const multiplier = e.ctrlKey || e.metaKey ? 4 : e.shiftKey ? 2 : 1
    return step * multiplier
  }

  const onKeyDownMin = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const delta = keyboardStep(e)
    if (['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp'].includes(e.key)) {
      e.preventDefault()
      const sign = e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 1
      const next = currentRange[0] + sign * delta
      handleRangeChange(next, currentRange[1])
    }
  }

  const onKeyDownMax = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const delta = keyboardStep(e)
    if (['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp'].includes(e.key)) {
      e.preventDefault()
      const sign = e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 1
      const next = currentRange[1] + sign * delta
      handleRangeChange(currentRange[0], next)
    }
  }

  const minPos = useMemo(() => getSliderPosition(currentRange[0]), [currentRange, min, max])
  const maxPos = useMemo(() => getSliderPosition(currentRange[1]), [currentRange, min, max])

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
      
      <div className="relative pb-8">
        {isRangeMode ? (
          /* Dual range slider */
          <div className="relative">
            {/* Track background */}
            <div className="w-full h-1 bg-white/20 rounded absolute top-0"></div>

            {/* Density overlay */}
            {density && density.length > 0 && (
              <div className="absolute top-0 left-0 right-0 h-1 flex items-stretch pointer-events-none">
                {density.map((d, idx) => {
                  const left = getSliderPosition(Math.max(min, Math.min(d.hour, max)))
                  const opacity = Math.max(0.08, Math.min(d.value, 1))
                  return (
                    <div
                      key={idx}
                      className="absolute h-1 bg-white rounded"
                      style={{ left: `${left}%`, width: '2px', opacity }}
                    />
                  )
                })}
              </div>
            )}
            
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
              onFocus={() => setIsFocused('min')}
              onBlur={() => setIsFocused(null)}
              onKeyDown={onKeyDownMin}
              className={`absolute w-full h-1 bg-transparent appearance-none cursor-pointer slider z-10 ${
                isDragging && activeThumb === 'min' ? 'active' : ''
              }`}
              aria-label="Minimum flight time"
              aria-valuemin={min}
              aria-valuemax={currentRange[1] - step}
              aria-valuenow={currentRange[0]}
              aria-valuetext={`Minimum ${formatTime(currentRange[0])}`}
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
              onFocus={() => setIsFocused('max')}
              onBlur={() => setIsFocused(null)}
              onKeyDown={onKeyDownMax}
              className={`absolute w-full h-1 bg-transparent appearance-none cursor-pointer slider z-10 ${
                isDragging && activeThumb === 'max' ? 'active' : ''
              }`}
              aria-label="Maximum flight time"
              aria-valuemin={currentRange[0] + step}
              aria-valuemax={max}
              aria-valuenow={currentRange[1]}
              aria-valuetext={`Maximum ${formatTime(currentRange[1])}`}
            />

            {/* Tooltips */}
            {(isDragging || isFocused) && (
              <>
                <div
                  className="absolute -top-6 transform -translate-x-1/2 text-[10px] text-white bg-black/60 px-1.5 py-0.5 rounded"
                  style={{ left: `${minPos}%` }}
                >
                  {formatTime(currentRange[0])}
                </div>
                <div
                  className="absolute -top-6 transform -translate-x-1/2 text-[10px] text-white bg-black/60 px-1.5 py-0.5 rounded"
                  style={{ left: `${maxPos}%` }}
                >
                  {formatTime(currentRange[1])}
                </div>
              </>
            )}
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