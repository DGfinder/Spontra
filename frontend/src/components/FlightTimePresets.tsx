import React from 'react'
import { FORM_DESIGN_TOKENS } from '@/lib/formDesignTokens'

interface FlightTimePresetsProps {
  currentRange: [number, number]
  onPresetSelect: (range: [number, number]) => void
  className?: string
}

const PRESETS = [
  { label: 'Short', range: [0.5, 2] as [number, number], description: 'Quick getaways' },
  { label: 'Weekend', range: [1, 4] as [number, number], description: 'Weekend trips' },
  { label: 'Medium', range: [2, 6] as [number, number], description: 'Extended stays' },
  { label: 'Long', range: [6, 12] as [number, number], description: 'Long journeys' },
  { label: 'Any', range: [0.5, 12] as [number, number], description: 'No preference' },
] as const

export function FlightTimePresets({ 
  currentRange, 
  onPresetSelect, 
  className = '' 
}: FlightTimePresetsProps) {
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {PRESETS.map((preset) => {
        const isActive = 
          currentRange[0] === preset.range[0] && 
          currentRange[1] === preset.range[1]
        
        return (
          <button
            key={preset.label}
            type="button"
            onClick={() => onPresetSelect(preset.range)}
            className={`
              ${FORM_DESIGN_TOKENS.presetButtonHeight}
              ${FORM_DESIGN_TOKENS.presetButtonPadding}
              ${FORM_DESIGN_TOKENS.fieldBorderRadius}
              ${FORM_DESIGN_TOKENS.fieldFontSize}
              font-muli
              ${FORM_DESIGN_TOKENS.transition}
              ${isActive 
                ? 'bg-white text-black shadow-sm' 
                : 'bg-white/20 text-white hover:bg-white/30'
              }
            `}
            aria-pressed={isActive}
            aria-label={`Select ${preset.label} flight time: ${preset.description}`}
            title={preset.description}
          >
            {preset.label}
          </button>
        )
      })}
    </div>
  )
}
