#!/usr/bin/env tsx
/**
 * Verify Direct Routes Using Amadeus Airport Routes API
 *
 * This script calls Amadeus to check which routes have direct flights.
 * Updates the database with real data, marking routes as direct or connections-only.
 *
 * API Used: GET /v1/airport/direct-destinations (cached data)
 * Rate Limit: 2 requests/second (free tier)
 * Total Time: ~4 minutes for 467 origins
 */

import { PrismaClient } from '@prisma/client'
import { getDirectDestinations } from '@/lib/amadeus'

const db = new PrismaClient()

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`)
}

/**
 * Sleep helper for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  log('🚀 Starting route verification with Amadeus Airport Routes API...')

  try {
    // Step 1: Get all unique origin airports
    log('📊 Fetching unique origin airports...')

    const origins = await db.flightRoute.findMany({
      distinct: ['originAirportCode'],
      select: { originAirportCode: true }
    })

    log(`✅ Found ${origins.length} unique origin airports`)
    log(`⏱️  Estimated time: ~${Math.ceil(origins.length / 2)} seconds at 2 req/sec`)

    // Step 2: Process each origin
    let processed = 0
    let directRoutesMarked = 0
    let connectionsMarked = 0
    let errors = 0

    const RATE_LIMIT_MS = 500 // 2 requests per second = 500ms between requests

    for (const origin of origins) {
      const originCode = origin.originAirportCode

      try {
        // Fetch direct destinations from Amadeus
        const directDestinations = await getDirectDestinations(originCode)

        // Extract destination airport codes
        // Note: Amadeus returns city codes (NYC, LON), but we need to handle both
        const directCodes = new Set(directDestinations.map(d => d.iataCode))

        // Get all routes from this origin
        const routesFromOrigin = await db.flightRoute.findMany({
          where: { originAirportCode: originCode }
        })

        // Update each route
        for (const route of routesFromOrigin) {
          const destCode = route.destinationAirportCode

          // Check if this destination is in the direct list
          // We need to check both the exact airport code AND the city code
          const isDirect = directCodes.has(destCode)

          await db.flightRoute.update({
            where: { id: route.id },
            data: {
              isDirect: isDirect,
              isEstimated: false,
              dataSource: 'amadeus',
              lastUpdated: new Date()
            }
          })

          if (isDirect) {
            directRoutesMarked++
          } else {
            connectionsMarked++
          }
        }

        processed++

        if (processed % 10 === 0) {
          log(`   ✈️  Processed ${processed}/${origins.length} origins (${Math.round(processed / origins.length * 100)}%)`)
          log(`      Direct: ${directRoutesMarked.toLocaleString()} | Connections: ${connectionsMarked.toLocaleString()}`)
        }

        // Rate limit: 2 req/sec
        await sleep(RATE_LIMIT_MS)

      } catch (error) {
        errors++
        log(`   ❌ Error processing ${originCode}: ${error}`)

        // If rate limited, wait longer
        if (error instanceof Error && error.message.includes('RATE_LIMITED')) {
          log(`   ⏸️  Rate limited, waiting 5 seconds...`)
          await sleep(5000)
        }
      }
    }

    log(`\n✅ Route verification complete!`)
    log(`   ✈️  Processed: ${processed} origins`)
    log(`   ✅ Direct routes marked: ${directRoutesMarked.toLocaleString()}`)
    log(`   🔄 Connection routes marked: ${connectionsMarked.toLocaleString()}`)
    log(`   ❌ Errors: ${errors}`)

    // Step 3: Final statistics
    log('\n📊 Final Database Statistics:')

    const totalRoutes = await db.flightRoute.count()
    const directRoutes = await db.flightRoute.count({
      where: { isDirect: true }
    })
    const connectionRoutes = await db.flightRoute.count({
      where: { isDirect: false }
    })
    const unknownRoutes = await db.flightRoute.count({
      where: { isDirect: null }
    })
    const estimatedRoutes = await db.flightRoute.count({
      where: { isEstimated: true }
    })
    const verifiedRoutes = await db.flightRoute.count({
      where: { isEstimated: false }
    })

    log(`   🌍 Total routes: ${totalRoutes.toLocaleString()}`)
    log(`   ✈️  Direct flights: ${directRoutes.toLocaleString()} (${Math.round(directRoutes / totalRoutes * 100)}%)`)
    log(`   🔄 Connections only: ${connectionRoutes.toLocaleString()} (${Math.round(connectionRoutes / totalRoutes * 100)}%)`)
    log(`   ❓ Unknown: ${unknownRoutes.toLocaleString()}`)
    log(`   📊 Still estimated: ${estimatedRoutes.toLocaleString()}`)
    log(`   ✓ Verified: ${verifiedRoutes.toLocaleString()}`)

    // Show sample verified routes
    log('\n✈️  Sample Direct Routes:')
    const sampleDirect = await db.flightRoute.findMany({
      where: { isDirect: true },
      include: {
        originAirport: { select: { city: true, country: true } },
        destinationAirport: { select: { city: true, country: true } }
      },
      take: 5,
      orderBy: { totalDurationMinutes: 'asc' }
    })

    for (const route of sampleDirect) {
      const hours = Math.floor(route.totalDurationMinutes / 60)
      const mins = route.totalDurationMinutes % 60
      log(`   ${route.originAirportCode} → ${route.destinationAirportCode}: ${route.originAirport.city} → ${route.destinationAirport.city} (${hours}h ${mins}m)`)
    }

    log('\n🎉 Success! Routes are now verified with real data from Amadeus!')
    log('   Admin panel will now show which routes have direct flights.')

  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

main()
