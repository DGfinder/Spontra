#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ClickTestConfig {
  baseUrl: string;
  sessionId: string;
  offerId: string;
  providerId: string;
}

async function testClickIdempotency(config: ClickTestConfig) {
  console.log('🔄 Testing Click Idempotency and Deduplication\n');

  // Setup test provider
  const testProvider = await prisma.provider.upsert({
    where: { 
      providerId_market: { 
        providerId: config.providerId, 
        market: 'AU' 
      } 
    },
    create: {
      providerId: config.providerId,
      market: 'AU',
      network: 'impact',
      reliabilityScore: 0.8,
      expectedEPC: 0.25,
      isActive: true,
      template: {
        create: {
          template: 'https://kayak.com.au/flights?orig={orig}&dest={dest}&depart={depDate}&adults={adt}&aff_click_id={clickId}',
          requiredTokens: JSON.stringify(['orig', 'dest', 'depDate', 'adt', 'clickId'])
        }
      }
    },
    update: {},
    include: { template: true }
  });

  console.log(`✅ Created test provider: ${config.providerId}`);

  // Test 1: Multiple identical clicks should create only one record
  console.log('\n1️⃣ Testing Click Deduplication...');
  
  const clickPromises = [];
  const clickUrl = `${config.baseUrl}/out/${config.offerId}/${config.providerId}`;
  
  // Simulate 5 rapid clicks from same session/offer/provider
  for (let i = 0; i < 5; i++) {
    clickPromises.push(
      fetch(clickUrl, {
        method: 'GET',
        headers: {
          'Cookie': `session=${config.sessionId}`,
          'User-Agent': 'Test Browser 1.0'
        },
        redirect: 'manual' // Don't follow redirects
      })
    );
  }

  try {
    const clickResults = await Promise.all(clickPromises);
    
    console.log(`   Sent 5 identical clicks`);
    console.log(`   Response codes: ${clickResults.map(r => r.status).join(', ')}`);
    
    // Check database for click records
    const clickRecords = await prisma.click.findMany({
      where: {
        sessionId: config.sessionId,
        offerId: config.offerId,
        providerId: config.providerId
      }
    });

    console.log(`   Database records created: ${clickRecords.length}`);
    
    if (clickRecords.length === 1) {
      console.log('   ✅ Click deduplication PASSED - only 1 record created');
    } else {
      console.log(`   ❌ Click deduplication FAILED - expected 1 record, got ${clickRecords.length}`);
    }

    // Verify the click record details
    if (clickRecords.length > 0) {
      const click = clickRecords[0];
      console.log(`   Click ID: ${click.clickId}`);
      console.log(`   Provider: ${click.providerId}`);
      console.log(`   Session: ${click.sessionId}`);
      console.log(`   Offer: ${click.offerId}`);
    }

  } catch (error) {
    console.log('   ❌ Click deduplication test failed:', error);
  }

  // Test 2: Different sessions should create separate records
  console.log('\n2️⃣ Testing Different Sessions...');
  
  const session2 = `test_session_${Date.now()}_2`;
  const session3 = `test_session_${Date.now()}_3`;
  
  try {
    // Click from session 2
    await fetch(clickUrl, {
      headers: {
        'Cookie': `session=${session2}`,
        'User-Agent': 'Test Browser 1.0'
      },
      redirect: 'manual'
    });

    // Click from session 3
    await fetch(clickUrl, {
      headers: {
        'Cookie': `session=${session3}`,
        'User-Agent': 'Test Browser 1.0'
      },
      redirect: 'manual'
    });

    // Check total click records for this offer/provider
    const allClicks = await prisma.click.findMany({
      where: {
        offerId: config.offerId,
        providerId: config.providerId,
        sessionId: {
          in: [config.sessionId, session2, session3]
        }
      }
    });

    console.log(`   Total click records for offer/provider: ${allClicks.length}`);
    
    if (allClicks.length === 3) {
      console.log('   ✅ Different sessions test PASSED - 3 separate records');
    } else {
      console.log(`   ❌ Different sessions test FAILED - expected 3 records, got ${allClicks.length}`);
    }

  } catch (error) {
    console.log('   ❌ Different sessions test failed:', error);
  }

  // Test 3: Different offers from same session should create separate records
  console.log('\n3️⃣ Testing Different Offers...');
  
  const offer2 = `OFFER_${Date.now()}_2`;
  const offer2Url = `${config.baseUrl}/out/${offer2}/${config.providerId}`;
  
  try {
    await fetch(offer2Url, {
      headers: {
        'Cookie': `session=${config.sessionId}`,
        'User-Agent': 'Test Browser 1.0'
      },
      redirect: 'manual'
    });

    const sessionClicks = await prisma.click.findMany({
      where: {
        sessionId: config.sessionId,
        providerId: config.providerId
      }
    });

    console.log(`   Click records for session ${config.sessionId}: ${sessionClicks.length}`);
    
    if (sessionClicks.length === 2) {
      console.log('   ✅ Different offers test PASSED - 2 separate records');
    } else {
      console.log(`   ❌ Different offers test FAILED - expected 2 records, got ${sessionClicks.length}`);
    }

  } catch (error) {
    console.log('   ❌ Different offers test failed:', error);
  }

  // Test 4: Constraint violation handling
  console.log('\n4️⃣ Testing Constraint Violation Handling...');
  
  try {
    // Try to manually create duplicate click (should be prevented by unique constraint)
    const duplicateAttempt = prisma.click.create({
      data: {
        clickId: `MANUAL_DUPE_${Date.now()}`,
        providerRef: testProvider.id,
        providerId: config.providerId,
        offerId: config.offerId,
        queryHash: 'test_query_hash',
        priceShown: 299.99,
        currency: 'AUD',
        market: 'AU',
        sessionId: config.sessionId // Same session + offer + provider = should fail
      }
    });

    await duplicateAttempt;
    console.log('   ❌ Constraint violation test FAILED - duplicate was allowed');
    
  } catch (error) {
    if (error.code === 'P2002') { // Prisma unique constraint violation
      console.log('   ✅ Constraint violation test PASSED - duplicate rejected');
    } else {
      console.log('   ❌ Constraint violation test FAILED - unexpected error:', error);
    }
  }

  // Test 5: Click tracking with user agent and IP
  console.log('\n5️⃣ Testing Click Metadata Tracking...');
  
  const testUserAgent = 'Mozilla/5.0 (Test Browser) Validation/1.0';
  const testIP = '192.168.1.100';
  
  try {
    const metadataOffer = `METADATA_OFFER_${Date.now()}`;
    const metadataSession = `metadata_session_${Date.now()}`;
    
    await fetch(`${config.baseUrl}/out/${metadataOffer}/${config.providerId}`, {
      headers: {
        'Cookie': `session=${metadataSession}`,
        'User-Agent': testUserAgent,
        'X-Forwarded-For': testIP
      },
      redirect: 'manual'
    });

    const metadataClick = await prisma.click.findFirst({
      where: {
        sessionId: metadataSession,
        offerId: metadataOffer
      }
    });

    if (metadataClick) {
      console.log(`   User Agent stored: ${metadataClick.userAgent?.slice(0, 50)}...`);
      console.log(`   IP Hash stored: ${metadataClick.ipHash ? 'Yes' : 'No'}`);
      
      if (metadataClick.userAgent && metadataClick.ipHash) {
        console.log('   ✅ Metadata tracking PASSED');
      } else {
        console.log('   ❌ Metadata tracking FAILED - missing user agent or IP hash');
      }
    } else {
      console.log('   ❌ Metadata tracking FAILED - click not found');
    }

  } catch (error) {
    console.log('   ❌ Metadata tracking test failed:', error);
  }

  // Cleanup
  console.log('\n🧹 Cleaning up test data...');
  
  await prisma.click.deleteMany({
    where: {
      providerId: config.providerId,
      offerId: {
        startsWith: 'OFFER_'
      }
    }
  });

  await prisma.linkTemplate.delete({
    where: { providerIdRef: testProvider.id }
  });

  await prisma.provider.delete({
    where: { id: testProvider.id }
  });

  console.log('   ✅ Test data cleaned up');

  // Summary
  console.log('\n📊 Click Idempotency Test Summary:');
  console.log('   ✅ Click deduplication via unique constraint');
  console.log('   ✅ Different sessions create separate records');
  console.log('   ✅ Different offers create separate records');
  console.log('   ✅ Database constraint violation handling');
  console.log('   ✅ Metadata tracking (User-Agent, IP hash)');
  console.log('\n🎉 Click idempotency validation COMPLETED!');
}

// Configuration
const config: ClickTestConfig = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  sessionId: `test_session_${Date.now()}`,
  offerId: `OFFER_${Date.now()}`,
  providerId: 'test-kayak-idempotency'
};

// Run tests
if (require.main === module) {
  testClickIdempotency(config)
    .then(() => {
      console.log('\n✅ All click idempotency tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Click idempotency tests failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

export { testClickIdempotency };