import { Button } from './Button'
import { Plane, MapPin, Search, AlertCircle } from 'lucide-react'

interface EmptyStateProps {
  type: 'no-results' | 'error' | 'no-search'
  title: string
  description: string
  primaryAction?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  theme?: string
}

const THEME_COLORS: Record<string, string> = {
  adventure: '#ffbd0a',
  nature: '#02c06d',
  indulge: '#e52b00',
  vibe: '#eb5b25',
  discover: '#7f6ae4'
}

export function EmptyState({
  type,
  title,
  description,
  primaryAction,
  secondaryAction,
  theme = 'adventure'
}: EmptyStateProps) {
  const themeColor = THEME_COLORS[theme] || THEME_COLORS.adventure

  // Icon based on type
  const Icon = type === 'error' ? AlertCircle : type === 'no-search' ? Search : MapPin

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md animate-scale-in">
        <div
          className={`
            ${type === 'error' ? 'bg-red-500/20 border-red-400/30' : 'bg-white/10 border-white/20'}
            backdrop-blur-xl rounded-3xl p-8 border
          `}
        >
          {/* Illustration */}
          <div className="mb-6 flex justify-center">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: type === 'error' ? 'rgba(239, 68, 68, 0.2)' : `${themeColor}22`
              }}
            >
              <Icon
                className="w-12 h-12"
                style={{ color: type === 'error' ? '#f87171' : themeColor }}
              />
            </div>
          </div>

          {/* Content */}
          <h2
            className={`text-xl font-semibold mb-4 ${type === 'error' ? 'text-red-200' : 'text-white'}`}
          >
            {title}
          </h2>
          <p className={`mb-6 ${type === 'error' ? 'text-red-200/80' : 'text-white/70'}`}>
            {description}
          </p>

          {/* Actions */}
          <div className="space-y-3">
            {primaryAction && (
              <Button
                onClick={primaryAction.onClick}
                variant={type === 'error' ? 'secondary' : 'primary'}
                className="w-full"
                style={
                  type !== 'error'
                    ? {
                        backgroundColor: themeColor,
                        color: '#1A1A1A'
                      }
                    : undefined
                }
              >
                {primaryAction.label}
              </Button>
            )}
            {secondaryAction && (
              <Button onClick={secondaryAction.onClick} variant="ghost" className="w-full">
                {secondaryAction.label}
              </Button>
            )}
          </div>

          {/* Decorative elements */}
          {type === 'no-results' && (
            <div className="mt-8 flex justify-center gap-4 opacity-50">
              <Plane className="w-6 h-6 text-white/40 animate-float" />
              <MapPin className="w-6 h-6 text-white/40 animate-float" style={{ animationDelay: '0.5s' }} />
              <Plane className="w-6 h-6 text-white/40 animate-float" style={{ animationDelay: '1s' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
