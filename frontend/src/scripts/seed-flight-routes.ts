/**
 * Seed Flight Routes Script
 *
 * Populates flight_routes table with duration data from Amadeus API
 * for all existing destinations in the database.
 *
 * Usage:
 *   npm run db:seed-routes                    # Normal run
 *   npm run db:seed-routes -- --dry-run       # Show plan without executing
 *   npm run db:seed-routes -- --resume        # Resume from saved progress
 *   npm run db:seed-routes -- --batch-size 10 # Process 10 origins at a time
 */

import { PrismaClient } from '@prisma/client'
import { searchFlights, parseDurationToMinutes } from '@/lib/amadeus'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// ============================================================================
// Configuration
// ============================================================================

const REQUESTS_PER_SECOND = 2
const DELAY_MS = 1000 / REQUESTS_PER_SECOND  // 500ms between requests
const PROGRESS_FILE = path.join(process.cwd(), '.seed-routes-progress.json')

// Departure date (30 days from now - typical advance booking)
const today = new Date()
const departureDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
const departureDateStr = departureDate.toISOString().split('T')[0]

interface Progress {
  lastProcessedOrigin: string | null
  routesCreated: number
  routesSkipped: number
  errors: Array<{ origin: string; destination: string; error: string }>
  startedAt: string
  lastUpdatedAt: string
}

interface SeedStats {
  totalOrigins: number
  totalDestinations: number
  potentialRoutes: number
  existingRoutes: number
  routesToCreate: number
  routesCreated: number
  routesSkipped: number
  errors: number
  startTime: number
  endTime?: number
}

// ============================================================================
// Helper Functions
// ============================================================================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function loadProgress(): Progress | null {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const data = fs.readFileSync(PROGRESS_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Failed to load progress file:', error)
  }
  return null
}

function saveProgress(progress: Progress): void {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
  } catch (error) {
    console.error('Failed to save progress:', error)
  }
}

function clearProgress(): void {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      fs.unlinkSync(PROGRESS_FILE)
    }
  } catch (error) {
    console.error('Failed to clear progress file:', error)
  }
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

