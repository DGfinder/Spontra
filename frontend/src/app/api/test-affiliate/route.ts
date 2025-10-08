import { NextResponse } from 'next/server'
import { searchAviasalesFlights, searchHotels } from '@/app/actions/travelpayouts'
import { generateAviasalesLink } from '@/lib/affiliate/travelpayouts'

/**
 * Test endpoint for Travelpayouts affiliate integration
 * Visit: http://localhost:3000/api/test-affiliate
 *
 * This endpoint tests:
 * 1. Aviasales flight search API
 * 2. Hotellook hotel search API
 * 3. Affiliate link generation
 *
 * Returns JSON with test results and any errors
 */
export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    credentials: {
      hasToken: !!process.env.TRAVELPAYOUTS_TOKEN,
      hasMarker: !!process.env.TRAVELPAYOUTS_MARKER
    },
    tests: {}
  }

  // Test 1: Check credentials
  if (!process.env.TRAVELPAYOUTS_TOKEN || !process.env.TRAVELPAYOUTS_MARKER) {
    return NextResponse.json({
      ...results,
      error: 'Missing credentials. Add TRAVELPAYOUTS_TOKEN and TRAVELPAYOUTS_MARKER to .env.local'
    }, { status: 500 })
  }

  // Test 2: Aviasales Flight Search
  try {
    const flightResult = await searchAviasalesFlights({
      origin: 'LAX',
      destination: 'LAS',
      departureDate: '2025-12-01',
      returnDate: '2025-12-08'
    })

    results.tests.flights = {
      success: flightResult.success,
      flightCount: flightResult.data?.flights?.length || 0,
      cheapestPrice: flightResult.data?.flights?.[0]?.price || null,
      error: flightResult.success ? null : flightResult.error,
      sampleFlight: flightResult.data?.flights?.[0] || null
    }
  } catch (error) {
    results.tests.flights = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // Test 3: Hotellook Hotel Search
  try {
    const hotelResult = await searchHotels({
      location: 'Las Vegas',
      checkIn: '2025-12-01',
      checkOut: '2025-12-08',
      limit: 5
    })

    results.tests.hotels = {
      success: hotelResult.success,
      hotelCount: hotelResult.data?.hotels?.length || 0,
      cheapestPrice: hotelResult.data?.hotels?.[0]?.priceFrom || null,
      error: hotelResult.success ? null : hotelResult.error,
      sampleHotel: hotelResult.data?.hotels?.[0] || null
    }
  } catch (error) {
    results.tests.hotels = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // Test 4: Affiliate Link Generation
  try {
    const affiliateLink = generateAviasalesLink({
      origin: 'LAX',
      destination: 'LAS',
      departureDate: '2025-12-01',
      returnDate: '2025-12-08'
    })

    results.tests.affiliateLinks = {
      success: true,
      sampleLink: affiliateLink,
      hasMarker: affiliateLink.includes('marker=')
    }
  } catch (error) {
    results.tests.affiliateLinks = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // Overall status
  const allTestsPassed =
    results.tests.flights?.success &&
    results.tests.hotels?.success &&
    results.tests.affiliateLinks?.success

  return NextResponse.json({
    ...results,
    status: allTestsPassed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌',
    nextSteps: allTestsPassed
      ? 'Integration working! Ready to build destination pages.'
      : 'Check the error messages above and verify your API credentials.'
  })
}
