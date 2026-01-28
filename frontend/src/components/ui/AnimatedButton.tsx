'use client'

import { motion, type HTMLMotionProps } from 'motion/react'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { getThemeClasses, validateTheme, type ThemeKey } from '@/lib/theme'

interface AnimatedButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode
  variant?: 'primary' | 'glass' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  theme?: ThemeKey | string
  loading?: boolean
  fullWidth?: boolean
  icon?: React.ReactNode
}

/**
 * AnimatedButton - Button with smooth press feedback and loading states.
 * 
 * Features:
 * - Press feedback (scale down on tap)
 * - Smooth loading spinner transition
 * - Hover effects
 * - Theme-aware styling
 */
export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ 
    children, 
    className, 
    variant = 'primary',
    size = 'md',
    theme = 'adventure',
    loading = false,
    fullWidth = false,
    icon,
    disabled,
    ...props 
  }, ref) => {
    const validTheme = validateTheme(theme)
    const themeClasses = getThemeClasses(validTheme)

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
      md: 'px-4 py-2 text-sm rounded-lg gap-2',
      lg: 'px-6 py-3 text-base rounded-lg gap-2.5',
      xl: 'px-8 py-4 text-lg rounded-xl gap-3'
    }

    const variantStyles = {
      primary: `${themeClasses.bg} text-white shadow-md`,
      glass: 'bg-white/10 text-white border border-white/30 backdrop-blur-sm',
      outline: `bg-transparent border-2 ${themeClasses.border} ${themeClasses.text}`,
      ghost: 'bg-transparent text-white/80'
    }

    const isDisabled = disabled || loading

    return (
      <motion.button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          sizeStyles[size],
          variantStyles[variant],
          fullWidth && 'w-full',
          loading && 'cursor-wait',
          className
        )}
        disabled={isDisabled}
        whileHover={!isDisabled ? { 
          scale: 1.03,
          transition: { duration: 0.15 }
        } : undefined}
        whileTap={!isDisabled ? { 
          scale: 0.97,
          transition: { duration: 0.1 }
        } : undefined}
        {...props}
      >
        {loading && (
          <motion.svg
            className="h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 1, rotate: 360 }}
            transition={{ 
              opacity: { duration: 0.2 },
              rotate: { duration: 1, repeat: Infinity, ease: 'linear' }
            }}
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
          </motion.svg>
        )}
        {icon && !loading && (
          <span className="flex items-center justify-center">
            {icon}
          </span>
        )}
        <span>{children}</span>
      </motion.button>
    )
  }
)

AnimatedButton.displayName = 'AnimatedButton'
