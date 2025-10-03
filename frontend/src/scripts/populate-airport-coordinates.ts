#!/usr/bin/env tsx
/**
 * Populate airport coordinates from airports.csv
 *
 * This script reads airport coordinates from the airports.csv file
 * and updates the database with latitude/longitude for all airports.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

interface CSVAirport {
  code: string
  icao?: string
  name: string
  latitude: string
  longitude: string
  elevation?: string
  country: string
  city: string
  state?: string
}

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`)
}

function parseCSV(filePath: string): Map<string, CSVAirport> {
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const headers = lines[0].split(',')

  const airportMap = new Map<string, CSVAirport>()

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Parse CSV line
    const values = line.split(',')
    if (values.length < headers.length) continue

    const airport: any = {}
    headers.forEach((header, index) => {
      const value = values[index]?.trim()
      airport[header.trim()] = value || null
    })

    // Only store if IATA code exists and is valid (3 letters)
    if (airport.code && airport.code.length === 3) {
      airportMap.set(airport.code.toUpperCase(), airport as CSVAirport)
    }
  }

  return airportMap
}

async function main() {
  log('🚀 Starting airport coordinate population...')

  try {
    // Parse CSV file
    const csvPath = resolve(process.cwd(), '..', 'airports.csv')
    log(`📁 Reading airport data from ${csvPath}`)

    const airportData = parseCSV(csvPath)
    log(`✅ Loaded ${airportData.size} airports from CSV`)

    // Get all airports from database
    const dbAirports = await db.airport.findMany({
      select: { iataCode: true, id: true }
    })
    log(`📊 Found ${dbAirports.length} airports in database`)

    // Update airports with coordinates
    let updated = 0
    let skipped = 0
    let notFound = 0

    for (const dbAirport of dbAirports) {
      const csvAirport = airportData.get(dbAirport.iataCode)

      if (!csvAirport) {
        notFound++
        log(`⚠️  No CSV data for ${dbAirport.iataCode}`)
        continue
      }

      const latitude = parseFloat(csvAirport.latitude)
      const longitude = parseFloat(csvAirport.longitude)

      if (isNaN(latitude) || isNaN(longitude)) {
        skipped++
        log(`⚠️  Invalid coordinates for ${dbAirport.iataCode}`)
        continue
      }

      // Update airport with coordinates
      await db.airport.update({
        where: { id: dbAirport.id },
        data: {
          latitude,
          longitude
        }
      })

      updated++

      if (updated % 50 === 0) {
        log(`📍 Updated ${updated} airports...`)
      }
    }

    log(`\n✅ Airport coordinate population complete!`)
    log(`   ✅ Updated: ${updated} airports`)
    log(`   ⏭️  Skipped (invalid coords): ${skipped}`)
    log(`   ❌ Not found in CSV: ${notFound}`)

    // Verify results
    const withCoords = await db.airport.count({
      where: {
        latitude: { not: null },
        longitude: { not: null }
      }
    })

    const total = await db.airport.count()
    const percentage = Math.round((withCoords / total) * 100)

    log(`\n📊 Final Statistics:`)
    log(`   🌍 Total airports: ${total}`)
    log(`   📍 With coordinates: ${withCoords} (${percentage}%)`)

    if (percentage < 90) {
      log(`\n⚠️  Warning: Only ${percentage}% of airports have coordinates`)
    } else {
      log(`\n🎉 Success! Map view is now ready to use!`)
    }

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

main()
