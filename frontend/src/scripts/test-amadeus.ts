/**
 * Amadeus API Test Script
 *
 * Usage:
 *   npx tsx src/scripts/test-amadeus.ts
 *
 * Requirements:
 *   - AMADEUS_CLIENT_ID in .env.local
 *   - AMADEUS_CLIENT_SECRET in .env.local
 */

// Load environment variables
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import {
  getAccessToken,
  searchFlights,
  parseDurationToMinutes,
  formatDuration,
  getCheapestOffer,
  getTotalDuration,
  type FlightSearchParams
} from '../lib/amadeus'
import { writeFileSync } from 'fs'
import { join } from 'path'

// Test queries (diverse routes to cover different scenarios)
const TEST_QUERIES: FlightSearchParams[] = [
  {
    origin: 'LAX',
    destination: 'JFK',
    departureDate: '2025-11-15',
    adults: 1
  },
  {
    origin: 'SFO',
    destination: 'MIA',
    departureDate: '2025-11-20',
    adults: 2
  },
  {
    origin: 'LAX',
    destination: 'LHR',
    departureDate: '2025-12-01',
    adults: 1
  }
]

async function main() {
  console.log('🚀 Starting Amadeus API Test\n')
  console.log('=' .repeat(60))

  // Test 1: Authentication
  console.log('\n📝 Test 1: Authentication & Token Caching')
  console.log('-'.repeat(60))

  try {
    const token1 = await getAccessToken()
    console.log('✅ First token fetch successful')
    console.log(`   Token preview: ${token1.substring(0, 20)}...`)

    // Test token caching
    const token2 = await getAccessToken()
    console.log('✅ Second token fetch (should be cached)')

    if (token1 === token2) {
      console.log('✅ Token caching works correctly!')
    } else {
      console.log('⚠️  Warning: Tokens don\'t match (unexpected)')
    }
  } catch (error) {
    console.error('❌ Authentication failed:', error)
    process.exit(1)
  }

  // Test 2: Flight Search
  console.log('\n📝 Test 2: Flight Search (Sample Queries)')
  console.log('-'.repeat(60))

  const results: any[] = []

  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const query = TEST_QUERIES[i]
    console.log(`\nQuery ${i + 1}/${TEST_QUERIES.length}:`, query)

    try {
      const response = await searchFlights(query)

      console.log(`✅ Found ${response.data.length} offers`)

      if (response.data.length > 0) {
        const cheapest = getCheapestOffer(response)
        if (cheapest) {
          const duration = getTotalDuration(cheapest)
          console.log(`   Cheapest: ${cheapest.price.total} ${cheapest.price.currency}`)
          console.log(`   Duration: ${formatDuration(duration)}`)
          console.log(`   Carrier: ${cheapest.validatingAirlineCodes[0]}`)
        }
      } else {
        console.log('   No offers found for this route/date')
      }

      // Save sample response
      results.push({
        query,
        offersCount: response.data.length,
        sample: response.data[0] || null,
        cheapest: getCheapestOffer(response),
        meta: response.meta
      })

      // Rate limit protection: wait 1 second between requests
      if (i < TEST_QUERIES.length - 1) {
        console.log('   ⏳ Waiting 1s (rate limit protection)...')
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

    } catch (error) {
      console.error(`❌ Search failed:`, error)

      results.push({
        query,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Test 3: Utility Functions
  console.log('\n📝 Test 3: Utility Functions')
  console.log('-'.repeat(60))

  const testDurations = ['PT5H30M', 'PT2H15M', 'PT12H', 'PT45M']
  testDurations.forEach(duration => {
    const minutes = parseDurationToMinutes(duration)
    const formatted = formatDuration(minutes)
    console.log(`${duration} → ${minutes} min → ${formatted}`)
  })

  // Save results to file
  console.log('\n💾 Saving test results...')
  const resultsPath = join(process.cwd(), 'tests', 'fixtures', 'amadeus-samples.json')

  try {
    // Create directory if it doesn't exist
    const { existsSync, mkdirSync } = await import('fs')
    const dir = join(process.cwd(), 'tests', 'fixtures')
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    writeFileSync(
      resultsPath,
      JSON.stringify(results, null, 2),
      'utf-8'
    )
    console.log(`✅ Results saved to: ${resultsPath}`)
  } catch (error) {
    console.error('❌ Failed to save results:', error)
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Test Summary')
  console.log('='.repeat(60))
  console.log(`Total queries: ${TEST_QUERIES.length}`)
  console.log(`Successful: ${results.filter(r => !r.error).length}`)
  console.log(`Failed: ${results.filter(r => r.error).length}`)
  console.log('\n✨ Test completed!')
}

// Run tests
main()
  .catch(error => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })
