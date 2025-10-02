import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function linkDestinationsToCountries() {
  console.log('🔗 Linking destinations to countries...\n')

  try {
    // Get all destinations
    const destinations = await prisma.destination.findMany({
      select: {
        id: true,
        cityName: true,
        airportCode: true,
        countryName: true,
        countryId: true
      }
    })

    console.log(`Found ${destinations.length} destinations\n`)

    let linked = 0
    let skipped = 0
    let created = 0

    for (const dest of destinations) {
      // Skip if already linked
      if (dest.countryId) {
        skipped++
        continue
      }

      let countryName = dest.countryName

      // If no countryName, try to get from airport
      if (!countryName) {
        const airport = await prisma.airport.findUnique({
          where: { iataCode: dest.airportCode },
          select: { country: true }
        })

        if (airport?.country) {
          countryName = airport.country
        }
      }

      if (!countryName) {
        console.log(`⚠️  Skipping ${dest.cityName} (${dest.airportCode}) - no country data`)
        skipped++
        continue
      }

      // Find or create country
      let country = await prisma.country.findFirst({
        where: { name: countryName }
      })

      if (!country) {
        // Try to determine country code from airport
        const airport = await prisma.airport.findUnique({
          where: { iataCode: dest.airportCode },
          select: { country: true }
        })

        // Generate a basic country code (first 2 letters uppercase)
        const code = countryName.substring(0, 2).toUpperCase()

        try {
          country = await prisma.country.create({
            data: {
              name: countryName,
              code: code
            }
          })
          console.log(`✨ Created country: ${countryName} (${code})`)
          created++
        } catch (error) {
          console.log(`❌ Failed to create country ${countryName}:`, error)
          skipped++
          continue
        }
      }

      // Link destination to country
      await prisma.destination.update({
        where: { id: dest.id },
        data: { countryId: country.id }
      })

      console.log(`✅ Linked ${dest.cityName} → ${country.name}`)
      linked++
    }

    console.log('\n📊 Summary:')
    console.log(`   Linked: ${linked}`)
    console.log(`   Created new countries: ${created}`)
    console.log(`   Skipped: ${skipped}`)
    console.log('\n✅ Done!')

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

linkDestinationsToCountries()
