import { NextRequest, NextResponse } from 'next/server'
import { apiClient } from '@/services/apiClient'
import { amadeusService } from '@/services/amadeusService'
import { validateApiRequest, destinationSearchApiSchema } from '@/lib/validations'
import { cacheGet, cacheSet } from '@/lib/cacheServer'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = validateApiRequest(destinationSearchApiSchema, body)
    if (!validation.success) {
      return NextResponse.json({ ok: false, error: 'Invalid destination search parameters', details: validation.errors }, { status: 400 })
    }

    const { origin, minFlightTime, maxFlightTime, theme, departureDate, priceRange, nonStop } = validation.data
    const cacheKey = `destinations:${origin}:${departureDate || 'any'}:${theme || 'general'}:${minFlightTime ?? ''}:${maxFlightTime ?? ''}:${nonStop ? '1' : '0'}:${process.env.NEXT_PUBLIC_BACKEND_ENABLED === 'true' ? 'be' : 'am'}`

    const cached = await cacheGet(cacheKey).catch(() => null)
    if (cached) return NextResponse.json(JSON.parse(cached), { headers: { 'X-Cache': 'HIT' } })

    // Load TTL from settings
    const settingsRaw = await cacheGet('admin:settings:general').catch(() => null)
    const resolveTTL = () => {
      try {
        const v = settingsRaw ? JSON.parse(settingsRaw).features?.destinationCacheTTLSeconds : 120
        return Math.max(30, Math.min(3600, Number(v || 120)))
      } catch { return 120 }
    }
    const ttl = resolveTTL()

    const backendEnabled = process.env.NEXT_PUBLIC_BACKEND_ENABLED === 'true'
    let isBackendHealthy = false
    if (backendEnabled) isBackendHealthy = await apiClient.healthCheck().then(() => true).catch(() => false)

    if (isBackendHealthy) {
      try {
        const response = await apiClient.exploreDestinations({
          origin_airport_code: origin,
          preferred_activities: [theme as any],
          min_flight_duration_hours: Math.max(0, Number(minFlightTime ?? 0)),
          max_flight_duration_hours: Math.min(24, Number(maxFlightTime ?? 12)),
          budget_level: priceRange || 'any',
          max_results: 20,
          include_visa_required: true
        })
        const payload = { ok: true, data: response.recommended_destinations, totalResults: response.total_results, source: 'backend', requestId: `req_${Date.now()}` }
        await cacheSet(cacheKey, JSON.stringify(payload), { ttlSeconds: ttl }).catch(() => {})
        return NextResponse.json(payload, { headers: { 'X-Cache': 'MISS' } })
      } catch {
        // fall back to Amadeus path
      }
    }

    let recommendations = await amadeusService.exploreDestinations({ origin, minFlightTime, maxFlightTime, theme, departureDate, nonStop, viewBy: 'PRICE' })

    // Enrich durations via reference service (optional)
    try {
      const url = new URL(`${req.nextUrl.origin}/api/admin/reference/flight-times`)
      url.searchParams.set('mode', 'origin')
      url.searchParams.set('origin', origin)
      url.searchParams.set('limit', '500')
      const refRes = await fetch(url.toString(), { cache: 'no-store' })
      if (refRes.ok) {
        const refJson = await refRes.json()
        const list = refJson?.data?.data || refJson?.data || []
        const byDest = new Map<string, number>()
        for (const item of list) {
          const code = item?.destination || item?.destination_airport || item?.destination_code
          const minutes = item?.duration_minutes || item?.minutes || item?.duration
          if (code && Number.isFinite(Number(minutes))) byDest.set(String(code), Number(minutes))
        }
        const filtered: typeof recommendations = []
        for (const rec of recommendations) {
          const code = rec?.destination?.airport_code
          if (!code) continue
          const minutes = byDest.get(code)
          if (Number.isFinite(minutes)) {
            rec.flight_route.total_duration_minutes = minutes as number
            rec.flight_route.estimated_duration_hours = Math.floor((minutes as number) / 60)
            rec.flight_route.estimated_duration_minutes = (minutes as number) % 60
          }
          const hours = rec.flight_route.total_duration_minutes / 60
          if ((minFlightTime != null && hours < minFlightTime) || (maxFlightTime != null && hours > maxFlightTime)) continue
          filtered.push(rec)
        }
        recommendations = filtered
      }
    } catch {}

    const payload = { ok: true, data: recommendations, source: 'legacy', requestId: `req_${Date.now()}` }
    await cacheSet(cacheKey, JSON.stringify(payload), { ttlSeconds: ttl }).catch(() => {})
    return NextResponse.json(payload, { headers: { 'X-Cache': 'MISS' } })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: 'An unexpected error occurred while searching destinations. Please try again.' }, { status: 500 })
  }
}

