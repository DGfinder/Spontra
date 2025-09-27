#!/usr/bin/env node

/**
 * Node.js Flight Routes Population Script
 * Uses the same database connection approach as admin API routes
 */

// Dynamic import for pg to handle build-time issues (same as admin routes)
const PgClient = (() => {
  try {
    return require('pg').Client
  } catch {
    return class MockClient {
      constructor() {}
      async connect() {}
      async query() { return { rows: [] } }
      async end() {}
    }
  }
})()

// European airports that match the seeded airports in Go service
const MAJOR_AIRPORTS = {
  'LHR': { city: 'London', lat: 51.4775, lon: -0.4614 },
  'LGW': { city: 'London', lat: 51.1481, lon: -0.1903 },
  'CDG': { city: 'Paris', lat: 49.0097, lon: 2.5479 },
  'ORY': { city: 'Paris', lat: 48.7233, lon: 2.3794 },
  'NCE': { city: 'Nice', lat: 43.6584, lon: 7.2159 },
  'AMS': { city: 'Amsterdam', lat: 52.3105, lon: 4.7683 },
  'FRA': { city: 'Frankfurt', lat: 50.0264, lon: 8.5431 },
  'MUC': { city: 'Munich', lat: 48.3537, lon: 11.7862 },
  'BER': { city: 'Berlin', lat: 52.3667, lon: 13.5033 },
  'MAD': { city: 'Madrid', lat: 40.4719, lon: -3.5626 },
  'BCN': { city: 'Barcelona', lat: 41.2971, lon: 2.0833 },
  'VIE': { city: 'Vienna', lat: 48.1103, lon: 16.5697 },
  'ZUR': { city: 'Zurich', lat: 47.4647, lon: 8.5492 },
  'GVA': { city: 'Geneva', lat: 46.2381, lon: 6.1089 },
  'FCO': { city: 'Rome', lat: 41.7999, lon: 12.2462 },
  'MXP': { city: 'Milan', lat: 45.6306, lon: 8.7281 },
  'ATH': { city: 'Athens', lat: 37.9364, lon: 23.9445 },
  'LIS': { city: 'Lisbon', lat: 38.7813, lon: -9.1357 },
  'OPO': { city: 'Porto', lat: 41.2481, lon: -8.6814 },
  'DUB': { city: 'Dublin', lat: 53.4213, lon: -6.2700 }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth's radius in km
  
  const toRad = (deg) => deg * (Math.PI / 180)
  
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  
  return R * c
}

function estimateFlightDuration(distanceKm) {
  let flightTime, groundTime
  
  if (distanceKm < 500) {
    // Short haul: more ground time relative to flight time
    flightTime = (distanceKm / 700) * 60 // Slower average for short flights
    groundTime = 45 // 45 minutes ground time
  } else if (distanceKm < 1500) {
    // Medium haul
    flightTime = (distanceKm / 800) * 60
    groundTime = 40
  } else {
    // Long haul
    flightTime = (distanceKm / 850) * 60
    groundTime = 35
  }
  
  const totalMinutes = Math.round(flightTime + groundTime)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  
  return { hours, minutes, totalMinutes }
}

function generateUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

