'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { validateTheme, type ThemeKey } from '@/lib/theme'

export interface BaseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'outline' | 'minimal'
  hover?: boolean
  interactive?: boolean
  theme?: ThemeKey | string
  children: React.ReactNode
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  badge?: React.ReactNode
  flag?: string
  children?: React.ReactNode
}

export interface CardMediaProps extends React.HTMLAttributes<HTMLDivElement> {
  images: string[]
  currentIndex?: number
  onImageChange?: (index: number) => void
  aspectRatio?: 'square' | 'video' | 'wide'
  children?: React.ReactNode
}

export interface CardStatsProps extends React.HTMLAttributes<HTMLDivElement> {
  stats: Array<{
    icon?: React.ReactNode
    value: string
    label: string
    color?: string
  }>
  columns?: 2 | 3 | 4
}

export interface CardInsightProps extends React.HTMLAttributes<HTMLDivElement> {
  type: 'price' | 'trend' | 'urgency' | 'info' | 'warning' | 'success'
  title: string
  description: string
  icon?: React.ReactNode
}

export interface CardActionProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  onClick: () => void
  theme: ThemeKey | string
  variant?: 'primary' | 'outline' | 'ghost'
  loading?: boolean
  disabled?: boolean
}

// Base Card Component
const Card = forwardRef<HTMLDivElement, BaseCardProps>(
  ({ 
    className,
    variant = 'glass',
    hover = false,
    interactive = false,
    theme = 'adventure',
    children,
    ...props
  }, ref) => {
    const validTheme = validateTheme(theme)
    
    const baseStyles = [
      'rounded-xl',
      'transition-all duration-300',
      'overflow-hidden'
    ]

    const variantStyles = {
      glass: [
        'bg-black/40 backdrop-blur-sm',
        'border border-white/20',
        hover && 'hover:bg-black/50 hover:border-white/30'
      ],
      solid: [
        'bg-white',
        'border border-gray-200',
        'shadow-md',
        hover && 'hover:shadow-lg'
      ],
      outline: [
        'bg-transparent',
        'border-2 border-white/30',
        hover && 'hover:border-white/50 hover:bg-white/5'
      ],
      minimal: [
        'bg-transparent',
        hover && 'hover:bg-white/5'
      ]
    }

    const interactiveStyles = interactive && [
      'cursor-pointer',
      'hover:scale-[1.02]',
      'active:scale-[0.98]'
    ]

    const cardClasses = cn(
      baseStyles,
      variantStyles[variant],
      interactiveStyles,
      className
    )

    return (
      <div className={cardClasses} ref={ref} {...props}>
        {children}
      </div>
    )
  }
)

Card.displayName = "Card"

// Card Header Component
const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, badge, flag, children, ...props }, ref) => {
    return (
      <div 
        className={cn("flex items-center justify-between p-4 pb-2", className)} 
        ref={ref} 
        {...props}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {flag && <span className="text-xl flex-shrink-0">{flag}</span>}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-white/70 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {badge && (
          <div className="flex-shrink-0 ml-2">
            {badge}
          </div>
        )}
        {children}
      </div>
    )
  }
)

CardHeader.displayName = "CardHeader"

