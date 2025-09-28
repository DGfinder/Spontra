import React from 'react'
import { FORM_DESIGN_TOKENS, getThemeFocusRing } from '@/lib/formDesignTokens'
import { cn } from '@/lib/utils'

type ThemeName = string

export interface FormFieldProps {
  label: string
  htmlFor?: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
  theme?: ThemeName
}

export function FormField({
  label,
  htmlFor,
  error,
  required = false,
  children,
  className = '',
  theme = 'adventure',
}: FormFieldProps) {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined
  const hasError = Boolean(error)
  const focus = getThemeFocusRing(theme)

  const clonedChild = React.cloneElement(children as React.ReactElement, {
    'aria-describedby': hasError ? errorId : undefined,
    'aria-invalid': hasError,
    className: cn(
      'w-full font-muli text-[15px] text-white placeholder:text-white/45',
      'border border-white/12 bg-white/[0.07] rounded-2xl px-4 py-3 shadow-sm',
      'hover:border-white/25 focus:outline-none',
      FORM_DESIGN_TOKENS.transition,
      focus.className,
      hasError ? 'border-red-400 bg-red-900/20 focus:ring-red-400' : '',
      (children as React.ReactElement).props.className,
    ),
    style: {
      ...(children as React.ReactElement).props.style,
      ...(hasError ? {} : { ['--ring-color' as '--ring-color']: focus.ringColor }),
    },
  })

  return (
    <div className={cn('space-y-2', className)}>
      <label
        className={cn(
          'flex items-center justify-between text-white/80 uppercase tracking-[0.18em]',
          'font-semibold font-muli',
          'text-[11px]'
        )}
        htmlFor={htmlFor}
      >
        <span>{label}</span>
        {required ? <span className="text-red-300 ml-1" aria-label="required">*</span> : null}
      </label>

      <div className="relative">
        {clonedChild}
      </div>

      {hasError ? (
        <div
          id={errorId}
          role="alert"
          className={cn('text-red-300 text-[11px] font-muli')}
        >
          {error}
        </div>
      ) : null}
    </div>
  )
}

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'error'
}

export function FormInput({ variant = 'default', className = '', style, ...props }: FormInputProps) {
  const baseClasses = cn(
    'w-full font-muli text-[15px] text-white placeholder:text-white/45',
    'border border-white/12 bg-white/[0.07] rounded-2xl px-4 py-3 shadow-sm',
    'hover:border-white/25 focus:outline-none',
    FORM_DESIGN_TOKENS.transition,
    FORM_DESIGN_TOKENS.focusRing,
    variant === 'error' ? `${FORM_DESIGN_TOKENS.errorBorderColor} bg-red-900/20 focus:ring-red-400` : '',
    className,
  )

  return (
    <input
      {...props}
      className={baseClasses}
      style={style}
    />
  )
}

export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  variant?: 'default' | 'error'
}

export function FormSelect({ variant = 'default', className = '', style, ...props }: FormSelectProps) {
  const baseClasses = cn(
    'w-full font-muli text-[15px] text-white',
    'border border-white/12 bg-white/[0.07] rounded-2xl px-4 py-3 shadow-sm',
    'hover:border-white/25 focus:outline-none appearance-none',
    FORM_DESIGN_TOKENS.transition,
    FORM_DESIGN_TOKENS.focusRing,
    variant === 'error' ? `${FORM_DESIGN_TOKENS.errorBorderColor} bg-red-900/20 focus:ring-red-400` : '',
    className,
  )

  return (
    <select
      {...props}
      className={baseClasses}
      style={style}
    />
  )
}
