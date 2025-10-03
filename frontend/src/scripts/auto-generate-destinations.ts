#!/usr/bin/env tsx
/**
 * Auto-Generate Destinations from All Airports
 *
 * Creates destination records for all unique cities represented by the 467 airports.
 * Links destinations to countries and creates airport mappings.
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

interface AirportData {
  iataCode: string
  name: string
  city: string
  country: string
  latitude: number | null
  longitude: number | null
}

interface CityGroup {
  city: string
  country: string
  airports: AirportData[]
}

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`)
}

async function main() {
  log('🚀 Starting auto-destination generation from airports...')

  try {
    // Step 1: Get all airports with coordinates
    log('📊 Fetching all airports from database...')
    const airports = await db.airport.findMany({
      where: {
        isActive: true
      },
      select: {
        iataCode: true,
        name: true,
        city: true,
        country: true,
        latitude: true,
        longitude: true
      },
      orderBy: [
        { country: 'asc' },
        { city: 'asc' }
      ]
    })

    log(`✅ Found ${airports.length} airports`)

    // Step 2: Group airports by city + country
    log('🗂️  Grouping airports by city...')
    const cityMap = new Map<string, CityGroup>()

    for (const airport of airports) {
      const key = `${airport.city}|${airport.country}`

      if (!cityMap.has(key)) {
        cityMap.set(key, {
          city: airport.city,
          country: airport.country,
          airports: []
        })
      }

      cityMap.get(key)!.airports.push(airport as AirportData)
    }

    log(`✅ Found ${cityMap.size} unique cities`)

    // Step 3: Get or create countries
    log('🌍 Ensuring all countries exist...')
    const countryMap = new Map<string, string>() // country name -> country ID

    for (const cityGroup of cityMap.values()) {
      if (!countryMap.has(cityGroup.country)) {
        // Try to find existing country
        let country = await db.country.findFirst({
          where: { name: cityGroup.country }
        })

        // Create if doesn't exist
        if (!country) {
          // Generate ISO code (first 2 letters uppercase)
          const code = cityGroup.country
            .replace(/[^a-zA-Z]/g, '')
            .substring(0, 2)
            .toUpperCase() || 'XX'

          country = await db.country.create({
            data: {
              name: cityGroup.country,
              code: code
            }
          })
          log(`   ✅ Created country: ${cityGroup.country} (${code})`)
        }

        countryMap.set(cityGroup.country, country.id)
      }
    }

    log(`✅ ${countryMap.size} countries ready`)

    // Step 4: Create destinations for each city
    log('🏙️  Creating destinations...')
    let created = 0
    let updated = 0
    let skipped = 0

    for (const cityGroup of cityMap.values()) {
      const countryId = countryMap.get(cityGroup.country)!

      // Check if destination already exists
      let destination = await db.destination.findFirst({
        where: {
          cityName: cityGroup.city,
          countryId: countryId
        }
      })

      if (!destination) {
        // Create new destination
        // Find primary airport (first one, or one with most connections)
        const primaryAirport = cityGroup.airports[0]

        destination = await db.destination.create({
          data: {
            cityName: cityGroup.city,
            countryId: countryId,
            description: `${cityGroup.city}, ${cityGroup.country}`,
            popularityScore: 50 // Default score
          }
        })

        created++

        if (created % 50 === 0) {
          log(`   📍 Created ${created} destinations...`)
        }
      } else {
        // Update existing destination to link to country
        if (!destination.countryId) {
          await db.destination.update({
            where: { id: destination.id },
            data: { countryId: countryId }
          })
          updated++
        } else {
          skipped++
        }
      }

      // Step 5: Create DestinationAirport mappings
      for (let i = 0; i < cityGroup.airports.length; i++) {
        const airport = cityGroup.airports[i]
        const isPrimary = i === 0 // First airport is primary

        // Check if mapping exists
        const existingMapping = await db.destinationAirport.findUnique({
          where: {
            destinationId_airportCode: {
              destinationId: destination.id,
              airportCode: airport.iataCode
            }
          }
        })

        if (!existingMapping) {
          await db.destinationAirport.create({
            data: {
              destinationId: destination.id,
              airportCode: airport.iataCode,
              isPrimary: isPrimary
            }
          })
        }
      }
    }

    log(`\n✅ Destination creation complete!`)
    log(`   ✅ Created: ${created} new destinations`)
    log(`   🔄 Updated: ${updated} existing destinations`)
    log(`   ⏭️  Skipped: ${skipped} already complete`)

    // Step 6: Verify results
    log('\n📊 Final Statistics:')

    const totalDestinations = await db.destination.count()
    const destinationsWithCountry = await db.destination.count({
      where: { countryId: { not: null } }
    })
    const totalCountries = await db.country.count()
    const totalMappings = await db.destinationAirport.count()

    log(`   🏙️  Total destinations: ${totalDestinations}`)
    log(`   🗺️  Destinations with country: ${destinationsWithCountry}`)
    log(`   🌍 Total countries: ${totalCountries}`)
    log(`   ✈️  Airport mappings: ${totalMappings}`)

    // Show sample multi-airport cities
    log('\n🏙️  Multi-airport cities:')
    const multiAirportCities = await db.destination.findMany({
      where: {
        airports: {
          some: {}
        }
      },
      include: {
        airports: {
          include: {
            airport: {
              select: {
                iataCode: true,
                name: true
              }
            }
          }
        },
        country: true
      },
      orderBy: {
        airports: {
          _count: 'desc'
        }
      },
      take: 10
    })

    for (const city of multiAirportCities) {
      if (city.airports.length > 1) {
        const airportCodes = city.airports.map(a =>
          a.airport.iataCode + (a.isPrimary ? '★' : '')
        ).join(', ')
        log(`   ${city.cityName}, ${city.country?.name}: ${airportCodes}`)
      }
    }

    log('\n🎉 Success! All cities from airports are now in /admin/destinations')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

main()
