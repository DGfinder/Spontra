'use client'

import { ChevronRight, Home, Search, Map, Building, Activity, Plane, CheckCircle } from 'lucide-react'
import { useNavigationState, useNavigationActions } from '@/store/searchStore'

interface BreadcrumbItem {
  step: string
  label: string
  icon: React.ReactNode
  isActive: boolean
  isCompleted: boolean
  onClick?: () => void
}

interface BreadcrumbNavigationProps {
  className?: string
}

export function BreadcrumbNavigation({ className = '' }: BreadcrumbNavigationProps) {
  const navigation = useNavigationState()
  const { navigateToStep } = useNavigationActions()

  // Define the navigation steps in order
  const steps = [
    { step: 'search', label: 'Search', icon: <Search size={16} /> },
    { step: 'results', label: 'Results', icon: <Map size={16} /> },
    { step: 'countries', label: 'Countries', icon: <Map size={16} /> },
    { step: 'cities', label: 'Cities', icon: <Building size={16} /> },
    { step: 'activities', label: 'Activities', icon: <Activity size={16} /> },
    { step: 'flights', label: 'Flights', icon: <Plane size={16} /> },
    { step: 'booking', label: 'Booking', icon: <CheckCircle size={16} /> }
  ]

  // Find current step index
  const currentStepIndex = steps.findIndex(step => step.step === navigation.currentStep)

  // Build breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = steps.map((step, index) => {
    const isActive = step.step === navigation.currentStep
    const isCompleted = index < currentStepIndex
    const isAccessible = index <= currentStepIndex

    return {
      step: step.step,
      label: step.label,
      icon: step.icon,
      isActive,
      isCompleted,
      onClick: isAccessible ? () => navigateToStep(step.step as any) : undefined
    }
  })

  // Only show breadcrumbs after the search step
  if (currentStepIndex <= 0) {
    return <></>
  }

  return (
    <nav className={`bg-black/20 backdrop-blur-sm border-b border-white/10 ${className}`} aria-label="Navigation breadcrumb">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center py-3 overflow-x-auto">
          {/* Home/Search Step */}
          <button
            onClick={() => navigateToStep('search')}
            className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors duration-200 px-2 py-1 rounded-md hover:bg-white/10 min-w-0"
          >
            <Home size={16} />
            <span className="text-sm font-medium hidden sm:inline">Home</span>
          </button>

          {/* Breadcrumb Items */}
          {breadcrumbItems.slice(1, currentStepIndex + 1).map((item, index) => (
            <div key={item.step} className="flex items-center">
              {/* Separator */}
              <ChevronRight size={16} className="text-white/40 mx-1 sm:mx-2 flex-shrink-0" />
              
              {/* Breadcrumb Item */}
              <button
                onClick={item.onClick}
                disabled={!item.onClick}
                className={`flex items-center space-x-2 px-2 py-1 rounded-md transition-all duration-200 min-w-0 ${
                  item.isActive
                    ? 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20'
                    : item.isCompleted
                    ? 'text-white/80 hover:text-white hover:bg-white/10'
                    : 'text-white/40 cursor-not-allowed'
                }`}
                aria-current={item.isActive ? 'page' : undefined}
              >
                <div className={`flex-shrink-0 ${item.isCompleted ? 'text-green-400' : ''}`}>
                  {item.isCompleted ? <CheckCircle size={16} /> : item.icon}
                </div>
                <span className="text-sm font-medium hidden sm:inline truncate">
                  {item.label}
                </span>
              </button>
            </div>
          ))}

          {/* Current Step Indicator for Mobile */}
          <div className="sm:hidden ml-auto flex items-center space-x-2 bg-yellow-400/10 border border-yellow-400/20 rounded-md px-2 py-1">
            <div className="text-yellow-400">
              {breadcrumbItems[currentStepIndex]?.icon}
            </div>
            <span className="text-yellow-400 text-sm font-medium">
              {breadcrumbItems[currentStepIndex]?.label}
            </span>
          </div>
        </div>
      </div>
    </nav>
  )
}