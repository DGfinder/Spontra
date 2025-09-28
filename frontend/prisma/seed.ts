/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/password'

const prisma = new PrismaClient()

/**
 * Conservative, partner-safe templates:
 * - Impact network partners: use ?subId={clickId}
 * - CJ partners:           use ?sid={clickId}
 * NOTE: final partner URLs will differ per contract; these are placeholders to validate your architecture.
 */
const T = {
  // OTAs (Impact style)
  EXPEDIA_AU:
    "https://www.expedia.com.au/Flights-Search?trip={trip}&leg1=from:{orig},to:{dest},departure:{depDate}&" +
    "leg2=from:{dest},to:{orig},departure:{retDate}&passengers=adults:{adt},children:{chd},infantinlap:{infLap},infantinseat:{infSeat}&" +
    "cabinclass={cabin}&currency={currency}&langid={locale}&subId={clickId}",
  TRIP_COM_SG:
    "https://sg.trip.com/flights/{orig}-{dest}/?dc={depDate}&rc={retDate}&adult={adt}&child={chd}&infant={infLap}&" +
    "cabin={cabin}&currency={currency}&locale={locale}&subId={clickId}",
  KAYAK_AU:
    "https://www.kayak.com.au/flights/{orig}-{dest}/{depDate}/{retDate}?adults={adt}&children={chd}&c={cabin}&" +
    "currency={currency}&locale={locale}&subId={clickId}",
  SKYSCANNER_NZ:
    "https://www.skyscanner.net/transport/flights/{orig}/{dest}/{depDate}/{retDate}/?adultsv2={adt}&childrenv2={chd}&" +
    "cabinclass={cabin}&currency={currency}&locale={locale}&subId={clickId}",

  // Airlines (CJ style, sid param)
  QANTAS_AU:
    "https://www.qantas.com/flight-search/book?a=1&from={orig}&to={dest}&dd={depDate}&rd={retDate}&ad={adt}&ch={chd}&" +
    "inLap={infLap}&inSeat={infSeat}&cabin={cabin}&currency={currency}&locale={locale}&sid={clickId}",
  VIRGIN_AU:
    "https://www.virginaustralia.com/au/en/bookings/flights/?from={orig}&to={dest}&dd={depDate}&rd={retDate}&adults={adt}&children={chd}&" +
    "infants={infLap}&cabin={cabin}&currency={currency}&sid={clickId}",
  AIRNZ_NZ:
    "https://www.airnewzealand.co.nz/book/flights?from={orig}&to={dest}&dd={depDate}&rd={retDate}&adults={adt}&children={chd}&" +
    "infants={infLap}&cabinclass={cabin}&currency={currency}&sid={clickId}",
  SIA_SG:
    "https://www.singaporeair.com/booking?org={orig}&dest={dest}&dd={depDate}&rd={retDate}&adt={adt}&chd={chd}&inf={infLap}&" +
    "cabin={cabin}&currency={currency}&sid={clickId}",
  BA_GB:
    "https://www.britishairways.com/travel/book/public/en_gb?eId=111083&from={orig}&to={dest}&depDate={depDate}&retDate={retDate}&" +
    "ad={adt}&ch={chd}&in={infLap}&cabin={cabin}&currency={currency}&sid={clickId}",
};

type SeedProvider = {
  providerId: string;
  market: "AU" | "NZ" | "GB" | "SG" | "JP";
  network: "impact" | "cj";
  reliabilityScore: number;
  expectedEPC: number;
  supportsInfants: boolean;
  allowedAirlines?: string; // CSV IATA or '*'
  currencyModes?: string;
  template: string;
  requiredTokens: string[];
  notes?: string;
};

