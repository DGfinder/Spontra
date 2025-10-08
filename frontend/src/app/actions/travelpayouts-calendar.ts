'use server'

import axios from 'axios'
import { getCachedResponse, CACHE_DURATIONS } from '@/lib/cache/travelpayouts'
import { withRetryAxios } from '@/lib/api/retry'
import {
  CalendarResponseSchema,
  DirectFlightsResponseSchema,
  PopularRoutesResponseSchema,
  SpecialOffersResponseSchema,
  validateResponse
} from '@/lib/validations/travelpayouts'

/**
 * Calendar / Flexible Dates Search
 * Returns cheapest prices for each date in a month
 * Perfect for "When is cheapest to fly?" feature
 */
export async function searchCalendarPrices(params: {
  origin: string
  destination: string
  departureMonth: string // Format: "2025-12"
  returnMonth?: string
  length?: number // Trip length in days (1-30)
}) {
  try {
    const token = process.env.TRAVELPAYOUTS_TOKEN

    if (!token) {
      return { success: false, error: 'API not configured' }
    }

    const cacheParams = {
      origin: params.origin,
      destination: params.destination,
      departureMonth: params.departureMonth,
      returnMonth: params.returnMonth || 'one-way',
      length: params.length || 7
    }

    const result = await getCachedResponse(
      'calendar',
      cacheParams,
      async () => {
        return await withRetryAxios(async () => {
          const response = await axios.get(
            'https://api.travelpayouts.com/aviasales/v3/prices_for_dates',
            {
              params: {
                origin: params.origin,
                destination: params.destination,
                departure_at: params.departureMonth,
                return_at: params.returnMonth,
                one_way: !params.returnMonth,
                trip_duration: params.length || 7,
                currency: 'USD',
                sorting: 'price',
                token: token
              },
              timeout: 30000
            }
          )
          return response.data
        })
      },
      CACHE_DURATIONS.CALENDAR
    )

    const validated = validateResponse(
      CalendarResponseSchema,
      result,
      'searchCalendarPrices'
    )

    if (!validated || !validated.success) {
      return {
        success: false,
        error: validated?.error || 'No calendar data found'
      }
    }

    // Transform to easier format: { date: price }
    const calendar: Record<string, number> = {}
    if (validated.data) {
      Object.entries(validated.data).forEach(([date, priceData]) => {
        calendar[date] = priceData.price
      })
    }

    return {
      success: true,
      data: {
        calendar,
        currency: validated.currency || 'USD'
      }
    }
  } catch (error) {
    console.error('Calendar API error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get cheapest month to fly
 * Returns price for each month in the next 12 months
 */
export async function searchCheapestMonth(params: {
  origin: string
  destination: string
}) {
  try {
    const token = process.env.TRAVELPAYOUTS_TOKEN

    if (!token) {
      return { success: false, error: 'API not configured' }
    }

    const cacheParams = {
      origin: params.origin,
      destination: params.destination,
      type: 'cheapest_month'
    }

    const result = await getCachedResponse(
      'month_matrix',
      cacheParams,
      async () => {
        return await withRetryAxios(async () => {
          const response = await axios.get(
            'https://api.travelpayouts.com/v1/prices/month-matrix',
            {
              params: {
                origin: params.origin,
                destination: params.destination,
                show_to_affiliates: true,
                currency: 'usd',
                token: token
              },
              timeout: 30000
            }
          )
          return response.data
        })
      },
      CACHE_DURATIONS.CALENDAR
    )

    // Month matrix returns: { "2025-12": 129, "2026-01": 89, ... }
    return {
      success: true,
      data: result.data || {}
    }
  } catch (error) {
    console.error('Cheapest month API error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Direct flights only
 * Returns only non-stop flights (premium user feature)
 */
export async function searchDirectFlights(params: {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
}) {
  try {
    const token = process.env.TRAVELPAYOUTS_TOKEN

    if (!token) {
      return { success: false, error: 'API not configured' }
    }

    const cacheParams = {
      origin: params.origin,
      destination: params.destination,
      departureDate: params.departureDate,
      returnDate: params.returnDate || 'one-way'
    }

    const result = await getCachedResponse(
      'direct_flights',
      cacheParams,
      async () => {
        return await withRetryAxios(async () => {
          const response = await axios.get(
            'https://api.travelpayouts.com/v1/prices/direct',
            {
              params: {
                origin: params.origin,
                destination: params.destination,
                departure_date: params.departureDate,
                return_date: params.returnDate,
                currency: 'usd',
                token: token
              },
              timeout: 30000
            }
          )
          return response.data
        })
      },
      CACHE_DURATIONS.DIRECT_FLIGHTS
    )

    const validated = validateResponse(
      DirectFlightsResponseSchema,
      result,
      'searchDirectFlights'
    )

    if (!validated || !validated.success || !validated.data) {
      return {
        success: false,
        error: 'No direct flights found'
      }
    }

    return {
      success: true,
      data: {
        flights: validated.data,
        currency: validated.currency || 'USD'
      }
    }
  } catch (error) {
    console.error('Direct flights API error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Popular routes from a city
 * Great for "Top destinations from [city]" widgets
 */
export async function getPopularRoutes(params: {
  origin: string
  limit?: number
}) {
  try {
    const token = process.env.TRAVELPAYOUTS_TOKEN

    if (!token) {
      return { success: false, error: 'API not configured' }
    }

    const cacheParams = {
      origin: params.origin,
      limit: params.limit || 10
    }

    const result = await getCachedResponse(
      'popular_routes',
      cacheParams,
      async () => {
        return await withRetryAxios(async () => {
          const response = await axios.get(
            'https://api.travelpayouts.com/v1/city-directions',
            {
              params: {
                origin: params.origin,
                currency: 'usd',
                token: token
              },
              timeout: 30000
            }
          )
          return response.data
        })
      },
      CACHE_DURATIONS.ROUTES
    )

    const validated = validateResponse(
      PopularRoutesResponseSchema,
      result,
      'getPopularRoutes'
    )

    if (!validated || !validated.success || !validated.data) {
      return {
        success: false,
        error: 'No popular routes found'
      }
    }

    // Sort by price and limit
    const routes = validated.data
      .sort((a, b) => a.price - b.price)
      .slice(0, params.limit || 10)

    return {
      success: true,
      data: {
        routes,
        currency: validated.currency || 'USD'
      }
    }
  } catch (error) {
    console.error('Popular routes API error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Special offers / deals
 * Show promotional pricing for homepage widgets
 */
export async function getSpecialOffers(params: {
  origin?: string
  limit?: number
}) {
  try {
    const token = process.env.TRAVELPAYOUTS_TOKEN

    if (!token) {
      return { success: false, error: 'API not configured' }
    }

    const cacheParams = {
      origin: params.origin || 'global',
      limit: params.limit || 20
    }

    const result = await getCachedResponse(
      'special_offers',
      cacheParams,
      async () => {
        return await withRetryAxios(async () => {
          const apiParams: any = {
            currency: 'usd',
            token: token
          }

          if (params.origin) {
            apiParams.origin = params.origin
          }

          const response = await axios.get(
            'https://api.travelpayouts.com/aviasales/v3/get_special_offers',
            {
              params: apiParams,
              timeout: 30000
            }
          )
          return response.data
        })
      },
      CACHE_DURATIONS.OFFERS
    )

    const validated = validateResponse(
      SpecialOffersResponseSchema,
      result,
      'getSpecialOffers'
    )

    if (!validated || !validated.success || !validated.data) {
      return {
        success: false,
        error: 'No special offers found'
      }
    }

    // Limit results
    const offers = validated.data.slice(0, params.limit || 20)

    return {
      success: true,
      data: {
        offers,
        currency: validated.currency || 'USD'
      }
    }
  } catch (error) {
    console.error('Special offers API error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get cheapest price for a route (helper)
 * Returns single cheapest price for display on cards
 */
export async function getCheapestPrice(params: {
  origin: string
  destination: string
}): Promise<number | null> {
  const result = await getPopularRoutes({ origin: params.origin, limit: 100 })

  if (!result.success || !result.data) {
    return null
  }

  const route = result.data.routes.find((r) => r.destination === params.destination)
  return route ? route.price : null
}
