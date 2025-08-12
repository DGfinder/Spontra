import { z } from 'zod'

// Airport code validation - must be exactly 3 letters
export const airportCodeSchema = z
  .string()
  .length(3, 'Airport code must be exactly 3 letters')
  .regex(/^[A-Z]{3}$/, 'Airport code must contain only uppercase letters')

// Date validation - must be today or future
export const futureDateSchema = z
  .string()
  .min(1, 'Date is required')
  .refine((date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const inputDate = new Date(date)
    return inputDate >= today
  }, 'Date must be today or in the future')

// Flight time range validation
const flightTimeRangeSchema = z
  .tuple([z.number(), z.number()])
  .refine(([min, max]) => min <= max, {
    message: 'Minimum flight time must be less than or equal to maximum'
  })
  .refine(([min]) => min >= 0.5, {
    message: 'Minimum flight time must be at least 0.5 hours'
  })
  .refine(([, max]) => max <= 12, {
    message: 'Maximum flight time cannot exceed 12 hours'
  })

// Flight search form validation schema
export const searchFormSchema = z.object({
  selectedTheme: z
    .string()
    .min(1, 'Please select a travel theme'),
  
  departureAirport: airportCodeSchema,
  
  departureDate: futureDateSchema,
  
  returnDate: z
    .string()
    .transform((val) => val === '' ? undefined : val)
    .optional(),
  
  passengers: z
    .number()
    .min(1, 'At least 1 passenger required')
    .max(8, 'Maximum 8 passengers allowed'),
  
  tripType: z
    .enum(['one-way', 'return'], {
      errorMap: () => ({ message: 'Invalid trip type' })
    }),
  
  // Support both single value (backward compatibility) and range
  maxFlightTime: z
    .number()
    .min(0.5, 'Minimum flight time is 0.5 hours')
    .max(12, 'Maximum flight time is 12 hours')
    .optional(),
  
  flightTimeRange: flightTimeRangeSchema.optional(),
  
  minFlightTime: z
    .number()
    .min(0.5, 'Minimum flight time is 0.5 hours')
    .max(12, 'Maximum flight time is 12 hours')
    .optional(),
  
  maxFlightTimeRange: z
    .number()
    .min(0.5, 'Minimum flight time is 0.5 hours')
    .max(12, 'Maximum flight time is 12 hours')
    .optional(),

  // New: Only direct flights toggle
  directFlightsOnly: z.boolean().optional()
  ,
  destinationAirport: airportCodeSchema.optional(),
  cabinClass: z.enum(['ECONOMY','PREMIUM_ECONOMY','BUSINESS','FIRST']).optional()
}).refine((data) => {
  // If return trip, return date is required and must be after departure
  if (data.tripType === 'return') {
    if (!data.returnDate) {
      return false
    }
    const departureDate = new Date(data.departureDate)
    const returnDate = new Date(data.returnDate)
    return returnDate > departureDate
  }
  return true
}, {
  message: 'Return date must be after departure date',
  path: ['returnDate']
}).refine((data) => {
  // Origin and destination must differ when destination present
  if (data.destinationAirport && data.destinationAirport === data.departureAirport) {
    return false
  }
  return true
}, {
  message: 'Origin and destination cannot be the same',
  path: ['destinationAirport']
}).refine((data) => {
  // Validate consistency between range and individual values
  if (data.flightTimeRange && (data.minFlightTime !== undefined || data.maxFlightTimeRange !== undefined)) {
    const [rangeMin, rangeMax] = data.flightTimeRange
    if (data.minFlightTime !== undefined && data.minFlightTime !== rangeMin) {
      return false
    }
    if (data.maxFlightTimeRange !== undefined && data.maxFlightTimeRange !== rangeMax) {
      return false
    }
  }
  
  // Validate individual min/max consistency
  if (data.minFlightTime !== undefined && data.maxFlightTimeRange !== undefined) {
    return data.minFlightTime <= data.maxFlightTimeRange
  }
  
  return true
}, {
  message: 'Flight time range values must be consistent',
  path: ['flightTimeRange']
})

// Type inference from schema
export type SearchFormData = z.infer<typeof searchFormSchema>

// Airport search validation
export const airportSearchSchema = z.object({
  query: z
    .string()
    .min(1, 'Please enter an airport name or code')
    .max(50, 'Search query too long')
})

// User preferences validation
export const preferencesSchema = z.object({
  defaultDepartureAirport: airportCodeSchema.optional(),
  defaultPassengers: z.number().min(1).max(8),
  preferredThemes: z.array(z.string()).min(1, 'At least one theme required'),
  recentAirports: z.array(airportCodeSchema).max(10)
})

// API request validation
export const destinationExploreRequestSchema = z.object({
  origin_airport_code: airportCodeSchema,
  min_flight_duration_hours: z.number().min(0).max(24),
  max_flight_duration_hours: z.number().min(0).max(24),
  preferred_activities: z.array(z.string()).min(1),
  budget_level: z.enum(['budget', 'mid-range', 'luxury', 'any']).optional(),
  max_results: z.number().min(1).max(50).optional(),
  include_visa_required: z.boolean().optional()
}).refine((data) => {
  return data.max_flight_duration_hours >= data.min_flight_duration_hours
}, {
  message: 'Maximum flight time must be greater than or equal to minimum',
  path: ['max_flight_duration_hours']
})

// Helper function to validate individual fields
export const validateField = <T>(schema: z.ZodSchema<T>, value: unknown): string | null => {
  try {
    schema.parse(value)
    return null
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || 'Invalid value'
    }
    return 'Validation error'
  }
}

// Helper function to get all validation errors
export const getValidationErrors = <T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): Record<string, string> => {
  try {
    schema.parse(data)
    return {}
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {}
      error.errors.forEach((err) => {
        const path = err.path.join('.')
        errors[path] = err.message
      })
      return errors
    }
    return { general: 'Validation failed' }
  }
}