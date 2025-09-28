import { PrismaClient } from '@prisma/client';

// Point to the frontend Prisma client with the correct schema
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function seedMetasearchProviders() {
  console.log('🔄 Seeding metasearch providers and templates...');

  // Australian market providers
  const providers = [
    {
      providerId: 'kayak',
      market: 'AU',
      network: 'impact',
      reliabilityScore: 0.9,
      expectedEPC: 0.45,
      supportsInfants: true,
      allowedAirlines: '*',
      currencyModes: 'NATIVE,CONVERT',
      template: {
        template: 'https://www.kayak.com.au/flights/{orig}-{dest}/{depDate}/{retDate}?sort=bestflight_a&adults={adt}&children={chd}&infants={infLap}&cabin={cabin}&currency={currency}&aid={clickId}',
        requiredTokens: JSON.stringify(['orig', 'dest', 'depDate', 'adt', 'cabin', 'currency', 'clickId']),
        notes: 'Kayak AU - primary aggregator partner'
      }
    },
    {
      providerId: 'skyscanner',
      market: 'AU',
      network: 'impact',
      reliabilityScore: 0.85,
      expectedEPC: 0.42,
      supportsInfants: true,
      allowedAirlines: '*',
      currencyModes: 'NATIVE,CONVERT',
      template: {
        template: 'https://www.skyscanner.com.au/transport/flights/{orig}/{dest}/{depDate}/{retDate}?adults={adt}&children={chd}&infants={infLap}&cabinclass={cabin}&currency={currency}&associateid={clickId}',
        requiredTokens: JSON.stringify(['orig', 'dest', 'depDate', 'adt', 'cabin', 'currency', 'clickId']),
        notes: 'Skyscanner AU - secondary aggregator'
      }
    },
    {
      providerId: 'qantas',
      market: 'AU',
      network: 'cj',
      reliabilityScore: 0.95,
      expectedEPC: 0.65,
      supportsInfants: true,
      allowedAirlines: 'QF,JQ',
      currencyModes: 'NATIVE',
      template: {
        template: 'https://www.qantas.com/au/en/flight-search-results.html?tripType={trip}&origin={orig}&destination={dest}&departureDate={depDate}&returnDate={retDate}&adults={adt}&children={chd}&infants={infLap}&cabinClass={cabin}&clickId={clickId}',
        requiredTokens: JSON.stringify(['trip', 'orig', 'dest', 'depDate', 'adt', 'cabin', 'clickId']),
        notes: 'Qantas direct booking - highest EPC'
      }
    },
    {
      providerId: 'virgin',
      market: 'AU',
      network: 'cj',
      reliabilityScore: 0.88,
      expectedEPC: 0.55,
      supportsInfants: true,
      allowedAirlines: 'VA',
      currencyModes: 'NATIVE',
      template: {
        template: 'https://www.virginaustralia.com/au/en/book/flight-search?tripType={trip}&origin={orig}&destination={dest}&departureDate={depDate}&returnDate={retDate}&adults={adt}&children={chd}&infants={infLap}&cabinClass={cabin}&promotionCode={clickId}',
        requiredTokens: JSON.stringify(['trip', 'orig', 'dest', 'depDate', 'adt', 'cabin', 'clickId']),
        notes: 'Virgin Australia direct booking'
      }
    },
    {
      providerId: 'expedia',
      market: 'AU',
      network: 'impact',
      reliabilityScore: 0.82,
      expectedEPC: 0.38,
      supportsInfants: true,
      allowedAirlines: '*',
      currencyModes: 'NATIVE,CONVERT',
      template: {
        template: 'https://www.expedia.com.au/Flights-Search?trip={trip}&leg1=from:{orig},to:{dest},departure:{depDate}&passengers=adults:{adt},children:{chd},infants:{infLap}&options=cabinclass:{cabin},currency:{currency}&mode=search&clickid={clickId}',
        requiredTokens: JSON.stringify(['trip', 'orig', 'dest', 'depDate', 'adt', 'cabin', 'currency', 'clickId']),
        notes: 'Expedia AU - OTA with broad inventory'
      }
    }
  ];

  // New Zealand market providers
  const nzProviders = [
    {
      providerId: 'kayak',
      market: 'NZ',
      network: 'impact',
      reliabilityScore: 0.88,
      expectedEPC: 0.52,
      supportsInfants: true,
      allowedAirlines: '*',
      currencyModes: 'NATIVE,CONVERT',
      template: {
        template: 'https://www.kayak.co.nz/flights/{orig}-{dest}/{depDate}/{retDate}?sort=bestflight_a&adults={adt}&children={chd}&infants={infLap}&cabin={cabin}&currency={currency}&aid={clickId}',
        requiredTokens: JSON.stringify(['orig', 'dest', 'depDate', 'adt', 'cabin', 'currency', 'clickId']),
        notes: 'Kayak NZ'
      }
    },
    {
      providerId: 'airnz',
      market: 'NZ',
      network: 'cj',
      reliabilityScore: 0.92,
      expectedEPC: 0.68,
      supportsInfants: true,
      allowedAirlines: 'NZ',
      currencyModes: 'NATIVE',
      template: {
        template: 'https://www.airnewzealand.co.nz/booking-flow-ui?journeyType={trip}&origin={orig}&destination={dest}&departureDate={depDate}&returnDate={retDate}&adults={adt}&children={chd}&infants={infLap}&cabinClass={cabin}&promoCode={clickId}',
        requiredTokens: JSON.stringify(['trip', 'orig', 'dest', 'depDate', 'adt', 'cabin', 'clickId']),
        notes: 'Air New Zealand direct - premium EPC'
      }
    }
  ];

  // Create providers and their templates
  for (const providerData of [...providers, ...nzProviders]) {
    const { template, ...providerOnly } = providerData;
    
    console.log(`Creating provider: ${providerData.providerId} (${providerData.market})`);
    
    const provider = await prisma.provider.upsert({
      where: {
        providerId_market: {
          providerId: providerData.providerId,
          market: providerData.market
        }
      },
      create: providerOnly,
      update: providerOnly
    });

    console.log(`Creating template for provider: ${provider.providerId}`);
    
    await prisma.linkTemplate.upsert({
      where: {
        providerIdRef: provider.id
      },
      create: {
        providerIdRef: provider.id,
        ...template
      },
      update: template
    });
  }

  console.log('✅ Metasearch providers and templates seeded successfully');
}

async function main() {
  try {
    await seedMetasearchProviders();
  } catch (error) {
    console.error('❌ Error seeding metasearch data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { seedMetasearchProviders };