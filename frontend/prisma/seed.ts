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
    { name: 'Saudi Arabia', code: 'SA' },
    { name: 'Israel', code: 'IL' },
    { name: 'Jordan', code: 'JO' },
    { name: 'Oman', code: 'OM' },
    { name: 'Kuwait', code: 'KW' },
    { name: 'Bahrain', code: 'BH' },
    { name: 'Lebanon', code: 'LB' },
    { name: 'Armenia', code: 'AM' },
    { name: 'Georgia', code: 'GE' },

    // South America
    { name: 'Brazil', code: 'BR' },
    { name: 'Argentina', code: 'AR' },
    { name: 'Colombia', code: 'CO' },
    { name: 'Peru', code: 'PE' },
    { name: 'Chile', code: 'CL' },
    { name: 'Ecuador', code: 'EC' },
    { name: 'Uruguay', code: 'UY' },
    { name: 'Paraguay', code: 'PY' },
    { name: 'Bolivia', code: 'BO' },
    { name: 'Suriname', code: 'SR' },
    { name: 'Guyana', code: 'GY' },

    // Africa
    { name: 'South Africa', code: 'ZA' },
    { name: 'Egypt', code: 'EG' },
    { name: 'Morocco', code: 'MA' },
    { name: 'Kenya', code: 'KE' },
    { name: 'Ethiopia', code: 'ET' },
    { name: 'Algeria', code: 'DZ' },
    { name: 'Tunisia', code: 'TN' },
    { name: 'Tanzania', code: 'TZ' },
    { name: 'Uganda', code: 'UG' },
    { name: 'Rwanda', code: 'RW' },
    { name: 'Zimbabwe', code: 'ZW' },
    { name: 'Namibia', code: 'NA' },
    { name: 'Botswana', code: 'BW' },
    { name: 'Mauritius', code: 'MU' },
    { name: 'Seychelles', code: 'SC' },
    { name: 'Nigeria', code: 'NG' },
    { name: 'Ghana', code: 'GH' },
    { name: 'Senegal', code: 'SN' },
    { name: 'Ivory Coast', code: 'CI' },

    // Caribbean
    { name: 'Puerto Rico', code: 'PR' },
    { name: 'Dominican Republic', code: 'DO' },
    { name: 'Jamaica', code: 'JM' },
    { name: 'Aruba', code: 'AW' },
    { name: 'Curaçao', code: 'CW' },
    { name: 'Barbados', code: 'BB' },
    { name: 'Trinidad and Tobago', code: 'TT' },
    { name: 'Bahamas', code: 'BS' },
    { name: 'Grenada', code: 'GD' },
    { name: 'Saint Lucia', code: 'LC' },
    { name: 'Cuba', code: 'CU' },

    // Central America
    { name: 'Panama', code: 'PA' },
    { name: 'Costa Rica', code: 'CR' },
    { name: 'Guatemala', code: 'GT' },
    { name: 'El Salvador', code: 'SV' },
    { name: 'Nicaragua', code: 'NI' },
    { name: 'Honduras', code: 'HN' },
    { name: 'Belize', code: 'BZ' },
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
    // North America - Comprehensive Coverage

    // United States - Top 50 by passenger volume
    { iataCode: 'ATL', name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', country: 'United States', latitude: 33.6367, longitude: -84.428101, isSearchable: true },
    { iataCode: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States', latitude: 33.94250107, longitude: -118.4079971, isSearchable: true },
    { iataCode: 'ORD', name: 'O\'Hare International Airport', city: 'Chicago', country: 'United States', isSearchable: true },
    { iataCode: 'DFW', name: 'Dallas/Fort Worth International Airport', city: 'Dallas', country: 'United States', latitude: 32.896801, longitude: -97.038002, isSearchable: true },
    { iataCode: 'DEN', name: 'Denver International Airport', city: 'Denver', country: 'United States', latitude: 39.861698150635, longitude: -104.672996521, isSearchable: true },
    { iataCode: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States', latitude: 40.63980103, longitude: -73.77890015, isSearchable: true },
    { iataCode: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'United States', latitude: 37.61899948120117, longitude: -122.375, isSearchable: true },
    { iataCode: 'SEA', name: 'Seattle-Tacoma International Airport', city: 'Seattle', country: 'United States', latitude: 47.449001, longitude: -122.308998, isSearchable: true },
    { iataCode: 'LAS', name: 'Harry Reid International Airport', city: 'Las Vegas', country: 'United States', latitude: 36.08010101, longitude: -115.1520004, isSearchable: true },
    { iataCode: 'MCO', name: 'Orlando International Airport', city: 'Orlando', country: 'United States', latitude: 28.429399490356445, longitude: -81.30899810791016, isSearchable: true },
    { iataCode: 'MIA', name: 'Miami International Airport', city: 'Miami', country: 'United States', latitude: 25.79319953918457, longitude: -80.29060363769531, isSearchable: true },
    { iataCode: 'PHX', name: 'Phoenix Sky Harbor International Airport', city: 'Phoenix', country: 'United States', latitude: 33.43429946899414, longitude: -112.01200103759766, isSearchable: true },
    { iataCode: 'IAH', name: 'George Bush Intercontinental Airport', city: 'Houston', country: 'United States', latitude: 29.984399795532227, longitude: -95.34140014648438, isSearchable: true },
    { iataCode: 'BOS', name: 'Logan International Airport', city: 'Boston', country: 'United States', latitude: 42.36429977, longitude: -71.00520325, isSearchable: true },
    { iataCode: 'EWR', name: 'Newark Liberty International Airport', city: 'Newark', country: 'United States', latitude: 40.692501068115234, longitude: -74.168701171875, isSearchable: true },
    { iataCode: 'MSP', name: 'Minneapolis-St Paul International Airport', city: 'Minneapolis', country: 'United States', latitude: 44.882, longitude: -93.221802, isSearchable: true },
    { iataCode: 'DTW', name: 'Detroit Metropolitan Airport', city: 'Detroit', country: 'United States', latitude: 42.212398529052734, longitude: -83.35340118408203, isSearchable: true },
    { iataCode: 'PHL', name: 'Philadelphia International Airport', city: 'Philadelphia', country: 'United States', latitude: 39.87189865112305, longitude: -75.24109649658203, isSearchable: true },
    { iataCode: 'LGA', name: 'LaGuardia Airport', city: 'New York', country: 'United States', latitude: 40.77719879, longitude: -73.87259674, isSearchable: true },
    { iataCode: 'BWI', name: 'Baltimore/Washington International Airport', city: 'Baltimore', country: 'United States', latitude: 39.1754, longitude: -76.668297, isSearchable: true },
    { iataCode: 'SLC', name: 'Salt Lake City International Airport', city: 'Salt Lake City', country: 'United States', latitude: 40.78839874267578, longitude: -111.97799682617188, isSearchable: true },
    { iataCode: 'SAN', name: 'San Diego International Airport', city: 'San Diego', country: 'United States', latitude: 32.7336006165, longitude: -117.190002441, isSearchable: true },
    { iataCode: 'PDX', name: 'Portland International Airport', city: 'Portland', country: 'United States', latitude: 45.58869934, longitude: -122.5979996, isSearchable: true },
    { iataCode: 'CLT', name: 'Charlotte Douglas International Airport', city: 'Charlotte', country: 'United States', latitude: 35.2140007019043, longitude: -80.94309997558594, isSearchable: true },
    { iataCode: 'TPA', name: 'Tampa International Airport', city: 'Tampa', country: 'United States', latitude: 27.975500106811523, longitude: -82.533203125, isSearchable: true },
    { iataCode: 'AUS', name: 'Austin-Bergstrom International Airport', city: 'Austin', country: 'United States', latitude: 30.194499969482422, longitude: -97.6698989868164, isSearchable: true },
    { iataCode: 'BNA', name: 'Nashville International Airport', city: 'Nashville', country: 'United States', latitude: 36.1245002746582, longitude: -86.6781997680664, isSearchable: true },
    { iataCode: 'RDU', name: 'Raleigh-Durham International Airport', city: 'Raleigh', country: 'United States', latitude: 35.877601623535156, longitude: -78.7874984741211, isSearchable: true },
    { iataCode: 'DCA', name: 'Ronald Reagan Washington National Airport', city: 'Washington DC', country: 'United States', latitude: 38.8521, longitude: -77.037697, isSearchable: true },
    { iataCode: 'IAD', name: 'Washington Dulles International Airport', city: 'Washington DC', country: 'United States', latitude: 38.94449997, longitude: -77.45580292, isSearchable: true },
    { iataCode: 'STL', name: 'St. Louis Lambert International Airport', city: 'St. Louis', country: 'United States', latitude: 38.748697, longitude: -90.370003, isSearchable: true },
    { iataCode: 'MDW', name: 'Chicago Midway International Airport', city: 'Chicago', country: 'United States', latitude: 41.785999, longitude: -87.752403, isSearchable: true },
    { iataCode: 'FLL', name: 'Fort Lauderdale-Hollywood International Airport', city: 'Fort Lauderdale', country: 'United States', latitude: 26.072599, longitude: -80.152702, isSearchable: true },
    { iataCode: 'HNL', name: 'Daniel K. Inouye International Airport', city: 'Honolulu', country: 'United States', latitude: 21.32062, longitude: -157.924228, isSearchable: true },
    { iataCode: 'OAK', name: 'Oakland International Airport', city: 'Oakland', country: 'United States', latitude: 37.721298, longitude: -122.221001, isSearchable: true },
    { iataCode: 'SJC', name: 'Norman Y. Mineta San José International Airport', city: 'San Jose', country: 'United States', latitude: 37.362598, longitude: -121.929001, isSearchable: true },
    { iataCode: 'SMF', name: 'Sacramento International Airport', city: 'Sacramento', country: 'United States', latitude: 38.69540023803711, longitude: -121.59100341796875, isSearchable: true },
    { iataCode: 'SNA', name: 'John Wayne Airport', city: 'Santa Ana', country: 'United States', latitude: 33.67570114, longitude: -117.8679962, isSearchable: true },
    { iataCode: 'PIT', name: 'Pittsburgh International Airport', city: 'Pittsburgh', country: 'United States', latitude: 40.49150085, longitude: -80.23290253, isSearchable: true },
    { iataCode: 'CLE', name: 'Cleveland Hopkins International Airport', city: 'Cleveland', country: 'United States', latitude: 41.4117012024, longitude: -81.8498001099, isSearchable: true },
    { iataCode: 'CVG', name: 'Cincinnati/Northern Kentucky International Airport', city: 'Cincinnati', country: 'United States', latitude: 39.0488014221, longitude: -84.6678009033, isSearchable: true },
    { iataCode: 'IND', name: 'Indianapolis International Airport', city: 'Indianapolis', country: 'United States', latitude: 39.7173, longitude: -86.294403, isSearchable: true },
    { iataCode: 'CMH', name: 'John Glenn Columbus International Airport', city: 'Columbus', country: 'United States', latitude: 39.998001, longitude: -82.891899, isSearchable: true },
    { iataCode: 'MKE', name: 'Milwaukee Mitchell International Airport', city: 'Milwaukee', country: 'United States', latitude: 42.947200775146484, longitude: -87.89659881591797, isSearchable: true },
    { iataCode: 'MCI', name: 'Kansas City International Airport', city: 'Kansas City', country: 'United States', latitude: 39.2976, longitude: -94.713898, isSearchable: true },
    { iataCode: 'MSY', name: 'Louis Armstrong New Orleans International Airport', city: 'New Orleans', country: 'United States', latitude: 29.99340057373047, longitude: -90.25800323486328, isSearchable: true },
    { iataCode: 'RSW', name: 'Southwest Florida International Airport', city: 'Fort Myers', country: 'United States', latitude: 26.53619956970215, longitude: -81.75520324707031, isSearchable: true },
    { iataCode: 'SJU', name: 'Luis Muñoz Marín International Airport', city: 'San Juan', country: 'Puerto Rico', latitude: 18.4393997192, longitude: -66.0018005371, isSearchable: true },
    { iataCode: 'SAT', name: 'San Antonio International Airport', city: 'San Antonio', country: 'United States', latitude: 29.533700942993164, longitude: -98.46980285644531, isSearchable: true },
    { iataCode: 'OMA', name: 'Eppley Airfield', city: 'Omaha', country: 'United States', latitude: 41.3032, longitude: -95.894096, isSearchable: true },
    { iataCode: 'BUF', name: 'Buffalo Niagara International Airport', city: 'Buffalo', country: 'United States', latitude: 42.94049835, longitude: -78.73220062, isSearchable: true },
    { iataCode: 'BDL', name: 'Bradley International Airport', city: 'Hartford', country: 'United States', latitude: 41.9388999939, longitude: -72.68319702149999, isSearchable: true },
    { iataCode: 'PVD', name: 'Rhode Island T.F. Green International Airport', city: 'Providence', country: 'United States', latitude: 41.732601, longitude: -71.420403, isSearchable: true },
    { iataCode: 'RIC', name: 'Richmond International Airport', city: 'Richmond', country: 'United States', latitude: 37.50519943237305, longitude: -77.3197021484375, isSearchable: true },
    { iataCode: 'ORF', name: 'Norfolk International Airport', city: 'Norfolk', country: 'United States', latitude: 36.89459991455078, longitude: -76.20120239257812, isSearchable: true },
    { iataCode: 'JAX', name: 'Jacksonville International Airport', city: 'Jacksonville', country: 'United States', latitude: 30.49410057067871, longitude: -81.68789672851562, isSearchable: true },
    { iataCode: 'MEM', name: 'Memphis International Airport', city: 'Memphis', country: 'United States', latitude: 35.04240036010742, longitude: -89.97669982910156, isSearchable: true },
    { iataCode: 'OKC', name: 'Will Rogers World Airport', city: 'Oklahoma City', country: 'United States', latitude: 35.39310073852539, longitude: -97.60070037841797, isSearchable: true },
    { iataCode: 'ANC', name: 'Ted Stevens Anchorage International Airport', city: 'Anchorage', country: 'United States', latitude: 61.174400329589844, longitude: -149.99600219726562, isSearchable: true },
    { iataCode: 'ABQ', name: 'Albuquerque International Sunport', city: 'Albuquerque', country: 'United States', latitude: 35.040199, longitude: -106.609001, isSearchable: true },
    { iataCode: 'TUS', name: 'Tucson International Airport', city: 'Tucson', country: 'United States', latitude: 32.1161003112793, longitude: -110.94100189208984, isSearchable: true },
    { iataCode: 'BUR', name: 'Hollywood Burbank Airport', city: 'Burbank', country: 'United States', latitude: 34.20069885253906, longitude: -118.35900115966797, isSearchable: true },
    { iataCode: 'ONT', name: 'Ontario International Airport', city: 'Ontario', country: 'United States', latitude: 34.055999755859375, longitude: -117.60099792480469, isSearchable: true },
    { iataCode: 'BOI', name: 'Boise Airport', city: 'Boise', country: 'United States', latitude: 43.5644, longitude: -116.223, isSearchable: true },
    { iataCode: 'RNO', name: 'Reno-Tahoe International Airport', city: 'Reno', country: 'United States', latitude: 39.49909973144531, longitude: -119.76799774169922, isSearchable: true },
    { iataCode: 'DSM', name: 'Des Moines International Airport', city: 'Des Moines', country: 'United States', latitude: 41.534000396728516, longitude: -93.66310119628906, isSearchable: true },
    { iataCode: 'BHM', name: 'Birmingham-Shuttlesworth International Airport', city: 'Birmingham', country: 'United States', latitude: 33.56290054, longitude: -86.75350189, isSearchable: true },
    { iataCode: 'PBI', name: 'Palm Beach International Airport', city: 'West Palm Beach', country: 'United States', latitude: 26.68320083618164, longitude: -80.09559631347656, isSearchable: true },
    { iataCode: 'SRQ', name: 'Sarasota-Bradenton International Airport', city: 'Sarasota', country: 'United States', latitude: 27.39539909362793, longitude: -82.55439758300781, isSearchable: true },
    { iataCode: 'GEG', name: 'Spokane International Airport', city: 'Spokane', country: 'United States', latitude: 47.61989974975586, longitude: -117.53399658203125, isSearchable: true },

    // Canada - Top 10
    { iataCode: 'YYZ', name: 'Toronto Pearson International Airport', city: 'Toronto', country: 'Canada', latitude: 43.6772003174, longitude: -79.63059997559999, isSearchable: true },
    { iataCode: 'YVR', name: 'Vancouver International Airport', city: 'Vancouver', country: 'Canada', latitude: 49.193901062, longitude: -123.183998108, isSearchable: true },
    { iataCode: 'YUL', name: 'Montréal-Pierre Elliott Trudeau International Airport', city: 'Montreal', country: 'Canada', latitude: 45.4706001282, longitude: -73.7407989502, isSearchable: true },
    { iataCode: 'YYC', name: 'Calgary International Airport', city: 'Calgary', country: 'Canada', latitude: 51.113899231, longitude: -114.019996643, isSearchable: true },
    { iataCode: 'YEG', name: 'Edmonton International Airport', city: 'Edmonton', country: 'Canada', latitude: 53.309700012200004, longitude: -113.580001831, isSearchable: true },
    { iataCode: 'YOW', name: 'Ottawa Macdonald-Cartier International Airport', city: 'Ottawa', country: 'Canada', latitude: 45.3224983215332, longitude: -75.66919708251953, isSearchable: true },
    { iataCode: 'YWG', name: 'Winnipeg James Armstrong Richardson International Airport', city: 'Winnipeg', country: 'Canada', latitude: 49.909999847399995, longitude: -97.2398986816, isSearchable: true },
    { iataCode: 'YHZ', name: 'Halifax Stanfield International Airport', city: 'Halifax', country: 'Canada', latitude: 44.8807983398, longitude: -63.5085983276, isSearchable: true },
    { iataCode: 'YQB', name: 'Québec City Jean Lesage International Airport', city: 'Quebec City', country: 'Canada', latitude: 46.7911, longitude: -71.393303, isSearchable: true },
    { iataCode: 'YYJ', name: 'Victoria International Airport', city: 'Victoria', country: 'Canada', latitude: 48.646900177, longitude: -123.426002502, isSearchable: true },

    // Mexico - Top 10
    { iataCode: 'MEX', name: 'Mexico City International Airport', city: 'Mexico City', country: 'Mexico', latitude: 19.4363, longitude: -99.072098, isSearchable: true },
    { iataCode: 'CUN', name: 'Cancún International Airport', city: 'Cancún', country: 'Mexico', latitude: 21.036500930800003, longitude: -86.8770980835, isSearchable: true },
    { iataCode: 'GDL', name: 'Guadalajara International Airport', city: 'Guadalajara', country: 'Mexico', latitude: 20.521799087524414, longitude: -103.31099700927734, isSearchable: true },
    { iataCode: 'MTY', name: 'Monterrey International Airport', city: 'Monterrey', country: 'Mexico', latitude: 25.7784996033, longitude: -100.107002258, isSearchable: true },
    { iataCode: 'TIJ', name: 'Tijuana International Airport', city: 'Tijuana', country: 'Mexico', latitude: 32.541099548339844, longitude: -116.97000122070312, isSearchable: true },
    { iataCode: 'PVR', name: 'Puerto Vallarta International Airport', city: 'Puerto Vallarta', country: 'Mexico', latitude: 20.680099487304688, longitude: -105.25399780273438, isSearchable: true },
    { iataCode: 'SJD', name: 'Los Cabos International Airport', city: 'San José del Cabo', country: 'Mexico', latitude: 23.15180015563965, longitude: -109.72100067138672, isSearchable: true },
    { iataCode: 'HMO', name: 'Hermosillo International Airport', city: 'Hermosillo', country: 'Mexico', latitude: 29.095899581900003, longitude: -111.047996521, isSearchable: true },
    { iataCode: 'MZT', name: 'Mazatlán International Airport', city: 'Mazatlán', country: 'Mexico', latitude: 23.1613998413, longitude: -106.26599884, isSearchable: true },
    { iataCode: 'ZIH', name: 'Ixtapa-Zihuatanejo International Airport', city: 'Zihuatanejo', country: 'Mexico', latitude: 17.601600647, longitude: -101.460998535, isSearchable: true },

    // Europe - Comprehensive Coverage (Top 10 per country)

    // United Kingdom (Top 10)
    { iataCode: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom', latitude: 51.4706, longitude: -0.461941, isSearchable: true },
    { iataCode: 'LGW', name: 'London Gatwick Airport', city: 'London', country: 'United Kingdom', latitude: 51.148102, longitude: -0.190278, isSearchable: true },
    { iataCode: 'MAN', name: 'Manchester Airport', city: 'Manchester', country: 'United Kingdom', latitude: 53.35369873046875, longitude: -2.2749500274658203, isSearchable: true },
    { iataCode: 'STN', name: 'London Stansted Airport', city: 'London', country: 'United Kingdom', latitude: 51.8849983215, longitude: 0.234999999404, isSearchable: true },
    { iataCode: 'LTN', name: 'London Luton Airport', city: 'London', country: 'United Kingdom', latitude: 51.874698638916016, longitude: -0.36833301186561584, isSearchable: true },
    { iataCode: 'EDI', name: 'Edinburgh Airport', city: 'Edinburgh', country: 'United Kingdom', latitude: 55.95000076293945, longitude: -3.372499942779541, isSearchable: true },
    { iataCode: 'BHX', name: 'Birmingham Airport', city: 'Birmingham', country: 'United Kingdom', latitude: 52.453899383499994, longitude: -1.74802994728, isSearchable: true },
    { iataCode: 'GLA', name: 'Glasgow Airport', city: 'Glasgow', country: 'United Kingdom', latitude: 55.8718986511, longitude: -4.43306016922, isSearchable: true },
    { iataCode: 'BRS', name: 'Bristol Airport', city: 'Bristol', country: 'United Kingdom', latitude: 51.382702, longitude: -2.71909, isSearchable: true },
    { iataCode: 'NCL', name: 'Newcastle Airport', city: 'Newcastle', country: 'United Kingdom', latitude: 55.037498474121094, longitude: -1.6916699409484863, isSearchable: true },

    // France (Top 10)
    { iataCode: 'CDG', name: 'Paris Charles de Gaulle Airport', city: 'Paris', country: 'France', latitude: 49.012798, longitude: 2.55, isSearchable: true },
    { iataCode: 'ORY', name: 'Paris Orly Airport', city: 'Paris', country: 'France', latitude: 48.7233333, longitude: 2.3794444, isSearchable: true },
    { iataCode: 'NCE', name: 'Nice Côte d\'Azur Airport', city: 'Nice', country: 'France', isSearchable: true },
    { iataCode: 'LYS', name: 'Lyon-Saint Exupéry Airport', city: 'Lyon', country: 'France', latitude: 45.725556, longitude: 5.081111, isSearchable: true },
    { iataCode: 'MRS', name: 'Marseille Provence Airport', city: 'Marseille', country: 'France', latitude: 43.439271922, longitude: 5.22142410278, isSearchable: true },
    { iataCode: 'TLS', name: 'Toulouse-Blagnac Airport', city: 'Toulouse', country: 'France', latitude: 43.629101, longitude: 1.36382, isSearchable: true },
    { iataCode: 'BOD', name: 'Bordeaux-Mérignac Airport', city: 'Bordeaux', country: 'France', latitude: 44.828300476100004, longitude: -0.715556025505, isSearchable: true },
    { iataCode: 'NTE', name: 'Nantes Atlantique Airport', city: 'Nantes', country: 'France', latitude: 47.153198242200006, longitude: -1.61073005199, isSearchable: true },
    { iataCode: 'BSL', name: 'EuroAirport Basel-Mulhouse-Freiburg', city: 'Basel/Mulhouse', country: 'France', latitude: 47.59, longitude: 7.5291667, isSearchable: true },
    { iataCode: 'LIL', name: 'Lille Airport', city: 'Lille', country: 'France', latitude: 50.563332, longitude: 3.086886, isSearchable: true },

    // Spain (Top 10)
    { iataCode: 'MAD', name: 'Adolfo Suárez Madrid-Barajas Airport', city: 'Madrid', country: 'Spain', latitude: 40.471926, longitude: -3.56264, isSearchable: true },
    { iataCode: 'BCN', name: 'Barcelona-El Prat Airport', city: 'Barcelona', country: 'Spain', latitude: 41.2971, longitude: 2.07846, isSearchable: true },
    { iataCode: 'PMI', name: 'Palma de Mallorca Airport', city: 'Palma', country: 'Spain', latitude: 39.551700592, longitude: 2.73881006241, isSearchable: true },
    { iataCode: 'AGP', name: 'Málaga-Costa del Sol Airport', city: 'Málaga', country: 'Spain', latitude: 36.67490005493164, longitude: -4.499110221862793, isSearchable: true },
    { iataCode: 'SVQ', name: 'Seville Airport', city: 'Seville', country: 'Spain', latitude: 37.417999267578125, longitude: -5.8931097984313965, isSearchable: true },
    { iataCode: 'ALC', name: 'Alicante-Elche Airport', city: 'Alicante', country: 'Spain', latitude: 38.28219985961914, longitude: -0.5581560134887695, isSearchable: true },
    { iataCode: 'VLC', name: 'Valencia Airport', city: 'Valencia', country: 'Spain', latitude: 39.4893, longitude: -0.481625, isSearchable: true },
    { iataCode: 'BIO', name: 'Bilbao Airport', city: 'Bilbao', country: 'Spain', latitude: 43.30110168457031, longitude: -2.9106099605560303, isSearchable: true },
    { iataCode: 'IBZ', name: 'Ibiza Airport', city: 'Ibiza', country: 'Spain', latitude: 38.872898101800004, longitude: 1.3731199502899998, isSearchable: true },
    { iataCode: 'TFS', name: 'Tenerife South Airport', city: 'Tenerife', country: 'Spain', latitude: 28.044500351, longitude: -16.5725002289, isSearchable: true },

    // Germany (Top 10)
    { iataCode: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', latitude: 50.033333, longitude: 8.570556, isSearchable: true },
    { iataCode: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'Germany', latitude: 48.353802, longitude: 11.7861, isSearchable: true },
    { iataCode: 'BER', name: 'Berlin Brandenburg Airport', city: 'Berlin', country: 'Germany', latitude: 52.36667, longitude: 13.50333, isSearchable: true },
    { iataCode: 'DUS', name: 'Düsseldorf Airport', city: 'Düsseldorf', country: 'Germany', latitude: 51.289501, longitude: 6.76678, isSearchable: true },
    { iataCode: 'HAM', name: 'Hamburg Airport', city: 'Hamburg', country: 'Germany', latitude: 53.630401611328, longitude: 9.9882297515869, isSearchable: true },
    { iataCode: 'CGN', name: 'Cologne Bonn Airport', city: 'Cologne', country: 'Germany', latitude: 50.8658981323, longitude: 7.1427397728, isSearchable: true },
    { iataCode: 'STR', name: 'Stuttgart Airport', city: 'Stuttgart', country: 'Germany', latitude: 48.689899444599995, longitude: 9.22196006775, isSearchable: true },
    { iataCode: 'HAJ', name: 'Hannover Airport', city: 'Hannover', country: 'Germany', latitude: 52.461101532, longitude: 9.685079574580001, isSearchable: true },
    { iataCode: 'NUE', name: 'Nuremberg Airport', city: 'Nuremberg', country: 'Germany', latitude: 49.498699, longitude: 11.078056, isSearchable: true },
    { iataCode: 'DRT', name: 'Dortmund Airport', city: 'Dortmund', country: 'Germany', latitude: 29.3742008209, longitude: -100.927001953, isSearchable: true },

    // Italy (Top 10)
    { iataCode: 'FCO', name: 'Leonardo da Vinci-Fiumicino Airport', city: 'Rome', country: 'Italy', latitude: 41.8002778, longitude: 12.2388889, isSearchable: true },
    { iataCode: 'MXP', name: 'Milan Malpensa Airport', city: 'Milan', country: 'Italy', latitude: 45.6306, longitude: 8.72811, isSearchable: true },
    { iataCode: 'BGY', name: 'Milan Bergamo Airport', city: 'Bergamo', country: 'Italy', latitude: 45.673901, longitude: 9.70417, isSearchable: true },
    { iataCode: 'VCE', name: 'Venice Marco Polo Airport', city: 'Venice', country: 'Italy', latitude: 45.505299, longitude: 12.3519, isSearchable: true },
    { iataCode: 'NAP', name: 'Naples International Airport', city: 'Naples', country: 'Italy', latitude: 40.886002, longitude: 14.2908, isSearchable: true },
    { iataCode: 'CTA', name: 'Catania-Fontanarossa Airport', city: 'Catania', country: 'Italy', latitude: 37.466801, longitude: 15.0664, isSearchable: true },
    { iataCode: 'BLQ', name: 'Bologna Guglielmo Marconi Airport', city: 'Bologna', country: 'Italy', latitude: 44.5354, longitude: 11.2887, isSearchable: true },
    { iataCode: 'PSA', name: 'Pisa International Airport', city: 'Pisa', country: 'Italy', latitude: 43.683899, longitude: 10.3927, isSearchable: true },
    { iataCode: 'LIN', name: 'Milan Linate Airport', city: 'Milan', country: 'Italy', latitude: 45.445099, longitude: 9.27674, isSearchable: true },
    { iataCode: 'CAG', name: 'Cagliari Elmas Airport', city: 'Cagliari', country: 'Italy', latitude: 39.251499, longitude: 9.05428, isSearchable: true },

    // Netherlands (Top 5 - smaller country)
    { iataCode: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands', latitude: 52.308601, longitude: 4.76389, isSearchable: true },
    { iataCode: 'EIN', name: 'Eindhoven Airport', city: 'Eindhoven', country: 'Netherlands', latitude: 51.4500999451, longitude: 5.37452983856, isSearchable: true },
    { iataCode: 'RTM', name: 'Rotterdam The Hague Airport', city: 'Rotterdam', country: 'Netherlands', latitude: 51.956902, longitude: 4.43722, isSearchable: true },
    { iataCode: 'MST', name: 'Maastricht Aachen Airport', city: 'Maastricht', country: 'Netherlands', latitude: 50.911701, longitude: 5.77014, isSearchable: true },
    { iataCode: 'GRQ', name: 'Groningen Airport Eelde', city: 'Groningen', country: 'Netherlands', latitude: 53.1197013855, longitude: 6.57944011688, isSearchable: true },

    // Switzerland (Top 4 - BSL already in France section)
    { iataCode: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland', latitude: 47.464699, longitude: 8.54917, isSearchable: true },
    { iataCode: 'GVA', name: 'Geneva Airport', city: 'Geneva', country: 'Switzerland', latitude: 46.23809814453125, longitude: 6.108950138092041, isSearchable: true },
    { iataCode: 'BRN', name: 'Bern Airport', city: 'Bern', country: 'Switzerland', latitude: 46.914100647, longitude: 7.497149944309999, isSearchable: true },
    { iataCode: 'LUG', name: 'Lugano Airport', city: 'Lugano', country: 'Switzerland', latitude: 46.00429916379999, longitude: 8.9105796814, isSearchable: true },

    // Austria (Top 6)
    { iataCode: 'VIE', name: 'Vienna International Airport', city: 'Vienna', country: 'Austria', latitude: 48.110298156738, longitude: 16.569700241089, isSearchable: true },
    { iataCode: 'SZG', name: 'Salzburg Airport', city: 'Salzburg', country: 'Austria', latitude: 47.793300628699996, longitude: 13.0043001175, isSearchable: true },
    { iataCode: 'INN', name: 'Innsbruck Airport', city: 'Innsbruck', country: 'Austria', latitude: 47.260201, longitude: 11.344, isSearchable: true },
    { iataCode: 'GRZ', name: 'Graz Airport', city: 'Graz', country: 'Austria', latitude: 46.9911003112793, longitude: 15.439599990844727, isSearchable: true },
    { iataCode: 'LNZ', name: 'Linz Airport', city: 'Linz', country: 'Austria', latitude: 48.2332, longitude: 14.1875, isSearchable: true },
    { iataCode: 'KLU', name: 'Klagenfurt Airport', city: 'Klagenfurt', country: 'Austria', latitude: 46.642502, longitude: 14.3377, isSearchable: true },

    // Belgium (Top 5)
    { iataCode: 'BRU', name: 'Brussels Airport', city: 'Brussels', country: 'Belgium', latitude: 50.901401519800004, longitude: 4.48443984985, isSearchable: true },
    { iataCode: 'CRL', name: 'Brussels South Charleroi Airport', city: 'Charleroi', country: 'Belgium', latitude: 50.459202, longitude: 4.45382, isSearchable: true },
    { iataCode: 'ANR', name: 'Antwerp International Airport', city: 'Antwerp', country: 'Belgium', latitude: 51.1893997192, longitude: 4.46027994156, isSearchable: true },
    { iataCode: 'LGG', name: 'Liège Airport', city: 'Liège', country: 'Belgium', latitude: 50.63740158081055, longitude: 5.443220138549805, isSearchable: true },
    { iataCode: 'OST', name: 'Ostend-Bruges International Airport', city: 'Ostend', country: 'Belgium', latitude: 51.198898315399994, longitude: 2.8622200489, isSearchable: true },

    // Denmark (Top 5)
    { iataCode: 'CPH', name: 'Copenhagen Airport', city: 'Copenhagen', country: 'Denmark', latitude: 55.617900848389, longitude: 12.656000137329, isSearchable: true },
    { iataCode: 'BLL', name: 'Billund Airport', city: 'Billund', country: 'Denmark', latitude: 55.7402992249, longitude: 9.15178012848, isSearchable: true },
    { iataCode: 'AAL', name: 'Aalborg Airport', city: 'Aalborg', country: 'Denmark', latitude: 57.0927589138, longitude: 9.84924316406, isSearchable: true },
    { iataCode: 'AAR', name: 'Aarhus Airport', city: 'Aarhus', country: 'Denmark', latitude: 56.2999992371, longitude: 10.619000434899998, isSearchable: true },
    { iataCode: 'KRP', name: 'Karup Airport', city: 'Karup', country: 'Denmark', latitude: 56.29750061035156, longitude: 9.124629974365234, isSearchable: true },

    // Sweden (Top 10)
    { iataCode: 'ARN', name: 'Stockholm Arlanda Airport', city: 'Stockholm', country: 'Sweden', latitude: 59.651901245117, longitude: 17.918600082397, isSearchable: true },
    { iataCode: 'GOT', name: 'Gothenburg Landvetter Airport', city: 'Gothenburg', country: 'Sweden', latitude: 57.662799835205, longitude: 12.279800415039, isSearchable: true },
    { iataCode: 'MMX', name: 'Malmö Airport', city: 'Malmö', country: 'Sweden', latitude: 55.536305364, longitude: 13.376197814900001, isSearchable: true },
    { iataCode: 'BMA', name: 'Stockholm Bromma Airport', city: 'Stockholm', country: 'Sweden', latitude: 59.354400634765625, longitude: 17.941699981689453, isSearchable: true },
    { iataCode: 'LLA', name: 'Luleå Airport', city: 'Luleå', country: 'Sweden', latitude: 65.543800354004, longitude: 22.121999740601, isSearchable: true },
    { iataCode: 'UME', name: 'Umeå Airport', city: 'Umeå', country: 'Sweden', latitude: 63.791801452637, longitude: 20.282800674438, isSearchable: true },
    { iataCode: 'VBY', name: 'Visby Airport', city: 'Visby', country: 'Sweden', latitude: 57.662799835205, longitude: 18.346200942993, isSearchable: true },
    { iataCode: 'KID', name: 'Kristianstad Airport', city: 'Kristianstad', country: 'Sweden', latitude: 55.92169952392578, longitude: 14.08549976348877, isSearchable: true },
    { iataCode: 'RNB', name: 'Ronneby Airport', city: 'Ronneby', country: 'Sweden', latitude: 56.266700744629, longitude: 15.265000343323, isSearchable: true },
    { iataCode: 'VST', name: 'Stockholm Västerås Airport', city: 'Västerås', country: 'Sweden', latitude: 59.58940124511719, longitude: 16.63360023498535, isSearchable: true },

    // Norway (Top 10)
    { iataCode: 'OSL', name: 'Oslo Airport Gardermoen', city: 'Oslo', country: 'Norway', latitude: 60.121, longitude: 11.0502, isSearchable: true },
    { iataCode: 'BGO', name: 'Bergen Airport Flesland', city: 'Bergen', country: 'Norway', latitude: 60.29339981, longitude: 5.218140125, isSearchable: true },
    { iataCode: 'SVG', name: 'Stavanger Airport Sola', city: 'Stavanger', country: 'Norway', latitude: 58.876701354, longitude: 5.6377801895, isSearchable: true },
    { iataCode: 'TRD', name: 'Trondheim Airport Værnes', city: 'Trondheim', country: 'Norway', latitude: 63.4578018, longitude: 10.9239998, isSearchable: true },
    { iataCode: 'TOS', name: 'Tromsø Airport', city: 'Tromsø', country: 'Norway', latitude: 69.681389, longitude: 18.917778, isSearchable: true },
    { iataCode: 'BOO', name: 'Bodø Airport', city: 'Bodø', country: 'Norway', latitude: 67.26920318603516, longitude: 14.365300178527832, isSearchable: true },
    { iataCode: 'AES', name: 'Ålesund Airport', city: 'Ålesund', country: 'Norway', latitude: 62.5625, longitude: 6.119699954986572, isSearchable: true },
    { iataCode: 'KRS', name: 'Kristiansand Airport', city: 'Kristiansand', country: 'Norway', latitude: 58.204201, longitude: 8.08537, isSearchable: true },
    { iataCode: 'HAU', name: 'Haugesund Airport', city: 'Haugesund', country: 'Norway', latitude: 59.34529876709, longitude: 5.2083601951599, isSearchable: true },
    { iataCode: 'MOL', name: 'Molde Airport', city: 'Molde', country: 'Norway', latitude: 62.744701385498, longitude: 7.2624998092651, isSearchable: true },

    // Finland (Top 10)
    { iataCode: 'HEL', name: 'Helsinki-Vantaa Airport', city: 'Helsinki', country: 'Finland', latitude: 60.317199707031, longitude: 24.963300704956, isSearchable: true },
    { iataCode: 'OUL', name: 'Oulu Airport', city: 'Oulu', country: 'Finland', latitude: 64.930099487305, longitude: 25.354600906372, isSearchable: true },
    { iataCode: 'TMP', name: 'Tampere-Pirkkala Airport', city: 'Tampere', country: 'Finland', latitude: 61.414100646973, longitude: 23.604400634766, isSearchable: true },
    { iataCode: 'RVN', name: 'Rovaniemi Airport', city: 'Rovaniemi', country: 'Finland', latitude: 66.564796447754, longitude: 25.830400466919, isSearchable: true },
    { iataCode: 'TKU', name: 'Turku Airport', city: 'Turku', country: 'Finland', latitude: 60.514099121094, longitude: 22.262800216675, isSearchable: true },
    { iataCode: 'KEM', name: 'Kemi-Tornio Airport', city: 'Kemi', country: 'Finland', latitude: 65.778701782227, longitude: 24.582099914551, isSearchable: true },
    { iataCode: 'KAJ', name: 'Kajaani Airport', city: 'Kajaani', country: 'Finland', latitude: 64.285499572754, longitude: 27.692399978638, isSearchable: true },
    { iataCode: 'IVL', name: 'Ivalo Airport', city: 'Ivalo', country: 'Finland', latitude: 68.607299804688, longitude: 27.405300140381, isSearchable: true },
    { iataCode: 'JYV', name: 'Jyväskylä Airport', city: 'Jyväskylä', country: 'Finland', latitude: 62.399501800537, longitude: 25.678300857544, isSearchable: true },
    { iataCode: 'VAA', name: 'Vaasa Airport', city: 'Vaasa', country: 'Finland', latitude: 63.050701141357, longitude: 21.762199401855, isSearchable: true },

    // Ireland (Top 5)
    { iataCode: 'DUB', name: 'Dublin Airport', city: 'Dublin', country: 'Ireland', latitude: 53.421299, longitude: -6.27007, isSearchable: true },
    { iataCode: 'ORK', name: 'Cork Airport', city: 'Cork', country: 'Ireland', latitude: 51.84130096435547, longitude: -8.491109848022461, isSearchable: true },
    { iataCode: 'SNN', name: 'Shannon Airport', city: 'Shannon', country: 'Ireland', latitude: 52.702, longitude: -8.92482, isSearchable: true },
    { iataCode: 'NOC', name: 'Ireland West Airport Knock', city: 'Knock', country: 'Ireland', latitude: 53.910301208496094, longitude: -8.818490028381348, isSearchable: true },
    { iataCode: 'KIR', name: 'Kerry Airport', city: 'Kerry', country: 'Ireland', latitude: 52.18090057373047, longitude: -9.52377986907959, isSearchable: true },

    // Portugal (Top 10)
    { iataCode: 'LIS', name: 'Lisbon Portela Airport', city: 'Lisbon', country: 'Portugal', latitude: 38.7813, longitude: -9.13592, isSearchable: true },
    { iataCode: 'OPO', name: 'Porto Airport', city: 'Porto', country: 'Portugal', latitude: 41.2481002808, longitude: -8.68138980865, isSearchable: true },
    { iataCode: 'FAO', name: 'Faro Airport', city: 'Faro', country: 'Portugal', latitude: 37.0144004822, longitude: -7.96590995789, isSearchable: true },
    { iataCode: 'FNC', name: 'Funchal Madeira Airport', city: 'Funchal', country: 'Portugal', latitude: 32.697899, longitude: -16.7745, isSearchable: true },
    { iataCode: 'PDL', name: 'Ponta Delgada Airport', city: 'Ponta Delgada', country: 'Portugal', latitude: 37.7411994934, longitude: -25.6979007721, isSearchable: true },
    { iataCode: 'TER', name: 'Lajes Airport', city: 'Terceira', country: 'Portugal', latitude: 38.761799, longitude: -27.090799, isSearchable: true },
    { iataCode: 'HOR', name: 'Horta Airport', city: 'Horta', country: 'Portugal', latitude: 38.519901275634766, longitude: -28.715900421142578, isSearchable: true },
    { iataCode: 'BGC', name: 'Bragança Airport', city: 'Bragança', country: 'Portugal', latitude: 41.8578, longitude: -6.70713, isSearchable: true },
    { iataCode: 'CHV', name: 'Chaves Airport', city: 'Chaves', country: 'Portugal', latitude: 41.722222, longitude: -7.463889, isSearchable: true },
    { iataCode: 'SMA', name: 'Santa Maria Airport', city: 'Santa Maria', country: 'Portugal', latitude: 36.97140121459961, longitude: -25.17060089111328, isSearchable: true },

    // Greece (Top 10)
    { iataCode: 'ATH', name: 'Athens International Airport', city: 'Athens', country: 'Greece', latitude: 37.9364013672, longitude: 23.9444999695, isSearchable: true },
    { iataCode: 'HER', name: 'Heraklion International Airport', city: 'Heraklion', country: 'Greece', latitude: 35.3396987915, longitude: 25.180299758900002, isSearchable: true },
    { iataCode: 'SKG', name: 'Thessaloniki Airport', city: 'Thessaloniki', country: 'Greece', latitude: 40.51969909667969, longitude: 22.97089958190918, isSearchable: true },
    { iataCode: 'RHO', name: 'Rhodes International Airport', city: 'Rhodes', country: 'Greece', latitude: 36.405399322509766, longitude: 28.086200714111328, isSearchable: true },
    { iataCode: 'CFU', name: 'Corfu International Airport', city: 'Corfu', country: 'Greece', latitude: 39.601898193359375, longitude: 19.911699295043945, isSearchable: true },
    { iataCode: 'CHQ', name: 'Chania International Airport', city: 'Chania', country: 'Greece', latitude: 35.531700134277344, longitude: 24.149700164794922, isSearchable: true },
    { iataCode: 'JTR', name: 'Santorini Airport', city: 'Santorini', country: 'Greece', latitude: 36.399200439453125, longitude: 25.479299545288086, isSearchable: true },
    { iataCode: 'KGS', name: 'Kos Island International Airport', city: 'Kos', country: 'Greece', latitude: 36.79330062866211, longitude: 27.091699600219727, isSearchable: true },
    { iataCode: 'ZTH', name: 'Zakynthos International Airport', city: 'Zakynthos', country: 'Greece', latitude: 37.7509, longitude: 20.8843, isSearchable: true },
    { iataCode: 'JMK', name: 'Mykonos Airport', city: 'Mykonos', country: 'Greece', latitude: 37.43510055541992, longitude: 25.348100662231445, isSearchable: true },

    // Poland (Top 10)
    { iataCode: 'WAW', name: 'Warsaw Chopin Airport', city: 'Warsaw', country: 'Poland', latitude: 52.1656990051, longitude: 20.967100143399996, isSearchable: true },
    { iataCode: 'KRK', name: 'Kraków John Paul II Airport', city: 'Kraków', country: 'Poland', latitude: 50.077702, longitude: 19.7848, isSearchable: true },
    { iataCode: 'GDN', name: 'Gdańsk Lech Wałęsa Airport', city: 'Gdańsk', country: 'Poland', latitude: 54.377601623535156, longitude: 18.46619987487793, isSearchable: true },
    { iataCode: 'WMI', name: 'Warsaw Modlin Airport', city: 'Warsaw', country: 'Poland', latitude: 52.451099, longitude: 20.6518, isSearchable: true },
    { iataCode: 'KTW', name: 'Katowice Airport', city: 'Katowice', country: 'Poland', latitude: 50.4743, longitude: 19.08, isSearchable: true },
    { iataCode: 'WRO', name: 'Wrocław Airport', city: 'Wrocław', country: 'Poland', latitude: 51.1026992798, longitude: 16.885799408, isSearchable: true },
    { iataCode: 'POZ', name: 'Poznań-Ławica Airport', city: 'Poznań', country: 'Poland', latitude: 52.421001434299995, longitude: 16.8262996674, isSearchable: true },
    { iataCode: 'RZE', name: 'Rzeszów-Jasionka Airport', city: 'Rzeszów', country: 'Poland', latitude: 50.1100006104, longitude: 22.0189990997, isSearchable: true },
    { iataCode: 'SZZ', name: 'Szczecin-Goleniów Airport', city: 'Szczecin', country: 'Poland', latitude: 53.584701538100006, longitude: 14.902199745199999, isSearchable: true },
    { iataCode: 'LUZ', name: 'Lublin Airport', city: 'Lublin', country: 'Poland', latitude: 51.240278, longitude: 22.713611, isSearchable: true },

    // Czech Republic (Top 5)
    { iataCode: 'PRG', name: 'Václav Havel Airport Prague', city: 'Prague', country: 'Czech Republic', latitude: 50.1008, longitude: 14.26, isSearchable: true },
    { iataCode: 'BRQ', name: 'Brno-Tuřany Airport', city: 'Brno', country: 'Czech Republic', latitude: 49.15129852294922, longitude: 16.694400787353516, isSearchable: true },
    { iataCode: 'OSR', name: 'Ostrava Leoš Janáček Airport', city: 'Ostrava', country: 'Czech Republic', latitude: 49.6963005065918, longitude: 18.111099243164062, isSearchable: true },
    { iataCode: 'PED', name: 'Pardubice Airport', city: 'Pardubice', country: 'Czech Republic', latitude: 50.01340103149414, longitude: 15.73859977722168, isSearchable: true },
    { iataCode: 'KLV', name: 'Karlovy Vary Airport', city: 'Karlovy Vary', country: 'Czech Republic', latitude: 50.202999114990234, longitude: 12.914999961853027, isSearchable: true },

    // Hungary (Top 3)
    { iataCode: 'BUD', name: 'Budapest Ferenc Liszt International Airport', city: 'Budapest', country: 'Hungary', latitude: 47.42976, longitude: 19.261093, isSearchable: true },
    { iataCode: 'DEB', name: 'Debrecen International Airport', city: 'Debrecen', country: 'Hungary', latitude: 47.48889923095703, longitude: 21.615299224853516, isSearchable: true },
    { iataCode: 'SOB', name: 'Sármellék International Airport', city: 'Sármellék', country: 'Hungary', latitude: 46.686391, longitude: 17.159084, isSearchable: true },

    // Romania (Top 10)
    { iataCode: 'OTP', name: 'Henri Coandă International Airport', city: 'Bucharest', country: 'Romania', latitude: 44.5711111, longitude: 26.085, isSearchable: true },
    { iataCode: 'CLJ', name: 'Cluj-Napoca International Airport', city: 'Cluj-Napoca', country: 'Romania', latitude: 46.78519821166992, longitude: 23.686199188232422, isSearchable: true },
    { iataCode: 'TSR', name: 'Timișoara Traian Vuia Airport', city: 'Timișoara', country: 'Romania', latitude: 45.809898376464844, longitude: 21.337900161743164, isSearchable: true },
    { iataCode: 'IAS', name: 'Iași International Airport', city: 'Iași', country: 'Romania', latitude: 47.17850112915039, longitude: 27.6205997467041, isSearchable: true },
    { iataCode: 'SBZ', name: 'Sibiu International Airport', city: 'Sibiu', country: 'Romania', latitude: 45.78559875488281, longitude: 24.091299057006836, isSearchable: true },
    { iataCode: 'CRA', name: 'Craiova Airport', city: 'Craiova', country: 'Romania', latitude: 44.31809997558594, longitude: 23.888599395751953, isSearchable: true },
    { iataCode: 'OMR', name: 'Oradea International Airport', city: 'Oradea', country: 'Romania', latitude: 47.025299072265625, longitude: 21.90250015258789, isSearchable: true },
    { iataCode: 'BCM', name: 'Bacău Airport', city: 'Bacău', country: 'Romania', latitude: 46.52190017700195, longitude: 26.91029930114746, isSearchable: true },
    { iataCode: 'TGM', name: 'Târgu Mureș Airport', city: 'Târgu Mureș', country: 'Romania', latitude: 46.46770095825195, longitude: 24.412500381469727, isSearchable: true },
    { iataCode: 'SUJ', name: 'Satu Mare Airport', city: 'Satu Mare', country: 'Romania', latitude: 47.70330047607422, longitude: 22.885700225830078, isSearchable: true },

    // Bulgaria (Top 5)
    { iataCode: 'SOF', name: 'Sofia Airport', city: 'Sofia', country: 'Bulgaria', latitude: 42.696693420410156, longitude: 23.411436080932617, isSearchable: true },
    { iataCode: 'VAR', name: 'Varna Airport', city: 'Varna', country: 'Bulgaria', latitude: 43.232101, longitude: 27.8251, isSearchable: true },
    { iataCode: 'BOJ', name: 'Burgas Airport', city: 'Burgas', country: 'Bulgaria', latitude: 42.56959915161133, longitude: 27.515199661254883, isSearchable: true },
    { iataCode: 'PDV', name: 'Plovdiv Airport', city: 'Plovdiv', country: 'Bulgaria', latitude: 42.067799, longitude: 24.8508, isSearchable: true },
    { iataCode: 'GOZ', name: 'Gorna Oryahovitsa Airport', city: 'Gorna Oryahovitsa', country: 'Bulgaria', latitude: 43.15140151977539, longitude: 25.712900161743164, isSearchable: true },

    // Croatia (Top 8)
    { iataCode: 'ZAG', name: 'Zagreb Airport', city: 'Zagreb', country: 'Croatia', latitude: 45.7429008484, longitude: 16.0687999725, isSearchable: true },
    { iataCode: 'SPU', name: 'Split Airport', city: 'Split', country: 'Croatia', latitude: 43.53889846801758, longitude: 16.29800033569336, isSearchable: true },
    { iataCode: 'DBV', name: 'Dubrovnik Airport', city: 'Dubrovnik', country: 'Croatia', latitude: 42.5614013671875, longitude: 18.268199920654297, isSearchable: true },
    { iataCode: 'PUY', name: 'Pula Airport', city: 'Pula', country: 'Croatia', latitude: 44.89350128173828, longitude: 13.922200202941895, isSearchable: true },
    { iataCode: 'ZAD', name: 'Zadar Airport', city: 'Zadar', country: 'Croatia', latitude: 44.108299, longitude: 15.3467, isSearchable: true },
    { iataCode: 'RJK', name: 'Rijeka Airport', city: 'Rijeka', country: 'Croatia', latitude: 45.21689987182617, longitude: 14.570300102233887, isSearchable: true },
    { iataCode: 'OSI', name: 'Osijek Airport', city: 'Osijek', country: 'Croatia', latitude: 45.46269989013672, longitude: 18.810199737548828, isSearchable: true },
    { iataCode: 'BWK', name: 'Bol Airport', city: 'Bol', country: 'Croatia', latitude: 43.285701751708984, longitude: 16.67970085144043, isSearchable: true },

    // Turkey (Top 10)
    { iataCode: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey', latitude: 41.275278, longitude: 28.751944, isSearchable: true },
    { iataCode: 'SAW', name: 'Sabiha Gökçen International Airport', city: 'Istanbul', country: 'Turkey', latitude: 40.898601532, longitude: 29.3092002869, isSearchable: true },
    { iataCode: 'AYT', name: 'Antalya Airport', city: 'Antalya', country: 'Turkey', latitude: 36.898701, longitude: 30.800501, isSearchable: true },
    { iataCode: 'ESB', name: 'Esenboğa International Airport', city: 'Ankara', country: 'Turkey', latitude: 40.128101348899996, longitude: 32.995098114, isSearchable: true },
    { iataCode: 'ADB', name: 'Adnan Menderes Airport', city: 'İzmir', country: 'Turkey', latitude: 38.2924003601, longitude: 27.156999588, isSearchable: true },
    { iataCode: 'DLM', name: 'Dalaman Airport', city: 'Dalaman', country: 'Turkey', latitude: 36.7131004333, longitude: 28.7924995422, isSearchable: true },
    { iataCode: 'BJV', name: 'Bodrum Airport', city: 'Bodrum', country: 'Turkey', latitude: 37.25059890749999, longitude: 27.6643009186, isSearchable: true },
    { iataCode: 'ADA', name: 'Adana Airport', city: 'Adana', country: 'Turkey', latitude: 36.9822006226, longitude: 35.280399322499996, isSearchable: true },
    { iataCode: 'GZT', name: 'Gaziantep Airport', city: 'Gaziantep', country: 'Turkey', latitude: 36.9472007751, longitude: 37.4786987305, isSearchable: true },
    { iataCode: 'TZX', name: 'Trabzon Airport', city: 'Trabzon', country: 'Turkey', latitude: 40.99509811401367, longitude: 39.78969955444336, isSearchable: true },

    // Iceland (Top 2)
    { iataCode: 'KEF', name: 'Keflavík International Airport', city: 'Reykjavik', country: 'Iceland', latitude: 63.985000610352, longitude: -22.605600357056, isSearchable: true },
    { iataCode: 'RKV', name: 'Reykjavík Airport', city: 'Reykjavik', country: 'Iceland', latitude: 64.1299972534, longitude: -21.9405994415, isSearchable: true },

    // Luxembourg (Top 1)
    { iataCode: 'LUX', name: 'Luxembourg Airport', city: 'Luxembourg City', country: 'Luxembourg', latitude: 49.6233333, longitude: 6.2044444, isSearchable: true },

    // Malta (Top 1)
    { iataCode: 'MLA', name: 'Malta International Airport', city: 'Valletta', country: 'Malta', latitude: 35.857498, longitude: 14.4775, isSearchable: true },

    // Cyprus (Top 2)
    { iataCode: 'LCA', name: 'Larnaca International Airport', city: 'Larnaca', country: 'Cyprus', latitude: 34.875099182128906, longitude: 33.624900817871094, isSearchable: true },
    { iataCode: 'PFO', name: 'Paphos International Airport', city: 'Paphos', country: 'Cyprus', latitude: 34.71799850463867, longitude: 32.48569869995117, isSearchable: true },

    // Estonia (Top 1)
    { iataCode: 'TLL', name: 'Tallinn Airport', city: 'Tallinn', country: 'Estonia', latitude: 59.41329956049999, longitude: 24.832799911499997, isSearchable: true },

    // Latvia (Top 1)
    { iataCode: 'RIX', name: 'Riga International Airport', city: 'Riga', country: 'Latvia', latitude: 56.92359924316406, longitude: 23.971099853515625, isSearchable: true },

    // Lithuania (Top 3)
    { iataCode: 'VNO', name: 'Vilnius Airport', city: 'Vilnius', country: 'Lithuania', latitude: 54.634102, longitude: 25.285801, isSearchable: true },
    { iataCode: 'KUN', name: 'Kaunas Airport', city: 'Kaunas', country: 'Lithuania', latitude: 54.96390151977539, longitude: 24.084800720214844, isSearchable: true },
    { iataCode: 'PLQ', name: 'Palanga International Airport', city: 'Palanga', country: 'Lithuania', latitude: 55.973201751708984, longitude: 21.093900680541992, isSearchable: true },

    // Slovakia (Top 2)
    { iataCode: 'BTS', name: 'Bratislava Airport', city: 'Bratislava', country: 'Slovakia', latitude: 48.17020034790039, longitude: 17.21269989013672, isSearchable: true },
    { iataCode: 'KSC', name: 'Košice International Airport', city: 'Košice', country: 'Slovakia', latitude: 48.66310119628906, longitude: 21.241100311279297, isSearchable: true },

    // Slovenia (Top 1)
    { iataCode: 'LJU', name: 'Ljubljana Jože Pučnik Airport', city: 'Ljubljana', country: 'Slovenia', latitude: 46.223701, longitude: 14.4576, isSearchable: true },

    // Serbia (Top 2)
    { iataCode: 'BEG', name: 'Belgrade Nikola Tesla Airport', city: 'Belgrade', country: 'Serbia', latitude: 44.8184013367, longitude: 20.3090991974, isSearchable: true },
    { iataCode: 'INI', name: 'Niš Constantine the Great Airport', city: 'Niš', country: 'Serbia', latitude: 43.337299, longitude: 21.853701, isSearchable: true },

    // Asia-Pacific - Comprehensive Coverage

    // Japan (Top 10)
    { iataCode: 'HND', name: 'Tokyo Haneda Airport', city: 'Tokyo', country: 'Japan', latitude: 35.552299, longitude: 139.779999, isSearchable: true },
    { iataCode: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan', latitude: 35.7647018433, longitude: 140.386001587, isSearchable: true },
    { iataCode: 'KIX', name: 'Kansai International Airport', city: 'Osaka', country: 'Japan', latitude: 34.42729949951172, longitude: 135.24400329589844, isSearchable: true },
    { iataCode: 'FUK', name: 'Fukuoka Airport', city: 'Fukuoka', country: 'Japan', latitude: 33.585899353027344, longitude: 130.4510040283203, isSearchable: true },
    { iataCode: 'CTS', name: 'New Chitose Airport', city: 'Sapporo', country: 'Japan', latitude: 42.77519989013672, longitude: 141.69200134277344, isSearchable: true },
    { iataCode: 'NGO', name: 'Chubu Centrair International Airport', city: 'Nagoya', country: 'Japan', latitude: 34.8583984375, longitude: 136.80499267578125, isSearchable: true },
    { iataCode: 'OKA', name: 'Naha Airport', city: 'Naha', country: 'Japan', latitude: 26.1958007812, longitude: 127.646003723, isSearchable: true },
    { iataCode: 'KOJ', name: 'Kagoshima Airport', city: 'Kagoshima', country: 'Japan', latitude: 31.80340003967285, longitude: 130.718994140625, isSearchable: true },
    { iataCode: 'HIJ', name: 'Hiroshima Airport', city: 'Hiroshima', country: 'Japan', latitude: 34.4361000061, longitude: 132.919006348, isSearchable: true },
    { iataCode: 'SDJ', name: 'Sendai Airport', city: 'Sendai', country: 'Japan', latitude: 38.1397018433, longitude: 140.917007446, isSearchable: true },

    // China (Top 15)
    { iataCode: 'PEK', name: 'Beijing Capital International Airport', city: 'Beijing', country: 'China', latitude: 40.080101013183594, longitude: 116.58499908447266, isSearchable: true },
    { iataCode: 'PVG', name: 'Shanghai Pudong International Airport', city: 'Shanghai', country: 'China', latitude: 31.143400192260742, longitude: 121.80500030517578, isSearchable: true },
    { iataCode: 'CAN', name: 'Guangzhou Baiyun International Airport', city: 'Guangzhou', country: 'China', latitude: 23.39240074157715, longitude: 113.29900360107422, isSearchable: true },
    { iataCode: 'CTU', name: 'Chengdu Shuangliu International Airport', city: 'Chengdu', country: 'China', latitude: 30.578500747680664, longitude: 103.9469985961914, isSearchable: true },
    { iataCode: 'SZX', name: 'Shenzhen Bao\'an International Airport', city: 'Shenzhen', country: 'China', isSearchable: true },
    { iataCode: 'KMG', name: 'Kunming Changshui International Airport', city: 'Kunming', country: 'China', latitude: 25.1019444, longitude: 102.9291667, isSearchable: true },
    { iataCode: 'XIY', name: 'Xi\'an Xianyang International Airport', city: 'Xi\'an', country: 'China', isSearchable: true },
    { iataCode: 'CKG', name: 'Chongqing Jiangbei International Airport', city: 'Chongqing', country: 'China', latitude: 29.719200134277344, longitude: 106.64199829101562, isSearchable: true },
    { iataCode: 'HGH', name: 'Hangzhou Xiaoshan International Airport', city: 'Hangzhou', country: 'China', latitude: 30.22949981689453, longitude: 120.43399810791016, isSearchable: true },
    { iataCode: 'SHA', name: 'Shanghai Hongqiao International Airport', city: 'Shanghai', country: 'China', latitude: 31.197900772094727, longitude: 121.33599853515625, isSearchable: true },
    { iataCode: 'WUH', name: 'Wuhan Tianhe International Airport', city: 'Wuhan', country: 'China', latitude: 30.7838, longitude: 114.208, isSearchable: true },
    { iataCode: 'NKG', name: 'Nanjing Lukou International Airport', city: 'Nanjing', country: 'China', latitude: 31.742000579833984, longitude: 118.86199951171875, isSearchable: true },
    { iataCode: 'TSN', name: 'Tianjin Binhai International Airport', city: 'Tianjin', country: 'China', latitude: 39.124401092499994, longitude: 117.346000671, isSearchable: true },
    { iataCode: 'DLC', name: 'Dalian Zhoushuizi International Airport', city: 'Dalian', country: 'China', latitude: 38.9656982421875, longitude: 121.53900146484375, isSearchable: true },
    { iataCode: 'TAO', name: 'Qingdao Liuting International Airport', city: 'Qingdao', country: 'China', latitude: 36.2661018372, longitude: 120.374000549, isSearchable: true },

    // India (Top 10)
    { iataCode: 'DEL', name: 'Indira Gandhi International Airport', city: 'New Delhi', country: 'India', latitude: 28.5665, longitude: 77.103104, isSearchable: true },
    { iataCode: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', country: 'India', latitude: 19.0886993408, longitude: 72.8678970337, isSearchable: true },
    { iataCode: 'BLR', name: 'Kempegowda International Airport', city: 'Bangalore', country: 'India', latitude: 13.1979, longitude: 77.706299, isSearchable: true },
    { iataCode: 'HYD', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', country: 'India', latitude: 17.2313175201, longitude: 78.4298553467, isSearchable: true },
    { iataCode: 'MAA', name: 'Chennai International Airport', city: 'Chennai', country: 'India', latitude: 12.990005493164062, longitude: 80.16929626464844, isSearchable: true },
    { iataCode: 'CCU', name: 'Netaji Subhas Chandra Bose International Airport', city: 'Kolkata', country: 'India', latitude: 22.654699325561523, longitude: 88.44670104980469, isSearchable: true },
    { iataCode: 'GOI', name: 'Dabolim Airport', city: 'Goa', country: 'India', latitude: 15.3808002472, longitude: 73.8313980103, isSearchable: true },
    { iataCode: 'COK', name: 'Cochin International Airport', city: 'Kochi', country: 'India', latitude: 10.152, longitude: 76.401901, isSearchable: true },
    { iataCode: 'JAI', name: 'Jaipur International Airport', city: 'Jaipur', country: 'India', latitude: 26.8242, longitude: 75.812202, isSearchable: true },
    { iataCode: 'AMD', name: 'Sardar Vallabhbhai Patel International Airport', city: 'Ahmedabad', country: 'India', latitude: 23.0771999359, longitude: 72.63469696039999, isSearchable: true },

    // South Korea (Top 5)
    { iataCode: 'ICN', name: 'Incheon International Airport', city: 'Seoul', country: 'South Korea', latitude: 37.46910095214844, longitude: 126.45099639892578, isSearchable: true },
    { iataCode: 'GMP', name: 'Gimpo International Airport', city: 'Seoul', country: 'South Korea', latitude: 37.5583, longitude: 126.791, isSearchable: true },
    { iataCode: 'PUS', name: 'Gimhae International Airport', city: 'Busan', country: 'South Korea', latitude: 35.1795005798, longitude: 128.93800354, isSearchable: true },
    { iataCode: 'CJU', name: 'Jeju International Airport', city: 'Jeju', country: 'South Korea', latitude: 33.51129913330078, longitude: 126.49299621582031, isSearchable: true },
    { iataCode: 'TAE', name: 'Daegu International Airport', city: 'Daegu', country: 'South Korea', latitude: 35.896872, longitude: 128.65531, isSearchable: true },

    // Southeast Asia
    { iataCode: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', latitude: 13.681099891662598, longitude: 100.74700164794922, isSearchable: true },
    { iataCode: 'DMK', name: 'Don Mueang International Airport', city: 'Bangkok', country: 'Thailand', latitude: 13.9125995636, longitude: 100.607002258, isSearchable: true },
    { iataCode: 'HKT', name: 'Phuket International Airport', city: 'Phuket', country: 'Thailand', latitude: 8.1132, longitude: 98.316902, isSearchable: true },
    { iataCode: 'CNX', name: 'Chiang Mai International Airport', city: 'Chiang Mai', country: 'Thailand', latitude: 18.766799926799997, longitude: 98.962600708, isSearchable: true },
    { iataCode: 'USM', name: 'Samui Airport', city: 'Koh Samui', country: 'Thailand', latitude: 9.547789573669998, longitude: 100.06199646, isSearchable: true },
    { iataCode: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore', latitude: 1.35019, longitude: 103.994003, isSearchable: true },
    { iataCode: 'KUL', name: 'Kuala Lumpur International Airport', city: 'Kuala Lumpur', country: 'Malaysia', latitude: 2.745579957962, longitude: 101.70999908447, isSearchable: true },
    { iataCode: 'PEN', name: 'Penang International Airport', city: 'Penang', country: 'Malaysia', latitude: 5.297140121459961, longitude: 100.2770004272461, isSearchable: true },
    { iataCode: 'LGK', name: 'Langkawi International Airport', city: 'Langkawi', country: 'Malaysia', latitude: 6.329730033874512, longitude: 99.72869873046875, isSearchable: true },
    { iataCode: 'JHB', name: 'Senai International Airport', city: 'Johor Bahru', country: 'Malaysia', latitude: 1.64131, longitude: 103.669998, isSearchable: true },
    { iataCode: 'CGK', name: 'Soekarno-Hatta International Airport', city: 'Jakarta', country: 'Indonesia', latitude: -6.1255698204, longitude: 106.65599823, isSearchable: true },
    { iataCode: 'DPS', name: 'Ngurah Rai International Airport', city: 'Denpasar', country: 'Indonesia', latitude: -8.7481698989868, longitude: 115.16699981689, isSearchable: true },
    { iataCode: 'SUB', name: 'Juanda International Airport', city: 'Surabaya', country: 'Indonesia', latitude: -7.3798298835754395, longitude: 112.78700256347656, isSearchable: true },
    { iataCode: 'JOG', name: 'Adisutjipto International Airport', city: 'Yogyakarta', country: 'Indonesia', latitude: -7.788179874420166, longitude: 110.43199920654297, isSearchable: true },
    { iataCode: 'MNL', name: 'Ninoy Aquino International Airport', city: 'Manila', country: 'Philippines', latitude: 14.5086, longitude: 121.019997, isSearchable: true },
    { iataCode: 'CEB', name: 'Mactan-Cebu International Airport', city: 'Cebu', country: 'Philippines', latitude: 10.307499885559, longitude: 123.97899627686, isSearchable: true },
    { iataCode: 'CRK', name: 'Clark International Airport', city: 'Angeles', country: 'Philippines', latitude: 15.186, longitude: 120.559998, isSearchable: true },
    { iataCode: 'SGN', name: 'Tan Son Nhat International Airport', city: 'Ho Chi Minh City', country: 'Vietnam', latitude: 10.8187999725, longitude: 106.652000427, isSearchable: true },
    { iataCode: 'HAN', name: 'Noi Bai International Airport', city: 'Hanoi', country: 'Vietnam', latitude: 21.221200942993164, longitude: 105.80699920654297, isSearchable: true },
    { iataCode: 'DAD', name: 'Da Nang International Airport', city: 'Da Nang', country: 'Vietnam', latitude: 16.043899536132812, longitude: 108.1989974975586, isSearchable: true },

    // Taiwan & Hong Kong
    { iataCode: 'TPE', name: 'Taiwan Taoyuan International Airport', city: 'Taipei', country: 'Taiwan', latitude: 25.0777, longitude: 121.233002, isSearchable: true },
    { iataCode: 'TSA', name: 'Taipei Songshan Airport', city: 'Taipei', country: 'Taiwan', latitude: 25.069400787353516, longitude: 121.552001953125, isSearchable: true },
    { iataCode: 'KHH', name: 'Kaohsiung International Airport', city: 'Kaohsiung', country: 'Taiwan', latitude: 22.57710075378418, longitude: 120.3499984741211, isSearchable: true },
    { iataCode: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'Hong Kong', latitude: 22.308901, longitude: 113.915001, isSearchable: true },

    // Australia (Top 8)
    { iataCode: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia', latitude: -33.94609832763672, longitude: 151.177001953125, isSearchable: true },
    { iataCode: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia', latitude: -37.673302, longitude: 144.843002, isSearchable: true },
    { iataCode: 'BNE', name: 'Brisbane Airport', city: 'Brisbane', country: 'Australia', latitude: -27.384199142456055, longitude: 153.11700439453125, isSearchable: true },
    { iataCode: 'PER', name: 'Perth Airport', city: 'Perth', country: 'Australia', latitude: -31.94029998779297, longitude: 115.96700286865234, isSearchable: true },
    { iataCode: 'ADL', name: 'Adelaide Airport', city: 'Adelaide', country: 'Australia', latitude: -34.945, longitude: 138.531006, isSearchable: true },
    { iataCode: 'OOL', name: 'Gold Coast Airport', city: 'Gold Coast', country: 'Australia', latitude: -28.1644001007, longitude: 153.505004883, isSearchable: true },
    { iataCode: 'CNS', name: 'Cairns Airport', city: 'Cairns', country: 'Australia', latitude: -16.885799408, longitude: 145.755004883, isSearchable: true },
    { iataCode: 'CBR', name: 'Canberra Airport', city: 'Canberra', country: 'Australia', latitude: -35.30690002441406, longitude: 149.19500732421875, isSearchable: true },

    // New Zealand (Top 5)
    { iataCode: 'AKL', name: 'Auckland Airport', city: 'Auckland', country: 'New Zealand', latitude: -37.008098602299995, longitude: 174.792007446, isSearchable: true },
    { iataCode: 'CHC', name: 'Christchurch International Airport', city: 'Christchurch', country: 'New Zealand', latitude: -43.48939895629883, longitude: 172.53199768066406, isSearchable: true },
    { iataCode: 'WLG', name: 'Wellington International Airport', city: 'Wellington', country: 'New Zealand', latitude: -41.3272018433, longitude: 174.804992676, isSearchable: true },
    { iataCode: 'ZQN', name: 'Queenstown Airport', city: 'Queenstown', country: 'New Zealand', latitude: -45.0210990906, longitude: 168.738998413, isSearchable: true },
    { iataCode: 'DUD', name: 'Dunedin Airport', city: 'Dunedin', country: 'New Zealand', latitude: -45.9281005859375, longitude: 170.197998046875, isSearchable: true },

    // Middle East (Top 15)
    { iataCode: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates', latitude: 25.2527999878, longitude: 55.3643989563, isSearchable: true },
    { iataCode: 'AUH', name: 'Abu Dhabi International Airport', city: 'Abu Dhabi', country: 'United Arab Emirates', latitude: 24.433000564575195, longitude: 54.651100158691406, isSearchable: true },
    { iataCode: 'SHJ', name: 'Sharjah International Airport', city: 'Sharjah', country: 'United Arab Emirates', latitude: 25.32859992980957, longitude: 55.5172004699707, isSearchable: true },
    { iataCode: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar', latitude: 25.273056, longitude: 51.608056, isSearchable: true },
    { iataCode: 'RUH', name: 'King Khalid International Airport', city: 'Riyadh', country: 'Saudi Arabia', latitude: 24.957599639892578, longitude: 46.69879913330078, isSearchable: true },
    { iataCode: 'JED', name: 'King Abdulaziz International Airport', city: 'Jeddah', country: 'Saudi Arabia', latitude: 21.6796, longitude: 39.156502, isSearchable: true },
    { iataCode: 'DMM', name: 'King Fahd International Airport', city: 'Dammam', country: 'Saudi Arabia', latitude: 26.471200942993164, longitude: 49.79790115356445, isSearchable: true },
    { iataCode: 'TLV', name: 'Ben Gurion Airport', city: 'Tel Aviv', country: 'Israel', latitude: 32.01139831542969, longitude: 34.88669967651367, isSearchable: true },
    { iataCode: 'AMM', name: 'Queen Alia International Airport', city: 'Amman', country: 'Jordan', latitude: 31.7226009369, longitude: 35.9931983948, isSearchable: true },
    { iataCode: 'MCT', name: 'Muscat International Airport', city: 'Muscat', country: 'Oman', latitude: 23.593299865722656, longitude: 58.284400939941406, isSearchable: true },
    { iataCode: 'KWI', name: 'Kuwait International Airport', city: 'Kuwait City', country: 'Kuwait', latitude: 29.226600646972656, longitude: 47.96889877319336, isSearchable: true },
    { iataCode: 'BAH', name: 'Bahrain International Airport', city: 'Manama', country: 'Bahrain', latitude: 26.27079963684082, longitude: 50.63359832763672, isSearchable: true },
    { iataCode: 'BEY', name: 'Rafic Hariri International Airport', city: 'Beirut', country: 'Lebanon', latitude: 33.820899963378906, longitude: 35.488399505615234, isSearchable: true },
    { iataCode: 'EVN', name: 'Zvartnots International Airport', city: 'Yerevan', country: 'Armenia', latitude: 40.1473007202, longitude: 44.3959007263, isSearchable: true },
    { iataCode: 'TBS', name: 'Tbilisi International Airport', city: 'Tbilisi', country: 'Georgia', latitude: 41.6692008972, longitude: 44.95470047, isSearchable: true },

    // South America - Comprehensive Coverage

    // Brazil (Top 12)
    { iataCode: 'GRU', name: 'São Paulo/Guarulhos International Airport', city: 'São Paulo', country: 'Brazil', latitude: -23.435556411743164, longitude: -46.47305679321289, isSearchable: true },
    { iataCode: 'GIG', name: 'Rio de Janeiro/Galeão International Airport', city: 'Rio de Janeiro', country: 'Brazil', latitude: -22.8099994659, longitude: -43.2505569458, isSearchable: true },
    { iataCode: 'BSB', name: 'Brasília International Airport', city: 'Brasília', country: 'Brazil', latitude: -15.86916732788086, longitude: -47.920833587646484, isSearchable: true },
    { iataCode: 'CGH', name: 'Congonhas Airport', city: 'São Paulo', country: 'Brazil', latitude: -23.626110076904297, longitude: -46.65638732910156, isSearchable: true },
    { iataCode: 'SSA', name: 'Salvador International Airport', city: 'Salvador', country: 'Brazil', latitude: -12.9086112976, longitude: -38.3224983215, isSearchable: true },
    { iataCode: 'FOR', name: 'Pinto Martins International Airport', city: 'Fortaleza', country: 'Brazil', latitude: -3.776279926300049, longitude: -38.53260040283203, isSearchable: true },
    { iataCode: 'MAO', name: 'Eduardo Gomes International Airport', city: 'Manaus', country: 'Brazil', latitude: -3.0386099815368652, longitude: -60.04970169067383, isSearchable: true },
    { iataCode: 'REC', name: 'Recife/Guararapes International Airport', city: 'Recife', country: 'Brazil', latitude: -8.126489639282227, longitude: -34.92359924316406, isSearchable: true },
    { iataCode: 'CWB', name: 'Afonso Pena International Airport', city: 'Curitiba', country: 'Brazil', latitude: -25.5284996033, longitude: -49.1758003235, isSearchable: true },
    { iataCode: 'POA', name: 'Salgado Filho International Airport', city: 'Porto Alegre', country: 'Brazil', latitude: -29.994400024414062, longitude: -51.1713981628418, isSearchable: true },
    { iataCode: 'BEL', name: 'Val de Cans International Airport', city: 'Belém', country: 'Brazil', latitude: -1.3792500495900002, longitude: -48.4762992859, isSearchable: true },
    { iataCode: 'CNF', name: 'Tancredo Neves International Airport', city: 'Belo Horizonte', country: 'Brazil', latitude: -19.62444305419922, longitude: -43.97194290161133, isSearchable: true },

    // Argentina (Top 5)
    { iataCode: 'EZE', name: 'Ministro Pistarini International Airport', city: 'Buenos Aires', country: 'Argentina', latitude: -34.8222, longitude: -58.5358, isSearchable: true },
    { iataCode: 'AEP', name: 'Jorge Newbery Airpark', city: 'Buenos Aires', country: 'Argentina', latitude: -34.5592, longitude: -58.4156, isSearchable: true },
    { iataCode: 'COR', name: 'Ingeniero Aeronáutico Ambrosio L.V. Taravella International Airport', city: 'Córdoba', country: 'Argentina', latitude: -31.323601, longitude: -64.208, isSearchable: true },
    { iataCode: 'MDZ', name: 'Governor Francisco Gabrielli International Airport', city: 'Mendoza', country: 'Argentina', latitude: -32.8316993713, longitude: -68.7929000854, isSearchable: true },
    { iataCode: 'BRC', name: 'San Carlos de Bariloche Airport', city: 'Bariloche', country: 'Argentina', latitude: -41.151199, longitude: -71.157501, isSearchable: true },

    // Colombia (Top 5)
    { iataCode: 'BOG', name: 'El Dorado International Airport', city: 'Bogotá', country: 'Colombia', latitude: 4.70159, longitude: -74.1469, isSearchable: true },
    { iataCode: 'MDE', name: 'José María Córdova International Airport', city: 'Medellín', country: 'Colombia', latitude: 6.16454, longitude: -75.4231, isSearchable: true },
    { iataCode: 'CLO', name: 'Alfonso Bonilla Aragón International Airport', city: 'Cali', country: 'Colombia', latitude: 3.54322, longitude: -76.3816, isSearchable: true },
    { iataCode: 'CTG', name: 'Rafael Núñez International Airport', city: 'Cartagena', country: 'Colombia', latitude: 10.4424, longitude: -75.513, isSearchable: true },
    { iataCode: 'BAQ', name: 'Ernesto Cortissoz International Airport', city: 'Barranquilla', country: 'Colombia', latitude: 10.8896, longitude: -74.7808, isSearchable: true },

    // Peru (Top 3)
    { iataCode: 'LIM', name: 'Jorge Chávez International Airport', city: 'Lima', country: 'Peru', latitude: -12.0219, longitude: -77.114305, isSearchable: true },
    { iataCode: 'CUZ', name: 'Alejandro Velasco Astete International Airport', city: 'Cusco', country: 'Peru', latitude: -13.535699844400002, longitude: -71.9387969971, isSearchable: true },
    { iataCode: 'AQP', name: 'Rodríguez Ballón International Airport', city: 'Arequipa', country: 'Peru', latitude: -16.3411006927, longitude: -71.5830993652, isSearchable: true },

    // Chile (Top 3)
    { iataCode: 'SCL', name: 'Arturo Merino Benítez International Airport', city: 'Santiago', country: 'Chile', latitude: -33.393001556396484, longitude: -70.78579711914062, isSearchable: true },
    { iataCode: 'ANF', name: 'Andrés Sabella Gálvez International Airport', city: 'Antofagasta', country: 'Chile', latitude: -23.444501, longitude: -70.445099, isSearchable: true },
    { iataCode: 'IPC', name: 'Mataveri International Airport', city: 'Easter Island', country: 'Chile', latitude: -27.1648006439, longitude: -109.42199707, isSearchable: true },

    // Ecuador (Top 2)
    { iataCode: 'UIO', name: 'Mariscal Sucre International Airport', city: 'Quito', country: 'Ecuador', latitude: -0.129166666667, longitude: -78.3575, isSearchable: true },
    { iataCode: 'GYE', name: 'José Joaquín de Olmedo International Airport', city: 'Guayaquil', country: 'Ecuador', latitude: -2.1574199199699997, longitude: -79.88359832760001, isSearchable: true },

    // Other South American Countries
    { iataCode: 'MVD', name: 'Carrasco International Airport', city: 'Montevideo', country: 'Uruguay', latitude: -34.838402, longitude: -56.0308, isSearchable: true },
    { iataCode: 'ASU', name: 'Silvio Pettirossi International Airport', city: 'Asunción', country: 'Paraguay', latitude: -25.239999771118164, longitude: -57.52000045776367, isSearchable: true },
    { iataCode: 'LPB', name: 'El Alto International Airport', city: 'La Paz', country: 'Bolivia', latitude: -16.5132999420166, longitude: -68.19229888916016, isSearchable: true },
    { iataCode: 'VVI', name: 'Viru Viru International Airport', city: 'Santa Cruz', country: 'Bolivia', latitude: -17.6448, longitude: -63.135399, isSearchable: true },
    { iataCode: 'PBM', name: 'Johan Adolf Pengel International Airport', city: 'Paramaribo', country: 'Suriname', latitude: 5.4528298377999995, longitude: -55.1878013611, isSearchable: true },
    { iataCode: 'GEO', name: 'Cheddi Jagan International Airport', city: 'Georgetown', country: 'Guyana', latitude: 6.498549938201904, longitude: -58.25410079956055, isSearchable: true },

    // Africa - Comprehensive Coverage

    // North Africa
    { iataCode: 'CAI', name: 'Cairo International Airport', city: 'Cairo', country: 'Egypt', latitude: 30.12190055847168, longitude: 31.40559959411621, isSearchable: true },
    { iataCode: 'HRG', name: 'Hurghada International Airport', city: 'Hurghada', country: 'Egypt', latitude: 27.178300857543945, longitude: 33.799400329589844, isSearchable: true },
    { iataCode: 'SSH', name: 'Sharm El Sheikh International Airport', city: 'Sharm El Sheikh', country: 'Egypt', latitude: 27.9773006439, longitude: 34.3950004578, isSearchable: true },
    { iataCode: 'CMN', name: 'Mohammed V International Airport', city: 'Casablanca', country: 'Morocco', latitude: 33.36750030517578, longitude: -7.589970111846924, isSearchable: true },
    { iataCode: 'RAK', name: 'Marrakesh Menara Airport', city: 'Marrakesh', country: 'Morocco', latitude: 31.606899261499997, longitude: -8.03629970551, isSearchable: true },
    { iataCode: 'FEZ', name: 'Fès–Saïs Airport', city: 'Fès', country: 'Morocco', latitude: 33.9272994995, longitude: -4.977960109709999, isSearchable: true },
    { iataCode: 'TNG', name: 'Tangier Ibn Battouta Airport', city: 'Tangier', country: 'Morocco', latitude: 35.726898193400004, longitude: -5.91689014435, isSearchable: true },
    { iataCode: 'ALG', name: 'Houari Boumediene Airport', city: 'Algiers', country: 'Algeria', latitude: 36.691001892089844, longitude: 3.215409994125366, isSearchable: true },
    { iataCode: 'TUN', name: 'Tunis-Carthage International Airport', city: 'Tunis', country: 'Tunisia', latitude: 36.85100173950195, longitude: 10.22719955444336, isSearchable: true },
    { iataCode: 'DJE', name: 'Djerba-Zarzis International Airport', city: 'Djerba', country: 'Tunisia', latitude: 33.875, longitude: 10.775500297546387, isSearchable: true },

    // East Africa
    { iataCode: 'NBO', name: 'Jomo Kenyatta International Airport', city: 'Nairobi', country: 'Kenya', latitude: -1.31923997402, longitude: 36.9277992249, isSearchable: true },
    { iataCode: 'MBA', name: 'Moi International Airport', city: 'Mombasa', country: 'Kenya', latitude: -4.034830093383789, longitude: 39.594200134277344, isSearchable: true },
    { iataCode: 'ADD', name: 'Addis Ababa Bole International Airport', city: 'Addis Ababa', country: 'Ethiopia', latitude: 8.97789001465, longitude: 38.799301147499996, isSearchable: true },
    { iataCode: 'DAR', name: 'Julius Nyerere International Airport', city: 'Dar es Salaam', country: 'Tanzania', latitude: -6.87811, longitude: 39.202599, isSearchable: true },
    { iataCode: 'ZNZ', name: 'Abeid Amani Karume International Airport', city: 'Zanzibar', country: 'Tanzania', latitude: -6.22202, longitude: 39.224899, isSearchable: true },
    { iataCode: 'JRO', name: 'Kilimanjaro International Airport', city: 'Kilimanjaro', country: 'Tanzania', latitude: -3.42940998077, longitude: 37.0745010376, isSearchable: true },
    { iataCode: 'EBB', name: 'Entebbe International Airport', city: 'Entebbe', country: 'Uganda', latitude: 0.042386, longitude: 32.443501, isSearchable: true },
    { iataCode: 'KGL', name: 'Kigali International Airport', city: 'Kigali', country: 'Rwanda', latitude: -1.96863, longitude: 30.1395, isSearchable: true },

    // Southern Africa
    { iataCode: 'JNB', name: 'O.R. Tambo International Airport', city: 'Johannesburg', country: 'South Africa', latitude: -26.1392, longitude: 28.246, isSearchable: true },
    { iataCode: 'CPT', name: 'Cape Town International Airport', city: 'Cape Town', country: 'South Africa', latitude: -33.9648017883, longitude: 18.6016998291, isSearchable: true },
    { iataCode: 'DUR', name: 'King Shaka International Airport', city: 'Durban', country: 'South Africa', latitude: -29.6144444444, longitude: 31.1197222222, isSearchable: true },
    { iataCode: 'VFA', name: 'Victoria Falls International Airport', city: 'Victoria Falls', country: 'Zimbabwe', latitude: -18.09589958190918, longitude: 25.839000701904297, isSearchable: true },
    { iataCode: 'WDH', name: 'Hosea Kutako International Airport', city: 'Windhoek', country: 'Namibia', latitude: -22.4799, longitude: 17.4709, isSearchable: true },
    { iataCode: 'GBE', name: 'Sir Seretse Khama International Airport', city: 'Gaborone', country: 'Botswana', latitude: -24.555201, longitude: 25.9182, isSearchable: true },
    { iataCode: 'MRU', name: 'Sir Seewoosagur Ramgoolam International Airport', city: 'Mauritius', country: 'Mauritius', latitude: -20.430201, longitude: 57.683601, isSearchable: true },
    { iataCode: 'SEZ', name: 'Seychelles International Airport', city: 'Mahé', country: 'Seychelles', latitude: -4.67434, longitude: 55.521801, isSearchable: true },

    // West Africa
    { iataCode: 'LOS', name: 'Murtala Muhammed International Airport', city: 'Lagos', country: 'Nigeria', latitude: 6.5773701667785645, longitude: 3.321160078048706, isSearchable: true },
    { iataCode: 'ABV', name: 'Nnamdi Azikiwe International Airport', city: 'Abuja', country: 'Nigeria', latitude: 9.006790161132812, longitude: 7.263169765472412, isSearchable: true },
    { iataCode: 'ACC', name: 'Kotoka International Airport', city: 'Accra', country: 'Ghana', latitude: 5.605189800262451, longitude: -0.16678600013256073, isSearchable: true },
    { iataCode: 'DSS', name: 'Blaise Diagne International Airport', city: 'Dakar', country: 'Senegal', latitude: 14.67, longitude: -17.073333, isSearchable: true },
    { iataCode: 'ABJ', name: 'Félix-Houphouët-Boigny International Airport', city: 'Abidjan', country: 'Ivory Coast', latitude: 5.261390209197998, longitude: -3.9262900352478027, isSearchable: true },

    // Caribbean & Central America

    // Caribbean Islands (SJU already in US section as Puerto Rico)
    { iataCode: 'PUJ', name: 'Punta Cana International Airport', city: 'Punta Cana', country: 'Dominican Republic', latitude: 18.567399978599997, longitude: -68.36340332030001, isSearchable: true },
    { iataCode: 'SDQ', name: 'Las Américas International Airport', city: 'Santo Domingo', country: 'Dominican Republic', latitude: 18.42970085144, longitude: -69.668899536133, isSearchable: true },
    { iataCode: 'MBJ', name: 'Sangster International Airport', city: 'Montego Bay', country: 'Jamaica', latitude: 18.503700256347656, longitude: -77.91339874267578, isSearchable: true },
    { iataCode: 'KIN', name: 'Norman Manley International Airport', city: 'Kingston', country: 'Jamaica', latitude: 17.935699462890625, longitude: -76.7874984741211, isSearchable: true },
    { iataCode: 'AUA', name: 'Queen Beatrix International Airport', city: 'Oranjestad', country: 'Aruba', latitude: 12.5014, longitude: -70.015198, isSearchable: true },
    { iataCode: 'CUR', name: 'Curaçao International Airport', city: 'Willemstad', country: 'Curaçao', latitude: 12.1889, longitude: -68.959801, isSearchable: true },
    { iataCode: 'BGI', name: 'Grantley Adams International Airport', city: 'Bridgetown', country: 'Barbados', latitude: 13.0746002197, longitude: -59.4925003052, isSearchable: true },
    { iataCode: 'POS', name: 'Piarco International Airport', city: 'Port of Spain', country: 'Trinidad and Tobago', latitude: 10.595399856567383, longitude: -61.33720016479492, isSearchable: true },
    { iataCode: 'NAS', name: 'Lynden Pindling International Airport', city: 'Nassau', country: 'Bahamas', latitude: 25.0389995575, longitude: -77.46620178219999, isSearchable: true },
    { iataCode: 'GND', name: 'Maurice Bishop International Airport', city: 'St. George\'s', country: 'Grenada', isSearchable: true },
    { iataCode: 'UVF', name: 'Hewanorra International Airport', city: 'Vieux Fort', country: 'Saint Lucia', latitude: 13.7332, longitude: -60.952599, isSearchable: true },
    { iataCode: 'HAV', name: 'José Martí International Airport', city: 'Havana', country: 'Cuba', latitude: 22.989200592041016, longitude: -82.40910339355469, isSearchable: true },
    { iataCode: 'VRA', name: 'Juan Gualberto Gómez Airport', city: 'Varadero', country: 'Cuba', latitude: 23.034400939941406, longitude: -81.435302734375, isSearchable: true },

    // Central America
    { iataCode: 'PTY', name: 'Tocumen International Airport', city: 'Panama City', country: 'Panama', latitude: 9.0713596344, longitude: -79.3834991455, isSearchable: true },
    { iataCode: 'SJO', name: 'Juan Santamaría International Airport', city: 'San José', country: 'Costa Rica', latitude: 9.993860244750977, longitude: -84.20880126953125, isSearchable: true },
    { iataCode: 'LIR', name: 'Daniel Oduber Quirós International Airport', city: 'Liberia', country: 'Costa Rica', latitude: 10.5933, longitude: -85.544403, isSearchable: true },
    { iataCode: 'GUA', name: 'La Aurora International Airport', city: 'Guatemala City', country: 'Guatemala', latitude: 14.5833, longitude: -90.527496, isSearchable: true },
    { iataCode: 'SAL', name: 'Monseñor Óscar Arnulfo Romero International Airport', city: 'San Salvador', country: 'El Salvador', latitude: 13.4409, longitude: -89.055702, isSearchable: true },
    { iataCode: 'MGA', name: 'Augusto C. Sandino International Airport', city: 'Managua', country: 'Nicaragua', latitude: 12.141500473022461, longitude: -86.16819763183594, isSearchable: true },
    { iataCode: 'TGU', name: 'Toncontín International Airport', city: 'Tegucigalpa', country: 'Honduras', latitude: 14.06089973449707, longitude: -87.21720123291016, isSearchable: true },
    { iataCode: 'BZE', name: 'Philip S. W. Goldson International Airport', city: 'Belize City', country: 'Belize', latitude: 17.539100646972656, longitude: -88.30819702148438, isSearchable: true },
  ]

  // Use createMany for bulk insert (much faster)
  await prisma.airport.createMany({
    data: airports,
    skipDuplicates: true // Skip if airport already exists
  })

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
