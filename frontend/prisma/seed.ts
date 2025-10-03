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
    // North America
    { name: 'United States', code: 'US' },
    { name: 'Canada', code: 'CA' },
    { name: 'Mexico', code: 'MX' },

    // Western Europe
    { name: 'United Kingdom', code: 'GB' },
    { name: 'France', code: 'FR' },
    { name: 'Spain', code: 'ES' },
    { name: 'Italy', code: 'IT' },
    { name: 'Netherlands', code: 'NL' },
    { name: 'Germany', code: 'DE' },
    { name: 'Austria', code: 'AT' },
    { name: 'Switzerland', code: 'CH' },
    { name: 'Belgium', code: 'BE' },
    { name: 'Portugal', code: 'PT' },
    { name: 'Ireland', code: 'IE' },
    { name: 'Luxembourg', code: 'LU' },

    // Nordic Countries
    { name: 'Denmark', code: 'DK' },
    { name: 'Sweden', code: 'SE' },
    { name: 'Norway', code: 'NO' },
    { name: 'Finland', code: 'FI' },
    { name: 'Iceland', code: 'IS' },

    // Southern Europe
    { name: 'Greece', code: 'GR' },
    { name: 'Turkey', code: 'TR' },
    { name: 'Malta', code: 'MT' },
    { name: 'Cyprus', code: 'CY' },

    // Central Europe
    { name: 'Czech Republic', code: 'CZ' },
    { name: 'Poland', code: 'PL' },
    { name: 'Hungary', code: 'HU' },
    { name: 'Slovakia', code: 'SK' },
    { name: 'Slovenia', code: 'SI' },

    // Eastern Europe
    { name: 'Romania', code: 'RO' },
    { name: 'Bulgaria', code: 'BG' },
    { name: 'Croatia', code: 'HR' },
    { name: 'Serbia', code: 'RS' },

    // Baltic States
    { name: 'Estonia', code: 'EE' },
    { name: 'Latvia', code: 'LV' },
    { name: 'Lithuania', code: 'LT' },

    // Asia-Pacific
    { name: 'Japan', code: 'JP' },
    { name: 'Singapore', code: 'SG' },
    { name: 'Hong Kong', code: 'HK' },
    { name: 'Thailand', code: 'TH' },
    { name: 'Malaysia', code: 'MY' },
    { name: 'Indonesia', code: 'ID' },
    { name: 'Philippines', code: 'PH' },
    { name: 'Vietnam', code: 'VN' },
    { name: 'Taiwan', code: 'TW' },
    { name: 'China', code: 'CN' },
    { name: 'United Arab Emirates', code: 'AE' },
    { name: 'Qatar', code: 'QA' },
    { name: 'Australia', code: 'AU' },
    { name: 'New Zealand', code: 'NZ' },
    { name: 'South Korea', code: 'KR' },
    { name: 'India', code: 'IN' },

    // South America
    { name: 'Brazil', code: 'BR' },
    { name: 'Argentina', code: 'AR' },
    { name: 'Colombia', code: 'CO' },
    { name: 'Peru', code: 'PE' },
    { name: 'Chile', code: 'CL' },

    // Africa
    { name: 'South Africa', code: 'ZA' },
    { name: 'Egypt', code: 'EG' },
    { name: 'Morocco', code: 'MA' },
    { name: 'Kenya', code: 'KE' },
    { name: 'Ethiopia', code: 'ET' },
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

    // Europe - Comprehensive Coverage (Top 10 per country)

    // United Kingdom (Top 10)
    { iataCode: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom', isSearchable: true },
    { iataCode: 'LGW', name: 'London Gatwick Airport', city: 'London', country: 'United Kingdom', isSearchable: true },
    { iataCode: 'MAN', name: 'Manchester Airport', city: 'Manchester', country: 'United Kingdom', isSearchable: true },
    { iataCode: 'STN', name: 'London Stansted Airport', city: 'London', country: 'United Kingdom', isSearchable: true },
    { iataCode: 'LTN', name: 'London Luton Airport', city: 'London', country: 'United Kingdom', isSearchable: true },
    { iataCode: 'EDI', name: 'Edinburgh Airport', city: 'Edinburgh', country: 'United Kingdom', isSearchable: true },
    { iataCode: 'BHX', name: 'Birmingham Airport', city: 'Birmingham', country: 'United Kingdom', isSearchable: true },
    { iataCode: 'GLA', name: 'Glasgow Airport', city: 'Glasgow', country: 'United Kingdom', isSearchable: true },
    { iataCode: 'BRS', name: 'Bristol Airport', city: 'Bristol', country: 'United Kingdom', isSearchable: true },
    { iataCode: 'NCL', name: 'Newcastle Airport', city: 'Newcastle', country: 'United Kingdom', isSearchable: true },

    // France (Top 10)
    { iataCode: 'CDG', name: 'Paris Charles de Gaulle Airport', city: 'Paris', country: 'France', isSearchable: true },
    { iataCode: 'ORY', name: 'Paris Orly Airport', city: 'Paris', country: 'France', isSearchable: true },
    { iataCode: 'NCE', name: 'Nice Côte d\'Azur Airport', city: 'Nice', country: 'France', isSearchable: true },
    { iataCode: 'LYS', name: 'Lyon-Saint Exupéry Airport', city: 'Lyon', country: 'France', isSearchable: true },
    { iataCode: 'MRS', name: 'Marseille Provence Airport', city: 'Marseille', country: 'France', isSearchable: true },
    { iataCode: 'TLS', name: 'Toulouse-Blagnac Airport', city: 'Toulouse', country: 'France', isSearchable: true },
    { iataCode: 'BOD', name: 'Bordeaux-Mérignac Airport', city: 'Bordeaux', country: 'France', isSearchable: true },
    { iataCode: 'NTE', name: 'Nantes Atlantique Airport', city: 'Nantes', country: 'France', isSearchable: true },
    { iataCode: 'BSL', name: 'EuroAirport Basel-Mulhouse-Freiburg', city: 'Basel/Mulhouse', country: 'France', isSearchable: true },
    { iataCode: 'LIL', name: 'Lille Airport', city: 'Lille', country: 'France', isSearchable: true },

    // Spain (Top 10)
    { iataCode: 'MAD', name: 'Adolfo Suárez Madrid-Barajas Airport', city: 'Madrid', country: 'Spain', isSearchable: true },
    { iataCode: 'BCN', name: 'Barcelona-El Prat Airport', city: 'Barcelona', country: 'Spain', isSearchable: true },
    { iataCode: 'PMI', name: 'Palma de Mallorca Airport', city: 'Palma', country: 'Spain', isSearchable: true },
    { iataCode: 'AGP', name: 'Málaga-Costa del Sol Airport', city: 'Málaga', country: 'Spain', isSearchable: true },
    { iataCode: 'SVQ', name: 'Seville Airport', city: 'Seville', country: 'Spain', isSearchable: true },
    { iataCode: 'ALC', name: 'Alicante-Elche Airport', city: 'Alicante', country: 'Spain', isSearchable: true },
    { iataCode: 'VLC', name: 'Valencia Airport', city: 'Valencia', country: 'Spain', isSearchable: true },
    { iataCode: 'BIO', name: 'Bilbao Airport', city: 'Bilbao', country: 'Spain', isSearchable: true },
    { iataCode: 'IBZ', name: 'Ibiza Airport', city: 'Ibiza', country: 'Spain', isSearchable: true },
    { iataCode: 'TFS', name: 'Tenerife South Airport', city: 'Tenerife', country: 'Spain', isSearchable: true },

    // Germany (Top 10)
    { iataCode: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', isSearchable: true },
    { iataCode: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'Germany', isSearchable: true },
    { iataCode: 'BER', name: 'Berlin Brandenburg Airport', city: 'Berlin', country: 'Germany', isSearchable: true },
    { iataCode: 'DUS', name: 'Düsseldorf Airport', city: 'Düsseldorf', country: 'Germany', isSearchable: true },
    { iataCode: 'HAM', name: 'Hamburg Airport', city: 'Hamburg', country: 'Germany', isSearchable: true },
    { iataCode: 'CGN', name: 'Cologne Bonn Airport', city: 'Cologne', country: 'Germany', isSearchable: true },
    { iataCode: 'STR', name: 'Stuttgart Airport', city: 'Stuttgart', country: 'Germany', isSearchable: true },
    { iataCode: 'HAJ', name: 'Hannover Airport', city: 'Hannover', country: 'Germany', isSearchable: true },
    { iataCode: 'NUE', name: 'Nuremberg Airport', city: 'Nuremberg', country: 'Germany', isSearchable: true },
    { iataCode: 'DRT', name: 'Dortmund Airport', city: 'Dortmund', country: 'Germany', isSearchable: true },

    // Italy (Top 10)
    { iataCode: 'FCO', name: 'Leonardo da Vinci-Fiumicino Airport', city: 'Rome', country: 'Italy', isSearchable: true },
    { iataCode: 'MXP', name: 'Milan Malpensa Airport', city: 'Milan', country: 'Italy', isSearchable: true },
    { iataCode: 'BGY', name: 'Milan Bergamo Airport', city: 'Bergamo', country: 'Italy', isSearchable: true },
    { iataCode: 'VCE', name: 'Venice Marco Polo Airport', city: 'Venice', country: 'Italy', isSearchable: true },
    { iataCode: 'NAP', name: 'Naples International Airport', city: 'Naples', country: 'Italy', isSearchable: true },
    { iataCode: 'CTA', name: 'Catania-Fontanarossa Airport', city: 'Catania', country: 'Italy', isSearchable: true },
    { iataCode: 'BLQ', name: 'Bologna Guglielmo Marconi Airport', city: 'Bologna', country: 'Italy', isSearchable: true },
    { iataCode: 'PSA', name: 'Pisa International Airport', city: 'Pisa', country: 'Italy', isSearchable: true },
    { iataCode: 'LIN', name: 'Milan Linate Airport', city: 'Milan', country: 'Italy', isSearchable: true },
    { iataCode: 'CAG', name: 'Cagliari Elmas Airport', city: 'Cagliari', country: 'Italy', isSearchable: true },

    // Netherlands (Top 5 - smaller country)
    { iataCode: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands', isSearchable: true },
    { iataCode: 'EIN', name: 'Eindhoven Airport', city: 'Eindhoven', country: 'Netherlands', isSearchable: true },
    { iataCode: 'RTM', name: 'Rotterdam The Hague Airport', city: 'Rotterdam', country: 'Netherlands', isSearchable: true },
    { iataCode: 'MST', name: 'Maastricht Aachen Airport', city: 'Maastricht', country: 'Netherlands', isSearchable: true },
    { iataCode: 'GRQ', name: 'Groningen Airport Eelde', city: 'Groningen', country: 'Netherlands', isSearchable: true },

    // Switzerland (Top 5)
    { iataCode: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland', isSearchable: true },
    { iataCode: 'GVA', name: 'Geneva Airport', city: 'Geneva', country: 'Switzerland', isSearchable: true },
    { iataCode: 'BSL', name: 'EuroAirport Basel-Mulhouse-Freiburg', city: 'Basel', country: 'Switzerland', isSearchable: true },
    { iataCode: 'BRN', name: 'Bern Airport', city: 'Bern', country: 'Switzerland', isSearchable: true },
    { iataCode: 'LUG', name: 'Lugano Airport', city: 'Lugano', country: 'Switzerland', isSearchable: true },

    // Austria (Top 6)
    { iataCode: 'VIE', name: 'Vienna International Airport', city: 'Vienna', country: 'Austria', isSearchable: true },
    { iataCode: 'SZG', name: 'Salzburg Airport', city: 'Salzburg', country: 'Austria', isSearchable: true },
    { iataCode: 'INN', name: 'Innsbruck Airport', city: 'Innsbruck', country: 'Austria', isSearchable: true },
    { iataCode: 'GRZ', name: 'Graz Airport', city: 'Graz', country: 'Austria', isSearchable: true },
    { iataCode: 'LNZ', name: 'Linz Airport', city: 'Linz', country: 'Austria', isSearchable: true },
    { iataCode: 'KLU', name: 'Klagenfurt Airport', city: 'Klagenfurt', country: 'Austria', isSearchable: true },

    // Belgium (Top 5)
    { iataCode: 'BRU', name: 'Brussels Airport', city: 'Brussels', country: 'Belgium', isSearchable: true },
    { iataCode: 'CRL', name: 'Brussels South Charleroi Airport', city: 'Charleroi', country: 'Belgium', isSearchable: true },
    { iataCode: 'ANR', name: 'Antwerp International Airport', city: 'Antwerp', country: 'Belgium', isSearchable: true },
    { iataCode: 'LGG', name: 'Liège Airport', city: 'Liège', country: 'Belgium', isSearchable: true },
    { iataCode: 'OST', name: 'Ostend-Bruges International Airport', city: 'Ostend', country: 'Belgium', isSearchable: true },

    // Denmark (Top 5)
    { iataCode: 'CPH', name: 'Copenhagen Airport', city: 'Copenhagen', country: 'Denmark', isSearchable: true },
    { iataCode: 'BLL', name: 'Billund Airport', city: 'Billund', country: 'Denmark', isSearchable: true },
    { iataCode: 'AAL', name: 'Aalborg Airport', city: 'Aalborg', country: 'Denmark', isSearchable: true },
    { iataCode: 'AAR', name: 'Aarhus Airport', city: 'Aarhus', country: 'Denmark', isSearchable: true },
    { iataCode: 'KRP', name: 'Karup Airport', city: 'Karup', country: 'Denmark', isSearchable: true },

    // Sweden (Top 10)
    { iataCode: 'ARN', name: 'Stockholm Arlanda Airport', city: 'Stockholm', country: 'Sweden', isSearchable: true },
    { iataCode: 'GOT', name: 'Gothenburg Landvetter Airport', city: 'Gothenburg', country: 'Sweden', isSearchable: true },
    { iataCode: 'MMX', name: 'Malmö Airport', city: 'Malmö', country: 'Sweden', isSearchable: true },
    { iataCode: 'BMA', name: 'Stockholm Bromma Airport', city: 'Stockholm', country: 'Sweden', isSearchable: true },
    { iataCode: 'LLA', name: 'Luleå Airport', city: 'Luleå', country: 'Sweden', isSearchable: true },
    { iataCode: 'UME', name: 'Umeå Airport', city: 'Umeå', country: 'Sweden', isSearchable: true },
    { iataCode: 'VBY', name: 'Visby Airport', city: 'Visby', country: 'Sweden', isSearchable: true },
    { iataCode: 'KID', name: 'Kristianstad Airport', city: 'Kristianstad', country: 'Sweden', isSearchable: true },
    { iataCode: 'RNB', name: 'Ronneby Airport', city: 'Ronneby', country: 'Sweden', isSearchable: true },
    { iataCode: 'VST', name: 'Stockholm Västerås Airport', city: 'Västerås', country: 'Sweden', isSearchable: true },

    // Norway (Top 10)
    { iataCode: 'OSL', name: 'Oslo Airport Gardermoen', city: 'Oslo', country: 'Norway', isSearchable: true },
    { iataCode: 'BGO', name: 'Bergen Airport Flesland', city: 'Bergen', country: 'Norway', isSearchable: true },
    { iataCode: 'SVG', name: 'Stavanger Airport Sola', city: 'Stavanger', country: 'Norway', isSearchable: true },
    { iataCode: 'TRD', name: 'Trondheim Airport Værnes', city: 'Trondheim', country: 'Norway', isSearchable: true },
    { iataCode: 'TOS', name: 'Tromsø Airport', city: 'Tromsø', country: 'Norway', isSearchable: true },
    { iataCode: 'BOO', name: 'Bodø Airport', city: 'Bodø', country: 'Norway', isSearchable: true },
    { iataCode: 'AES', name: 'Ålesund Airport', city: 'Ålesund', country: 'Norway', isSearchable: true },
    { iataCode: 'KRS', name: 'Kristiansand Airport', city: 'Kristiansand', country: 'Norway', isSearchable: true },
    { iataCode: 'HAU', name: 'Haugesund Airport', city: 'Haugesund', country: 'Norway', isSearchable: true },
    { iataCode: 'MOL', name: 'Molde Airport', city: 'Molde', country: 'Norway', isSearchable: true },

    // Finland (Top 10)
    { iataCode: 'HEL', name: 'Helsinki-Vantaa Airport', city: 'Helsinki', country: 'Finland', isSearchable: true },
    { iataCode: 'OUL', name: 'Oulu Airport', city: 'Oulu', country: 'Finland', isSearchable: true },
    { iataCode: 'TMP', name: 'Tampere-Pirkkala Airport', city: 'Tampere', country: 'Finland', isSearchable: true },
    { iataCode: 'RVN', name: 'Rovaniemi Airport', city: 'Rovaniemi', country: 'Finland', isSearchable: true },
    { iataCode: 'TKU', name: 'Turku Airport', city: 'Turku', country: 'Finland', isSearchable: true },
    { iataCode: 'KEM', name: 'Kemi-Tornio Airport', city: 'Kemi', country: 'Finland', isSearchable: true },
    { iataCode: 'KAJ', name: 'Kajaani Airport', city: 'Kajaani', country: 'Finland', isSearchable: true },
    { iataCode: 'IVL', name: 'Ivalo Airport', city: 'Ivalo', country: 'Finland', isSearchable: true },
    { iataCode: 'JYV', name: 'Jyväskylä Airport', city: 'Jyväskylä', country: 'Finland', isSearchable: true },
    { iataCode: 'VAA', name: 'Vaasa Airport', city: 'Vaasa', country: 'Finland', isSearchable: true },

    // Ireland (Top 5)
    { iataCode: 'DUB', name: 'Dublin Airport', city: 'Dublin', country: 'Ireland', isSearchable: true },
    { iataCode: 'ORK', name: 'Cork Airport', city: 'Cork', country: 'Ireland', isSearchable: true },
    { iataCode: 'SNN', name: 'Shannon Airport', city: 'Shannon', country: 'Ireland', isSearchable: true },
    { iataCode: 'NOC', name: 'Ireland West Airport Knock', city: 'Knock', country: 'Ireland', isSearchable: true },
    { iataCode: 'KIR', name: 'Kerry Airport', city: 'Kerry', country: 'Ireland', isSearchable: true },

    // Portugal (Top 10)
    { iataCode: 'LIS', name: 'Lisbon Portela Airport', city: 'Lisbon', country: 'Portugal', isSearchable: true },
    { iataCode: 'OPO', name: 'Porto Airport', city: 'Porto', country: 'Portugal', isSearchable: true },
    { iataCode: 'FAO', name: 'Faro Airport', city: 'Faro', country: 'Portugal', isSearchable: true },
    { iataCode: 'FNC', name: 'Funchal Madeira Airport', city: 'Funchal', country: 'Portugal', isSearchable: true },
    { iataCode: 'PDL', name: 'Ponta Delgada Airport', city: 'Ponta Delgada', country: 'Portugal', isSearchable: true },
    { iataCode: 'TER', name: 'Lajes Airport', city: 'Terceira', country: 'Portugal', isSearchable: true },
    { iataCode: 'HOR', name: 'Horta Airport', city: 'Horta', country: 'Portugal', isSearchable: true },
    { iataCode: 'BGC', name: 'Bragança Airport', city: 'Bragança', country: 'Portugal', isSearchable: true },
    { iataCode: 'CHV', name: 'Chaves Airport', city: 'Chaves', country: 'Portugal', isSearchable: true },
    { iataCode: 'SMA', name: 'Santa Maria Airport', city: 'Santa Maria', country: 'Portugal', isSearchable: true },

    // Greece (Top 10)
    { iataCode: 'ATH', name: 'Athens International Airport', city: 'Athens', country: 'Greece', isSearchable: true },
    { iataCode: 'HER', name: 'Heraklion International Airport', city: 'Heraklion', country: 'Greece', isSearchable: true },
    { iataCode: 'SKG', name: 'Thessaloniki Airport', city: 'Thessaloniki', country: 'Greece', isSearchable: true },
    { iataCode: 'RHO', name: 'Rhodes International Airport', city: 'Rhodes', country: 'Greece', isSearchable: true },
    { iataCode: 'CFU', name: 'Corfu International Airport', city: 'Corfu', country: 'Greece', isSearchable: true },
    { iataCode: 'CHQ', name: 'Chania International Airport', city: 'Chania', country: 'Greece', isSearchable: true },
    { iataCode: 'JTR', name: 'Santorini Airport', city: 'Santorini', country: 'Greece', isSearchable: true },
    { iataCode: 'KGS', name: 'Kos Island International Airport', city: 'Kos', country: 'Greece', isSearchable: true },
    { iataCode: 'ZTH', name: 'Zakynthos International Airport', city: 'Zakynthos', country: 'Greece', isSearchable: true },
    { iataCode: 'JMK', name: 'Mykonos Airport', city: 'Mykonos', country: 'Greece', isSearchable: true },

    // Poland (Top 10)
    { iataCode: 'WAW', name: 'Warsaw Chopin Airport', city: 'Warsaw', country: 'Poland', isSearchable: true },
    { iataCode: 'KRK', name: 'Kraków John Paul II Airport', city: 'Kraków', country: 'Poland', isSearchable: true },
    { iataCode: 'GDN', name: 'Gdańsk Lech Wałęsa Airport', city: 'Gdańsk', country: 'Poland', isSearchable: true },
    { iataCode: 'WMI', name: 'Warsaw Modlin Airport', city: 'Warsaw', country: 'Poland', isSearchable: true },
    { iataCode: 'KTW', name: 'Katowice Airport', city: 'Katowice', country: 'Poland', isSearchable: true },
    { iataCode: 'WRO', name: 'Wrocław Airport', city: 'Wrocław', country: 'Poland', isSearchable: true },
    { iataCode: 'POZ', name: 'Poznań-Ławica Airport', city: 'Poznań', country: 'Poland', isSearchable: true },
    { iataCode: 'RZE', name: 'Rzeszów-Jasionka Airport', city: 'Rzeszów', country: 'Poland', isSearchable: true },
    { iataCode: 'SZZ', name: 'Szczecin-Goleniów Airport', city: 'Szczecin', country: 'Poland', isSearchable: true },
    { iataCode: 'LUZ', name: 'Lublin Airport', city: 'Lublin', country: 'Poland', isSearchable: true },

    // Czech Republic (Top 5)
    { iataCode: 'PRG', name: 'Václav Havel Airport Prague', city: 'Prague', country: 'Czech Republic', isSearchable: true },
    { iataCode: 'BRQ', name: 'Brno-Tuřany Airport', city: 'Brno', country: 'Czech Republic', isSearchable: true },
    { iataCode: 'OSR', name: 'Ostrava Leoš Janáček Airport', city: 'Ostrava', country: 'Czech Republic', isSearchable: true },
    { iataCode: 'PED', name: 'Pardubice Airport', city: 'Pardubice', country: 'Czech Republic', isSearchable: true },
    { iataCode: 'KLV', name: 'Karlovy Vary Airport', city: 'Karlovy Vary', country: 'Czech Republic', isSearchable: true },

    // Hungary (Top 3)
    { iataCode: 'BUD', name: 'Budapest Ferenc Liszt International Airport', city: 'Budapest', country: 'Hungary', isSearchable: true },
    { iataCode: 'DEB', name: 'Debrecen International Airport', city: 'Debrecen', country: 'Hungary', isSearchable: true },
    { iataCode: 'SOB', name: 'Sármellék International Airport', city: 'Sármellék', country: 'Hungary', isSearchable: true },

    // Romania (Top 10)
    { iataCode: 'OTP', name: 'Henri Coandă International Airport', city: 'Bucharest', country: 'Romania', isSearchable: true },
    { iataCode: 'CLJ', name: 'Cluj-Napoca International Airport', city: 'Cluj-Napoca', country: 'Romania', isSearchable: true },
    { iataCode: 'TSR', name: 'Timișoara Traian Vuia Airport', city: 'Timișoara', country: 'Romania', isSearchable: true },
    { iataCode: 'IAS', name: 'Iași International Airport', city: 'Iași', country: 'Romania', isSearchable: true },
    { iataCode: 'SBZ', name: 'Sibiu International Airport', city: 'Sibiu', country: 'Romania', isSearchable: true },
    { iataCode: 'CRA', name: 'Craiova Airport', city: 'Craiova', country: 'Romania', isSearchable: true },
    { iataCode: 'OMR', name: 'Oradea International Airport', city: 'Oradea', country: 'Romania', isSearchable: true },
    { iataCode: 'BCM', name: 'Bacău Airport', city: 'Bacău', country: 'Romania', isSearchable: true },
    { iataCode: 'TGM', name: 'Târgu Mureș Airport', city: 'Târgu Mureș', country: 'Romania', isSearchable: true },
    { iataCode: 'SUJ', name: 'Satu Mare Airport', city: 'Satu Mare', country: 'Romania', isSearchable: true },

    // Bulgaria (Top 5)
    { iataCode: 'SOF', name: 'Sofia Airport', city: 'Sofia', country: 'Bulgaria', isSearchable: true },
    { iataCode: 'VAR', name: 'Varna Airport', city: 'Varna', country: 'Bulgaria', isSearchable: true },
    { iataCode: 'BOJ', name: 'Burgas Airport', city: 'Burgas', country: 'Bulgaria', isSearchable: true },
    { iataCode: 'PDV', name: 'Plovdiv Airport', city: 'Plovdiv', country: 'Bulgaria', isSearchable: true },
    { iataCode: 'GOZ', name: 'Gorna Oryahovitsa Airport', city: 'Gorna Oryahovitsa', country: 'Bulgaria', isSearchable: true },

    // Croatia (Top 8)
    { iataCode: 'ZAG', name: 'Zagreb Airport', city: 'Zagreb', country: 'Croatia', isSearchable: true },
    { iataCode: 'SPU', name: 'Split Airport', city: 'Split', country: 'Croatia', isSearchable: true },
    { iataCode: 'DBV', name: 'Dubrovnik Airport', city: 'Dubrovnik', country: 'Croatia', isSearchable: true },
    { iataCode: 'PUY', name: 'Pula Airport', city: 'Pula', country: 'Croatia', isSearchable: true },
    { iataCode: 'ZAD', name: 'Zadar Airport', city: 'Zadar', country: 'Croatia', isSearchable: true },
    { iataCode: 'RJK', name: 'Rijeka Airport', city: 'Rijeka', country: 'Croatia', isSearchable: true },
    { iataCode: 'OSI', name: 'Osijek Airport', city: 'Osijek', country: 'Croatia', isSearchable: true },
    { iataCode: 'BWK', name: 'Bol Airport', city: 'Bol', country: 'Croatia', isSearchable: true },

    // Turkey (Top 10)
    { iataCode: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey', isSearchable: true },
    { iataCode: 'SAW', name: 'Sabiha Gökçen International Airport', city: 'Istanbul', country: 'Turkey', isSearchable: true },
    { iataCode: 'AYT', name: 'Antalya Airport', city: 'Antalya', country: 'Turkey', isSearchable: true },
    { iataCode: 'ESB', name: 'Esenboğa International Airport', city: 'Ankara', country: 'Turkey', isSearchable: true },
    { iataCode: 'ADB', name: 'Adnan Menderes Airport', city: 'İzmir', country: 'Turkey', isSearchable: true },
    { iataCode: 'DLM', name: 'Dalaman Airport', city: 'Dalaman', country: 'Turkey', isSearchable: true },
    { iataCode: 'BJV', name: 'Bodrum Airport', city: 'Bodrum', country: 'Turkey', isSearchable: true },
    { iataCode: 'ADA', name: 'Adana Airport', city: 'Adana', country: 'Turkey', isSearchable: true },
    { iataCode: 'GZT', name: 'Gaziantep Airport', city: 'Gaziantep', country: 'Turkey', isSearchable: true },
    { iataCode: 'TZX', name: 'Trabzon Airport', city: 'Trabzon', country: 'Turkey', isSearchable: true },

    // Iceland (Top 2)
    { iataCode: 'KEF', name: 'Keflavík International Airport', city: 'Reykjavik', country: 'Iceland', isSearchable: true },
    { iataCode: 'RKV', name: 'Reykjavík Airport', city: 'Reykjavik', country: 'Iceland', isSearchable: true },

    // Luxembourg (Top 1)
    { iataCode: 'LUX', name: 'Luxembourg Airport', city: 'Luxembourg City', country: 'Luxembourg', isSearchable: true },

    // Malta (Top 1)
    { iataCode: 'MLA', name: 'Malta International Airport', city: 'Valletta', country: 'Malta', isSearchable: true },

    // Cyprus (Top 2)
    { iataCode: 'LCA', name: 'Larnaca International Airport', city: 'Larnaca', country: 'Cyprus', isSearchable: true },
    { iataCode: 'PFO', name: 'Paphos International Airport', city: 'Paphos', country: 'Cyprus', isSearchable: true },

    // Estonia (Top 1)
    { iataCode: 'TLL', name: 'Tallinn Airport', city: 'Tallinn', country: 'Estonia', isSearchable: true },

    // Latvia (Top 1)
    { iataCode: 'RIX', name: 'Riga International Airport', city: 'Riga', country: 'Latvia', isSearchable: true },

    // Lithuania (Top 3)
    { iataCode: 'VNO', name: 'Vilnius Airport', city: 'Vilnius', country: 'Lithuania', isSearchable: true },
    { iataCode: 'KUN', name: 'Kaunas Airport', city: 'Kaunas', country: 'Lithuania', isSearchable: true },
    { iataCode: 'PLQ', name: 'Palanga International Airport', city: 'Palanga', country: 'Lithuania', isSearchable: true },

    // Slovakia (Top 2)
    { iataCode: 'BTS', name: 'Bratislava Airport', city: 'Bratislava', country: 'Slovakia', isSearchable: true },
    { iataCode: 'KSC', name: 'Košice International Airport', city: 'Košice', country: 'Slovakia', isSearchable: true },

    // Slovenia (Top 1)
    { iataCode: 'LJU', name: 'Ljubljana Jože Pučnik Airport', city: 'Ljubljana', country: 'Slovenia', isSearchable: true },

    // Serbia (Top 2)
    { iataCode: 'BEG', name: 'Belgrade Nikola Tesla Airport', city: 'Belgrade', country: 'Serbia', isSearchable: true },
    { iataCode: 'INI', name: 'Niš Constantine the Great Airport', city: 'Niš', country: 'Serbia', isSearchable: true },

    // Africa - Morocco & Kenya
    { iataCode: 'CMN', name: 'Mohammed V International Airport', city: 'Casablanca', country: 'Morocco', isSearchable: true },
    { iataCode: 'NBO', name: 'Jomo Kenyatta International Airport', city: 'Nairobi', country: 'Kenya', isSearchable: true },

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
    { iataCode: 'SGN', name: 'Tan Son Nhat International Airport', city: 'Ho Chi Minh City', country: 'Vietnam', isSearchable: true },
    { iataCode: 'HAN', name: 'Noi Bai International Airport', city: 'Hanoi', country: 'Vietnam', isSearchable: true },
    { iataCode: 'KIX', name: 'Kansai International Airport', city: 'Osaka', country: 'Japan', isSearchable: true },
    { iataCode: 'CTS', name: 'New Chitose Airport', city: 'Sapporo', country: 'Japan', isSearchable: true },
    { iataCode: 'BNE', name: 'Brisbane Airport', city: 'Brisbane', country: 'Australia', isSearchable: true },
    { iataCode: 'PER', name: 'Perth Airport', city: 'Perth', country: 'Australia', isSearchable: true },

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
    { airportCode: 'BOG', cityName: 'Bogotá', countryName: 'Colombia', description: 'High-altitude capital with colonial charm and vibrant culture', popularityScore: 7.8 },
    { airportCode: 'LIM', cityName: 'Lima', countryName: 'Peru', description: 'Culinary capital with Pacific coast views and historic center', popularityScore: 8.2 },
    { airportCode: 'SCL', cityName: 'Santiago', countryName: 'Chile', description: 'Modern city surrounded by Andes mountains', popularityScore: 7.9 },

    // More Europe
    { airportCode: 'BER', cityName: 'Berlin', countryName: 'Germany', description: 'Creative capital with rich history and underground scene', popularityScore: 9.1 },
    { airportCode: 'MUC', cityName: 'Munich', countryName: 'Germany', description: 'Bavarian beer halls, historic sites, and Alpine gateway', popularityScore: 8.6 },
    { airportCode: 'MXP', cityName: 'Milan', countryName: 'Italy', description: 'Fashion capital with gothic cathedral and design scene', popularityScore: 8.9 },
    { airportCode: 'VIE', cityName: 'Vienna', countryName: 'Austria', description: 'Imperial palaces, classical music, and coffeehouse culture', popularityScore: 8.8 },
    { airportCode: 'CPH', cityName: 'Copenhagen', countryName: 'Denmark', description: 'Scandinavian design, hygge lifestyle, and harbor beauty', popularityScore: 8.7 },
    { airportCode: 'ARN', cityName: 'Stockholm', countryName: 'Sweden', description: 'Archipelago city with Nordic elegance and innovation', popularityScore: 8.5 },
    { airportCode: 'OSL', cityName: 'Oslo', countryName: 'Norway', description: 'Fjord gateway with modern architecture and outdoor culture', popularityScore: 8.3 },
    { airportCode: 'BRU', cityName: 'Brussels', countryName: 'Belgium', description: 'European capital with grand squares and chocolate shops', popularityScore: 7.9 },
    { airportCode: 'MAD', cityName: 'Madrid', countryName: 'Spain', description: 'Royal city with world-class museums and tapas culture', popularityScore: 8.8 },
    { airportCode: 'EDI', cityName: 'Edinburgh', countryName: 'United Kingdom', description: 'Medieval fortress city with festivals and whisky heritage', popularityScore: 8.6 },
    { airportCode: 'KEF', cityName: 'Reykjavik', countryName: 'Iceland', description: 'Northern lights, geothermal pools, and Viking heritage', popularityScore: 8.7 },
    { airportCode: 'WAW', cityName: 'Warsaw', countryName: 'Poland', description: 'Rebuilt capital with resilient spirit and emerging culture', popularityScore: 7.7 },
    { airportCode: 'BUD', cityName: 'Budapest', countryName: 'Hungary', description: 'Danube jewel with thermal baths and ruin bars', popularityScore: 8.5 },

    // More Asia-Pacific
    { airportCode: 'KUL', cityName: 'Kuala Lumpur', countryName: 'Malaysia', description: 'Petronas Towers, street food paradise, and tropical energy', popularityScore: 8.2 },
    { airportCode: 'MNL', cityName: 'Manila', countryName: 'Philippines', description: 'Bustling metropolis with Spanish heritage and island access', popularityScore: 7.6 },
    { airportCode: 'CGK', cityName: 'Jakarta', countryName: 'Indonesia', description: 'Megacity gateway to Indonesian archipelago', popularityScore: 7.5 },
    { airportCode: 'TPE', cityName: 'Taipei', countryName: 'Taiwan', description: 'Night markets, hot springs, and modern Asian hub', popularityScore: 8.4 },
    { airportCode: 'SGN', cityName: 'Ho Chi Minh City', countryName: 'Vietnam', description: 'Dynamic city with French colonial heritage and street life', popularityScore: 8.1 },
    { airportCode: 'HAN', cityName: 'Hanoi', countryName: 'Vietnam', description: 'Ancient capital with lakes, temples, and old quarter charm', popularityScore: 8.0 },
    { airportCode: 'KIX', cityName: 'Osaka', countryName: 'Japan', description: 'Food capital with neon streets and castle history', popularityScore: 8.5 },
    { airportCode: 'DOH', cityName: 'Doha', countryName: 'Qatar', description: 'Futuristic skyline meets traditional souks', popularityScore: 7.9 },
    { airportCode: 'AUH', cityName: 'Abu Dhabi', countryName: 'United Arab Emirates', description: 'Grand mosques, cultural district, and desert luxury', popularityScore: 8.0 },
    { airportCode: 'AKL', cityName: 'Auckland', countryName: 'New Zealand', description: 'City of sails with volcanic harbors and Maori culture', popularityScore: 8.3 },
    { airportCode: 'BNE', cityName: 'Brisbane', countryName: 'Australia', description: 'Subtropical capital with river walks and laid-back vibe', popularityScore: 7.8 },

    // More North America
    { airportCode: 'ORD', cityName: 'Chicago', countryName: 'United States', description: 'Architectural marvel with deep-dish pizza and lakefront beauty', popularityScore: 8.9 },
    { airportCode: 'BOS', cityName: 'Boston', countryName: 'United States', description: 'Historic city with Freedom Trail and university culture', popularityScore: 8.4 },
    { airportCode: 'SEA', cityName: 'Seattle', countryName: 'United States', description: 'Emerald city with coffee culture and tech innovation', popularityScore: 8.5 },
    { airportCode: 'YUL', cityName: 'Montreal', countryName: 'Canada', description: 'European flair in North America with festivals and food', popularityScore: 8.6 },
  ]

  for (const destination of destinations) {
    const countryId = countryMap[destination.countryName]
    if (!countryId) {
      console.warn(`⚠️  Country not found for ${destination.cityName}: ${destination.countryName}`)
      continue
    }

    // Check if destination already exists
    let dest = await prisma.destination.findFirst({
      where: {
        cityName: destination.cityName,
        countryId: countryId
      }
    })

    // Create if doesn't exist
    if (!dest) {
      dest = await prisma.destination.create({
        data: {
          cityName: destination.cityName,
          countryId: countryId,
          countryName: destination.countryName,
          description: destination.description,
          popularityScore: destination.popularityScore
        }
      })
    }

    // Link airport to destination via DestinationAirport junction table
    const existingLink = await prisma.destinationAirport.findFirst({
      where: {
        destinationId: dest.id,
        airportCode: destination.airportCode
      }
    })

    if (!existingLink) {
      await prisma.destinationAirport.create({
        data: {
          destinationId: dest.id,
          airportCode: destination.airportCode,
          isPrimary: true
        }
      })
    }
  }

  console.log(`✅ Created ${destinations.length} destinations`)

  // POIs should be manually curated via admin panel for quality
  console.log('⏭️  Skipping POI creation (manual curation required)')

  // Create comprehensive flight routes
  console.log('🛫 Creating flight routes...')

  const routes = [
    // US Domestic Routes
    { originAirportCode: 'JFK', destinationAirportCode: 'LAX', totalDurationMinutes: 360 },
    { originAirportCode: 'JFK', destinationAirportCode: 'SFO', totalDurationMinutes: 390 },
    { originAirportCode: 'JFK', destinationAirportCode: 'MIA', totalDurationMinutes: 190 },
    { originAirportCode: 'JFK', destinationAirportCode: 'ORD', totalDurationMinutes: 155 },
    { originAirportCode: 'JFK', destinationAirportCode: 'BOS', totalDurationMinutes: 75 },
    { originAirportCode: 'JFK', destinationAirportCode: 'SEA', totalDurationMinutes: 355 },
    { originAirportCode: 'LAX', destinationAirportCode: 'JFK', totalDurationMinutes: 320 },
    { originAirportCode: 'LAX', destinationAirportCode: 'SFO', totalDurationMinutes: 85 },
    { originAirportCode: 'LAX', destinationAirportCode: 'LAS', totalDurationMinutes: 70 },
    { originAirportCode: 'LAX', destinationAirportCode: 'SEA', totalDurationMinutes: 170 },
    { originAirportCode: 'LAX', destinationAirportCode: 'ORD', totalDurationMinutes: 260 },
    { originAirportCode: 'SFO', destinationAirportCode: 'LAX', totalDurationMinutes: 85 },
    { originAirportCode: 'SFO', destinationAirportCode: 'JFK', totalDurationMinutes: 330 },
    { originAirportCode: 'SFO', destinationAirportCode: 'SEA', totalDurationMinutes: 125 },
    { originAirportCode: 'SFO', destinationAirportCode: 'ORD', totalDurationMinutes: 270 },
    { originAirportCode: 'ORD', destinationAirportCode: 'JFK', totalDurationMinutes: 150 },
    { originAirportCode: 'ORD', destinationAirportCode: 'LAX', totalDurationMinutes: 270 },
    { originAirportCode: 'ORD', destinationAirportCode: 'SFO', totalDurationMinutes: 280 },
    { originAirportCode: 'BOS', destinationAirportCode: 'JFK', totalDurationMinutes: 70 },
    { originAirportCode: 'BOS', destinationAirportCode: 'MIA', totalDurationMinutes: 200 },
    { originAirportCode: 'SEA', destinationAirportCode: 'SFO', totalDurationMinutes: 120 },
    { originAirportCode: 'SEA', destinationAirportCode: 'LAX', totalDurationMinutes: 165 },
    { originAirportCode: 'MIA', destinationAirportCode: 'JFK', totalDurationMinutes: 185 },
    { originAirportCode: 'MIA', destinationAirportCode: 'BOS', totalDurationMinutes: 195 },

    // Transatlantic Routes
    { originAirportCode: 'JFK', destinationAirportCode: 'LHR', totalDurationMinutes: 420 },
    { originAirportCode: 'JFK', destinationAirportCode: 'CDG', totalDurationMinutes: 450 },
    { originAirportCode: 'JFK', destinationAirportCode: 'FCO', totalDurationMinutes: 510 },
    { originAirportCode: 'JFK', destinationAirportCode: 'BCN', totalDurationMinutes: 480 },
    { originAirportCode: 'JFK', destinationAirportCode: 'AMS', totalDurationMinutes: 440 },
    { originAirportCode: 'JFK', destinationAirportCode: 'BER', totalDurationMinutes: 470 },
    { originAirportCode: 'LAX', destinationAirportCode: 'LHR', totalDurationMinutes: 650 },
    { originAirportCode: 'LAX', destinationAirportCode: 'CDG', totalDurationMinutes: 670 },
    { originAirportCode: 'SFO', destinationAirportCode: 'LHR', totalDurationMinutes: 630 },
    { originAirportCode: 'SFO', destinationAirportCode: 'CDG', totalDurationMinutes: 650 },
    { originAirportCode: 'BOS', destinationAirportCode: 'LHR', totalDurationMinutes: 400 },
    { originAirportCode: 'BOS', destinationAirportCode: 'CDG', totalDurationMinutes: 420 },
    { originAirportCode: 'ORD', destinationAirportCode: 'LHR', totalDurationMinutes: 470 },
    { originAirportCode: 'LHR', destinationAirportCode: 'JFK', totalDurationMinutes: 480 },
    { originAirportCode: 'LHR', destinationAirportCode: 'LAX', totalDurationMinutes: 670 },
    { originAirportCode: 'LHR', destinationAirportCode: 'BOS', totalDurationMinutes: 420 },
    { originAirportCode: 'CDG', destinationAirportCode: 'JFK', totalDurationMinutes: 490 },
    { originAirportCode: 'CDG', destinationAirportCode: 'LAX', totalDurationMinutes: 690 },

    // European Routes - Intra-Europe (40+ routes)
    { originAirportCode: 'LHR', destinationAirportCode: 'CDG', totalDurationMinutes: 75 },
    { originAirportCode: 'LHR', destinationAirportCode: 'BCN', totalDurationMinutes: 140 },
    { originAirportCode: 'LHR', destinationAirportCode: 'FCO', totalDurationMinutes: 155 },
    { originAirportCode: 'LHR', destinationAirportCode: 'AMS', totalDurationMinutes: 65 },
    { originAirportCode: 'LHR', destinationAirportCode: 'DUB', totalDurationMinutes: 80 },
    { originAirportCode: 'LHR', destinationAirportCode: 'BER', totalDurationMinutes: 105 },
    { originAirportCode: 'LHR', destinationAirportCode: 'MUC', totalDurationMinutes: 115 },
    { originAirportCode: 'LHR', destinationAirportCode: 'VIE', totalDurationMinutes: 135 },
    { originAirportCode: 'LHR', destinationAirportCode: 'PRG', totalDurationMinutes: 125 },
    { originAirportCode: 'LHR', destinationAirportCode: 'IST', totalDurationMinutes: 235 },
    { originAirportCode: 'LHR', destinationAirportCode: 'ATH', totalDurationMinutes: 215 },
    { originAirportCode: 'LHR', destinationAirportCode: 'CPH', totalDurationMinutes: 110 },
    { originAirportCode: 'LHR', destinationAirportCode: 'ARN', totalDurationMinutes: 145 },
    { originAirportCode: 'LHR', destinationAirportCode: 'OSL', totalDurationMinutes: 135 },
    { originAirportCode: 'CDG', destinationAirportCode: 'LHR', totalDurationMinutes: 75 },
    { originAirportCode: 'CDG', destinationAirportCode: 'BCN', totalDurationMinutes: 110 },
    { originAirportCode: 'CDG', destinationAirportCode: 'FCO', totalDurationMinutes: 120 },
    { originAirportCode: 'CDG', destinationAirportCode: 'AMS', totalDurationMinutes: 70 },
    { originAirportCode: 'CDG', destinationAirportCode: 'BER', totalDurationMinutes: 105 },
    { originAirportCode: 'CDG', destinationAirportCode: 'MUC', totalDurationMinutes: 100 },
    { originAirportCode: 'CDG', destinationAirportCode: 'VIE', totalDurationMinutes: 125 },
    { originAirportCode: 'CDG', destinationAirportCode: 'MAD', totalDurationMinutes: 125 },
    { originAirportCode: 'CDG', destinationAirportCode: 'LIS', totalDurationMinutes: 145 },
    { originAirportCode: 'AMS', destinationAirportCode: 'LHR', totalDurationMinutes: 65 },
    { originAirportCode: 'AMS', destinationAirportCode: 'CDG', totalDurationMinutes: 70 },
    { originAirportCode: 'AMS', destinationAirportCode: 'BCN', totalDurationMinutes: 135 },
    { originAirportCode: 'AMS', destinationAirportCode: 'BER', totalDurationMinutes: 80 },
    { originAirportCode: 'AMS', destinationAirportCode: 'CPH', totalDurationMinutes: 85 },
    { originAirportCode: 'BER', destinationAirportCode: 'LHR', totalDurationMinutes: 110 },
    { originAirportCode: 'BER', destinationAirportCode: 'CDG', totalDurationMinutes: 105 },
    { originAirportCode: 'BER', destinationAirportCode: 'AMS', totalDurationMinutes: 80 },
    { originAirportCode: 'BER', destinationAirportCode: 'MUC', totalDurationMinutes: 70 },
    { originAirportCode: 'BER', destinationAirportCode: 'VIE', totalDurationMinutes: 80 },
    { originAirportCode: 'BER', destinationAirportCode: 'PRG', totalDurationMinutes: 65 },
    { originAirportCode: 'BER', destinationAirportCode: 'WAW', totalDurationMinutes: 70 },
    { originAirportCode: 'BCN', destinationAirportCode: 'LHR', totalDurationMinutes: 140 },
    { originAirportCode: 'BCN', destinationAirportCode: 'CDG', totalDurationMinutes: 115 },
    { originAirportCode: 'BCN', destinationAirportCode: 'FCO', totalDurationMinutes: 110 },
    { originAirportCode: 'BCN', destinationAirportCode: 'AMS', totalDurationMinutes: 135 },
    { originAirportCode: 'BCN', destinationAirportCode: 'MAD', totalDurationMinutes: 80 },
    { originAirportCode: 'BCN', destinationAirportCode: 'LIS', totalDurationMinutes: 125 },
    { originAirportCode: 'FCO', destinationAirportCode: 'LHR', totalDurationMinutes: 160 },
    { originAirportCode: 'FCO', destinationAirportCode: 'CDG', totalDurationMinutes: 125 },
    { originAirportCode: 'FCO', destinationAirportCode: 'BCN', totalDurationMinutes: 115 },
    { originAirportCode: 'FCO', destinationAirportCode: 'MXP', totalDurationMinutes: 65 },
    { originAirportCode: 'FCO', destinationAirportCode: 'VIE', totalDurationMinutes: 95 },
    { originAirportCode: 'FCO', destinationAirportCode: 'ATH', totalDurationMinutes: 125 },
    { originAirportCode: 'MUC', destinationAirportCode: 'BER', totalDurationMinutes: 70 },
    { originAirportCode: 'MUC', destinationAirportCode: 'VIE', totalDurationMinutes: 55 },
    { originAirportCode: 'MUC', destinationAirportCode: 'ZRH', totalDurationMinutes: 55 },
    { originAirportCode: 'MUC', destinationAirportCode: 'LHR', totalDurationMinutes: 120 },
    { originAirportCode: 'VIE', destinationAirportCode: 'MUC', totalDurationMinutes: 55 },
    { originAirportCode: 'VIE', destinationAirportCode: 'BER', totalDurationMinutes: 80 },
    { originAirportCode: 'VIE', destinationAirportCode: 'PRG', totalDurationMinutes: 55 },
    { originAirportCode: 'VIE', destinationAirportCode: 'BUD', totalDurationMinutes: 50 },
    { originAirportCode: 'CPH', destinationAirportCode: 'LHR', totalDurationMinutes: 115 },
    { originAirportCode: 'CPH', destinationAirportCode: 'AMS', totalDurationMinutes: 90 },
    { originAirportCode: 'CPH', destinationAirportCode: 'BER', totalDurationMinutes: 75 },
    { originAirportCode: 'CPH', destinationAirportCode: 'ARN', totalDurationMinutes: 70 },
    { originAirportCode: 'CPH', destinationAirportCode: 'OSL', totalDurationMinutes: 80 },
    { originAirportCode: 'IST', destinationAirportCode: 'LHR', totalDurationMinutes: 245 },
    { originAirportCode: 'IST', destinationAirportCode: 'CDG', totalDurationMinutes: 230 },
    { originAirportCode: 'IST', destinationAirportCode: 'FCO', totalDurationMinutes: 165 },
    { originAirportCode: 'IST', destinationAirportCode: 'ATH', totalDurationMinutes: 90 },
    { originAirportCode: 'DUB', destinationAirportCode: 'LHR', totalDurationMinutes: 80 },
    { originAirportCode: 'DUB', destinationAirportCode: 'CDG', totalDurationMinutes: 115 },
    { originAirportCode: 'DUB', destinationAirportCode: 'AMS', totalDurationMinutes: 105 },
    { originAirportCode: 'PRG', destinationAirportCode: 'LHR', totalDurationMinutes: 130 },
    { originAirportCode: 'PRG', destinationAirportCode: 'CDG', totalDurationMinutes: 110 },
    { originAirportCode: 'PRG', destinationAirportCode: 'BER', totalDurationMinutes: 65 },
    { originAirportCode: 'PRG', destinationAirportCode: 'VIE', totalDurationMinutes: 55 },

    // Asia Routes - Intra-Asia (30+ routes)
    { originAirportCode: 'NRT', destinationAirportCode: 'SIN', totalDurationMinutes: 420 },
    { originAirportCode: 'NRT', destinationAirportCode: 'HKG', totalDurationMinutes: 270 },
    { originAirportCode: 'NRT', destinationAirportCode: 'ICN', totalDurationMinutes: 145 },
    { originAirportCode: 'NRT', destinationAirportCode: 'BKK', totalDurationMinutes: 400 },
    { originAirportCode: 'NRT', destinationAirportCode: 'TPE', totalDurationMinutes: 220 },
    { originAirportCode: 'NRT', destinationAirportCode: 'KIX', totalDurationMinutes: 80 },
    { originAirportCode: 'HND', destinationAirportCode: 'ICN', totalDurationMinutes: 140 },
    { originAirportCode: 'HND', destinationAirportCode: 'HKG', totalDurationMinutes: 265 },
    { originAirportCode: 'HND', destinationAirportCode: 'SIN', totalDurationMinutes: 415 },
    { originAirportCode: 'ICN', destinationAirportCode: 'NRT', totalDurationMinutes: 150 },
    { originAirportCode: 'ICN', destinationAirportCode: 'HKG', totalDurationMinutes: 210 },
    { originAirportCode: 'ICN', destinationAirportCode: 'SIN', totalDurationMinutes: 365 },
    { originAirportCode: 'ICN', destinationAirportCode: 'BKK', totalDurationMinutes: 335 },
    { originAirportCode: 'ICN', destinationAirportCode: 'TPE', totalDurationMinutes: 155 },
    { originAirportCode: 'SIN', destinationAirportCode: 'BKK', totalDurationMinutes: 145 },
    { originAirportCode: 'SIN', destinationAirportCode: 'SYD', totalDurationMinutes: 480 },
    { originAirportCode: 'SIN', destinationAirportCode: 'HKG', totalDurationMinutes: 240 },
    { originAirportCode: 'SIN', destinationAirportCode: 'KUL', totalDurationMinutes: 60 },
    { originAirportCode: 'SIN', destinationAirportCode: 'CGK', totalDurationMinutes: 110 },
    { originAirportCode: 'SIN', destinationAirportCode: 'MNL', totalDurationMinutes: 215 },
    { originAirportCode: 'SIN', destinationAirportCode: 'NRT', totalDurationMinutes: 430 },
    { originAirportCode: 'HKG', destinationAirportCode: 'SIN', totalDurationMinutes: 235 },
    { originAirportCode: 'HKG', destinationAirportCode: 'NRT', totalDurationMinutes: 280 },
    { originAirportCode: 'HKG', destinationAirportCode: 'ICN', totalDurationMinutes: 215 },
    { originAirportCode: 'HKG', destinationAirportCode: 'BKK', totalDurationMinutes: 165 },
    { originAirportCode: 'HKG', destinationAirportCode: 'TPE', totalDurationMinutes: 105 },
    { originAirportCode: 'BKK', destinationAirportCode: 'SIN', totalDurationMinutes: 140 },
    { originAirportCode: 'BKK', destinationAirportCode: 'HKG', totalDurationMinutes: 170 },
    { originAirportCode: 'BKK', destinationAirportCode: 'KUL', totalDurationMinutes: 135 },
    { originAirportCode: 'BKK', destinationAirportCode: 'HAN', totalDurationMinutes: 125 },
    { originAirportCode: 'BKK', destinationAirportCode: 'SGN', totalDurationMinutes: 90 },
    { originAirportCode: 'KUL', destinationAirportCode: 'SIN', totalDurationMinutes: 60 },
    { originAirportCode: 'KUL', destinationAirportCode: 'BKK', totalDurationMinutes: 140 },
    { originAirportCode: 'KUL', destinationAirportCode: 'CGK', totalDurationMinutes: 125 },
    { originAirportCode: 'TPE', destinationAirportCode: 'HKG', totalDurationMinutes: 100 },
    { originAirportCode: 'TPE', destinationAirportCode: 'NRT', totalDurationMinutes: 225 },
    { originAirportCode: 'TPE', destinationAirportCode: 'ICN', totalDurationMinutes: 160 },
    { originAirportCode: 'DXB', destinationAirportCode: 'BKK', totalDurationMinutes: 385 },
    { originAirportCode: 'DXB', destinationAirportCode: 'SIN', totalDurationMinutes: 445 },
    { originAirportCode: 'DXB', destinationAirportCode: 'BOM', totalDurationMinutes: 195 },
    { originAirportCode: 'DXB', destinationAirportCode: 'DEL', totalDurationMinutes: 210 },
    { originAirportCode: 'DOH', destinationAirportCode: 'BKK', totalDurationMinutes: 390 },
    { originAirportCode: 'DOH', destinationAirportCode: 'SIN', totalDurationMinutes: 450 },

    // Long-haul Routes (Intercontinental)
    { originAirportCode: 'LAX', destinationAirportCode: 'NRT', totalDurationMinutes: 720 },
    { originAirportCode: 'LAX', destinationAirportCode: 'SYD', totalDurationMinutes: 850 },
    { originAirportCode: 'LAX', destinationAirportCode: 'HKG', totalDurationMinutes: 870 },
    { originAirportCode: 'SFO', destinationAirportCode: 'NRT', totalDurationMinutes: 660 },
    { originAirportCode: 'SFO', destinationAirportCode: 'HKG', totalDurationMinutes: 840 },
    { originAirportCode: 'SFO', destinationAirportCode: 'SIN', totalDurationMinutes: 1020 },
    { originAirportCode: 'LHR', destinationAirportCode: 'DXB', totalDurationMinutes: 420 },
    { originAirportCode: 'LHR', destinationAirportCode: 'SIN', totalDurationMinutes: 780 },
    { originAirportCode: 'LHR', destinationAirportCode: 'HKG', totalDurationMinutes: 720 },
    { originAirportCode: 'LHR', destinationAirportCode: 'SYD', totalDurationMinutes: 1290 },
    { originAirportCode: 'DXB', destinationAirportCode: 'LHR', totalDurationMinutes: 450 },
    { originAirportCode: 'DXB', destinationAirportCode: 'JFK', totalDurationMinutes: 840 },
    { originAirportCode: 'CDG', destinationAirportCode: 'DXB', totalDurationMinutes: 410 },
    { originAirportCode: 'CDG', destinationAirportCode: 'SIN', totalDurationMinutes: 795 },
    { originAirportCode: 'NRT', destinationAirportCode: 'LAX', totalDurationMinutes: 630 },
    { originAirportCode: 'NRT', destinationAirportCode: 'SFO', totalDurationMinutes: 585 },
    { originAirportCode: 'SYD', destinationAirportCode: 'LAX', totalDurationMinutes: 780 },
    { originAirportCode: 'SYD', destinationAirportCode: 'SIN', totalDurationMinutes: 490 },

    // Southern Hemisphere & Americas
    { originAirportCode: 'GRU', destinationAirportCode: 'GIG', totalDurationMinutes: 55 },
    { originAirportCode: 'GRU', destinationAirportCode: 'EZE', totalDurationMinutes: 190 },
    { originAirportCode: 'GRU', destinationAirportCode: 'BOG', totalDurationMinutes: 360 },
    { originAirportCode: 'GRU', destinationAirportCode: 'LIM', totalDurationMinutes: 305 },
    { originAirportCode: 'GIG', destinationAirportCode: 'GRU', totalDurationMinutes: 55 },
    { originAirportCode: 'GIG', destinationAirportCode: 'EZE', totalDurationMinutes: 200 },
    { originAirportCode: 'EZE', destinationAirportCode: 'GRU', totalDurationMinutes: 195 },
    { originAirportCode: 'EZE', destinationAirportCode: 'SCL', totalDurationMinutes: 135 },
    { originAirportCode: 'MEX', destinationAirportCode: 'CUN', totalDurationMinutes: 130 },
    { originAirportCode: 'MEX', destinationAirportCode: 'BOG', totalDurationMinutes: 280 },
    { originAirportCode: 'MEX', destinationAirportCode: 'LIM', totalDurationMinutes: 350 },
    { originAirportCode: 'YYZ', destinationAirportCode: 'YVR', totalDurationMinutes: 280 },
    { originAirportCode: 'YYZ', destinationAirportCode: 'YUL', totalDurationMinutes: 90 },
    { originAirportCode: 'YVR', destinationAirportCode: 'YYZ', totalDurationMinutes: 275 },
    { originAirportCode: 'SYD', destinationAirportCode: 'MEL', totalDurationMinutes: 85 },
    { originAirportCode: 'SYD', destinationAirportCode: 'BNE', totalDurationMinutes: 95 },
    { originAirportCode: 'SYD', destinationAirportCode: 'AKL', totalDurationMinutes: 185 },
    { originAirportCode: 'MEL', destinationAirportCode: 'SYD', totalDurationMinutes: 85 },
    { originAirportCode: 'CPT', destinationAirportCode: 'JNB', totalDurationMinutes: 125 },
    { originAirportCode: 'JNB', destinationAirportCode: 'CPT', totalDurationMinutes: 125 },
    { originAirportCode: 'CAI', destinationAirportCode: 'DXB', totalDurationMinutes: 215 },
    { originAirportCode: 'CAI', destinationAirportCode: 'IST', totalDurationMinutes: 180 },
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
