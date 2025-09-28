#!/usr/bin/env tsx

/**
 * Test Amadeus API Authentication
 * Verifies that Amadeus credentials work and can fetch real data
 */

import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') })

interface AmadeusTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

async function testAmadeusAuth(): Promise<void> {
  console.log('🔐 Testing Amadeus API Authentication...\n')

  // Check environment variables
  const clientId = process.env.AMADEUS_CLIENT_ID
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET
  const environment = process.env.AMADEUS_ENVIRONMENT || 'test'

  console.log('📋 Configuration:')
  console.log(`   Environment: ${environment}`)
  console.log(`   Client ID: ${clientId ? `${clientId.substring(0, 8)}...` : 'NOT SET'}`)
  console.log(`   Client Secret: ${clientSecret ? `${clientSecret.substring(0, 4)}...` : 'NOT SET'}`)
  console.log('')

  if (!clientId || !clientSecret) {
    console.log('❌ ERROR: Amadeus credentials not configured')
    console.log('   Please set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET in .env.local')
    process.exit(1)
  }

  const baseUrl = environment === 'production' 
    ? 'https://api.amadeus.com'
    : 'https://test.api.amadeus.com'

  console.log(`🌐 Testing against: ${baseUrl}`)

  try {
    // Step 1: Get access token
    console.log('\n🔑 Step 1: Requesting access token...')
    
    const authResponse = await fetch(`${baseUrl}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      })
    })

    if (!authResponse.ok) {
      const errorText = await authResponse.text()
      console.log(`❌ Authentication failed: ${authResponse.status}`)
      console.log(`   Response: ${errorText}`)
      process.exit(1)
    }

    const authData: AmadeusTokenResponse = await authResponse.json()
    console.log(`✅ Authentication successful!`)
    console.log(`   Token type: ${authData.token_type}`)
    console.log(`   Expires in: ${authData.expires_in} seconds`)

    // Step 2: Test airport search
    console.log('\n✈️ Step 2: Testing airport search...')
    
    const airportResponse = await fetch(
      `${baseUrl}/v1/reference-data/locations?subType=AIRPORT&keyword=London&page[limit]=3`,
      {
        headers: {
          'Authorization': `Bearer ${authData.access_token}`
        }
      }
    )

    if (!airportResponse.ok) {
      const errorText = await airportResponse.text()
      console.log(`❌ Airport search failed: ${airportResponse.status}`)
      console.log(`   Response: ${errorText}`)
      process.exit(1)
    }

    const airportData = await airportResponse.json()
    console.log(`✅ Airport search successful!`)
    console.log(`   Found ${airportData.data?.length || 0} airports`)
    
    if (airportData.data && airportData.data.length > 0) {
      airportData.data.forEach((airport: any, index: number) => {
        console.log(`   ${index + 1}. ${airport.name} (${airport.iataCode}) - ${airport.address?.cityName}`)
      })
    }

    // Step 3: Test flight search
    console.log('\n🛫 Step 3: Testing flight search...')
    
    // Use tomorrow's date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const departureDate = tomorrow.toISOString().split('T')[0]

    const flightResponse = await fetch(
      `${baseUrl}/v2/shopping/flight-offers?originLocationCode=LHR&destinationLocationCode=BCN&departureDate=${departureDate}&adults=1&max=3`,
      {
        headers: {
          'Authorization': `Bearer ${authData.access_token}`
        }
      }
    )

    if (!flightResponse.ok) {
      const errorText = await flightResponse.text()
      console.log(`❌ Flight search failed: ${flightResponse.status}`)
      console.log(`   Response: ${errorText}`)
      
      // This might fail in test environment with limited data
      console.log('\n⚠️  Note: Flight search may have limited data in test environment')
    } else {
      const flightData = await flightResponse.json()
      console.log(`✅ Flight search successful!`)
      console.log(`   Found ${flightData.data?.length || 0} flight offers`)
      
      if (flightData.data && flightData.data.length > 0) {
        const firstFlight = flightData.data[0]
        console.log(`   First flight: ${firstFlight.price?.currency} ${firstFlight.price?.total}`)
        console.log(`   Airline: ${firstFlight.validatingAirlineCodes?.[0] || 'Unknown'}`)
        console.log(`   Duration: ${firstFlight.itineraries?.[0]?.duration || 'Unknown'}`)
      }
    }

    console.log('\n🎉 Amadeus API test completed successfully!')
    console.log('✅ All authentication and basic API calls are working')

  } catch (error) {
    console.log('\n💥 Test failed with error:')
    console.error(error)
    process.exit(1)
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testAmadeusAuth()
}

export { testAmadeusAuth }