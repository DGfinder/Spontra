import { cn } from '@/lib/utils'

interface TripTypeToggleProps {
  tripType: 'one-way' | 'return'
  onTripTypeChange: (tripType: 'one-way' | 'return') => void
  accentColor?: string
}

const OPTIONS: Array<{ label: string; value: 'one-way' | 'return' }> = [
  { label: 'Return', value: 'return' },
  { label: 'One way', value: 'one-way' },
]

export function TripTypeToggle({ tripType, onTripTypeChange, accentColor = '#f97316' }: TripTypeToggleProps) {
  return (
    <div className="space-y-2">
      <label className="flex items-center justify-between text-white/80 uppercase tracking-[0.18em] text-[11px] font-semibold font-muli">
        <span>Trip type</span>
      </label>
      <div className="flex items-center gap-2 rounded-full bg-white/10 p-1.5 backdrop-blur-sm">
        {OPTIONS.map((option) => {
          const isActive = tripType === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onTripTypeChange(option.value)}
              className={cn(
                'flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200',
                isActive
                  ? 'text-slate-900 shadow-[0_12px_24px_rgba(0,0,0,0.35)]'
                  : 'text-white/70 hover:text-white'
              )}
              style={isActive ? { backgroundColor: accentColor } : undefined}
              aria-pressed={isActive}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

