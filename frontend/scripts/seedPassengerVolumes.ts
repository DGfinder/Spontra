/**
 * Seed airport passenger volumes from CSV data
 * Run with: npx tsx scripts/seedPassengerVolumes.ts
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: join(process.cwd(), '.env.local') })

const db = new PrismaClient()

// Airport split ratios for multi-airport cities (based on typical distribution)
const AIRPORT_SPLIT_RATIOS: Record<string, Record<string, number>> = {
  // London airports
  'LHR': 0.50,  // Heathrow: ~50%
  'LGW': 0.25,  // Gatwick: ~25%
  'STN': 0.15,  // Stansted: ~15%
  'LTN': 0.08,  // Luton: ~8%
  'LCY': 0.02,  // City: ~2%

  // Paris airports
  'CDG': 0.70,  // Charles de Gaulle: ~70%
  'ORY': 0.25,  // Orly: ~25%
  'BVA': 0.05,  // Beauvais: ~5%

  // NYC airports
  'JFK': 0.50,  // JFK: ~50%
  'EWR': 0.35,  // Newark: ~35%
  'LGA': 0.15,  // LaGuardia: ~15%

  // Tokyo airports
  'NRT': 0.48,  // Narita: ~48%
  'HND': 0.52,  // Haneda: ~52%

  // Milan airports
  'MXP': 0.60,  // Malpensa: ~60%
  'LIN': 0.30,  // Linate: ~30%
  'BGY': 0.10,  // Bergamo: ~10%

  // Chicago airports
  'ORD': 0.70,  // O'Hare: ~70%
  'MDW': 0.30,  // Midway: ~30%

  // Moscow airports
  'SVO': 0.50,  // Sheremetyevo: ~50%
  'DME': 0.40,  // Domodedovo: ~40%
  'VKO': 0.10,  // Vnukovo: ~10%

  // Bangkok airports
  'BKK': 0.85,  // Suvarnabhumi: ~85%
  'DMK': 0.15,  // Don Mueang: ~15%

  // Rome airports
  'FCO': 0.90,  // Fiumicino: ~90%
  'CIA': 0.10,  // Ciampino: ~10%

  // Istanbul airports
  'IST': 0.75,  // New Istanbul: ~75%
  'SAW': 0.25,  // Sabiha Gökçen: ~25%
}

function parsePassengerNumber(paxStr: string): number {
  if (!paxStr) return 0

  // Remove commas, "Pax" text, and whitespace
  const cleaned = paxStr
    .replace(/,/g, '')
    .replace(/Pax/gi, '')
    .replace(/\s/g, '')

  const num = parseInt(cleaned, 10)
  return isNaN(num) ? 0 : Math.round(num / 1000000) // Convert to millions
}

function splitAirportCodes(iataStr: string): string[] {
  if (!iataStr) return []

  // Split by comma, space, or combination
  return iataStr
    .split(/[,\s]+/)
    .map(code => code.trim().toUpperCase())
    .filter(code => code.length === 3)
}

// Simple CSV parser that handles quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

async function seedPassengerVolumes() {
  try {
    const csvPath = join(process.cwd(), '..', 'Spontra - Sheet1.csv')
    console.log(`📊 Reading CSV from: ${csvPath}`)

    const csvContent = readFileSync(csvPath, 'utf-8')
    const lines = csvContent.split('\n')

    console.log(`📄 Found ${lines.length} lines in CSV`)

    let updated = 0
    let skipped = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // Skip empty lines
      if (!line) {
        continue
      }

      const parts = parseCSVLine(line)

      // Skip header (line 1) and lines without data
      if (i === 0 || parts.length < 4) {
        continue
      }

      const iataCodeStr = parts[2] ? parts[2].trim() : ''
      const paxNumberStr = parts[3] ? parts[3].trim() : ''

      if (!iataCodeStr || !paxNumberStr) {
        continue
      }

      const totalPassengers = parsePassengerNumber(paxNumberStr)
      if (totalPassengers === 0) {
        continue
      }

      const airportCodes = splitAirportCodes(iataCodeStr)

      if (airportCodes.length === 0) {
        skipped++
        continue
      }

      // Handle single airport or multi-airport cities
      if (airportCodes.length === 1) {
        const code = airportCodes[0]

        try {
          await db.airport.updateMany({
            where: { iataCode: code },
            data: { passengerVolume: totalPassengers }
          })
          console.log(`✅ ${code}: ${totalPassengers}M passengers`)
          updated++
        } catch (err) {
          // Airport might not exist in DB
          skipped++
        }
      } else {
        // Multi-airport city: split passengers based on typical ratios
        console.log(`🔀 Multi-airport city: ${airportCodes.join(', ')} (${totalPassengers}M total)`)

        for (const code of airportCodes) {
          const ratio = AIRPORT_SPLIT_RATIOS[code] || (1 / airportCodes.length)
          const airportPassengers = Math.round(totalPassengers * ratio)

          try {
            await db.airport.updateMany({
              where: { iataCode: code },
              data: { passengerVolume: airportPassengers }
            })
            console.log(`   ${code}: ${airportPassengers}M (${Math.round(ratio * 100)}%)`)
            updated++
          } catch (err) {
            skipped++
          }
        }
      }
    }

    console.log(`\n✅ Updated ${updated} airports`)
    console.log(`⏭️  Skipped ${skipped} entries`)

    // Show top 10 busiest airports
    const topAirports = await db.airport.findMany({
      where: { passengerVolume: { gt: 0 } },
      orderBy: { passengerVolume: 'desc' },
      take: 10,
      select: {
        iataCode: true,
        name: true,
        city: true,
        passengerVolume: true
      }
    })

    console.log(`\n🏆 Top 10 Busiest Airports:`)
    topAirports.forEach((airport, i) => {
      console.log(`${i + 1}. ${airport.iataCode} - ${airport.name} (${airport.city}): ${airport.passengerVolume}M`)
    })

    await db.$disconnect()
  } catch (error) {
    console.error('❌ Error seeding passenger volumes:', error)
    await db.$disconnect()
    process.exit(1)
  }
}

seedPassengerVolumes()
