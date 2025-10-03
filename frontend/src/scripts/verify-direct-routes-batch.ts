#!/usr/bin/env tsx
/**
 * Verify Direct Routes - BATCH VERSION
 *
 * Process a subset of origins at a time for faster parallel execution.
 *
 * Usage:
 *   npx tsx src/scripts/verify-direct-routes-batch.ts [batchNumber] [batchSize]
 *
 * Examples:
 *   npx tsx src/scripts/verify-direct-routes-batch.ts 0 50    # Process origins 0-49
 *   npx tsx src/scripts/verify-direct-routes-batch.ts 1 50    # Process origins 50-99
 *   npx tsx src/scripts/verify-direct-routes-batch.ts 2 50    # Process origins 100-149
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { getDirectDestinations } from '@/lib/amadeus'

const db = new PrismaClient()

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  // Parse command line arguments
  const batchNumber = parseInt(process.argv[2] || '0')
  const batchSize = parseInt(process.argv[3] || '50')

  const startIndex = batchNumber * batchSize
  const endIndex = startIndex + batchSize

  log(`🚀 Starting BATCH ${batchNumber} route verification...`)
  log(`   Range: Origins ${startIndex} to ${endIndex - 1} (${batchSize} origins)`)

  try {
    // Step 1: Get all unique origin airports
    const allOrigins = await db.flightRoute.findMany({
      distinct: ['originAirportCode'],
      select: { originAirportCode: true },
      orderBy: { originAirportCode: 'asc' }
    })

    log(`📊 Total origins in database: ${allOrigins.length}`)

    // Get this batch
    const origins = allOrigins.slice(startIndex, endIndex)

    if (origins.length === 0) {
      log(`⚠️  No origins in this batch range. Total origins: ${allOrigins.length}`)
      log(`   Batch ${batchNumber} is out of range.`)
      return
    }

    log(`✅ Processing ${origins.length} origins in this batch`)
    log(`⏱️  Estimated time: ~${Math.ceil(origins.length / 2)} seconds at 2 req/sec`)

    // Step 2: Process each origin
    let processed = 0
    let directRoutesMarked = 0
    let connectionsMarked = 0
    let errors = 0

    const RATE_LIMIT_MS = 500 // 2 requests per second

    for (const origin of origins) {
      const originCode = origin.originAirportCode

      try {
        // Fetch direct destinations from Amadeus
        const directDestinations = await getDirectDestinations(originCode)

        // Extract destination codes
        const directCodes = new Set(directDestinations.map(d => d.iataCode))

        // Get all routes from this origin
        const routesFromOrigin = await db.flightRoute.findMany({
          where: { originAirportCode: originCode }
        })

        // Update each route
        for (const route of routesFromOrigin) {
          const destCode = route.destinationAirportCode
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

        // Progress update every 5 origins
        if (processed % 5 === 0) {
          const overallProgress = startIndex + processed
          const overallPercent = Math.round(overallProgress / allOrigins.length * 100)
          log(`   ✈️  Batch progress: ${processed}/${origins.length} | Overall: ${overallProgress}/${allOrigins.length} (${overallPercent}%)`)
          log(`      Direct: ${directRoutesMarked.toLocaleString()} | Connections: ${connectionsMarked.toLocaleString()}`)
        }

        // Rate limit
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

    log(`\n✅ Batch ${batchNumber} verification complete!`)
    log(`   ✈️  Processed: ${processed}/${origins.length} origins`)
    log(`   ✅ Direct routes marked: ${directRoutesMarked.toLocaleString()}`)
    log(`   🔄 Connection routes marked: ${connectionsMarked.toLocaleString()}`)
    log(`   ❌ Errors: ${errors}`)

    // Overall progress
    const totalVerified = await db.flightRoute.count({
      where: { isEstimated: false }
    })
    const totalRoutes = await db.flightRoute.count()
    const percentComplete = Math.round(totalVerified / totalRoutes * 100)

    log(`\n📊 Overall Progress:`)
    log(`   ✓ Verified routes: ${totalVerified.toLocaleString()}/${totalRoutes.toLocaleString()} (${percentComplete}%)`)
    log(`   📊 Still estimated: ${(totalRoutes - totalVerified).toLocaleString()}`)

    // Calculate remaining batches
    const remainingOrigins = allOrigins.length - endIndex
    const remainingBatches = Math.ceil(remainingOrigins / batchSize)

    if (remainingBatches > 0) {
      log(`\n🔜 Next Steps:`)
      log(`   Run batch ${batchNumber + 1}: npx tsx src/scripts/verify-direct-routes-batch.ts ${batchNumber + 1} ${batchSize}`)
      log(`   Remaining batches: ${remainingBatches}`)
    } else {
      log(`\n🎉 All batches complete! All routes verified.`)
    }

  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

main()
