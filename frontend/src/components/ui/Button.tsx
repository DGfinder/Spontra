'use client'

import React, { forwardRef } from 'react'
import { getThemeBgClass, getThemeTextClass, getThemeClasses, validateTheme, type ThemeKey } from '@/lib/theme'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'glass' | 'outline' | 'ghost' | 'toggle' | 'icon'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  theme?: ThemeKey | string
  selected?: boolean
  loading?: boolean
  icon?: React.ReactNode
  children?: React.ReactNode
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className,
    variant = 'primary',
    size = 'md',
    theme = 'adventure',
    selected = false,
    loading = false,
    disabled,
    icon,
    children,
    fullWidth = false,
    ...props
  }, ref) => {
    const validTheme = validateTheme(theme)
    const themeClasses = getThemeClasses(validTheme)
    
    // Base button styles
    const baseStyles = [
      'inline-flex items-center justify-center',
      'font-medium',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'active:scale-95',
      fullWidth ? 'w-full' : ''
    ]

    // Size variants
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
      md: 'px-4 py-2 text-sm rounded-lg gap-2',
      lg: 'px-6 py-3 text-base rounded-lg gap-2.5',
      xl: 'px-8 py-4 text-lg rounded-xl gap-3'
    }

    // Variant styles
    const variantStyles = {
      primary: [
        `${themeClasses.bg} hover:${themeClasses.bgHover}`,
        'text-white',
        'shadow-md hover:shadow-lg',
        'hover:scale-105',
        `focus:ring-${themeClasses.ring}`
      ],
      
      glass: [
        'bg-white/10 hover:bg-white/20',
        'text-white',
        'border border-white/30 hover:border-white/50',
        'backdrop-blur-sm',
        'focus:ring-white/50'
      ],
      
      outline: [
        'bg-transparent hover:bg-white/10',
        `border-2 ${themeClasses.border}`,
        `${themeClasses.text} hover:text-white`,
        `focus:ring-${themeClasses.ring}`
      ],
      
      ghost: [
        'bg-transparent hover:bg-white/10',
        'text-white/80 hover:text-white',
        'focus:ring-white/50'
      ],
      
      toggle: selected 
        ? [
            'bg-white text-black',
            'shadow-md',
            'border border-white/20'
          ]
        : [
            'bg-white/20 hover:bg-white/30',
            'text-white/90 hover:text-white',
            'border border-white/30 hover:border-white/50'
          ],
      
      icon: [
        'bg-black/40 hover:bg-black/60',
        'text-white/90 hover:text-white',
        'rounded-full',
        'w-8 h-8 p-0',
        'focus:ring-white/50'
      ]
    }

    // Icon-only button adjustments
    if (variant === 'icon') {
      const iconSizes = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8', 
        lg: 'w-10 h-10',
        xl: 'w-12 h-12'
      }
      variantStyles.icon = [
        ...variantStyles.icon.slice(0, -3), // Remove default w-8 h-8 p-0
        iconSizes[size],
        'p-0'
      ]
    }

    const buttonClasses = cn(
      baseStyles,
      sizeStyles[size],
      variantStyles[variant],
      loading && 'cursor-wait',
      className
    )

    const content = (
      <>
        {loading && (
          <svg 
            className="animate-spin -ml-1 mr-2 h-4 w-4" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {icon && !loading && (
          <span className={children ? 'flex' : 'flex items-center justify-center'}>
            {icon}
          </span>
        )}
        {children && <span>{children}</span>}
      </>
    )

    return (
      <button
        className={buttonClasses}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {content}
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button }