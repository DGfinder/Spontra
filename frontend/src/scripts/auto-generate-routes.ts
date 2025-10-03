#!/usr/bin/env tsx
/**
 * Auto-Generate Flight Routes Between Airports
 *
 * Generates flight routes with estimated durations based on great circle distance.
 * Uses Haversine formula to calculate distance, then estimates flight time.
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

interface Airport {
  iataCode: string
  name: string
  city: string
  country: string
  latitude: number
  longitude: number
}

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`)
}

/**
 * Calculate great circle distance between two points using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return distance
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Estimate flight duration based on distance
 * Uses average commercial aircraft cruising speed of ~800 km/h
 * Adds taxi/takeoff/landing time based on distance
 */
function estimateFlightDuration(distanceKm: number): number {
  // Average cruising speed: 800 km/h
  const cruisingSpeed = 800

  // Base flight time
  let flightTimeHours = distanceKm / cruisingSpeed

  // Add taxi, takeoff, landing, and approach time
  // Short flights (<500km): +45 min
  // Medium flights (500-2000km): +60 min
  // Long flights (2000-5000km): +75 min
  // Ultra long flights (>5000km): +90 min
  let groundTimeHours = 0.75 // 45 minutes default

  if (distanceKm >= 500 && distanceKm < 2000) {
    groundTimeHours = 1.0 // 60 minutes
  } else if (distanceKm >= 2000 && distanceKm < 5000) {
    groundTimeHours = 1.25 // 75 minutes
  } else if (distanceKm >= 5000) {
    groundTimeHours = 1.5 // 90 minutes
  }

  const totalTimeHours = flightTimeHours + groundTimeHours
  const totalTimeMinutes = Math.round(totalTimeHours * 60)

  return totalTimeMinutes
}

async function main() {
  log('🚀 Starting auto-route generation...')

  try {
    // Step 1: Get all airports with coordinates
    log('📊 Fetching airports with coordinates...')
    const airports = await db.airport.findMany({
      where: {
        isActive: true,
        latitude: { not: null },
        longitude: { not: null }
      },
      select: {
        iataCode: true,
        name: true,
        city: true,
        country: true,
        latitude: true,
        longitude: true
      },
      orderBy: {
        iataCode: 'asc'
      }
    })

    log(`✅ Found ${airports.length} airports with coordinates`)

    // Filter out airports without valid coordinates
    const validAirports: Airport[] = airports.filter(
      a => a.latitude !== null && a.longitude !== null
    ) as Airport[]

    if (validAirports.length === 0) {
      log('❌ No airports with valid coordinates found')
      return
    }

    log(`✅ ${validAirports.length} airports ready for route generation`)

    // Step 2: Get existing routes to avoid duplicates
    log('📋 Checking existing routes...')
    const existingRoutes = await db.flightRoute.findMany({
      select: {
        originAirportCode: true,
        destinationAirportCode: true
      }
    })

    const routeSet = new Set<string>()
    for (const route of existingRoutes) {
      routeSet.add(`${route.originAirportCode}-${route.destinationAirportCode}`)
    }

    log(`✅ Found ${existingRoutes.length} existing routes`)

    // Step 3: Generate routes
    log('✈️  Generating routes...')
    log(`   Total possible combinations: ${validAirports.length * (validAirports.length - 1)}`)

    const MIN_DISTANCE_KM = 100 // Minimum 100km (filter out same-city duplicates)
    const MAX_DISTANCE_KM = 20000 // Maximum 20,000km (around the world)

    let created = 0
    let skipped = 0
    let tooClose = 0
    let tooFar = 0

    const BATCH_SIZE = 100
    let batch: any[] = []

    for (let i = 0; i < validAirports.length; i++) {
      const origin = validAirports[i]

      for (let j = 0; j < validAirports.length; j++) {
        if (i === j) continue // Skip same airport

        const destination = validAirports[j]

        // Check if route already exists
        const routeKey = `${origin.iataCode}-${destination.iataCode}`
        if (routeSet.has(routeKey)) {
          skipped++
          continue
        }

        // Calculate distance
        const distance = calculateDistance(
          origin.latitude,
          origin.longitude,
          destination.latitude,
          destination.longitude
        )

        // Filter by distance
        if (distance < MIN_DISTANCE_KM) {
          tooClose++
          continue
        }

        if (distance > MAX_DISTANCE_KM) {
          tooFar++
          continue
        }

        // Estimate flight duration
        const durationMinutes = estimateFlightDuration(distance)

        // Add to batch
        batch.push({
          originAirportCode: origin.iataCode,
          destinationAirportCode: destination.iataCode,
          totalDurationMinutes: durationMinutes
        })

        created++

        // Insert batch when full
        if (batch.length >= BATCH_SIZE) {
          await db.flightRoute.createMany({
            data: batch,
            skipDuplicates: true
          })
          batch = []

          if (created % 1000 === 0) {
            log(`   ✈️  Created ${created.toLocaleString()} routes...`)
          }
        }
      }
    }

    // Insert remaining batch
    if (batch.length > 0) {
      await db.flightRoute.createMany({
        data: batch,
        skipDuplicates: true
      })
    }

    log(`\n✅ Route generation complete!`)
    log(`   ✅ Created: ${created.toLocaleString()} new routes`)
    log(`   ⏭️  Skipped (already exist): ${skipped.toLocaleString()}`)
    log(`   🚫 Skipped (too close < 100km): ${tooClose.toLocaleString()}`)
    log(`   🚫 Skipped (too far > 20,000km): ${tooFar.toLocaleString()}`)

    // Step 4: Final statistics
    log('\n📊 Final Statistics:')

    const totalRoutes = await db.flightRoute.count()
    const uniqueOrigins = await db.flightRoute.findMany({
      distinct: ['originAirportCode'],
      select: { originAirportCode: true }
    })

    log(`   ✈️  Total routes: ${totalRoutes.toLocaleString()}`)
    log(`   🛫 Unique origin airports: ${uniqueOrigins.length}`)
    log(`   🛬 Average routes per origin: ${Math.round(totalRoutes / uniqueOrigins.length)}`)

    // Show sample long and short routes
    log('\n🌍 Sample Routes:')

    const shortestRoute = await db.flightRoute.findFirst({
      orderBy: { totalDurationMinutes: 'asc' },
      include: {
        originAirport: { select: { city: true, country: true } },
        destinationAirport: { select: { city: true, country: true } }
      }
    })

    const longestRoute = await db.flightRoute.findFirst({
      orderBy: { totalDurationMinutes: 'desc' },
      include: {
        originAirport: { select: { city: true, country: true } },
        destinationAirport: { select: { city: true, country: true } }
      }
    })

    if (shortestRoute) {
      const hours = Math.floor(shortestRoute.totalDurationMinutes / 60)
      const mins = shortestRoute.totalDurationMinutes % 60
      log(`   🏃 Shortest: ${shortestRoute.originAirportCode} → ${shortestRoute.destinationAirportCode} (${hours}h ${mins}m)`)
      log(`      ${shortestRoute.originAirport.city} → ${shortestRoute.destinationAirport.city}`)
    }

    if (longestRoute) {
      const hours = Math.floor(longestRoute.totalDurationMinutes / 60)
      const mins = longestRoute.totalDurationMinutes % 60
      log(`   🌏 Longest: ${longestRoute.originAirportCode} → ${longestRoute.destinationAirportCode} (${hours}h ${mins}m)`)
      log(`      ${longestRoute.originAirport.city} → ${longestRoute.destinationAirport.city}`)
    }

    log('\n🎉 Success! All routes are now available in /admin/routes')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

main()
