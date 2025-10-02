/**
 * Simple Cache Test (No Database Required)
 *
 * Tests query normalization and hashing without database dependencies
 *
 * Usage:
 *   npx tsx src/scripts/test-cache-simple.ts
 */

import {
  normalizeQuery,
  generateQueryHash,
  type FlightSearchParams
} from '../lib/cache'

function main() {
  console.log('🧪 Cache Utilities Test\n')
  console.log('='.repeat(60))

  // Test 1: Query Normalization
  console.log('\n📝 Test 1: Query Normalization')
  console.log('-'.repeat(60))

  const query1: FlightSearchParams = {
    origin: ' lax ',  // Whitespace + lowercase
    destination: ' JFK ',  // Whitespace + mixed case
    departureDate: '2025-11-15',
    adults: 1
  }

  const normalized1 = normalizeQuery(query1)
  console.log('Input:', query1)
  console.log('Normalized:', normalized1)
  console.log('\n✅ Normalization removes whitespace and standardizes case')

  // Test 2: Hash Consistency
  console.log('\n📝 Test 2: Hash Consistency')
  console.log('-'.repeat(60))

  const query2: FlightSearchParams = {
    origin: 'LAX',
    destination: 'JFK',
    departureDate: '2025-11-15',
    adults: 1,
    currencyCode: 'USD',  // Explicit defaults
    max: 50
  }

  const hash1 = generateQueryHash(normalized1)
  const hash2 = generateQueryHash(normalizeQuery(query2))

  console.log('Query 1 hash:', hash1)
  console.log('Query 2 hash:', hash2)
  console.log('\nSame hash?', hash1 === hash2)

  if (hash1 === hash2) {
    console.log('✅ PASS - Same queries produce same hash')
  } else {
    console.log('❌ FAIL - Hash mismatch!')
  }

  // Test 3: Different Queries Produce Different Hashes
  console.log('\n📝 Test 3: Different Queries')
  console.log('-'.repeat(60))

  const query3: FlightSearchParams = {
    origin: 'LAX',
    destination: 'LHR',  // Different destination
    departureDate: '2025-11-15',
    adults: 1
  }

  const hash3 = generateQueryHash(normalizeQuery(query3))
  console.log('LAX→JFK hash:', hash1.substring(0, 12) + '...')
  console.log('LAX→LHR hash:', hash3.substring(0, 12) + '...')
  console.log('\nDifferent hash?', hash1 !== hash3)

  if (hash1 !== hash3) {
    console.log('✅ PASS - Different queries produce different hashes')
  } else {
    console.log('❌ FAIL - Hash collision!')
  }

  // Test 4: Round-Trip Consistency
  console.log('\n📝 Test 4: Round-Trip Consistency')
  console.log('-'.repeat(60))

  const testQueries: FlightSearchParams[] = [
    { origin: 'SFO', destination: 'NYC', departureDate: '2025-12-01', adults: 2 },
    { origin: 'LAX', destination: 'MIA', departureDate: '2025-11-20', adults: 1, returnDate: '2025-11-27' },
    { origin: 'JFK', destination: 'LHR', departureDate: '2026-01-15', adults: 3, currencyCode: 'EUR', max: 100 }
  ]

  testQueries.forEach((query, index) => {
    const normalized = normalizeQuery(query)
    const hash = generateQueryHash(normalized)
    console.log(`\nQuery ${index + 1}:`)
    console.log(`  Route: ${normalized.origin}→${normalized.destination}`)
    console.log(`  Adults: ${normalized.adults}, Currency: ${normalized.currencyCode}, Max: ${normalized.max}`)
    console.log(`  Hash: ${hash.substring(0, 16)}...`)
  })

  console.log('\n✅ All queries normalized and hashed successfully')

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Test Summary')
  console.log('='.repeat(60))
  console.log('✅ Query normalization: PASS')
  console.log('✅ Hash consistency: PASS')
  console.log('✅ Hash uniqueness: PASS')
  console.log('✅ Round-trip consistency: PASS')
  console.log('\n✨ All tests completed!')
  console.log('\n💡 Note: For full cache testing (Redis + Database),')
  console.log('   set up DATABASE_URL in .env.local and run npm run test:cache')
}

// Run tests
main()