// Card Media Component  
const CardMedia = forwardRef<HTMLDivElement, CardMediaProps>(
  ({ 
    className, 
    images, 
    currentIndex = 0, 
    onImageChange,
    aspectRatio = 'video',
    children,
    ...props 
  }, ref) => {
    const aspectStyles = {
      square: 'aspect-square',
      video: 'aspect-video', 
      wide: 'aspect-[21/9]'
    }

    const handlePrevImage = () => {
      if (onImageChange && images.length > 1) {
        const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1
        onImageChange(newIndex)
      }
    }

    const handleNextImage = () => {
      if (onImageChange && images.length > 1) {
        const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0
        onImageChange(newIndex)
      }
    }

    return (
      <div 
        className={cn("relative", aspectStyles[aspectRatio], className)} 
        ref={ref} 
        {...props}
      >
        {images.length > 0 && (
          <img
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
        
        {images.length > 1 && onImageChange && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 hover:bg-black/60 text-white/90 rounded-full flex items-center justify-center transition-all duration-200"
              aria-label="Previous image"
            >
              ←
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 hover:bg-black/60 text-white/90 rounded-full flex items-center justify-center transition-all duration-200"
              aria-label="Next image"
            >
              →
            </button>
            
            {/* Image indicators */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => onImageChange(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-200",
                    index === currentIndex 
                      ? "bg-white" 
                      : "bg-white/50 hover:bg-white/70"
                  )}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
        
        {children}
      </div>
    )
  }
)

CardMedia.displayName = "CardMedia"

// Card Stats Component
const CardStats = forwardRef<HTMLDivElement, CardStatsProps>(
  ({ className, stats, columns = 3, ...props }, ref) => {
    const gridCols = {
      2: 'grid-cols-2',
      3: 'grid-cols-3', 
      4: 'grid-cols-4'
    }

    return (
      <div 
        className={cn("px-4 py-2", className)} 
        ref={ref} 
        {...props}
      >
        <div className={cn("grid gap-3", gridCols[columns])}>
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              {stat.icon && (
                <div className="flex justify-center mb-1 text-white/80">
                  {stat.icon}
                </div>
              )}
              <div 
                className={cn(
                  "text-sm font-semibold",
                  stat.color || "text-white"
                )}
              >
                {stat.value}
              </div>
              <div className="text-xs text-white/60 truncate">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
)

CardStats.displayName = "CardStats"

// Card Insight Component
const CardInsight = forwardRef<HTMLDivElement, CardInsightProps>(
  ({ className, type, title, description, icon, ...props }, ref) => {
    const typeStyles = {
      price: 'bg-blue-900/20 border-blue-500/30 text-blue-300',
      trend: 'bg-green-900/20 border-green-500/30 text-green-300',
      urgency: 'bg-red-900/20 border-red-500/30 text-red-300',
      info: 'bg-blue-900/20 border-blue-500/30 text-blue-300',
      warning: 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300',
      success: 'bg-green-900/20 border-green-500/30 text-green-300'
    }

    return (
      <div 
        className={cn(
          "rounded-lg p-2 border text-xs",
          typeStyles[type],
          className
        )} 
        ref={ref} 
        {...props}
      >
        <div className="flex items-start gap-2">
          {icon && (
            <div className="flex-shrink-0 mt-0.5">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{title}</div>
            <div className="text-white/70 leading-tight mt-0.5">
              {description}
            </div>
          </div>
        </div>
      </div>
    )
  }
)

CardInsight.displayName = "CardInsight"

// Card Action Component
const CardAction = forwardRef<HTMLDivElement, CardActionProps>(
  ({ 
    className, 
    label, 
    onClick, 
    theme, 
    variant = 'primary',
    loading = false,
    disabled = false,
    ...props 
  }, ref) => {
    const validTheme = validateTheme(theme)
    
    const variantStyles = {
      primary: `bg-${validTheme === 'adventure' ? 'orange' : validTheme === 'party' ? 'purple' : validTheme === 'nature' ? 'green' : validTheme === 'shopping' ? 'pink' : 'blue'}-500 hover:bg-${validTheme === 'adventure' ? 'orange' : validTheme === 'party' ? 'purple' : validTheme === 'nature' ? 'green' : validTheme === 'shopping' ? 'pink' : 'blue'}-600 text-white`,
      outline: `border border-white/30 hover:border-white/50 text-white hover:bg-white/10`,
      ghost: `text-white hover:bg-white/10`
    }

    return (
      <div className={cn("p-4 pt-2", className)} ref={ref} {...props}>
        <button
          onClick={onClick}
          disabled={disabled || loading}
          className={cn(
            "w-full font-medium py-3 px-4 rounded-lg transition-all duration-200",
            "hover:scale-105 hover:shadow-lg",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
            variantStyles[variant]
          )}
          aria-label={label}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <span>Loading...</span>
            </div>
          ) : (
            label
          )}
        </button>
      </div>
    )
  }
)

CardAction.displayName = "CardAction"

// Content wrapper
const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div 
        className={cn("px-4 py-2", className)} 
        ref={ref} 
        {...props} 
      />
    )
  }
)

CardContent.displayName = "CardContent"

export { 
  Card, 
  CardHeader, 
  CardMedia, 
  CardStats, 
  CardInsight, 
  CardAction, 
  CardContent 
}