import React from 'react'
import { clsx } from 'clsx'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'adventure' | 'nature' | 'culture'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  isLoading?: boolean
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className = '',
  disabled = false,
  isLoading = false,
  children, 
  ...props 
}: ButtonProps) {
  const baseClasses = [
    'inline-flex items-center justify-center rounded-xl font-medium',
    'transition-all duration-200 ease-smooth',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
    'active:scale-[0.98] transform-gpu',
  ].join(' ')
  
  const variantClasses = {
    primary: [
      'bg-brand-blue text-white shadow-lg',
      'hover:bg-brand-blue/90 hover:shadow-xl hover:-translate-y-0.5',
      'focus:ring-brand-blue/50',
    ].join(' '),
    
    secondary: [
      'bg-white/20 text-white border border-white/30 backdrop-blur-sm',
      'hover:bg-white/30 hover:border-white/50',
      'focus:ring-white/50',
    ].join(' '),
    
    ghost: [
      'bg-transparent text-white',
      'hover:bg-white/10',
      'focus:ring-white/30',
    ].join(' '),
    
    adventure: [
      'bg-adventure text-white shadow-lg',
      'hover:bg-adventure/90 hover:shadow-xl hover:-translate-y-0.5',
      'focus:ring-adventure/50',
    ].join(' '),
    
    nature: [
      'bg-nature text-white shadow-lg',
      'hover:bg-nature/90 hover:shadow-xl hover:-translate-y-0.5',
      'focus:ring-nature/50',
    ].join(' '),
    
    culture: [
      'bg-culture text-white shadow-lg',
      'hover:bg-culture/90 hover:shadow-xl hover:-translate-y-0.5',
      'focus:ring-culture/50',
    ].join(' '),
  }
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm h-9',
    md: 'px-6 py-3 text-base h-12',
    lg: 'px-8 py-4 text-lg h-14'
  }
  
  const classes = clsx(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  )
  
  return (
    <button 
      className={classes} 
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg 
            className="animate-spin -ml-1 mr-3 h-5 w-5" 
            fill="none" 
            viewBox="0 0 24 24"
            aria-hidden="true"
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
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  )
}