'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface FormFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'datetime-local'
  error?: string
  helpText?: string
  required?: boolean
  icon?: React.ReactNode
  suffix?: React.ReactNode
  variant?: 'default' | 'minimal' | 'glass'
}

export interface SelectFieldProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label: string
  options: Array<{ value: string; label: string; disabled?: boolean }>
  error?: string
  helpText?: string
  required?: boolean
  placeholder?: string
  variant?: 'default' | 'minimal' | 'glass'
}

export interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  helpText?: string
  required?: boolean
  variant?: 'default' | 'minimal' | 'glass'
  resize?: boolean
}

// Base input styles
const getInputStyles = (variant: string, hasError: boolean) => {
  const baseStyles = [
    'w-full',
    'font-muli',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  ]

  const variantStyles = {
    default: [
      'bg-white text-black',
      'border border-gray-300',
      'rounded-md',
      'px-3 py-2',
      'text-sm',
      'focus:ring-blue-500 focus:border-blue-500'
    ],
    minimal: [
      'bg-white text-black',
      'border-0 border-b-2 border-gray-300',
      'rounded-none',
      'px-2 py-1',
      'text-xs',
      'focus:ring-0 focus:border-blue-500'
    ],
    glass: [
      'bg-white/90 text-black',
      'border border-white/30',
      'rounded-lg',
      'px-3 py-2',
      'text-sm',
      'backdrop-blur-sm',
      'focus:ring-white/50 focus:border-white/50',
      'placeholder:text-gray-500'
    ]
  }

  const errorStyles = hasError && [
    'border-red-500',
    'focus:ring-red-500 focus:border-red-500'
  ]

  return cn(baseStyles, variantStyles[variant], errorStyles)
}

// Label component
const FieldLabel = ({ 
  label, 
  required, 
  htmlFor,
  className 
}: { 
  label: string
  required?: boolean
  htmlFor?: string
  className?: string 
}) => (
  <label 
    htmlFor={htmlFor}
    className={cn(
      "block text-white/90 font-muli text-xs mb-2",
      className
    )}
  >
    {label}
    {required && <span className="text-red-400 ml-1">*</span>}
  </label>
)

// Error message component
const FieldError = ({ error }: { error?: string }) => {
  if (!error) return null
  
  return (
    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {error}
    </p>
  )
}

// Help text component
const FieldHelpText = ({ helpText }: { helpText?: string }) => {
  if (!helpText) return null
  
  return (
    <p className="text-white/60 text-xs mt-1">
      {helpText}
    </p>
  )
}

// Input Field Component
const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ 
    label,
    type = 'text',
    error,
    helpText,
    required = false,
    icon,
    suffix,
    variant = 'default',
    className,
    id,
    ...props
  }, ref) => {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, '-')
    const hasError = !!error

    return (
      <div className="space-y-1">
        <FieldLabel 
          label={label} 
          required={required} 
          htmlFor={fieldId} 
        />
        
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            id={fieldId}
            type={type}
            className={cn(
              getInputStyles(variant, hasError),
              icon && 'pl-10',
              suffix && 'pr-10',
              className
            )}
            {...props}
          />
          
          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {suffix}
            </div>
          )}
        </div>
        
        <FieldError error={error} />
        <FieldHelpText helpText={helpText} />
      </div>
    )
  }
)

FormField.displayName = "FormField"

// Select Field Component
const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ 
    label,
    options,
    error,
    helpText,
    required = false,
    placeholder,
    variant = 'default',
    className,
    id,
    ...props
  }, ref) => {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, '-')
    const hasError = !!error

    return (
      <div className="space-y-1">
        <FieldLabel 
          label={label} 
          required={required} 
          htmlFor={fieldId} 
        />
        
        <div className="relative">
          <select
            ref={ref}
            id={fieldId}
            className={cn(
              getInputStyles(variant, hasError),
              'appearance-none',
              'pr-10',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Dropdown arrow */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        <FieldError error={error} />
        <FieldHelpText helpText={helpText} />
      </div>
    )
  }
)

SelectField.displayName = "SelectField"

// TextArea Field Component
const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ 
    label,
    error,
    helpText,
    required = false,
    variant = 'default',
    resize = true,
    className,
    id,
    rows = 3,
    ...props
  }, ref) => {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, '-')
    const hasError = !!error

    return (
      <div className="space-y-1">
        <FieldLabel 
          label={label} 
          required={required} 
          htmlFor={fieldId} 
        />
        
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          className={cn(
            getInputStyles(variant, hasError),
            !resize && 'resize-none',
            className
          )}
          {...props}
        />
        
        <FieldError error={error} />
        <FieldHelpText helpText={helpText} />
      </div>
    )
  }
)

TextAreaField.displayName = "TextAreaField"

// Checkbox Field Component
interface CheckboxFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  description?: string
  error?: string
}

const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ 
    label,
    description,
    error,
    className,
    id,
    ...props
  }, ref) => {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1">
        <div className="flex items-start gap-3">
          <input
            ref={ref}
            id={fieldId}
            type="checkbox"
            className={cn(
              "w-4 h-4 mt-0.5",
              "text-blue-600 bg-white border-gray-300 rounded",
              "focus:ring-blue-500 focus:ring-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              className
            )}
            {...props}
          />
          
          <div className="flex-1">
            <label 
              htmlFor={fieldId}
              className="text-white/90 font-muli text-sm cursor-pointer"
            >
              {label}
            </label>
            {description && (
              <p className="text-white/60 text-xs mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
        
        <FieldError error={error} />
      </div>
    )
  }
)

CheckboxField.displayName = "CheckboxField"

export { 
  FormField, 
  SelectField, 
  TextAreaField, 
  CheckboxField,
  FieldLabel,
  FieldError,
  FieldHelpText
}