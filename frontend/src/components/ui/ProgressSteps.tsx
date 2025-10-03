interface ProgressStepsProps {
  currentStep: 'search' | 'results' | 'countries'
  theme?: string
}

const THEME_COLORS: Record<string, string> = {
  adventure: '#ffbd0a',
  nature: '#02c06d',
  indulge: '#e52b00',
  vibe: '#eb5b25',
  discover: '#7f6ae4'
}

export function ProgressSteps({ currentStep, theme = 'adventure' }: ProgressStepsProps) {
  const themeColor = THEME_COLORS[theme] || THEME_COLORS.adventure

  const steps = [
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'countries', label: 'Countries', icon: '🌍' },
    { id: 'results', label: 'Destinations', icon: '✈️' }
  ]

  const currentIndex = steps.findIndex(s => s.id === currentStep)

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep
        const isCompleted = index < currentIndex
        const isUpcoming = index > currentIndex

        return (
          <div key={step.id} className="flex items-center gap-2">
            {/* Step Circle */}
            <div
              className={`
                flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium
                transition-all duration-300
                ${isActive ? 'scale-110' : 'scale-100'}
                ${isCompleted ? 'bg-white/20' : ''}
                ${isUpcoming ? 'bg-white/5' : ''}
              `}
              style={isActive ? { backgroundColor: themeColor, color: '#1A1A1A' } : {}}
            >
              {isCompleted ? '✓' : step.icon}
            </div>

            {/* Step Label (optional, only show on larger screens) */}
            <span
              className={`
                hidden md:inline-block text-sm transition-all
                ${isActive ? 'text-white font-semibold' : 'text-white/60'}
              `}
            >
              {step.label}
            </span>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="w-8 md:w-12 h-0.5 mx-1 transition-all duration-300"
                style={{
                  backgroundColor: index < currentIndex ? themeColor : 'rgba(255,255,255,0.2)'
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