function formatETA(remainingOrigins: number, avgTimePerOrigin: number): string {
  const totalSeconds = Math.round((remainingOrigins * avgTimePerOrigin) / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

// ============================================================================
// Main Seeding Logic
// ============================================================================

async function seedFlightRoutes(options: {
  dryRun?: boolean
  resume?: boolean
  batchSize?: number
}) {
  const stats: SeedStats = {
    totalOrigins: 0,
    totalDestinations: 0,
    potentialRoutes: 0,
    existingRoutes: 0,
    routesToCreate: 0,
    routesCreated: 0,
    routesSkipped: 0,
    errors: 0,
    startTime: Date.now()
  }

  console.log('\n🛫 Flight Routes Seeding Script')
  console.log('=' .repeat(60))
  console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Departure Date: ${departureDateStr}`)
  console.log(`Rate Limit: ${REQUESTS_PER_SECOND} req/sec\n`)

  // Load progress if resuming
  let progress: Progress | null = null
  if (options.resume) {
    progress = loadProgress()
    if (progress) {
      console.log('📂 Resuming from previous run:')
      console.log(`   Last processed: ${progress.lastProcessedOrigin}`)
      console.log(`   Routes created: ${progress.routesCreated}`)
      console.log(`   Routes skipped: ${progress.routesSkipped}`)
      console.log(`   Errors: ${progress.errors.length}\n`)
    } else {
      console.log('⚠️  No progress file found, starting fresh\n')
    }
  }

  // Initialize progress if not resuming
  if (!progress) {
    progress = {
      lastProcessedOrigin: null,
      routesCreated: 0,
      routesSkipped: 0,
      errors: [],
      startedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString()
    }
  }

  // Step 1: Get all unique airport codes from destinations
  console.log('📊 Analyzing destinations...\n')

  const destinationsWithAirports = await prisma.$queryRaw<Array<{
    destination_id: string
    airport_code: string
    city_name: string
  }>>`
    SELECT DISTINCT
      da.destination_id,
      da.airport_code,
      d.city_name
    FROM destination_airports da
    JOIN destinations d ON da.destination_id = d.id
    WHERE da.is_primary = true
    ORDER BY da.airport_code ASC
  `

  const uniqueAirportCodes = [...new Set(destinationsWithAirports.map(d => d.airport_code))]

  stats.totalOrigins = uniqueAirportCodes.length
  stats.totalDestinations = uniqueAirportCodes.length
  stats.potentialRoutes = stats.totalOrigins * (stats.totalDestinations - 1) // excluding self-routes

  console.log(`   Unique airports: ${uniqueAirportCodes.length}`)
  console.log(`   Potential routes: ${stats.potentialRoutes} (excluding self-routes)\n`)

  // Step 2: Count existing routes
  const existingRoutesCount = await prisma.flightRoute.count()
  stats.existingRoutes = existingRoutesCount
  stats.routesToCreate = stats.potentialRoutes - existingRoutesCount

  console.log(`   Existing routes: ${existingRoutesCount}`)
  console.log(`   Routes to create: ${stats.routesToCreate}\n`)

  if (options.dryRun) {
    console.log('🔍 DRY RUN - Estimated runtime:')
    const estimatedSeconds = (stats.routesToCreate * DELAY_MS) / 1000
    const estimatedMinutes = Math.round(estimatedSeconds / 60)
    const estimatedHours = Math.round(estimatedMinutes / 60)

    console.log(`   API calls needed: ${stats.routesToCreate}`)
    console.log(`   Estimated time: ${estimatedHours > 0 ? `${estimatedHours}h ${estimatedMinutes % 60}m` : `${estimatedMinutes}m`}`)
    console.log(`   Rate: ${REQUESTS_PER_SECOND} requests/second`)
    console.log('\n✅ Dry run complete. Run without --dry-run to execute.\n')
    return
  }

  // Step 3: Process each origin
  console.log('🚀 Starting route creation...\n')

  const originCodesToProcess = options.resume && progress.lastProcessedOrigin
    ? uniqueAirportCodes.slice(uniqueAirportCodes.indexOf(progress.lastProcessedOrigin) + 1)
    : uniqueAirportCodes

  let processedOrigins = 0
  const originStartTime = Date.now()

  for (const originCode of originCodesToProcess) {
    processedOrigins++
    const originInfo = destinationsWithAirports.find(d => d.airport_code === originCode)
    const originCity = originInfo?.city_name || originCode

    console.log(`[${processedOrigins}/${originCodesToProcess.length}] Processing ${originCode} (${originCity})...`)

    // Get destinations for this origin (excluding self)
    const destinationCodes = uniqueAirportCodes.filter(code => code !== originCode)

    let routesCreatedForOrigin = 0
    let routesSkippedForOrigin = 0

    for (const destCode of destinationCodes) {
      // Check if route already exists
      const existingRoute = await prisma.flightRoute.findUnique({
        where: {
          originAirportCode_destinationAirportCode: {
            originAirportCode: originCode,
            destinationAirportCode: destCode
          }
        }
      })

      if (existingRoute) {
        routesSkippedForOrigin++
        progress.routesSkipped++
        continue
      }

      // Fetch flight data from Amadeus
      try {
        await delay(DELAY_MS) // Rate limiting

        const result = await searchFlights({
          origin: originCode,
          destination: destCode,
          departureDate: departureDateStr,
          adults: 1,
          max: 1 // Only need one offer to get duration
        })

        if (!result.data || result.data.length === 0) {
          // No flights available for this route
          routesSkippedForOrigin++
          progress.routesSkipped++
          continue
        }

        // Extract duration from first itinerary
        const firstOffer = result.data[0]
        const durationISO = firstOffer.itineraries[0].duration
        const totalMinutes = parseDurationToMinutes(durationISO)

        // Create route
        await prisma.flightRoute.create({
          data: {
            originAirportCode: originCode,
            destinationAirportCode: destCode,
            totalDurationMinutes: totalMinutes
          }
        })

        routesCreatedForOrigin++
        progress.routesCreated++

      } catch (error: any) {
        // Log error and continue
        const errorMsg = error.message || 'Unknown error'
        progress.errors.push({
          origin: originCode,
          destination: destCode,
          error: errorMsg
        })
        stats.errors++

        // If rate limited, wait longer
        if (errorMsg.includes('RATE_LIMITED')) {
          console.log('   ⚠️  Rate limited, waiting 5 seconds...')
          await delay(5000)
        }
      }
    }

    // Update progress
    progress.lastProcessedOrigin = originCode
    progress.lastUpdatedAt = new Date().toISOString()
    saveProgress(progress)

    // Calculate ETA
    const avgTimePerOrigin = (Date.now() - originStartTime) / processedOrigins
    const remainingOrigins = originCodesToProcess.length - processedOrigins
    const eta = formatETA(remainingOrigins, avgTimePerOrigin)

    console.log(`   ✅ Created: ${routesCreatedForOrigin} | Skipped: ${routesSkippedForOrigin} | ETA: ${eta}\n`)

    // Check batch size limit
    if (options.batchSize && processedOrigins >= options.batchSize) {
      console.log(`⏸️  Batch limit reached (${options.batchSize} origins). Run with --resume to continue.\n`)
      break
    }
  }

  stats.endTime = Date.now()
  stats.routesCreated = progress.routesCreated
  stats.routesSkipped = progress.routesSkipped
  stats.errors = progress.errors.length

  // Final summary
  console.log('=' .repeat(60))
  console.log('✅ Seeding Complete!\n')
  console.log('Summary:')
  console.log(`   Total routes created: ${stats.routesCreated}`)
  console.log(`   Total routes skipped: ${stats.routesSkipped}`)
  console.log(`   Errors: ${stats.errors}`)
  console.log(`   Duration: ${Math.round((stats.endTime - stats.startTime) / 1000 / 60)} minutes\n`)

  if (progress.errors.length > 0) {
    console.log('⚠️  Errors encountered:')
    progress.errors.slice(0, 10).forEach(err => {
      console.log(`   ${err.origin} → ${err.destination}: ${err.error}`)
    })
    if (progress.errors.length > 10) {
      console.log(`   ... and ${progress.errors.length - 10} more errors\n`)
    }
  }

  // Clear progress file on complete success
  if (processedOrigins === originCodesToProcess.length && stats.errors === 0) {
    clearProgress()
    console.log('✨ Progress file cleared.\n')
  } else {
    console.log('💾 Progress saved. Run with --resume to continue.\n')
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  const args = process.argv.slice(2)
  const options = {
    dryRun: args.includes('--dry-run'),
    resume: args.includes('--resume'),
    batchSize: args.includes('--batch-size')
      ? parseInt(args[args.indexOf('--batch-size') + 1])
      : undefined
  }

  try {
    await seedFlightRoutes(options)
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
