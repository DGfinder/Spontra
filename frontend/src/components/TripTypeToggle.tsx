interface TripTypeToggleProps {
  tripType: 'one-way' | 'return'
  onTripTypeChange: (tripType: 'one-way' | 'return') => void
}

export function TripTypeToggle({ tripType, onTripTypeChange }: TripTypeToggleProps) {
  return (
    <div>
      <label className="block text-white/90 mb-2 font-muli" style={{ fontSize: '12px' }}>
        TRIP TYPE
      </label>
      <div className="grid grid-cols-2 gap-1 bg-white/20 rounded p-1">
        <button
          type="button"
          onClick={() => onTripTypeChange('return')}
          className={`rounded font-muli ${
            tripType === 'return'
              ? 'bg-white text-black'
              : 'text-white'
          }`}
          onMouseEnter={(e) => {
            if (tripType !== 'return') {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
            }
          }}
          onMouseLeave={(e) => {
            if (tripType !== 'return') {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
          style={{
            height: '32px',
            fontSize: '11px',
            transition: 'all 200ms ease-out'
          }}
          aria-pressed={tripType === 'return'}
        >
          Return
        </button>
        <button
          type="button"
          onClick={() => onTripTypeChange('one-way')}
          className={`rounded font-muli ${
            tripType === 'one-way'
              ? 'bg-white text-black'
              : 'text-white'
          }`}
          onMouseEnter={(e) => {
            if (tripType !== 'one-way') {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
            }
          }}
          onMouseLeave={(e) => {
            if (tripType !== 'one-way') {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
          style={{
            height: '32px',
            fontSize: '11px',
            transition: 'all 200ms ease-out'
          }}
          aria-pressed={tripType === 'one-way'}
        >
          One way
        </button>
      </div>
    </div>
  )
}