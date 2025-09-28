import React from 'react'
import { FORM_DESIGN_TOKENS } from '@/lib/formDesignTokens'
import { cn } from '@/lib/utils'

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
    <div className={cn('flex flex-wrap gap-2', className)}>
      {PRESETS.map((preset) => {
        const isActive = currentRange[0] === preset.range[0] && currentRange[1] === preset.range[1]

        return (
          <button
            key={preset.label}
            type="button"
            onClick={() => onPresetSelect(preset.range)}
            className={cn(
              'rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.18em]',
              'border transition-all duration-200',
              isActive
                ? 'bg-white text-slate-900 shadow-[0_12px_32px_rgba(0,0,0,0.35)] border-white'
                : 'bg-white/[0.08] text-white/70 border-white/10 hover:border-white/30 hover:text-white'
            )}
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
