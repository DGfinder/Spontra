import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef } from 'react'
import { searchFormSchema, SearchFormData } from '@/lib/validations'
import { useFormData, useSearchActions } from '@/store/searchStore'

export function useSearchForm() {
  const formData = useFormData()
  const { updateFormData } = useSearchActions()
  
  // Use refs to track if updates are from external store changes to prevent loops
  const isExternalUpdate = useRef(false)
  const lastFormData = useRef(formData)

  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: formData,
    mode: 'onChange', // Validate on change for better UX
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting, isDirty },
    watch,
    setValue,
    reset,
    trigger
  } = form

  // Watch all form values and sync with store
  const watchedValues = watch()

  useEffect(() => {
    // Skip if this is from an external store update
    if (isExternalUpdate.current) {
      isExternalUpdate.current = false
      return
    }

    // Always update selectedTheme immediately for background switching
    if (watchedValues.selectedTheme !== formData.selectedTheme) {
      updateFormData({ ...formData, selectedTheme: watchedValues.selectedTheme })
    }
    
    // Update other fields only if form is valid and has changes
    if (isDirty && isValid) {
      updateFormData(watchedValues)
    }
  }, [watchedValues, isDirty, isValid, updateFormData])

  // Sync store changes back to form (useful for external updates)
  useEffect(() => {
    // Only update if formData actually changed (deep comparison of key fields)
    const hasChanged = 
      formData.selectedTheme !== lastFormData.current.selectedTheme ||
      formData.departureAirport !== lastFormData.current.departureAirport ||
      formData.departureDate !== lastFormData.current.departureDate ||
      formData.returnDate !== lastFormData.current.returnDate ||
      formData.passengers !== lastFormData.current.passengers ||
      formData.tripType !== lastFormData.current.tripType ||
      formData.maxFlightTime !== lastFormData.current.maxFlightTime

    if (hasChanged) {
      isExternalUpdate.current = true
      reset(formData)
      lastFormData.current = formData
    }
  }, [formData, reset])

  // Helper function to set individual field values with proper type handling
  function updateField<K extends keyof SearchFormData>(
    field: K,
    value: SearchFormData[K]
  ): void
  function updateField(field: 'returnDate', value: string | undefined): void
  function updateField<K extends keyof SearchFormData>(
    field: K,
    value: SearchFormData[K] | undefined
  ): void {
    try {
      // Handle optional fields specifically
      if (field === 'returnDate') {
        // For optional returnDate, handle both undefined and empty string
        const processedValue = value === undefined || value === '' ? '' : value
        setValue(field as any, processedValue as any, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true
        })
        return
      }
      
      // For all other cases, use the value directly with null checks
      if (value !== undefined && value !== null) {
        setValue(field as any, value as any, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true
        })
      }
    } catch (error) {
      console.warn(`Failed to update field ${String(field)}:`, error)
    }
  }

  // Helper function to validate specific field
  const validateField = async (field: keyof SearchFormData) => {
    return await trigger(field)
  }

  // Helper to get field error message
  const getFieldError = (field: keyof SearchFormData): string | undefined => {
    return errors[field]?.message
  }

  // Helper to check if field has error
  const hasFieldError = (field: keyof SearchFormData): boolean => {
    return !!errors[field]
  }

  // Custom validation for departure airport
  const validateDepartureAirport = (value: string) => {
    if (!value) return 'Departure airport is required'
    if (value.length !== 3) return 'Airport code must be 3 characters'
    if (!/^[A-Z]{3}$/.test(value)) return 'Airport code must be 3 uppercase letters'
    return true
  }

  // Custom validation for dates
  const validateDepartureDate = (value: string) => {
    if (!value) return 'Departure date is required'
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selectedDate = new Date(value)
    if (selectedDate < today) return 'Departure date cannot be in the past'
    return true
  }

  const validateReturnDate = (value: string, formValues: SearchFormData) => {
    if (formValues.tripType === 'return') {
      if (!value) return 'Return date is required for return trips'
      const departureDate = new Date(formValues.departureDate)
      const returnDate = new Date(value)
      if (returnDate <= departureDate) return 'Return date must be after departure date'
    }
    return true
  }

  // Enhanced register function with custom validation
  const registerField = (field: keyof SearchFormData, options?: any) => {
    const baseRegistration = register(field, options)

    switch (field) {
      case 'departureAirport':
        return {
          ...baseRegistration,
          validate: validateDepartureAirport
        }
      case 'departureDate':
        return {
          ...baseRegistration,
          validate: validateDepartureDate
        }
      case 'returnDate':
        return {
          ...baseRegistration,
          validate: (value: string) => validateReturnDate(value, watchedValues)
        }
      default:
        return baseRegistration
    }
  }

  return {
    // Form methods
    handleSubmit,
    register: registerField,
    setValue: updateField,
    watch,
    reset,
    trigger,

    // Form state
    errors,
    isValid,
    isSubmitting,
    isDirty,

    // Helper functions
    getFieldError,
    hasFieldError,
    validateField,

    // Current form values
    formValues: watchedValues,

    // Raw form instance (for advanced usage)
    form
  }
}