interface TripTypeToggleProps {
  tripType: 'one-way' | 'return'
  onTripTypeChange: (tripType: 'one-way' | 'return') => void
}

export function TripTypeToggle({ tripType, onTripTypeChange }: TripTypeToggleProps) {
  return (
    <div className="mb-4">
      <div className="grid grid-cols-2 gap-1 bg-white/20 rounded p-1">
        <button
          type="button"
          onClick={() => onTripTypeChange('return')}
          className={`py-2 px-3 rounded text-sm transition-all ${
            tripType === 'return'
              ? 'bg-white text-black'
              : 'text-white hover:bg-white/20'
          }`}
          aria-pressed={tripType === 'return'}
        >
          Return
        </button>
        <button
          type="button"
          onClick={() => onTripTypeChange('one-way')}
          className={`py-2 px-3 rounded text-sm transition-all ${
            tripType === 'one-way'
              ? 'bg-white text-black'
              : 'text-white hover:bg-white/20'
          }`}
          aria-pressed={tripType === 'one-way'}
        >
          One way
        </button>
      </div>
    </div>
  )
}