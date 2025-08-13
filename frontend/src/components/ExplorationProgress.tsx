'use client'

interface ExplorationProgressProps {
  currentStep: 'search' | 'countries' | 'cities' | 'activities' | 'flights' | 'booking'
  destination?: {
    city_name: string
    country_name: string
  }
}

import { useFormData } from '@/store/searchStore'
import { getThemeColor, getThemeHoverColor, type ThemeKey } from '@/lib/theme'

export function ExplorationProgress({ currentStep, destination }: ExplorationProgressProps) {
  const formData = useFormData()
  const theme = (formData.selectedTheme || 'adventure') as ThemeKey
  const steps = [
    { id: 'search', label: 'Explore', icon: '🔍' },
    { id: 'countries', label: 'Countries', icon: '🌍' },
    { id: 'cities', label: 'Cities', icon: '🏙️' },
    { id: 'activities', label: 'Activities', icon: '🎯' },
    { id: 'flights', label: 'Flights', icon: '✈️' },
    { id: 'booking', label: 'Book', icon: '🎟️' }
  ]

  const currentStepIndex = steps.findIndex(step => step.id === currentStep)

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-full px-6 py-2 flex items-center space-x-4">
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className={`flex items-center space-x-2 transition-all duration-300 ${
              index <= currentStepIndex 
                ? '' 
                : 'text-white/40'
            }`}
            style={index <= currentStepIndex ? { color: getThemeColor(theme) } : undefined}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${
              index === currentStepIndex 
                ? 'text-black' 
                : index < currentStepIndex
                ? ''
                : 'bg-white/10 text-white/40'
            }`}
            style={index === currentStepIndex
              ? { background: `linear-gradient(90deg, ${getThemeColor(theme)}, ${getThemeHoverColor(theme)})` }
              : index < currentStepIndex
              ? { backgroundColor: `${getThemeColor(theme)}33`, color: getThemeColor(theme) }
              : undefined}
            >
              {index < currentStepIndex ? '✓' : step.icon}
            </div>
            
            <span className="text-xs font-medium hidden sm:inline">
              {step.label}
            </span>
            
            {index < steps.length - 1 && (
              <div className={`w-8 h-px transition-all duration-300 ${
                index < currentStepIndex ? '' : 'bg-white/20'
              }`} 
                style={index < currentStepIndex ? { backgroundColor: getThemeColor(theme) } : undefined} />
            )}
          </div>
        ))}
        
        {destination && (currentStep === 'cities' || currentStep === 'activities' || currentStep === 'flights') && (
          <div className="ml-4 pl-4 border-l border-white/20 text-xs">
            <div className="text-white/60">
              {currentStep === 'cities' ? 'Discovering' : 
               currentStep === 'activities' ? 'Exploring' : 'Flying to'}
            </div>
            <div className="font-medium" style={{ color: getThemeColor(theme) }}>
              {currentStep === 'cities' ? destination.country_name : destination.city_name}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}