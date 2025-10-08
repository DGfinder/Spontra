import { z } from 'zod'

/**
 * Travelpayouts API Response Validation Schemas
 * Ensures type safety and runtime validation for all API responses
 */

// ============================================================================
// Common Schemas
// ============================================================================

const MoneySchema = z.number().nonnegative()
const IATACodeSchema = z.string().length(3).regex(/^[A-Z]{3}$/)
const DateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const AirlineCodeSchema = z.string().min(2).max(3)

// ============================================================================
// Aviasales Flight Search Schemas
// ============================================================================

export const AviasalesFlightSchema = z.object({
  origin: IATACodeSchema,
  destination: IATACodeSchema,
  origin_airport: IATACodeSchema,
  destination_airport: IATACodeSchema,
  price: MoneySchema,
  airline: AirlineCodeSchema,
  flight_number: z.string(),
  departure_at: z.string(), // ISO datetime
  return_at: z.string().optional(),
  transfers: z.number().int().nonnegative(),
  return_transfers: z.number().int().nonnegative().optional(),
  duration: z.number().int().positive(), // minutes
  duration_to: z.number().int().positive().optional(),
  duration_back: z.number().int().positive().optional(),
  link: z.string()
})

export const AviasalesSearchResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(AviasalesFlightSchema),
  currency: z.string().optional(),
  error: z.string().optional()
})

export type AviasalesFlightData = z.infer<typeof AviasalesFlightSchema>
export type AviasalesSearchResponse = z.infer<typeof AviasalesSearchResponseSchema>

// ============================================================================
// Calendar / Month Price Schemas
// ============================================================================

export const CalendarPriceSchema = z.object({
  origin: IATACodeSchema,
  destination: IATACodeSchema,
  departure_at: DateStringSchema,
  return_at: DateStringSchema.optional(),
  price: MoneySchema,
  airline: AirlineCodeSchema.optional(),
  transfers: z.number().int().nonnegative().optional(),
  flight_number: z.string().optional(),
  link: z.string().optional()
})

export const CalendarResponseSchema = z.object({
  success: z.boolean(),
  data: z.record(z.string(), CalendarPriceSchema).optional(), // { "2025-12-01": {...} }
  currency: z.string().optional(),
  error: z.string().optional()
})

export type CalendarPriceData = z.infer<typeof CalendarPriceSchema>
export type CalendarResponse = z.infer<typeof CalendarResponseSchema>

// ============================================================================
// Popular Routes / Directions Schemas
// ============================================================================

export const PopularRouteSchema = z.object({
  origin: IATACodeSchema,
  destination: IATACodeSchema,
  price: MoneySchema,
  airline: AirlineCodeSchema.optional(),
  departure_at: z.string().optional(),
  return_at: z.string().optional(),
  transfers: z.number().int().nonnegative().optional(),
  duration: z.number().int().positive().optional()
})

export const PopularRoutesResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(PopularRouteSchema).optional(),
  currency: z.string().optional(),
  error: z.string().optional()
})

export type PopularRouteData = z.infer<typeof PopularRouteSchema>
export type PopularRoutesResponse = z.infer<typeof PopularRoutesResponseSchema>

// ============================================================================
// Direct Flights Schemas
// ============================================================================

export const DirectFlightSchema = z.object({
  origin: IATACodeSchema,
  destination: IATACodeSchema,
  price: MoneySchema,
  airline: AirlineCodeSchema,
  departure_at: z.string(),
  return_at: z.string().optional(),
  flight_number: z.string().optional(),
  duration: z.number().int().positive().optional(),
  link: z.string().optional()
})

export const DirectFlightsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(DirectFlightSchema).optional(),
  currency: z.string().optional(),
  error: z.string().optional()
})

export type DirectFlightData = z.infer<typeof DirectFlightSchema>
export type DirectFlightsResponse = z.infer<typeof DirectFlightsResponseSchema>

// ============================================================================
// Hotellook Hotel Schemas
// ============================================================================

export const HotelSchema = z.object({
  hotelId: z.union([z.string(), z.number()]),
  hotelName: z.string(),
  location: z.object({
    lat: z.number(),
    lon: z.number()
  }).optional(),
  priceFrom: MoneySchema,
  stars: z.number().int().min(0).max(5).optional(),
  link: z.string().optional(),
  photoUrl: z.string().url().optional(),
  address: z.string().optional()
})

export const HotelsResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    hotels: z.array(HotelSchema)
  }).optional(),
  error: z.string().optional()
})

export type HotelData = z.infer<typeof HotelSchema>
export type HotelsResponse = z.infer<typeof HotelsResponseSchema>

// ============================================================================
// Special Offers Schemas
// ============================================================================

export const SpecialOfferSchema = z.object({
  origin: IATACodeSchema,
  destination: IATACodeSchema,
  price: MoneySchema,
  airline: AirlineCodeSchema.optional(),
  departure_at: DateStringSchema.optional(),
  return_at: DateStringSchema.optional(),
  expires_at: z.string().optional(), // When the deal expires
  link: z.string().optional(),
  discount_percent: z.number().min(0).max(100).optional()
})

export const SpecialOffersResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(SpecialOfferSchema).optional(),
  currency: z.string().optional(),
  error: z.string().optional()
})

export type SpecialOfferData = z.infer<typeof SpecialOfferSchema>
export type SpecialOffersResponse = z.infer<typeof SpecialOffersResponseSchema>

// ============================================================================
// Error Response Schema
// ============================================================================

export const TravelpayoutsErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  error_code: z.string().optional(),
  details: z.any().optional()
})

export type TravelpayoutsError = z.infer<typeof TravelpayoutsErrorSchema>

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Safely parse and validate API response
 * Returns validated data or null if invalid
 */
export function validateResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T | null {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`[Travelpayouts Validation Error]${context ? ` ${context}` : ''}:`, {
        errors: error.errors,
        receivedData: data
      })
    }
    return null
  }
}

/**
 * Validate or throw error (for critical paths)
 */
export function validateResponseStrict<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`[Travelpayouts Validation Error]${context ? ` ${context}` : ''}:`, {
        errors: error.errors,
        receivedData: data
      })
      throw new Error(`Invalid API response${context ? ` for ${context}` : ''}`)
    }
    throw error
  }
}