const providers: SeedProvider[] = [
  // ── AU ─────────────────────────────────────────────
  {
    providerId: "Expedia",
    market: "AU",
    network: "impact",
    reliabilityScore: 0.9,
    expectedEPC: 0.45,
    supportsInfants: true,
    currencyModes: "NATIVE",
    template: T.EXPEDIA_AU,
    requiredTokens: ["trip","orig","dest","depDate","retDate","adt","chd","infLap","infSeat","cabin","currency","locale","clickId"],
    notes: "Impact AU program; uses subId for attribution",
  },
  {
    providerId: "KAYAK",
    market: "AU",
    network: "impact",
    reliabilityScore: 0.88,
    expectedEPC: 0.38,
    supportsInfants: true,
    currencyModes: "NATIVE",
    template: T.KAYAK_AU,
    requiredTokens: ["trip","orig","dest","depDate","retDate","adt","chd","cabin","currency","locale","clickId"],
  },
  {
    providerId: "Qantas",
    market: "AU",
    network: "cj",
    reliabilityScore: 0.92,
    expectedEPC: 0.52,
    supportsInfants: true,
    allowedAirlines: "QF",
    currencyModes: "NATIVE",
    template: T.QANTAS_AU,
    requiredTokens: ["orig","dest","depDate","retDate","adt","chd","infLap","infSeat","cabin","currency","locale","clickId"],
  },
  {
    providerId: "VirginAustralia",
    market: "AU",
    network: "cj",
    reliabilityScore: 0.87,
    expectedEPC: 0.40,
    supportsInfants: true,
    allowedAirlines: "VA",
    currencyModes: "NATIVE",
    template: T.VIRGIN_AU,
    requiredTokens: ["orig","dest","depDate","retDate","adt","chd","infLap","cabin","currency","clickId"],
  },

  // ── NZ ─────────────────────────────────────────────
  {
    providerId: "Skyscanner",
    market: "NZ",
    network: "impact",
    reliabilityScore: 0.9,
    expectedEPC: 0.42,
    supportsInfants: true,
    template: T.SKYSCANNER_NZ,
    requiredTokens: ["orig","dest","depDate","retDate","adt","chd","cabin","currency","locale","clickId","trip"],
  },
  {
    providerId: "AirNewZealand",
    market: "NZ",
    network: "cj",
    reliabilityScore: 0.93,
    expectedEPC: 0.55,
    supportsInfants: true,
    allowedAirlines: "NZ",
    template: T.AIRNZ_NZ,
    requiredTokens: ["orig","dest","depDate","retDate","adt","chd","infLap","cabin","currency","clickId"],
  },

  // ── GB (Europe hub) ────────────────────────────────
  {
    providerId: "BritishAirways",
    market: "GB",
    network: "cj",
    reliabilityScore: 0.9,
    expectedEPC: 0.5,
    supportsInfants: true,
    allowedAirlines: "BA",
    template: T.BA_GB,
    requiredTokens: ["orig","dest","depDate","retDate","adt","chd","infLap","cabin","currency","clickId"],
  },

  // ── SG (Asia hub) ──────────────────────────────────
  {
    providerId: "TripCom",
    market: "SG",
    network: "impact",
    reliabilityScore: 0.88,
    expectedEPC: 0.40,
    supportsInfants: true,
    template: T.TRIP_COM_SG,
    requiredTokens: ["orig","dest","depDate","retDate","adt","chd","infLap","cabin","currency","locale","clickId","trip"],
  },
  {
    providerId: "SingaporeAirlines",
    market: "SG",
    network: "cj",
    reliabilityScore: 0.92,
    expectedEPC: 0.48,
    supportsInfants: true,
    allowedAirlines: "SQ",
    template: T.SIA_SG,
    requiredTokens: ["orig","dest","depDate","retDate","adt","chd","infLap","cabin","currency","clickId"],
  },

  // ── JP (Asia) — keep one OTA for coverage ─────────
  {
    providerId: "KAYAK",
    market: "JP",
    network: "impact",
    reliabilityScore: 0.86,
    expectedEPC: 0.36,
    supportsInfants: true,
    template: T.KAYAK_AU.replace("kayak.com.au","kayak.co.jp"),
    requiredTokens: ["trip","orig","dest","depDate","retDate","adt","chd","cabin","currency","locale","clickId"],
    notes: "Re-uses KAYAK template, localized host",
  },
];

