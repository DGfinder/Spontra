'use client'

import { useEffect, useState } from 'react'
import { searchAviasalesFlights, searchHotels, trackAviasalesClick } from '@/app/actions/travelpayouts'
import { generateAviasalesLink } from '@/lib/affiliate/travelpayouts'

export default function TestAffiliatePage() {
  const [apiTest, setApiTest] = useState<any>(null)
  const [flightTest, setFlightTest] = useState<any>(null)
  const [hotelTest, setHotelTest] = useState<any>(null)
  const [trackingTest, setTrackingTest] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Test API endpoint on load
  useEffect(() => {
    fetch('/api/test-affiliate')
      .then(res => res.json())
      .then(data => setApiTest(data))
      .catch(err => setApiTest({ error: err.message }))
  }, [])

  // Test flight search manually
  const testFlightSearch = async () => {
    setLoading(true)
    try {
      const result = await searchAviasalesFlights({
        origin: 'SYD',
        destination: 'MEL',
        departureDate: '2025-12-01',
        returnDate: '2025-12-08'
      })
      setFlightTest(result)
    } catch (error) {
      setFlightTest({ error: error instanceof Error ? error.message : 'Error' })
    }
    setLoading(false)
  }

  // Test hotel search manually
  const testHotelSearch = async () => {
    setLoading(true)
    try {
      const result = await searchHotels({
        location: 'Melbourne',
        checkIn: '2025-12-01',
        checkOut: '2025-12-08',
        limit: 5
      })
      setHotelTest(result)
    } catch (error) {
      setHotelTest({ error: error instanceof Error ? error.message : 'Error' })
    }
    setLoading(false)
  }

  // Test click tracking
  const testClickTracking = async () => {
    setLoading(true)
    try {
      const link = generateAviasalesLink({
        origin: 'SYD',
        destination: 'MEL',
        departureDate: '2025-12-01'
      })

      const result = await trackAviasalesClick({
        sessionId: 'test-session-' + Date.now(),
        originAirport: 'SYD',
        destinationAirport: 'MEL',
        departureDate: '2025-12-01',
        displayedPrice: 89,
        clickUrl: link
      })

      setTrackingTest(result)
    } catch (error) {
      setTrackingTest({ error: error instanceof Error ? error.message : 'Error' })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h1 className="text-4xl font-bold text-white mb-2">
            Affiliate Integration Test
          </h1>
          <p className="text-white/70">
            Test your Travelpayouts API credentials and integration
          </p>
        </div>

        {/* API Test Results */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">
            🔍 API Endpoint Test
          </h2>
          {!apiTest ? (
            <p className="text-white/70">Loading...</p>
          ) : apiTest.error ? (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-200 font-semibold">❌ Error:</p>
              <p className="text-red-200">{apiTest.error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`${apiTest.status?.includes('PASSED') ? 'bg-green-500/20 border-green-500/50' : 'bg-yellow-500/20 border-yellow-500/50'} border rounded-lg p-4`}>
                <p className="text-white font-semibold text-lg">{apiTest.status}</p>
                <p className="text-white/70 text-sm mt-2">{apiTest.nextSteps}</p>
              </div>

              {/* Credentials */}
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white font-semibold mb-2">Credentials:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={apiTest.credentials?.hasToken ? 'text-green-400' : 'text-red-400'}>
                      {apiTest.credentials?.hasToken ? '✅' : '❌'}
                    </span>
                    <span className="text-white/70">TRAVELPAYOUTS_TOKEN</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={apiTest.credentials?.hasMarker ? 'text-green-400' : 'text-red-400'}>
                      {apiTest.credentials?.hasMarker ? '✅' : '❌'}
                    </span>
                    <span className="text-white/70">TRAVELPAYOUTS_MARKER</span>
                  </div>
                </div>
              </div>

              {/* Test Results */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Flights */}
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold">Flights API</span>
                    <span className={apiTest.tests?.flights?.success ? 'text-green-400' : 'text-red-400'}>
                      {apiTest.tests?.flights?.success ? '✅' : '❌'}
                    </span>
                  </div>
                  {apiTest.tests?.flights?.success && (
                    <div className="text-sm space-y-1">
                      <p className="text-white/70">Found: {apiTest.tests.flights.flightCount} flights</p>
                      <p className="text-white/70">From: ${apiTest.tests.flights.cheapestPrice}</p>
                    </div>
                  )}
                  {apiTest.tests?.flights?.error && (
                    <p className="text-red-200 text-sm">{apiTest.tests.flights.error}</p>
                  )}
                </div>

                {/* Hotels */}
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold">Hotels API</span>
                    <span className={apiTest.tests?.hotels?.success ? 'text-green-400' : 'text-red-400'}>
                      {apiTest.tests?.hotels?.success ? '✅' : '❌'}
                    </span>
                  </div>
                  {apiTest.tests?.hotels?.success && (
                    <div className="text-sm space-y-1">
                      <p className="text-white/70">Found: {apiTest.tests.hotels.hotelCount} hotels</p>
                      <p className="text-white/70">From: ${apiTest.tests.hotels.cheapestPrice}/night</p>
                    </div>
                  )}
                  {apiTest.tests?.hotels?.error && (
                    <p className="text-red-200 text-sm">{apiTest.tests.hotels.error}</p>
                  )}
                </div>

                {/* Links */}
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold">Affiliate Links</span>
                    <span className={apiTest.tests?.affiliateLinks?.success ? 'text-green-400' : 'text-red-400'}>
                      {apiTest.tests?.affiliateLinks?.success ? '✅' : '❌'}
                    </span>
                  </div>
                  {apiTest.tests?.affiliateLinks?.success && (
                    <div className="text-sm">
                      <p className="text-white/70">
                        {apiTest.tests.affiliateLinks.hasMarker ? 'Marker included ✅' : 'No marker ❌'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Manual Tests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Flight Search Test */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">✈️ Test Flight Search</h2>
            <button
              onClick={testFlightSearch}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors w-full mb-4"
            >
              {loading ? 'Searching...' : 'Search SYD → MEL'}
            </button>

            {flightTest && (
              <div className="bg-white/5 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-white text-xs whitespace-pre-wrap">
                  {JSON.stringify(flightTest, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Hotel Search Test */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">🏨 Test Hotel Search</h2>
            <button
              onClick={testHotelSearch}
              disabled={loading}
              className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors w-full mb-4"
            >
              {loading ? 'Searching...' : 'Search Melbourne Hotels'}
            </button>

            {hotelTest && (
              <div className="bg-white/5 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-white text-xs whitespace-pre-wrap">
                  {JSON.stringify(hotelTest, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Click Tracking Test */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">📊 Test Click Tracking</h2>
          <button
            onClick={testClickTracking}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors mb-4"
          >
            {loading ? 'Tracking...' : 'Track Test Click'}
          </button>

          {trackingTest && (
            <div className="bg-white/5 rounded-lg p-4">
              <pre className="text-white text-xs whitespace-pre-wrap">
                {JSON.stringify(trackingTest, null, 2)}
              </pre>
              {trackingTest.success && (
                <p className="text-green-200 mt-4">
                  ✅ Click tracked! Check your database `affiliate_clicks` table for ID: {trackingTest.clickId}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">📝 Setup Instructions</h2>
          <ol className="text-white/70 space-y-3 list-decimal list-inside">
            <li>Sign up for Travelpayouts: <a href="https://www.travelpayouts.com/" target="_blank" className="text-blue-300 hover:underline">https://www.travelpayouts.com/</a></li>
            <li>Get your API token and marker from the dashboard</li>
            <li>Add to <code className="bg-white/10 px-2 py-1 rounded text-sm">frontend/.env.local</code>:</li>
          </ol>
          <div className="bg-black/30 rounded-lg p-4 mt-3 font-mono text-sm">
            <code className="text-green-300">
              TRAVELPAYOUTS_TOKEN=your_token_here<br />
              TRAVELPAYOUTS_MARKER=your_marker_here
            </code>
          </div>
          <p className="text-white/70 mt-4">Restart your dev server and refresh this page to test!</p>
        </div>
      </div>
    </div>
  )
}
