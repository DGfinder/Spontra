import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateAirportsToJoinTable() {
  console.log('✈️  Migrating airports to many-to-many relationship...\n')

  try {
    // Step 1: Migrate existing airportCode from destinations
    const destinations = await prisma.destination.findMany({
      where: {
        airportCode: { not: null }
      },
      select: {
        id: true,
        cityName: true,
        airportCode: true
      }
    })

    console.log(`Found ${destinations.length} destinations with airport codes\n`)

    let primaryLinked = 0
    let additionalLinked = 0

    for (const dest of destinations) {
      if (!dest.airportCode) continue

      // Create primary airport link
      await prisma.destinationAirport.upsert({
        where: {
          destinationId_airportCode: {
            destinationId: dest.id,
            airportCode: dest.airportCode
          }
        },
        create: {
          destinationId: dest.id,
          airportCode: dest.airportCode,
          isPrimary: true
        },
        update: {
          isPrimary: true
        }
      })

      console.log(`✅ Set ${dest.airportCode} as primary airport for ${dest.cityName}`)
      primaryLinked++

      // Step 2: Find additional airports in the same city
      const cityAirport = await prisma.airport.findUnique({
        where: { iataCode: dest.airportCode },
        select: { city: true, country: true }
      })

      if (cityAirport) {
        const additionalAirports = await prisma.airport.findMany({
          where: {
            city: cityAirport.city,
            country: cityAirport.country,
            iataCode: { not: dest.airportCode },
            isActive: true
          },
          select: { iataCode: true, name: true }
        })

        for (const airport of additionalAirports) {
          await prisma.destinationAirport.upsert({
            where: {
              destinationId_airportCode: {
                destinationId: dest.id,
                airportCode: airport.iataCode
              }
            },
            create: {
              destinationId: dest.id,
              airportCode: airport.iataCode,
              isPrimary: false
            },
            update: {}
          })

          console.log(`   ➕ Added ${airport.iataCode} (${airport.name}) to ${dest.cityName}`)
          additionalLinked++
        }
      }
    }

    console.log('\n📊 Summary:')
    console.log(`   Primary airports linked: ${primaryLinked}`)
    console.log(`   Additional airports linked: ${additionalLinked}`)
    console.log(`   Total airports: ${primaryLinked + additionalLinked}`)
    console.log('\n✅ Migration complete!')

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrateAirportsToJoinTable()
