/**
 * Generate static airports JSON file for client-side autocomplete
 * Run with: tsx scripts/generateAirports.ts
 *
 * Requires DATABASE_URL environment variable
 */

import { PrismaClient } from '@prisma/client'
import { writeFileSync, mkdirSync, statSync } from 'fs'
import { join } from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') })

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables')
  console.error('💡 Make sure .env.local exists with DATABASE_URL')
  process.exit(1)
}

const db = new PrismaClient()

async function generateAirportsJson() {
  try {
    console.log('📍 Fetching searchable airports from database...')

    const airports = await db.airport.findMany({
      where: {
        isSearchable: true
      },
      select: {
        id: true,
        iataCode: true,
        name: true,
        city: true,
        country: true
      },
      orderBy: {
        iataCode: 'asc'
      }
    })

    console.log(`✅ Found ${airports.length} searchable airports`)

    // Ensure public/data directory exists
    const publicDataDir = join(process.cwd(), 'public', 'data')
    mkdirSync(publicDataDir, { recursive: true })

    // Write JSON file
    const outputPath = join(publicDataDir, 'airports.json')
    writeFileSync(
      outputPath,
      JSON.stringify(airports, null, 2),
      'utf-8'
    )

    console.log(`💾 Saved to: ${outputPath}`)

    // Calculate file size
    const stats = statSync(outputPath)
    const fileSizeKB = (stats.size / 1024).toFixed(2)
    console.log(`📦 File size: ${fileSizeKB} KB`)

    await db.$disconnect()
  } catch (error) {
    console.error('❌ Error generating airports JSON:', error)
    await db.$disconnect()
    process.exit(1)
  }
}

generateAirportsJson()
