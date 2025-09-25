import React from 'react'
import { FORM_DESIGN_TOKENS, getThemeFocusRing } from '@/lib/formDesignTokens'

interface FormFieldProps {
  label: string
  htmlFor?: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
  theme?: string
}

export function FormField({ 
  label, 
  htmlFor, 
  error, 
  required = false, 
  children, 
  className = '',
  theme = 'adventure'
}: FormFieldProps) {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined
  const hasError = Boolean(error)
  
  return (
    <div className={`${FORM_DESIGN_TOKENS.fieldGap} ${className}`}>
      <label 
        className={`block ${FORM_DESIGN_TOKENS.labelFontSize} font-muli text-white/90 mb-2`}
        htmlFor={htmlFor}
      >
        {label}
        {required && <span className="text-red-400 ml-1" aria-label="required">*</span>}
      </label>
      
      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          'aria-describedby': hasError ? errorId : undefined,
          'aria-invalid': hasError,
          className: `${FORM_DESIGN_TOKENS.transition} ${
            hasError 
              ? `${FORM_DESIGN_TOKENS.errorBorderColor} ${FORM_DESIGN_TOKENS.errorBgColor}` 
              : getThemeFocusRing(theme)
          } ${(children as React.ReactElement).props.className || ''}`
        })}
      </div>
      
      {hasError && (
        <div 
          id={errorId}
          role="alert" 
          className={`${FORM_DESIGN_TOKENS.errorColor} ${FORM_DESIGN_TOKENS.labelFontSize} mt-1`}
        >
          {error}
        </div>
      )}
    </div>
  )
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'error'
}

export function FormInput({ 
  variant = 'default', 
  className = '', 
  ...props 
}: FormInputProps) {
  const baseClasses = `
    w-full bg-white text-black rounded border-0 font-muli
    ${FORM_DESIGN_TOKENS.fieldHeight}
    ${FORM_DESIGN_TOKENS.fieldPadding}
    ${FORM_DESIGN_TOKENS.fieldFontSize}
    ${FORM_DESIGN_TOKENS.transition}
  `.trim()
  
  const variantClasses = variant === 'error' 
    ? `${FORM_DESIGN_TOKENS.errorBorderColor} ${FORM_DESIGN_TOKENS.errorBgColor}`
    : ''
  
  return (
    <input
      {...props}
      className={`${baseClasses} ${variantClasses} ${className}`}
    />
  )
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  variant?: 'default' | 'error'
}

export function FormSelect({ 
  variant = 'default', 
  className = '', 
  ...props 
}: FormSelectProps) {
  const baseClasses = `
    w-full bg-white text-black rounded border-0 font-muli
    ${FORM_DESIGN_TOKENS.fieldHeight}
    ${FORM_DESIGN_TOKENS.fieldPadding}
    ${FORM_DESIGN_TOKENS.fieldFontSize}
    ${FORM_DESIGN_TOKENS.transition}
  `.trim()
  
  const variantClasses = variant === 'error' 
    ? `${FORM_DESIGN_TOKENS.errorBorderColor} ${FORM_DESIGN_TOKENS.errorBgColor}`
    : ''
  
  return (
    <select
      {...props}
      className={`${baseClasses} ${variantClasses} ${className}`}
    />
  )
}