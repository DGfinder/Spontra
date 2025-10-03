#!/usr/bin/env tsx
/**
 * Add Missing Destinations from Amadeus
 *
 * Checks all direct destinations returned by Amadeus and adds any
 * airports/destinations that aren't in our database yet.
 *
 * Usage:
 *   npx tsx src/scripts/add-missing-destinations.ts
 */

import { PrismaClient } from '@prisma/client'
import { getDirectDestinations } from '@/lib/amadeus'
import { readFileSync } from 'fs'
import { join } from 'path'

const db = new PrismaClient()

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

interface AirportData {
  iataCode: string
  name: string
  city: string
  country: string
  latitude: number
  longitude: number
}

/**
 * Load airports.csv data
 */
function loadAirportsCsv(): Map<string, AirportData> {
  const csvPath = join(process.cwd(), 'airports.csv')
  const csvContent = readFileSync(csvPath, 'utf-8')
  const lines = csvContent.split('\n').slice(1) // Skip header

  const airportsMap = new Map<string, AirportData>()

  for (const line of lines) {
    if (!line.trim()) continue

    const parts = line.split(',')
    if (parts.length < 11) continue

    const iataCode = parts[0]?.replace(/"/g, '').trim()
    if (!iataCode || iataCode.length !== 3) continue

    const name = parts[2]?.replace(/"/g, '').trim()
    const latitude = parseFloat(parts[3]?.replace(/"/g, '').trim() || '0')
    const longitude = parseFloat(parts[4]?.replace(/"/g, '').trim() || '0')
    const country = parts[9]?.replace(/"/g, '').trim()
    const city = parts[10]?.replace(/"/g, '').trim()

    if (!city || !country) continue

    airportsMap.set(iataCode, {
      iataCode,
      name,
      city,
      country,
      latitude,
      longitude
    })
  }

  log(`✅ Loaded ${airportsMap.size} airports from CSV`)
  return airportsMap
}

async function main() {
  log('🚀 Starting search for missing destinations...')

  try {
    // Load airports.csv
    const airportsCsvData = loadAirportsCsv()

    // Get all origins from database
    const origins = await db.flightRoute.findMany({
      distinct: ['originAirportCode'],
      select: { originAirportCode: true },
      take: 50 // Sample first 50 to check
    })

    log(`📊 Checking ${origins.length} sample origins for missing destinations...`)

    // Collect all destination codes from Amadeus
    const allDestinationCodes = new Set<string>()
    let processed = 0

    for (const origin of origins) {
      try {
        const destinations = await getDirectDestinations(origin.originAirportCode)
        destinations.forEach(dest => allDestinationCodes.add(dest.iataCode))

        processed++
        if (processed % 10 === 0) {
          log(`   Processed ${processed}/${origins.length} origins`)
        }

        await sleep(500) // Rate limit
      } catch (error) {
        log(`   ⚠️  Error processing ${origin.originAirportCode}: ${error}`)
      }
    }

    log(`✅ Collected ${allDestinationCodes.size} unique destination codes from Amadeus`)

    // Check which destinations are missing from our database
    const existingAirports = await db.airport.findMany({
      select: { iataCode: true }
    })
    const existingCodes = new Set(existingAirports.map(a => a.iataCode))

    const missingCodes = Array.from(allDestinationCodes).filter(
      code => !existingCodes.has(code)
    )

    log(`\n📋 Found ${missingCodes.length} missing destinations:`)
    log(`   Missing codes: ${missingCodes.join(', ')}`)

    if (missingCodes.length === 0) {
      log('\n✅ All destinations from Amadeus are already in the database!')
      return
    }

    // Add missing airports
    log(`\n🔧 Adding missing airports...`)
    let added = 0
    let notFound = 0

    for (const code of missingCodes) {
      const airportData = airportsCsvData.get(code)

      if (!airportData) {
        log(`   ❌ ${code} not found in airports.csv`)
        notFound++
        continue
      }

      // Add airport
      await db.airport.create({
        data: {
          iataCode: airportData.iataCode,
          name: airportData.name,
          city: airportData.city,
          country: airportData.country,
          latitude: airportData.latitude,
          longitude: airportData.longitude,
          isActive: true
        }
      })

      log(`   ✅ Added airport: ${code} - ${airportData.city}, ${airportData.country}`)
      added++
    }

    log(`\n✅ Added ${added} new airports`)
    log(`❌ Not found in CSV: ${notFound}`)

    // Now create destinations and routes for the new airports
    if (added > 0) {
      log(`\n🔧 Creating destinations for new airports...`)

      // Helper to get full country name from code
      function getCountryName(code: string): string {
        // Common country codes - can be expanded
        const countryMap: Record<string, string> = {
          'US': 'United States', 'GB': 'United Kingdom', 'FR': 'France', 'DE': 'Germany',
          'IT': 'Italy', 'ES': 'Spain', 'CA': 'Canada', 'AU': 'Australia', 'JP': 'Japan',
          'CN': 'China', 'KR': 'South Korea', 'IN': 'India', 'BR': 'Brazil', 'MX': 'Mexico',
          'NL': 'Netherlands', 'BE': 'Belgium', 'CH': 'Switzerland', 'AT': 'Austria',
          'SE': 'Sweden', 'NO': 'Norway', 'DK': 'Denmark', 'FI': 'Finland', 'PT': 'Portugal',
          'GR': 'Greece', 'TR': 'Turkey', 'AE': 'United Arab Emirates', 'SA': 'Saudi Arabia',
          'IL': 'Israel', 'EG': 'Egypt', 'ZA': 'South Africa', 'KE': 'Kenya', 'MA': 'Morocco',
          'TH': 'Thailand', 'SG': 'Singapore', 'MY': 'Malaysia', 'ID': 'Indonesia',
          'PH': 'Philippines', 'VN': 'Vietnam', 'NZ': 'New Zealand', 'AR': 'Argentina',
          'CL': 'Chile', 'CO': 'Colombia', 'PE': 'Peru', 'PL': 'Poland', 'CZ': 'Czech Republic',
          'HU': 'Hungary', 'RO': 'Romania', 'HR': 'Croatia', 'RS': 'Serbia', 'BG': 'Bulgaria',
          'IE': 'Ireland', 'IS': 'Iceland', 'RU': 'Russia', 'UA': 'Ukraine', 'BY': 'Belarus'
        }
        return countryMap[code] || code // Fallback to code if not found
      }

      for (const code of missingCodes) {
        const airportData = airportsCsvData.get(code)
        if (!airportData) continue

        // Check/create country
        let country = await db.country.findUnique({
          where: { code: airportData.country }
        })

        if (!country) {
          const countryName = getCountryName(airportData.country)
          country = await db.country.create({
            data: {
              code: airportData.country,
              name: countryName
            }
          })
          log(`   ✅ Created country: ${countryName} (${airportData.country})`)
        }

        // Create destination
        const countryName = getCountryName(airportData.country)
        const destination = await db.destination.create({
          data: {
            airportCode: code,
            cityName: airportData.city,
            countryName: countryName,
            description: `Explore ${airportData.city}, ${countryName}`
          }
        })

        log(`   ✅ Created destination: ${airportData.city}, ${countryName} (${code})`)
      }

      log(`\n🎉 All missing destinations added!`)
      log(`📊 Next steps:`)
      log(`   1. Re-run verify-all-batches.ts to create routes to new destinations`)
      log(`   2. Consider running auto-generate-routes.ts to add estimated routes`)
    }

  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

main()