async function populateFlightRoutes() {
  // Use same connection approach as admin API routes
  const pgUrl = process.env.SEARCH_DATABASE_URL || process.env.DATABASE_URL
  if (!pgUrl) {
    console.error('❌ Database URL not configured (need SEARCH_DATABASE_URL or DATABASE_URL)')
    return false
  }

  const pg = new PgClient({ connectionString: pgUrl })
  
  try {
    console.log('🚀 Starting flight routes population...')
    await pg.connect()
    
    // Start transaction
    await pg.query('BEGIN')
    
    // First, check which airports actually exist in the database
    const airportCodes = Object.keys(MAJOR_AIRPORTS)
    const placeholders = airportCodes.map((_, i) => `$${i + 1}`).join(',')
    
    const { rows: existingAirports } = await pg.query(
      `SELECT iata_code FROM airports WHERE iata_code IN (${placeholders})`,
      airportCodes
    )
    
    const existingCodes = existingAirports.map(row => row.iata_code)
    const missingCodes = airportCodes.filter(code => !existingCodes.includes(code))
    
    console.log(`✅ Found ${existingCodes.length}/${airportCodes.length} airports in database`)
    if (missingCodes.length > 0) {
      console.log(`⚠️  Missing airports: ${missingCodes.join(', ')}`)
      console.log('📝 Only creating routes for existing airports')
    }
    
    // Clear existing flight routes
    await pg.query('DELETE FROM flight_routes')
    console.log('🗑️ Cleared existing flight routes')
    
    let routesCreated = 0
    
    // Generate routes only between existing airports
    for (let i = 0; i < existingCodes.length; i++) {
      for (let j = 0; j < existingCodes.length; j++) {
        if (i !== j) { // Don't create routes from airport to itself
          const origin = existingCodes[i]
          const destination = existingCodes[j]
          
          // Calculate distance and duration
          const originData = MAJOR_AIRPORTS[origin]
          const destData = MAJOR_AIRPORTS[destination]
          
          const distance = calculateDistance(
            originData.lat, originData.lon,
            destData.lat, destData.lon
          )
          
          const { hours, minutes, totalMinutes } = estimateFlightDuration(distance)
          
          // Insert flight route
          const routeId = generateUuid()
          const now = new Date()
          
          await pg.query(`
            INSERT INTO flight_routes (
              id, origin_airport_code, destination_airport_code,
              estimated_duration_hours, estimated_duration_minutes,
              total_duration_minutes, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            routeId, origin, destination,
            hours, minutes, totalMinutes,
            now, now
          ])
          
          routesCreated++
          
          // Progress indicator
          if (routesCreated % 50 === 0) {
            console.log(`📍 Created ${routesCreated} routes...`)
          }
        }
      }
    }
    
    // Commit the transaction
    await pg.query('COMMIT')
    
    console.log(`✅ Successfully created ${routesCreated} flight routes`)
    console.log(`🌍 Coverage: ${existingCodes.length} airports with full connectivity`)
    
    // Verify the data
    const { rows: countRows } = await pg.query('SELECT COUNT(*) as count FROM flight_routes')
    const count = parseInt(countRows[0].count)
    console.log(`📊 Total flight routes in database: ${count}`)
    
    // Show sample routes
    const { rows: sampleRoutes } = await pg.query(`
      SELECT origin_airport_code, destination_airport_code, total_duration_minutes
      FROM flight_routes 
      WHERE origin_airport_code = $1
      ORDER BY total_duration_minutes ASC
      LIMIT 5
    `, ['LHR'])
    
    console.log('\n🛫 Sample routes from London Heathrow:')
    sampleRoutes.forEach(row => {
      const hours = Math.floor(row.total_duration_minutes / 60)
      const minutes = row.total_duration_minutes % 60
      console.log(`  ${row.origin_airport_code} → ${row.destination_airport_code}: ${hours}h ${minutes}m (${row.total_duration_minutes} min)`)
    })
    
    return true
    
  } catch (error) {
    // Rollback transaction on error
    try { await pg.query('ROLLBACK') } catch {}
    console.error('❌ Failed to populate flight routes:', error.message)
    return false
  } finally {
    try { await pg.end() } catch {}
  }
}

// Run the script
if (require.main === module) {
  populateFlightRoutes().then(success => {
    if (success) {
      console.log('\n🎉 Flight routes population completed successfully!')
      console.log('✅ Admin panel should now show proper airport statistics')
      console.log('✅ Airport sync functionality should work correctly')
      process.exit(0)
    } else {
      console.log('\n💥 Flight routes population failed!')
      process.exit(1)
    }
  }).catch(error => {
    console.error('💥 Unexpected error:', error)
    process.exit(1)
  })
}