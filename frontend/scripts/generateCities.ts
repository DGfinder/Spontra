/**
 * Generate cities.json from destinations table for CityAutocomplete
 *
 * Run: npx tsx scripts/generateCities.ts
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const db = new PrismaClient()

async function main() {
  console.log('[Generate Cities] Starting...')

  // Fetch all destinations with country info
  const destinations = await db.destination.findMany({
    select: {
      id: true,
      cityName: true,
      airportCode: true,
      country: {
        select: {
          name: true,
          code: true
        }
      }
    },
    where: {
      country: {
        isNot: null
      }
    },
    orderBy: {
      cityName: 'asc'
    }
  })

  console.log(`[Generate Cities] Found ${destinations.length} destinations`)

  // Transform to city autocomplete format
  const cities = destinations.map(dest => ({
    id: dest.id,
    cityName: dest.cityName,
    countryName: dest.country?.name || 'Unknown',
    countryCode: dest.country?.code || '',
    airportCode: dest.airportCode || ''
  }))

  // Remove duplicates by city + country combination
  const uniqueCities = Array.from(
    new Map(
      cities.map(city => [`${city.cityName}-${city.countryName}`, city])
    ).values()
  )

  console.log(`[Generate Cities] Unique cities: ${uniqueCities.length}`)

  // Write to public/data/cities.json
  const outputPath = path.join(process.cwd(), 'public', 'data', 'cities.json')
  const outputDir = path.dirname(outputPath)

  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  fs.writeFileSync(outputPath, JSON.stringify(uniqueCities, null, 2))

  const fileSizeKB = (fs.statSync(outputPath).size / 1024).toFixed(2)
  console.log(`[Generate Cities] ✓ Written to ${outputPath} (${fileSizeKB} KB)`)
  console.log(`[Generate Cities] ✓ Total cities: ${uniqueCities.length}`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
