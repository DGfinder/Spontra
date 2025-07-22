import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { searchFormSchema, SearchFormData } from '@/lib/validations'
import { useFormData, useSearchActions } from '@/store/searchStore'

export function useSearchForm() {
  const formData = useFormData()
  const { updateFormData } = useSearchActions()

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
    // Only update store if form is valid and has changes
    if (isDirty && isValid) {
      updateFormData(watchedValues)
    }
  }, [watchedValues, isDirty, isValid, updateFormData])

  // Sync store changes back to form (useful for external updates)
  useEffect(() => {
    reset(formData)
  }, [formData, reset])

  // Helper function to set individual field values
  const updateField = <K extends keyof SearchFormData>(
    field: K,
    value: SearchFormData[K]
  ) => {
    setValue(field, value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    })
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