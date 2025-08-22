'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { validateTheme, type ThemeKey } from '@/lib/theme'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'glass'
  size?: 'sm' | 'md' | 'lg'
  theme?: ThemeKey | string
  rounded?: boolean
  icon?: React.ReactNode
  removable?: boolean
  onRemove?: () => void
  children: React.ReactNode
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ 
    className,
    variant = 'default',
    size = 'md',
    theme = 'adventure',
    rounded = false,
    icon,
    removable = false,
    onRemove,
    children,
    ...props
  }, ref) => {
    const validTheme = validateTheme(theme)
    
    // Base styles
    const baseStyles = [
      'inline-flex items-center gap-1.5',
      'font-medium',
      'transition-all duration-200',
      'whitespace-nowrap'
    ]

    // Size variants
    const sizeStyles = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-xs', 
      lg: 'px-3 py-1.5 text-sm'
    }

    // Shape variants
    const shapeStyles = rounded ? 'rounded-full' : 'rounded-md'

    // Color variants
    const variantStyles = {
      default: [
        'bg-gray-500/20 text-gray-300',
        'border border-gray-500/30'
      ],
      secondary: [
        'bg-gray-600/20 text-gray-200',
        'border border-gray-600/30'
      ],
      success: [
        'bg-green-500/20 text-green-300',
        'border border-green-500/30'
      ],
      warning: [
        'bg-yellow-500/20 text-yellow-300',
        'border border-yellow-500/30'
      ],
      danger: [
        'bg-red-500/20 text-red-300',
        'border border-red-500/30'
      ],
      info: [
        'bg-blue-500/20 text-blue-300',
        'border border-blue-500/30'
      ],
      outline: [
        'bg-transparent text-white',
        'border border-white/30'
      ],
      glass: [
        'bg-white/10 text-white',
        'border border-white/20',
        'backdrop-blur-sm'
      ]
    }

    // Theme-based variants (when using theme prop)
    const themeStyles = {
      adventure: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
      vibe: 'bg-purple-600/20 text-purple-300 border border-purple-600/30',
      nature: 'bg-green-500/20 text-green-300 border border-green-500/30',
      indulge: 'bg-amber-600/20 text-amber-300 border border-amber-600/30',
      discover: 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
    }

    // Use theme styles if theme is provided and variant is default
    const colorStyles = variant === 'default' && theme 
      ? themeStyles[validTheme]
      : variantStyles[variant]

    const badgeClasses = cn(
      baseStyles,
      sizeStyles[size],
      shapeStyles,
      colorStyles,
      className
    )

    return (
      <span className={badgeClasses} ref={ref} {...props}>
        {icon && (
          <span className="flex-shrink-0">
            {icon}
          </span>
        )}
        <span className="truncate">{children}</span>
        {removable && onRemove && (
          <button
            onClick={onRemove}
            className="flex-shrink-0 ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
            aria-label="Remove badge"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </span>
    )
  }
)

Badge.displayName = "Badge"

// Specialized badge variants for common use cases
export const StatusBadge = forwardRef<HTMLSpanElement, Omit<BadgeProps, 'variant'> & { 
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'error' 
}>(({ status, ...props }, ref) => {
  const statusVariants = {
    active: 'success',
    inactive: 'secondary',
    pending: 'warning',
    completed: 'success',
    error: 'danger'
  } as const

  return <Badge ref={ref} variant={statusVariants[status]} {...props} />
})

StatusBadge.displayName = "StatusBadge"

export const PriceBadge = forwardRef<HTMLSpanElement, Omit<BadgeProps, 'variant'> & { 
  trend: 'up' | 'down' | 'stable'
}>(({ trend, children, ...props }, ref) => {
  const trendIcons = {
    up: '↗',
    down: '↘', 
    stable: '→'
  }

  const trendVariants = {
    up: 'danger',
    down: 'success',
    stable: 'info'
  } as const

  return (
    <Badge 
      ref={ref} 
      variant={trendVariants[trend]} 
      icon={<span>{trendIcons[trend]}</span>}
      {...props}
    >
      {children}
    </Badge>
  )
})

PriceBadge.displayName = "PriceBadge"

export const VisaFreeBadge = forwardRef<HTMLSpanElement, Omit<BadgeProps, 'variant' | 'children'>>(
  (props, ref) => {
    return (
      <Badge 
        ref={ref} 
        variant="success" 
        rounded
        icon={<span>✈️</span>}
        {...props}
      >
        Visa-free
      </Badge>
    )
  }
)

VisaFreeBadge.displayName = "VisaFreeBadge"

export const ThemeBadge = forwardRef<HTMLSpanElement, Omit<BadgeProps, 'variant'> & { 
  themeType: ThemeKey 
}>(({ themeType, ...props }, ref) => {
  const themeLabels = {
    adventure: 'Adventure',
    vibe: 'Social Energy',
    nature: 'Nature',
    indulge: 'Luxury & Wellness',
    discover: 'Culture & Cuisine'
  }

  return (
    <Badge 
      ref={ref} 
      theme={themeType}
      rounded
      {...props}
    >
      {themeLabels[themeType]}
    </Badge>
  )
})

ThemeBadge.displayName = "ThemeBadge"

export { Badge }