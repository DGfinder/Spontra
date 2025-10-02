// Load environment variables
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

async function main() {
  console.log('🌱 Starting ultra-minimal MVP seed...')

  // Create admin user
  console.log('👤 Creating admin user...')
  const adminEmail = 'admin@spontra.com'
  const adminPassword = await hashPassword('Admin123!')

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: adminPassword,
      role: 'admin',
      isEmailVerified: true
    }
  })

  console.log('✅ Created admin user:', adminUser.email)

  // Create sample airports
  console.log('✈️ Creating sample airports...')
  
  const airports = [
    { iataCode: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States' },
    { iataCode: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States' },
    { iataCode: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom' },
    { iataCode: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' },
    { iataCode: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan' },
    { iataCode: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia' },
    { iataCode: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates' },
    { iataCode: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore' }
  ]

  for (const airport of airports) {
    await prisma.airport.upsert({
      where: { iataCode: airport.iataCode },
      update: {},
      create: airport
    })
  }

  console.log(`✅ Created ${airports.length} airports`)

  // Create sample destinations
  console.log('🏙️ Creating sample destinations...')
  
  const destinations = [
    { airportCode: 'LAX', cityName: 'Los Angeles', countryName: 'United States', description: 'City of Angels with beaches and Hollywood glamour', popularityScore: 9.5 },
    { airportCode: 'JFK', cityName: 'New York', countryName: 'United States', description: 'The Big Apple - city that never sleeps', popularityScore: 10.0 },
    { airportCode: 'LHR', cityName: 'London', countryName: 'United Kingdom', description: 'Historic capital with royal palaces and cultural treasures', popularityScore: 9.8 },
    { airportCode: 'CDG', cityName: 'Paris', countryName: 'France', description: 'City of Light with romantic charm and world-class cuisine', popularityScore: 9.7 },
    { airportCode: 'NRT', cityName: 'Tokyo', countryName: 'Japan', description: 'Modern metropolis blending tradition with cutting-edge technology', popularityScore: 9.3 },
    { airportCode: 'SYD', cityName: 'Sydney', countryName: 'Australia', description: 'Harbor city with iconic Opera House and beautiful beaches', popularityScore: 9.0 },
    { airportCode: 'DXB', cityName: 'Dubai', countryName: 'United Arab Emirates', description: 'Futuristic city with luxury shopping and desert adventures', popularityScore: 8.5 },
    { airportCode: 'SIN', cityName: 'Singapore', countryName: 'Singapore', description: 'Garden city with amazing food and modern architecture', popularityScore: 8.8 }
  ]

  for (const destination of destinations) {
    await prisma.destination.upsert({
      where: { airportCode: destination.airportCode },
      update: {},
      create: destination
    })
  }

  console.log(`✅ Created ${destinations.length} destinations`)

  // Create sample flight routes
  console.log('🛫 Creating sample flight routes...')
  
  const routes = [
    { originAirportCode: 'LAX', destinationAirportCode: 'JFK', totalDurationMinutes: 320 }, // 5h 20m
    { originAirportCode: 'LAX', destinationAirportCode: 'LHR', totalDurationMinutes: 650 }, // 10h 50m
    { originAirportCode: 'LAX', destinationAirportCode: 'NRT', totalDurationMinutes: 720 }, // 12h
    { originAirportCode: 'JFK', destinationAirportCode: 'LHR', totalDurationMinutes: 420 }, // 7h
    { originAirportCode: 'JFK', destinationAirportCode: 'CDG', totalDurationMinutes: 450 }, // 7h 30m
    { originAirportCode: 'LHR', destinationAirportCode: 'CDG', totalDurationMinutes: 75 },  // 1h 15m
    { originAirportCode: 'LHR', destinationAirportCode: 'DXB', totalDurationMinutes: 420 }, // 7h
    { originAirportCode: 'SIN', destinationAirportCode: 'SYD', totalDurationMinutes: 480 }, // 8h
  ]

  for (const route of routes) {
    await prisma.flightRoute.upsert({
      where: { 
        originAirportCode_destinationAirportCode: {
          originAirportCode: route.originAirportCode,
          destinationAirportCode: route.destinationAirportCode
        }
      },
      update: {},
      create: route
    })
  }

  console.log(`✅ Created ${routes.length} flight routes`)

  console.log('\n🎉 Ultra-minimal MVP seed completed successfully!')
  console.log('🔑 Admin login: admin@spontra.com / Admin123!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })