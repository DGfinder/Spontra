import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

interface AirportData {
  iataCode: string
  latitude: number | null
  longitude: number | null
}

// Parse OpenFlights airports.dat file
function parseAirportsData(filePath: string): Map<string, AirportData> {
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const airportMap = new Map<string, AirportData>()

  for (const line of lines) {
    if (!line.trim()) continue

    // Remove quotes and split by comma
    const parts = line.split(',').map((part) => part.replace(/^"|"$/g, '').trim())

    // Column indices based on OpenFlights format:
    // 0: ID, 1: Name, 2: City, 3: Country, 4: IATA, 5: ICAO, 6: Lat, 7: Lon
    const iataCode = parts[4]
    const latitude = parts[6] ? parseFloat(parts[6]) : null
    const longitude = parts[7] ? parseFloat(parts[7]) : null

    // Only store if IATA code exists and is valid (3 letters)
    if (iataCode && iataCode.length === 3 && latitude !== null && longitude !== null) {
      airportMap.set(iataCode, { iataCode, latitude, longitude })
    }
  }

  return airportMap
}

// Read seed.ts and update airport entries
function updateSeedFile() {
  const airportsDataPath = resolve(process.cwd(), 'airports.dat')
  const seedFilePath = resolve(process.cwd(), 'prisma', 'seed.ts')

  console.log('📍 Parsing OpenFlights airport data...')
  const airportCoordinates = parseAirportsData(airportsDataPath)
  console.log(`✅ Loaded coordinates for ${airportCoordinates.size} airports`)

  console.log('📝 Reading seed.ts file...')
  let seedContent = readFileSync(seedFilePath, 'utf-8')

  // Find all airport entries and update them
  let updatedCount = 0
  let notFoundCount = 0
  const notFoundAirports: string[] = []

  // Regex to match airport objects: { iataCode: 'XXX', name: '...', city: '...', country: '...', isSearchable: true/false }
  const airportRegex = /{\s*iataCode:\s*'([A-Z]{3})',\s*name:\s*'([^']+)',\s*city:\s*'([^']+)',\s*country:\s*'([^']+)',\s*isSearchable:\s*(true|false)\s*}/g

  seedContent = seedContent.replace(airportRegex, (match, iataCode, name, city, country, isSearchable) => {
    const coords = airportCoordinates.get(iataCode)

    if (coords && coords.latitude !== null && coords.longitude !== null) {
      updatedCount++
      // Return updated airport object with coordinates
      return `{ iataCode: '${iataCode}', name: '${name}', city: '${city}', country: '${country}', latitude: ${coords.latitude}, longitude: ${coords.longitude}, isSearchable: ${isSearchable} }`
    } else {
      notFoundCount++
      notFoundAirports.push(iataCode)
      // Return original without coordinates (will be null in DB)
      return match
    }
  })

  console.log('💾 Writing updated seed.ts...')
  writeFileSync(seedFilePath, seedContent, 'utf-8')

  console.log('\n✅ Seed file updated!')
  console.log(`   Updated: ${updatedCount} airports`)
  console.log(`   Not found: ${notFoundCount} airports`)

  if (notFoundAirports.length > 0 && notFoundAirports.length < 20) {
    console.log('\n⚠️  Airports without coordinates:')
    notFoundAirports.forEach((code) => console.log(`   - ${code}`))
  }
}

// Run the script
try {
  updateSeedFile()
} catch (error) {
  console.error('❌ Error updating seed file:', error)
  process.exit(1)
}
