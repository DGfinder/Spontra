import { NextRequest, NextResponse } from 'next/server'
import { amadeusClient } from '@/lib/amadeusSimple'
import { AmadeusLocation } from '@/types/amadeus'

export const runtime = 'nodejs'

function parseISODurationToHours(iso: string): number {
  // PT#H#M
  if (!iso || !iso.startsWith('PT')) return 0
  const hMatch = iso.match(/(\d+)H/)
  const mMatch = iso.match(/(\d+)M/)
  const hours = hMatch ? parseInt(hMatch[1], 10) : 0
  const minutes = mMatch ? parseInt(mMatch[1], 10) : 0
  return Math.round((hours + minutes / 60) * 10) / 10
}

export async function POST(req: NextRequest) {
  try {
    const { countryName, countryCode, origin, departureDate } = await req.json()
    if (!countryName && !countryCode) {
      return NextResponse.json({ ok: false, error: 'countryName or countryCode required' }, { status: 400 })
    }
    if (!origin) {
      return NextResponse.json({ ok: false, error: 'origin is required' }, { status: 400 })
    }

    // Find cities in the country
    const keyword = countryName || countryCode
    const locations = await amadeusClient.searchLocations(keyword, 'CITY')

    const filtered = (locations || [])
      .filter((loc: AmadeusLocation) => {
        // Note: amadeus-simple.ts AmadeusDestination doesn't have address property
        // Filtering by keyword match should be sufficient for city search
        return loc.name && loc.iataCode
      })
      .slice(0, 6)

    // For each city, attempt to fetch one representative flight to estimate price and duration
    const results: any[] = []
    for (const city of filtered) {
      let estimated_price = undefined as string | undefined
      let flight_duration = undefined as number | undefined
      const destCode = city.iataCode
      try {
        const offers = await amadeusClient.searchFlights({
          origin,
          destination: destCode,
          departureDate: departureDate || new Date().toISOString().slice(0, 10),
          adults: 1,
          max: 1,
        })
        const offer = (offers || [])[0]
        if (offer) {
          const total = offer?.price?.total
          const currency = offer?.price?.currency || 'EUR'
          if (total) estimated_price = `${currency}${Math.round(parseFloat(total))}`
          const dur = offer?.itineraries?.[0]?.duration
          if (dur) flight_duration = parseISODurationToHours(dur)
        }
      } catch {
        // ignore per-city failures
      }

      results.push({
        id: city.id || city.iataCode,
        name: city.name || city.address?.cityName || city.iataCode,
        airport_code: city.iataCode,
        population: 0,
        flight_frequency: 0,
        primary_theme: 'culture',
        secondary_themes: [],
        is_hidden_gem: false,
        estimated_price: estimated_price || '',
        flight_duration: flight_duration || 0,
        description: `Explore ${city.name || city.address?.cityName || city.iataCode}`,
      })
    }

    return NextResponse.json({ ok: true, data: results })
  } catch (e: unknown) {
    const error = e as Error
    return NextResponse.json({ ok: false, error: error?.message || 'Internal Server Error' }, { status: 500 })
  }
}

