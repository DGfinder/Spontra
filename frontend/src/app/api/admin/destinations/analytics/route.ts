import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { apiClient } from '@/services/apiClient'

export const runtime = 'nodejs'

interface AnalyticsRequest {
  timeRange?: '24h' | '7d' | '30d' | '90d'
  filters?: {
    countries?: string[]
    minScore?: number
    maxScore?: number
    activeOnly?: boolean
  }
}

// GET /api/admin/destinations/analytics
// Get destination analytics and performance metrics
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const timeRange = (searchParams.get('timeRange') as '24h' | '7d' | '30d' | '90d') || '30d'
    
    // Parse filters from query params
    const filters: any = {}
    const countries = searchParams.get('countries')
    const minScore = searchParams.get('minScore')
    const maxScore = searchParams.get('maxScore')
    const activeOnly = searchParams.get('activeOnly')

    if (countries) filters.countries = countries.split(',')
    if (minScore) filters.minScore = parseFloat(minScore)
    if (maxScore) filters.maxScore = parseFloat(maxScore)
    if (activeOnly) filters.activeOnly = activeOnly === 'true'

    // Get destinations data (this would normally come from the backend)
    const destinationsResponse = await apiClient.exploreDestinations({
      origin_airport_code: 'LHR',
      min_flight_duration_hours: 0,
      max_flight_duration_hours: 20,
      preferred_activities: ['activities'],
      budget_level: 'any',
      max_results: 200,
      include_visa_required: true,
    }).catch(() => ({ recommended_destinations: [], total_results: 0 }))

    const destinations = destinationsResponse.recommended_destinations || []

    // Calculate analytics
    const analytics = calculateAnalytics(destinations, timeRange, filters)

    return NextResponse.json({
      success: true,
      data: analytics
    })

  } catch (error) {
    console.error('Analytics request failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to load analytics' 
    }, { status: 500 })
  }
}

function calculateAnalytics(destinations: any[], timeRange: string, filters: any) {
  // Apply filters
  let filteredDestinations = destinations

  if (filters.countries && filters.countries.length > 0) {
    filteredDestinations = filteredDestinations.filter(d => 
      filters.countries.includes(d.destination?.country_name)
    )
  }


  if (filters.minScore !== undefined) {
    filteredDestinations = filteredDestinations.filter(d => 
      (d.match_score || 0) >= filters.minScore
    )
  }

  if (filters.maxScore !== undefined) {
    filteredDestinations = filteredDestinations.filter(d => 
      (d.match_score || 0) <= filters.maxScore
    )
  }

  if (filters.activeOnly) {
    // In a real implementation, this would check the actual active status
    filteredDestinations = filteredDestinations.filter(d => d.destination?.airport_code)
  }

  // Calculate metrics
  const totalDestinations = filteredDestinations.length
  const activeDestinations = filteredDestinations.length // Simplified
  const popularDestinations = filteredDestinations.filter(d => (d.match_score || 0) >= 8.0).length

  const totalBookings = filteredDestinations.reduce((sum, d) => {
    const popularity = d.destination?.popularity_score || d.match_score || 0
    return sum + Math.round(popularity * 10)
  }, 0)

  const totalRevenue = filteredDestinations.reduce((sum, d) => {
    const price = d.estimated_flight_price ? parseInt(d.estimated_flight_price.replace(/\D/g, '')) : 0
    return sum + (price * 100)
  }, 0)

  const averageScore = filteredDestinations.reduce((sum, d) => sum + (d.match_score || 0), 0) / totalDestinations

  // Top performing destinations
  const topPerforming = [...filteredDestinations]
    .sort((a, b) => {
      const scoreA = (a.match_score || 0) + ((a.destination?.popularity_score || 0) / 10)
      const scoreB = (b.match_score || 0) + ((b.destination?.popularity_score || 0) / 10)
      return scoreB - scoreA
    })
    .slice(0, 5)
    .map(d => ({
      iataCode: d.destination?.airport_code,
      cityName: d.destination?.city_name,
      countryName: d.destination?.country_name,
      score: d.match_score || 0,
      bookings: Math.round((d.match_score || 0) * 10),
      revenue: d.estimated_flight_price ? parseInt(d.estimated_flight_price.replace(/\D/g, '')) * 100 : 0
    }))

  // Underperforming destinations
  const underperforming = filteredDestinations
    .filter(d => (d.match_score || 0) < 5.0)
    .sort((a, b) => (a.match_score || 0) - (b.match_score || 0))
    .slice(0, 5)
    .map(d => ({
      iataCode: d.destination?.airport_code,
      cityName: d.destination?.city_name,
      countryName: d.destination?.country_name,
      score: d.match_score || 0,
      bookings: Math.round((d.match_score || 0) * 10)
    }))


  // Country distribution
  const countryDistribution: Record<string, number> = {}
  filteredDestinations.forEach(dest => {
    const country = dest.destination?.country_name
    if (country) {
      countryDistribution[country] = (countryDistribution[country] || 0) + Math.round((dest.match_score || 0) * 10)
    }
  })

  // Performance trends (mock data)
  const performanceTrends = {
    bookings: generateTrendData(totalBookings, timeRange),
    revenue: generateTrendData(totalRevenue, timeRange),
    scores: generateTrendData(averageScore * 10, timeRange)
  }

  return {
    totalDestinations,
    activeDestinations,
    popularDestinations,
    totalBookings,
    totalRevenue,
    averageScore,
    topPerforming,
    underperforming,
    countryDistribution,
    performanceTrends
  }
}

function generateTrendData(baseValue: number, timeRange: string): number[] {
  const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
  const data = []
  
  for (let i = 0; i < days; i++) {
    const variation = (Math.random() - 0.5) * 0.2 // ±10% variation
    data.push(Math.round(baseValue * (1 + variation)))
  }
  
  return data
}
