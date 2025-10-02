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
  console.log('🌱 Starting comprehensive MVP seed...')

  // Create admin user
  console.log('👤 Creating admin user...')
  const adminEmail = 'hayden.george.hamilton@gmail.com'
  const adminPassword = await hashPassword('Argentina1212!')

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminPassword,
      role: 'admin'
    },
    create: {
      email: adminEmail,
      passwordHash: adminPassword,
      role: 'admin',
      isEmailVerified: true
    }
  })

  console.log('✅ Created admin user:', adminUser.email)

  // Create countries first
  console.log('🌍 Creating countries...')

  const countries = [
    { name: 'United States', code: 'US' },
    { name: 'Canada', code: 'CA' },
    { name: 'Mexico', code: 'MX' },
    { name: 'United Kingdom', code: 'GB' },
    { name: 'France', code: 'FR' },
    { name: 'Spain', code: 'ES' },
    { name: 'Italy', code: 'IT' },
    { name: 'Netherlands', code: 'NL' },
    { name: 'Turkey', code: 'TR' },
    { name: 'Ireland', code: 'IE' },
    { name: 'Czech Republic', code: 'CZ' },
    { name: 'Portugal', code: 'PT' },
    { name: 'Greece', code: 'GR' },
    { name: 'Japan', code: 'JP' },
    { name: 'Singapore', code: 'SG' },
    { name: 'Hong Kong', code: 'HK' },
    { name: 'Thailand', code: 'TH' },
    { name: 'United Arab Emirates', code: 'AE' },
    { name: 'Australia', code: 'AU' },
    { name: 'South Korea', code: 'KR' },
    { name: 'India', code: 'IN' },
    { name: 'Brazil', code: 'BR' },
    { name: 'Argentina', code: 'AR' },
    { name: 'South Africa', code: 'ZA' },
    { name: 'Egypt', code: 'EG' },
  ]

  const countryMap: Record<string, string> = {}

  for (const country of countries) {
    const created = await prisma.country.upsert({
      where: { code: country.code },
      update: {},
      create: country
    })
    countryMap[country.name] = created.id
  }

  console.log(`✅ Created ${countries.length} countries`)

  // Comprehensive airport list (~100 major airports marked as searchable)
  console.log('✈️ Creating airports...')

  const airports = [
    // North America - Major Hubs (isSearchable: true)
    { iataCode: 'ATL', name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', country: 'United States', isSearchable: true },
    { iataCode: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States', isSearchable: true },
    { iataCode: 'ORD', name: 'O\'Hare International Airport', city: 'Chicago', country: 'United States', isSearchable: true },
    { iataCode: 'DFW', name: 'Dallas/Fort Worth International Airport', city: 'Dallas', country: 'United States', isSearchable: true },
    { iataCode: 'DEN', name: 'Denver International Airport', city: 'Denver', country: 'United States', isSearchable: true },
    { iataCode: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States', isSearchable: true },
    { iataCode: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'United States', isSearchable: true },
    { iataCode: 'SEA', name: 'Seattle-Tacoma International Airport', city: 'Seattle', country: 'United States', isSearchable: true },
    { iataCode: 'LAS', name: 'Harry Reid International Airport', city: 'Las Vegas', country: 'United States', isSearchable: true },
    { iataCode: 'MCO', name: 'Orlando International Airport', city: 'Orlando', country: 'United States', isSearchable: true },
    { iataCode: 'MIA', name: 'Miami International Airport', city: 'Miami', country: 'United States', isSearchable: true },
    { iataCode: 'PHX', name: 'Phoenix Sky Harbor International Airport', city: 'Phoenix', country: 'United States', isSearchable: true },
    { iataCode: 'IAH', name: 'George Bush Intercontinental Airport', city: 'Houston', country: 'United States', isSearchable: true },
    { iataCode: 'BOS', name: 'Logan International Airport', city: 'Boston', country: 'United States', isSearchable: true },
    { iataCode: 'EWR', name: 'Newark Liberty International Airport', city: 'Newark', country: 'United States', isSearchable: true },
    { iataCode: 'MSP', name: 'Minneapolis-St Paul International Airport', city: 'Minneapolis', country: 'United States', isSearchable: true },
    { iataCode: 'DTW', name: 'Detroit Metropolitan Airport', city: 'Detroit', country: 'United States', isSearchable: true },
    { iataCode: 'PHL', name: 'Philadelphia International Airport', city: 'Philadelphia', country: 'United States', isSearchable: true },
    { iataCode: 'LGA', name: 'LaGuardia Airport', city: 'New York', country: 'United States', isSearchable: true },
    { iataCode: 'BWI', name: 'Baltimore/Washington International Airport', city: 'Baltimore', country: 'United States', isSearchable: true },
    { iataCode: 'SLC', name: 'Salt Lake City International Airport', city: 'Salt Lake City', country: 'United States', isSearchable: true },
    { iataCode: 'SAN', name: 'San Diego International Airport', city: 'San Diego', country: 'United States', isSearchable: true },
    { iataCode: 'PDX', name: 'Portland International Airport', city: 'Portland', country: 'United States', isSearchable: true },
    { iataCode: 'YYZ', name: 'Toronto Pearson International Airport', city: 'Toronto', country: 'Canada', isSearchable: true },
    { iataCode: 'YVR', name: 'Vancouver International Airport', city: 'Vancouver', country: 'Canada', isSearchable: true },
    { iataCode: 'YUL', name: 'Montréal-Pierre Elliott Trudeau International Airport', city: 'Montreal', country: 'Canada', isSearchable: true },
    { iataCode: 'MEX', name: 'Mexico City International Airport', city: 'Mexico City', country: 'Mexico', isSearchable: true },
    { iataCode: 'CUN', name: 'Cancún International Airport', city: 'Cancún', country: 'Mexico', isSearchable: true },

    // Europe - Major Hubs
    { iataCode: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom', isSearchable: true },
    { iataCode: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', isSearchable: true },
    { iataCode: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands', isSearchable: true },
    { iataCode: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', isSearchable: true },
    { iataCode: 'MAD', name: 'Adolfo Suárez Madrid-Barajas Airport', city: 'Madrid', country: 'Spain', isSearchable: true },
    { iataCode: 'BCN', name: 'Barcelona-El Prat Airport', city: 'Barcelona', country: 'Spain', isSearchable: true },
    { iataCode: 'FCO', name: 'Leonardo da Vinci-Fiumicino Airport', city: 'Rome', country: 'Italy', isSearchable: true },
    { iataCode: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'Germany', isSearchable: true },
    { iataCode: 'LGW', name: 'London Gatwick Airport', city: 'London', country: 'United Kingdom', isSearchable: true },
    { iataCode: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey', isSearchable: true },
    { iataCode: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland', isSearchable: true },
    { iataCode: 'VIE', name: 'Vienna International Airport', city: 'Vienna', country: 'Austria', isSearchable: true },
    { iataCode: 'CPH', name: 'Copenhagen Airport', city: 'Copenhagen', country: 'Denmark', isSearchable: true },
    { iataCode: 'DUB', name: 'Dublin Airport', city: 'Dublin', country: 'Ireland', isSearchable: true },
    { iataCode: 'ARN', name: 'Stockholm Arlanda Airport', city: 'Stockholm', country: 'Sweden', isSearchable: true },
    { iataCode: 'OSL', name: 'Oslo Airport', city: 'Oslo', country: 'Norway', isSearchable: true },
    { iataCode: 'BRU', name: 'Brussels Airport', city: 'Brussels', country: 'Belgium', isSearchable: true },
    { iataCode: 'LIS', name: 'Lisbon Portela Airport', city: 'Lisbon', country: 'Portugal', isSearchable: true },
    { iataCode: 'ATH', name: 'Athens International Airport', city: 'Athens', country: 'Greece', isSearchable: true },
    { iataCode: 'PRG', name: 'Václav Havel Airport Prague', city: 'Prague', country: 'Czech Republic', isSearchable: true },

    // Asia-Pacific - Major Hubs
    { iataCode: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates', isSearchable: true },
    { iataCode: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore', isSearchable: true },
    { iataCode: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'Hong Kong', isSearchable: true },
    { iataCode: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan', isSearchable: true },
    { iataCode: 'HND', name: 'Tokyo Haneda Airport', city: 'Tokyo', country: 'Japan', isSearchable: true },
    { iataCode: 'ICN', name: 'Incheon International Airport', city: 'Seoul', country: 'South Korea', isSearchable: true },
    { iataCode: 'PEK', name: 'Beijing Capital International Airport', city: 'Beijing', country: 'China', isSearchable: true },
    { iataCode: 'PVG', name: 'Shanghai Pudong International Airport', city: 'Shanghai', country: 'China', isSearchable: true },
    { iataCode: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', isSearchable: true },
    { iataCode: 'KUL', name: 'Kuala Lumpur International Airport', city: 'Kuala Lumpur', country: 'Malaysia', isSearchable: true },
    { iataCode: 'DEL', name: 'Indira Gandhi International Airport', city: 'New Delhi', country: 'India', isSearchable: true },
    { iataCode: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', country: 'India', isSearchable: true },
    { iataCode: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia', isSearchable: true },
    { iataCode: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia', isSearchable: true },
    { iataCode: 'AKL', name: 'Auckland Airport', city: 'Auckland', country: 'New Zealand', isSearchable: true },
    { iataCode: 'CGK', name: 'Soekarno-Hatta International Airport', city: 'Jakarta', country: 'Indonesia', isSearchable: true },
    { iataCode: 'MNL', name: 'Ninoy Aquino International Airport', city: 'Manila', country: 'Philippines', isSearchable: true },
    { iataCode: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar', isSearchable: true },
    { iataCode: 'AUH', name: 'Abu Dhabi International Airport', city: 'Abu Dhabi', country: 'United Arab Emirates', isSearchable: true },
    { iataCode: 'TPE', name: 'Taiwan Taoyuan International Airport', city: 'Taipei', country: 'Taiwan', isSearchable: true },

    // South America & Africa - Major Hubs
    { iataCode: 'GRU', name: 'São Paulo/Guarulhos International Airport', city: 'São Paulo', country: 'Brazil', isSearchable: true },
    { iataCode: 'GIG', name: 'Rio de Janeiro/Galeão International Airport', city: 'Rio de Janeiro', country: 'Brazil', isSearchable: true },
    { iataCode: 'BOG', name: 'El Dorado International Airport', city: 'Bogotá', country: 'Colombia', isSearchable: true },
    { iataCode: 'LIM', name: 'Jorge Chávez International Airport', city: 'Lima', country: 'Peru', isSearchable: true },
    { iataCode: 'EZE', name: 'Ministro Pistarini International Airport', city: 'Buenos Aires', country: 'Argentina', isSearchable: true },
    { iataCode: 'SCL', name: 'Arturo Merino Benítez International Airport', city: 'Santiago', country: 'Chile', isSearchable: true },
    { iataCode: 'CPT', name: 'Cape Town International Airport', city: 'Cape Town', country: 'South Africa', isSearchable: true },
    { iataCode: 'JNB', name: 'O.R. Tambo International Airport', city: 'Johannesburg', country: 'South Africa', isSearchable: true },
    { iataCode: 'CAI', name: 'Cairo International Airport', city: 'Cairo', country: 'Egypt', isSearchable: true },
    { iataCode: 'ADD', name: 'Addis Ababa Bole International Airport', city: 'Addis Ababa', country: 'Ethiopia', isSearchable: true },
  ]

  for (const airport of airports) {
    await prisma.airport.upsert({
      where: { iataCode: airport.iataCode },
      update: {},
      create: airport
    })
  }

  console.log(`✅ Created ${airports.length} airports (${airports.filter(a => a.isSearchable).length} searchable)`)

  // Create destinations for major cities
  console.log('🏙️ Creating destinations...')

  const destinations = [
    // North America
    { airportCode: 'JFK', cityName: 'New York', countryName: 'United States', description: 'The Big Apple - iconic skyline, world-class museums, and vibrant culture', popularityScore: 10.0 },
    { airportCode: 'LAX', cityName: 'Los Angeles', countryName: 'United States', description: 'City of Angels with Hollywood glamour, beaches, and sunshine', popularityScore: 9.5 },
    { airportCode: 'SFO', cityName: 'San Francisco', countryName: 'United States', description: 'Golden Gate Bridge, tech hub, and stunning bay views', popularityScore: 9.2 },
    { airportCode: 'MIA', cityName: 'Miami', countryName: 'United States', description: 'Tropical paradise with Art Deco architecture and Latin flavor', popularityScore: 8.8 },
    { airportCode: 'LAS', cityName: 'Las Vegas', countryName: 'United States', description: 'Entertainment capital with casinos, shows, and nightlife', popularityScore: 8.5 },
    { airportCode: 'YYZ', cityName: 'Toronto', countryName: 'Canada', description: 'Multicultural metropolis with CN Tower and diverse cuisine', popularityScore: 8.7 },
    { airportCode: 'YVR', cityName: 'Vancouver', countryName: 'Canada', description: 'Coastal city surrounded by mountains and natural beauty', popularityScore: 8.9 },
    { airportCode: 'MEX', cityName: 'Mexico City', countryName: 'Mexico', description: 'Ancient Aztec capital with rich history and vibrant culture', popularityScore: 8.3 },
    { airportCode: 'CUN', cityName: 'Cancún', countryName: 'Mexico', description: 'Caribbean paradise with turquoise waters and Mayan ruins', popularityScore: 9.1 },

    // Europe
    { airportCode: 'LHR', cityName: 'London', countryName: 'United Kingdom', description: 'Historic capital with royal palaces and cultural treasures', popularityScore: 9.8 },
    { airportCode: 'CDG', cityName: 'Paris', countryName: 'France', description: 'City of Light with romantic charm and world-class cuisine', popularityScore: 9.7 },
    { airportCode: 'BCN', cityName: 'Barcelona', countryName: 'Spain', description: 'Gaudí architecture, Mediterranean beaches, and Catalan culture', popularityScore: 9.4 },
    { airportCode: 'FCO', cityName: 'Rome', countryName: 'Italy', description: 'Eternal City with ancient ruins and Renaissance masterpieces', popularityScore: 9.6 },
    { airportCode: 'AMS', cityName: 'Amsterdam', countryName: 'Netherlands', description: 'Canal-filled city with art museums and cycling culture', popularityScore: 9.0 },
    { airportCode: 'IST', cityName: 'Istanbul', countryName: 'Turkey', description: 'Where East meets West - mosques, bazaars, and Bosphorus views', popularityScore: 8.9 },
    { airportCode: 'DUB', cityName: 'Dublin', countryName: 'Ireland', description: 'Friendly city with literary heritage and lively pubs', popularityScore: 8.5 },
    { airportCode: 'PRG', cityName: 'Prague', countryName: 'Czech Republic', description: 'Fairytale city with medieval architecture and beer culture', popularityScore: 8.8 },
    { airportCode: 'LIS', cityName: 'Lisbon', countryName: 'Portugal', description: 'Coastal capital with colorful tiles and pastel buildings', popularityScore: 8.7 },
    { airportCode: 'ATH', cityName: 'Athens', countryName: 'Greece', description: 'Cradle of civilization with ancient Acropolis', popularityScore: 8.6 },

    // Asia-Pacific
    { airportCode: 'NRT', cityName: 'Tokyo', countryName: 'Japan', description: 'Modern metropolis blending tradition with cutting-edge technology', popularityScore: 9.3 },
    { airportCode: 'SIN', cityName: 'Singapore', countryName: 'Singapore', description: 'Garden city with amazing food and futuristic architecture', popularityScore: 8.8 },
    { airportCode: 'HKG', cityName: 'Hong Kong', countryName: 'Hong Kong', description: 'Dynamic city where skyscrapers meet Victoria Harbour', popularityScore: 8.9 },
    { airportCode: 'BKK', cityName: 'Bangkok', countryName: 'Thailand', description: 'Temple-filled city with street food and vibrant nightlife', popularityScore: 8.7 },
    { airportCode: 'DXB', cityName: 'Dubai', countryName: 'United Arab Emirates', description: 'Futuristic city with luxury shopping and desert adventures', popularityScore: 8.5 },
    { airportCode: 'SYD', cityName: 'Sydney', countryName: 'Australia', description: 'Harbor city with iconic Opera House and beautiful beaches', popularityScore: 9.0 },
    { airportCode: 'MEL', cityName: 'Melbourne', countryName: 'Australia', description: 'Cultural capital with coffee culture and street art', popularityScore: 8.6 },
    { airportCode: 'ICN', cityName: 'Seoul', countryName: 'South Korea', description: 'Dynamic city blending K-pop culture with traditional palaces', popularityScore: 8.7 },
    { airportCode: 'DEL', cityName: 'New Delhi', countryName: 'India', description: 'Historic capital with Mughal monuments and vibrant markets', popularityScore: 8.2 },
    { airportCode: 'BOM', cityName: 'Mumbai', countryName: 'India', description: 'Bollywood capital with colonial architecture and bustling energy', popularityScore: 8.1 },

    // South America & Africa
    { airportCode: 'GRU', cityName: 'São Paulo', countryName: 'Brazil', description: 'Massive metropolis with art scene and diverse neighborhoods', popularityScore: 8.3 },
    { airportCode: 'GIG', cityName: 'Rio de Janeiro', countryName: 'Brazil', description: 'Carnival city with Christ the Redeemer and Copacabana Beach', popularityScore: 8.9 },
    { airportCode: 'EZE', cityName: 'Buenos Aires', countryName: 'Argentina', description: 'Paris of South America with tango and steak culture', popularityScore: 8.5 },
    { airportCode: 'CPT', cityName: 'Cape Town', countryName: 'South Africa', description: 'Stunning coastal city at the foot of Table Mountain', popularityScore: 8.8 },
    { airportCode: 'JNB', cityName: 'Johannesburg', countryName: 'South Africa', description: 'Gateway to safaris and vibrant African culture', popularityScore: 7.9 },
    { airportCode: 'CAI', cityName: 'Cairo', countryName: 'Egypt', description: 'Ancient city home to the Pyramids and Sphinx', popularityScore: 8.4 },
  ]

  for (const destination of destinations) {
    const countryId = countryMap[destination.countryName]
    if (!countryId) {
      console.warn(`⚠️  Country not found for ${destination.cityName}: ${destination.countryName}`)
      continue
    }

    await prisma.destination.upsert({
      where: { airportCode: destination.airportCode },
      update: {},
      create: {
        airportCode: destination.airportCode,
        cityName: destination.cityName,
        countryId: countryId,
        description: destination.description,
        popularityScore: destination.popularityScore
      }
    })
  }

  console.log(`✅ Created ${destinations.length} destinations`)

  // Add sample Theme POIs for a few destinations
  console.log('🎬 Creating sample Theme POIs...')

  const samplePOIs = [
    // Barcelona - Adventure
    { destinationCode: 'BCN', theme: 'adventure', name: 'Montserrat Mountain Hiking', description: 'Epic mountain trails with stunning views', videoUrl: 'https://youtube.com/shorts/example1', order: 1 },
    { destinationCode: 'BCN', theme: 'adventure', name: 'Park Güell Exploration', description: 'Gaudí\'s whimsical park adventure', videoUrl: 'https://youtube.com/shorts/example2', order: 2 },

    // Barcelona - Vibe
    { destinationCode: 'BCN', theme: 'vibe', name: 'Gothic Quarter Nightlife', description: 'Vibrant bars and clubs in medieval streets', videoUrl: 'https://youtube.com/shorts/example3', order: 1 },
    { destinationCode: 'BCN', theme: 'vibe', name: 'Beach Club Sunset', description: 'Barceloneta beach party scene', videoUrl: 'https://youtube.com/shorts/example4', order: 2 },

    // Tokyo - Discover
    { destinationCode: 'NRT', theme: 'discover', name: 'Sensoji Temple Visit', description: 'Ancient Buddhist temple in Asakusa', videoUrl: 'https://youtube.com/shorts/example5', order: 1 },
    { destinationCode: 'NRT', theme: 'discover', name: 'Tsukiji Fish Market Tour', description: 'World-famous seafood market experience', videoUrl: 'https://youtube.com/shorts/example6', order: 2 },

    // New York - Indulge
    { destinationCode: 'JFK', theme: 'indulge', name: 'Michelin Star Restaurant Crawl', description: 'Fine dining across Manhattan', videoUrl: 'https://youtube.com/shorts/example7', order: 1 },
    { destinationCode: 'JFK', theme: 'indulge', name: 'Broadway Show Experience', description: 'World-class theater performances', videoUrl: 'https://youtube.com/shorts/example8', order: 2 },
  ]

  for (const poi of samplePOIs) {
    const destination = await prisma.destination.findUnique({
      where: { airportCode: poi.destinationCode }
    })

    if (destination) {
      await prisma.themePOI.create({
        data: {
          destinationId: destination.id,
          theme: poi.theme,
          name: poi.name,
          description: poi.description,
          videoUrl: poi.videoUrl,
          displayOrder: poi.order
        }
      })
    }
  }

  console.log(`✅ Created ${samplePOIs.length} sample POIs`)

  // Create comprehensive flight routes
  console.log('🛫 Creating flight routes...')

  const routes = [
    // US Domestic Routes
    { originAirportCode: 'JFK', destinationAirportCode: 'LAX', totalDurationMinutes: 360 },
    { originAirportCode: 'JFK', destinationAirportCode: 'SFO', totalDurationMinutes: 390 },
    { originAirportCode: 'JFK', destinationAirportCode: 'MIA', totalDurationMinutes: 190 },
    { originAirportCode: 'LAX', destinationAirportCode: 'JFK', totalDurationMinutes: 320 },
    { originAirportCode: 'LAX', destinationAirportCode: 'SFO', totalDurationMinutes: 85 },
    { originAirportCode: 'LAX', destinationAirportCode: 'LAS', totalDurationMinutes: 70 },
    { originAirportCode: 'SFO', destinationAirportCode: 'LAX', totalDurationMinutes: 85 },
    { originAirportCode: 'SFO', destinationAirportCode: 'JFK', totalDurationMinutes: 330 },

    // Transatlantic Routes
    { originAirportCode: 'JFK', destinationAirportCode: 'LHR', totalDurationMinutes: 420 },
    { originAirportCode: 'JFK', destinationAirportCode: 'CDG', totalDurationMinutes: 450 },
    { originAirportCode: 'LAX', destinationAirportCode: 'LHR', totalDurationMinutes: 650 },
    { originAirportCode: 'SFO', destinationAirportCode: 'LHR', totalDurationMinutes: 630 },
    { originAirportCode: 'LHR', destinationAirportCode: 'JFK', totalDurationMinutes: 480 },
    { originAirportCode: 'CDG', destinationAirportCode: 'JFK', totalDurationMinutes: 490 },

    // European Routes
    { originAirportCode: 'LHR', destinationAirportCode: 'CDG', totalDurationMinutes: 75 },
    { originAirportCode: 'LHR', destinationAirportCode: 'BCN', totalDurationMinutes: 140 },
    { originAirportCode: 'LHR', destinationAirportCode: 'FCO', totalDurationMinutes: 155 },
    { originAirportCode: 'LHR', destinationAirportCode: 'AMS', totalDurationMinutes: 65 },
    { originAirportCode: 'LHR', destinationAirportCode: 'DUB', totalDurationMinutes: 80 },
    { originAirportCode: 'CDG', destinationAirportCode: 'LHR', totalDurationMinutes: 75 },
    { originAirportCode: 'CDG', destinationAirportCode: 'BCN', totalDurationMinutes: 110 },
    { originAirportCode: 'CDG', destinationAirportCode: 'FCO', totalDurationMinutes: 120 },

    // Asia Routes
    { originAirportCode: 'NRT', destinationAirportCode: 'SIN', totalDurationMinutes: 420 },
    { originAirportCode: 'NRT', destinationAirportCode: 'HKG', totalDurationMinutes: 270 },
    { originAirportCode: 'SIN', destinationAirportCode: 'BKK', totalDurationMinutes: 145 },
    { originAirportCode: 'SIN', destinationAirportCode: 'SYD', totalDurationMinutes: 480 },
    { originAirportCode: 'HKG', destinationAirportCode: 'SIN', totalDurationMinutes: 240 },
    { originAirportCode: 'HKG', destinationAirportCode: 'NRT', totalDurationMinutes: 280 },

    // Long-haul Routes
    { originAirportCode: 'LAX', destinationAirportCode: 'NRT', totalDurationMinutes: 720 },
    { originAirportCode: 'LAX', destinationAirportCode: 'SYD', totalDurationMinutes: 850 },
    { originAirportCode: 'SFO', destinationAirportCode: 'NRT', totalDurationMinutes: 660 },
    { originAirportCode: 'LHR', destinationAirportCode: 'DXB', totalDurationMinutes: 420 },
    { originAirportCode: 'LHR', destinationAirportCode: 'SIN', totalDurationMinutes: 780 },
    { originAirportCode: 'DXB', destinationAirportCode: 'LHR', totalDurationMinutes: 450 },

    // Southern Hemisphere & Americas
    { originAirportCode: 'GRU', destinationAirportCode: 'GIG', totalDurationMinutes: 55 },
    { originAirportCode: 'GRU', destinationAirportCode: 'EZE', totalDurationMinutes: 190 },
    { originAirportCode: 'MEX', destinationAirportCode: 'CUN', totalDurationMinutes: 130 },
    { originAirportCode: 'YYZ', destinationAirportCode: 'YVR', totalDurationMinutes: 280 },
    { originAirportCode: 'SYD', destinationAirportCode: 'MEL', totalDurationMinutes: 85 },
    { originAirportCode: 'CPT', destinationAirportCode: 'JNB', totalDurationMinutes: 125 },
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

  console.log('\n🎉 Comprehensive MVP seed completed successfully!')
  console.log(`📊 Summary:`)
  console.log(`   - ${airports.length} airports (${airports.filter(a => a.isSearchable).length} searchable)`)
  console.log(`   - ${destinations.length} destinations`)
  console.log(`   - ${routes.length} flight routes`)
  console.log(`🔑 Admin login: admin@spontra.com / Admin123!`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
