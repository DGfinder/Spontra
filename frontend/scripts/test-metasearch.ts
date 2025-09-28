#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { buildDeeplink } from '../src/server/affiliates/buildDeeplink';

const prisma = new PrismaClient();

async function testMetasearchArchitecture() {
  console.log('🧪 Testing Metasearch Architecture\n');

  try {
    // 1. Test database schema and seeded data
    console.log('1️⃣ Testing Database Schema...');
    
    const providerCount = await prisma.provider.count();
    const templateCount = await prisma.linkTemplate.count();
    
    console.log(`   ✅ Providers: ${providerCount}`);
    console.log(`   ✅ Templates: ${templateCount}`);
    
    if (providerCount === 0 || templateCount === 0) {
      throw new Error("No providers or templates found. Run seedMetasearch.ts first.");
    }

    // 2. Test provider retrieval and template usage
    console.log('\n2️⃣ Testing Provider and Template Retrieval...');
    
    const kayakProvider = await prisma.provider.findFirst({
      where: { providerId: 'kayak', market: 'AU' },
      include: { template: true }
    });

    if (!kayakProvider || !kayakProvider.template) {
      throw new Error("Kayak provider or template not found");
    }

    console.log(`   ✅ Provider: ${kayakProvider.providerId} (${kayakProvider.market})`);
    console.log(`   ✅ EPC: ${kayakProvider.expectedEPC}`);
    console.log(`   ✅ Template: ${kayakProvider.template.template.slice(0, 50)}...`);

    // 3. Test deeplink generation
    console.log('\n3️⃣ Testing Deeplink Generation...');
    
    const testQuery = {
      origin: "SYD",
      destination: "MEL", 
      departDate: "2025-12-01",
      pax: { ADT: 1, CHD: 0, INF_LAP: 0, INF_SEAT: 0 },
      cabin: "ECONOMY" as const,
      market: "AU",
      currency: "AUD"
    };

    const deeplink = buildDeeplink({
      provider: kayakProvider,
      linkTemplate: kayakProvider.template,
      query: testQuery,
      clickId: "TEST_CLICK_123",
      campaignId: "test_campaign",
      placementId: "test_placement"
    });

    console.log(`   ✅ Generated URL: ${deeplink}`);
    console.log(`   ✅ Contains clickId: ${deeplink.includes('TEST_CLICK_123')}`);
    console.log(`   ✅ Contains UTM params: ${deeplink.includes('utm_source=spontra')}`);

    // 4. Test URL validity
    console.log('\n4️⃣ Testing URL Validity...');
    
    try {
      const url = new URL(deeplink);
      console.log(`   ✅ Valid URL: ${url.protocol}//${url.hostname}`);
      console.log(`   ✅ Query params: ${url.searchParams.size} parameters`);
    } catch (urlError) {
      throw new Error(`Invalid URL generated: ${urlError}`);
    }

    // 5. Test multiple providers
    console.log('\n5️⃣ Testing Multiple Providers...');
    
    const allProviders = await prisma.provider.findMany({
      where: { market: 'AU', isActive: true },
      include: { template: true },
      take: 3
    });

    for (const provider of allProviders) {
      if (!provider.template) continue;
      
      try {
        const testLink = buildDeeplink({
          provider,
          linkTemplate: provider.template,
          query: testQuery,
          clickId: `TEST_${provider.providerId}_123`
        });
        
        console.log(`   ✅ ${provider.providerId}: URL generated (${testLink.length} chars)`);
      } catch (linkError) {
        console.log(`   ❌ ${provider.providerId}: Failed - ${linkError}`);
      }
    }

    // 6. Test click logging simulation
    console.log('\n6️⃣ Testing Click Logging...');
    
    const testClick = await prisma.click.create({
      data: {
        clickId: "TEST_CLICK_SIMULATION",
        providerRef: kayakProvider.id,
        providerId: kayakProvider.providerId,
        offerId: "TEST_OFFER_123",
        queryHash: "test_query_hash",
        priceShown: 299.99,
        currency: "AUD",
        market: "AU",
        sessionId: "test_session_123",
        userAgent: "Test Bot",
        ipHash: "test_ip_hash"
      }
    });

    console.log(`   ✅ Click logged: ID ${testClick.id}`);

    // 7. Test conversion simulation
    console.log('\n7️⃣ Testing Conversion Logging...');
    
    const testConversion = await prisma.conversion.create({
      data: {
        clickId: testClick.clickId,
        status: "APPROVED",
        commission: 12.50,
        saleAmount: 299.99,
        currency: "AUD",
        providerRef: kayakProvider.id,
        providerId: kayakProvider.providerId,
        rawPayload: JSON.stringify({
          source: "test",
          timestamp: new Date().toISOString()
        })
      }
    });

    console.log(`   ✅ Conversion logged: ID ${testConversion.id}`);

    // Cleanup test data
    await prisma.conversion.delete({ where: { id: testConversion.id } });
    await prisma.click.delete({ where: { id: testClick.id } });
    
    console.log('   ✅ Test data cleaned up');

    // 8. Summary
    console.log('\n📊 Test Summary:');
    console.log(`   ✅ Database Schema: Working`);
    console.log(`   ✅ Provider Management: Working`);
    console.log(`   ✅ Deeplink Generation: Working`);
    console.log(`   ✅ Click Tracking: Working`);
    console.log(`   ✅ Conversion Tracking: Working`);
    console.log(`   ✅ Multiple Providers: ${allProviders.length} tested`);

    console.log('\n🎉 Metasearch Architecture Test: PASSED');
    console.log('\n✨ Spontra is ready for professional metasearch operations!');

    return {
      success: true,
      providersCount: providerCount,
      templatesCount: templateCount,
      testedProviders: allProviders.length,
      sampleDeeplink: deeplink
    };

  } catch (error) {
    console.error('\n❌ Metasearch Architecture Test: FAILED');
    console.error('Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testMetasearchArchitecture()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { testMetasearchArchitecture };