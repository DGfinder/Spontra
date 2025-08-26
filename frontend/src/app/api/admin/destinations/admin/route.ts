import { NextRequest, NextResponse } from 'next/server'
import { apiClient } from '@/services/apiClient'

export const runtime = 'nodejs'

// GET /api/admin/destinations/admin
// Aggregates destinations from backend (same logic as earlier route)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const country = searchParams.get('country') || undefined
    const isActiveParam = searchParams.get('isActive')
    const isActive = isActiveParam === null ? undefined : isActiveParam === 'true'
    const page = Number(searchParams.get('page') || '1')
    const limit = Math.min(Number(searchParams.get('limit') || '30'), 100)

    const themes = ['activities'] as const
    const origin = 'LHR'
    const responses = await Promise.all(
      themes.map((t) =>
        apiClient.exploreDestinations({
          origin_airport_code: origin,
          min_flight_duration_hours: 0,
          max_flight_duration_hours: 20,
          preferred_activities: [t],
          budget_level: 'any',
          max_results: 200,
          include_visa_required: true,
        }).catch(() => ({ recommended_destinations: [] }))
      )
    )

    const map = new Map<string, any>()
    for (const resp of responses) {
      for (const rec of resp.recommended_destinations || []) {
        const code = rec.destination.airport_code
        if (code && !map.has(code)) map.set(code, rec)
      }
    }

    let items = Array.from(map.values())
    if (country) items = items.filter((rec) => rec.destination.country_name?.toLowerCase() === country.toLowerCase())

    const transformed = items.map((rec) => {
      const d = rec.destination
      const popularity = d.popularity_score || rec.match_score || 0
      return {
        iataCode: d.airport_code,
        cityName: d.city_name,
        countryName: d.country_name,
        countryCode: d.country_code,
        continent: '',
        coordinates: { lat: 0, lng: 0 },
        isActive: true,
        isPopular: popularity >= 80,
        highlights: d.best_time_to_visit?.slice?.(0, 3) || [],
        themeScores: { vibe: 0, adventure: 0, discover: 0, indulge: 0, nature: 0 },
        supportedActivities: (d.activities || []).map((a: any) => a.type).slice(0, 8),
        metrics: {
          totalBookings: Math.round(popularity * 10),
          totalRevenue: Math.round((rec.estimated_flight_price ? parseInt(rec.estimated_flight_price.replace(/\D/g, '')) : 0) * 100),
          averageStay: 3,
          popularityScore: Math.round((popularity / 10) * 10) / 10,
          contentCount: (d.activities || []).length,
          creatorCount: Math.max(1, Math.min(99, Math.round(popularity / 2))),
        },
        description: d.description,
        imageUrl: d.image_url,
        lastUpdated: new Date().toISOString(),
        averageFlightTime: (rec.flight_route?.total_duration_minutes || 0) / 60,
        priceRange: (d.budget?.level as any) || 'mid-range',
        bestMonths: d.best_time_to_visit || [],
      }
    })

    const filtered = typeof isActive === 'boolean' ? transformed.filter((t) => t.isActive === isActive) : transformed
    const start = (page - 1) * limit
    const end = start + limit
    const paged = filtered.slice(start, end)

    return NextResponse.json({
      success: true,
      data: {
        items: paged,
        total: filtered.length,
        page,
        limit,
        hasMore: end < filtered.length,
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to load destinations' }, { status: 500 })
  }
}