async function main() {
  console.log('🌱 Starting comprehensive database seed...')

  // 1. Create users (existing functionality)
  console.log('\n👥 Creating users...')
  const adminEmail = 'admin@spontra.com'
  const adminPassword = await hashPassword('Admin123!')

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      username: 'admin',
      role: 'admin',
      isEmailVerified: true,
      preferences: JSON.stringify({
        preferredCabinClass: 'BUSINESS',
        currency: 'USD',
        language: 'en',
        newsletter: false
      })
    }
  })

  console.log('✅ Created admin user:', adminUser.email)

  const testEmail = 'test@spontra.com'
  const testPassword = await hashPassword('Test123!')

  const testUser = await prisma.user.upsert({
    where: { email: testEmail },
    update: {},
    create: {
      email: testEmail,
      passwordHash: testPassword,
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      role: 'user',
      isEmailVerified: true,
      preferences: JSON.stringify({
        preferredCabinClass: 'ECONOMY',
        currency: 'USD',
        language: 'en',
        newsletter: true
      })
    }
  })

  console.log('✅ Created test user:', testUser.email)

  // 2. Seed metasearch providers (new functionality)
  console.log('\n🌐 Seeding metasearch providers for AU/NZ/GB/SG/JP markets...')

  for (const p of providers) {
    console.log(`Seeding ${p.providerId} (${p.market}) - ${p.network} network`)
    
    const up = await prisma.provider.upsert({
      where: { providerId_market: { providerId: p.providerId, market: p.market } },
      update: {
        network: p.network,
        reliabilityScore: p.reliabilityScore,
        expectedEPC: p.expectedEPC,
        supportsInfants: p.supportsInfants,
        allowedAirlines: p.allowedAirlines,
        currencyModes: p.currencyModes,
        isActive: true,
      },
      create: {
        providerId: p.providerId,
        market: p.market,
        network: p.network,
        reliabilityScore: p.reliabilityScore,
        expectedEPC: p.expectedEPC,
        supportsInfants: p.supportsInfants,
        allowedAirlines: p.allowedAirlines,
        currencyModes: p.currencyModes,
        isActive: true,
      },
      include: { template: true },
    });

    await prisma.linkTemplate.upsert({
      where: { providerIdRef: up.id },
      update: {
        template: p.template,
        requiredTokens: JSON.stringify(p.requiredTokens),
        notes: p.notes,
      },
      create: {
        providerIdRef: up.id,
        template: p.template,
        requiredTokens: JSON.stringify(p.requiredTokens),
        notes: p.notes,
      },
    });

    console.log(`  ✅ ${p.providerId}/${p.market} - EPC: ${p.expectedEPC}, Reliability: ${(p.reliabilityScore * 100).toFixed(1)}%`);
  }

  // 3. Clean up expired sessions
  console.log('\n🧹 Cleaning up expired sessions...')
  const deletedSessions = await prisma.userSession.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  })

  console.log(`✅ Cleaned up ${deletedSessions.count} expired sessions`)

  // 4. Summary
  console.log(`\n🎉 Successfully seeded database with ${providers.length} metasearch providers!`)
  console.log('\n📊 Market Coverage:')
  console.log('  🇦🇺 AU: 4 providers (2 OTAs, 2 Airlines)')
  console.log('  🇳🇿 NZ: 2 providers (1 OTA, 1 Airline)')
  console.log('  🇬🇧 GB: 1 provider (1 Airline)')
  console.log('  🇸🇬 SG: 2 providers (1 OTA, 1 Airline)')
  console.log('  🇯🇵 JP: 1 provider (1 OTA)')
  console.log('\n🔗 Network Distribution:')
  console.log(`  Impact Radius: ${providers.filter(p => p.network === 'impact').length} providers`)
  console.log(`  Commission Junction: ${providers.filter(p => p.network === 'cj').length} providers`)
  console.log('\n🚀 Ready for go-live testing!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })