#!/usr/bin/env tsx
/**
 * Create Destinations for Airports Without Them
 *
 * Finds all airports that don't have a destination and creates one.
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`)
}

// Helper to get full country name from code
function getCountryName(code: string): string {
  const countryMap: Record<string, string> = {
    'US': 'United States', 'GB': 'United Kingdom', 'FR': 'France', 'DE': 'Germany',
    'IT': 'Italy', 'ES': 'Spain', 'CA': 'Canada', 'AU': 'Australia', 'JP': 'Japan',
    'CN': 'China', 'KR': 'South Korea', 'IN': 'India', 'BR': 'Brazil', 'MX': 'Mexico',
    'NL': 'Netherlands', 'BE': 'Belgium', 'CH': 'Switzerland', 'AT': 'Austria',
    'SE': 'Sweden', 'NO': 'Norway', 'DK': 'Denmark', 'FI': 'Finland', 'PT': 'Portugal',
    'GR': 'Greece', 'TR': 'Turkey', 'AE': 'United Arab Emirates', 'SA': 'Saudi Arabia',
    'IL': 'Israel', 'EG': 'Egypt', 'ZA': 'South Africa', 'KE': 'Kenya', 'MA': 'Morocco',
    'TH': 'Thailand', 'SG': 'Singapore', 'MY': 'Malaysia', 'ID': 'Indonesia',
    'PH': 'Philippines', 'VN': 'Vietnam', 'NZ': 'New Zealand', 'AR': 'Argentina',
    'CL': 'Chile', 'CO': 'Colombia', 'PE': 'Peru', 'PL': 'Poland', 'CZ': 'Czech Republic',
    'HU': 'Hungary', 'RO': 'Romania', 'HR': 'Croatia', 'RS': 'Serbia', 'BG': 'Bulgaria',
    'IE': 'Ireland', 'IS': 'Iceland', 'RU': 'Russia', 'UA': 'Ukraine', 'BY': 'Belarus',
    'LT': 'Lithuania', 'LV': 'Latvia', 'EE': 'Estonia', 'SK': 'Slovakia', 'SI': 'Slovenia',
    'AL': 'Albania', 'MK': 'North Macedonia', 'BA': 'Bosnia and Herzegovina', 'ME': 'Montenegro',
    'XK': 'Kosovo', 'MD': 'Moldova', 'AM': 'Armenia', 'GE': 'Georgia', 'AZ': 'Azerbaijan',
    'KZ': 'Kazakhstan', 'UZ': 'Uzbekistan', 'TM': 'Turkmenistan', 'KG': 'Kyrgyzstan',
    'TJ': 'Tajikistan', 'AF': 'Afghanistan', 'PK': 'Pakistan', 'BD': 'Bangladesh',
    'LK': 'Sri Lanka', 'NP': 'Nepal', 'BT': 'Bhutan', 'MM': 'Myanmar', 'LA': 'Laos',
    'KH': 'Cambodia', 'BN': 'Brunei', 'TL': 'Timor-Leste', 'MN': 'Mongolia',
    'TW': 'Taiwan', 'HK': 'Hong Kong', 'MO': 'Macau', 'KP': 'North Korea',
    'IQ': 'Iraq', 'IR': 'Iran', 'SY': 'Syria', 'LB': 'Lebanon', 'JO': 'Jordan',
    'PS': 'Palestine', 'KW': 'Kuwait', 'QA': 'Qatar', 'BH': 'Bahrain', 'OM': 'Oman',
    'YE': 'Yemen', 'DZ': 'Algeria', 'TN': 'Tunisia', 'LY': 'Libya', 'SD': 'Sudan',
    'SS': 'South Sudan', 'ET': 'Ethiopia', 'ER': 'Eritrea', 'DJ': 'Djibouti', 'SO': 'Somalia',
    'UG': 'Uganda', 'RW': 'Rwanda', 'BI': 'Burundi', 'TZ': 'Tanzania', 'MZ': 'Mozambique',
    'MW': 'Malawi', 'ZM': 'Zambia', 'ZW': 'Zimbabwe', 'BW': 'Botswana', 'NA': 'Namibia',
    'AO': 'Angola', 'CD': 'DR Congo', 'CG': 'Republic of the Congo', 'GA': 'Gabon',
    'GQ': 'Equatorial Guinea', 'ST': 'São Tomé and Príncipe', 'CM': 'Cameroon',
    'CF': 'Central African Republic', 'TD': 'Chad', 'NE': 'Niger', 'NG': 'Nigeria',
    'BJ': 'Benin', 'TG': 'Togo', 'GH': 'Ghana', 'CI': 'Ivory Coast', 'LR': 'Liberia',
    'SL': 'Sierra Leone', 'GN': 'Guinea', 'GW': 'Guinea-Bissau', 'GM': 'Gambia',
    'SN': 'Senegal', 'MR': 'Mauritania', 'ML': 'Mali', 'BF': 'Burkina Faso',
    'LS': 'Lesotho', 'SZ': 'Eswatini', 'KM': 'Comoros', 'MU': 'Mauritius',
    'SC': 'Seychelles', 'MG': 'Madagascar', 'RE': 'Réunion', 'YT': 'Mayotte',
    'EC': 'Ecuador', 'VE': 'Venezuela', 'GY': 'Guyana', 'SR': 'Suriname', 'GF': 'French Guiana',
    'BO': 'Bolivia', 'PY': 'Paraguay', 'UY': 'Uruguay', 'FK': 'Falkland Islands',
    'NI': 'Nicaragua', 'HN': 'Honduras', 'SV': 'El Salvador', 'GT': 'Guatemala',
    'BZ': 'Belize', 'CR': 'Costa Rica', 'PA': 'Panama', 'CU': 'Cuba', 'JM': 'Jamaica',
    'HT': 'Haiti', 'DO': 'Dominican Republic', 'PR': 'Puerto Rico', 'VI': 'US Virgin Islands',
    'BB': 'Barbados', 'GD': 'Grenada', 'LC': 'Saint Lucia', 'VC': 'Saint Vincent',
    'TT': 'Trinidad and Tobago', 'BS': 'Bahamas', 'KY': 'Cayman Islands',
    'TC': 'Turks and Caicos', 'AI': 'Anguilla', 'AG': 'Antigua and Barbuda',
    'DM': 'Dominica', 'KN': 'Saint Kitts and Nevis', 'MS': 'Montserrat',
    'VG': 'British Virgin Islands', 'SX': 'Sint Maarten', 'MF': 'Saint Martin',
    'GP': 'Guadeloupe', 'MQ': 'Martinique', 'AW': 'Aruba', 'CW': 'Curaçao',
    'BM': 'Bermuda', 'GL': 'Greenland', 'FO': 'Faroe Islands', 'SJ': 'Svalbard',
    'AX': 'Åland Islands', 'GI': 'Gibraltar', 'MT': 'Malta', 'CY': 'Cyprus',
    'FJ': 'Fiji', 'PG': 'Papua New Guinea', 'SB': 'Solomon Islands', 'VU': 'Vanuatu',
    'NC': 'New Caledonia', 'PF': 'French Polynesia', 'WS': 'Samoa', 'TO': 'Tonga',
    'KI': 'Kiribati', 'TV': 'Tuvalu', 'NR': 'Nauru', 'PW': 'Palau', 'FM': 'Micronesia',
    'MH': 'Marshall Islands', 'GU': 'Guam', 'MP': 'Northern Mariana Islands',
    'AS': 'American Samoa', 'CK': 'Cook Islands', 'NU': 'Niue', 'TK': 'Tokelau',
    'WF': 'Wallis and Futuna', 'PN': 'Pitcairn Islands'
  }
  return countryMap[code] || code
}

async function main() {
  log('🚀 Creating destinations for airports without them...')

  try {
    // Find airports that don't have destinations
    const airportsWithoutDestinations = await db.airport.findMany({
      where: {
        destinations: {
          none: {}
        }
      },
      select: {
        iataCode: true,
        city: true,
        country: true
      }
    })

    log(`📊 Found ${airportsWithoutDestinations.length} airports without destinations`)

    if (airportsWithoutDestinations.length === 0) {
      log('✅ All airports already have destinations!')
      return
    }

    let created = 0
    let countriesCreated = 0

    for (const airport of airportsWithoutDestinations) {
      // Check/create country
      let country = await db.country.findUnique({
        where: { code: airport.country }
      })

      if (!country) {
        const countryName = getCountryName(airport.country)
        country = await db.country.create({
          data: {
            code: airport.country,
            name: countryName
          }
        })
        countriesCreated++
        log(`   ✅ Created country: ${countryName} (${airport.country})`)
      }

      // Create destination
      const countryName = getCountryName(airport.country)
      await db.destination.create({
        data: {
          airportCode: airport.iataCode,
          cityName: airport.city,
          countryName: countryName,
          description: `Explore ${airport.city}, ${countryName}`
        }
      })

      created++

      if (created % 100 === 0) {
        log(`   📍 Created ${created}/${airportsWithoutDestinations.length} destinations...`)
      }
    }

    log(`\n✅ Created ${created} new destinations`)
    log(`✅ Created ${countriesCreated} new countries`)

    // Final stats
    const totalDestinations = await db.destination.count()
    const totalCountries = await db.country.count()
    const totalAirports = await db.airport.count()

    log(`\n📊 Final Statistics:`)
    log(`   🌍 Total airports: ${totalAirports}`)
    log(`   📍 Total destinations: ${totalDestinations}`)
    log(`   🌏 Total countries: ${totalCountries}`)

  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

main()
