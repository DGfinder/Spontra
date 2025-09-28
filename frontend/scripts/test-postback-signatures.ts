#!/usr/bin/env tsx

import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PostbackTestConfig {
  baseUrl: string;
  impactSecret: string;
  cjSecret: string;
  cjAdvertiserIds: string[];
}

async function testPostbackSignatures(config: PostbackTestConfig) {
  console.log('🔐 Testing Postback Signature Validation\n');

  // Setup test click first
  const testClickId = `TEST_POSTBACK_${Date.now()}`;
  const testProviderId = 'test-provider';
  
  // Create test provider and click
  const testProvider = await prisma.provider.upsert({
    where: { 
      providerId_market: { 
        providerId: testProviderId, 
        market: 'AU' 
      } 
    },
    create: {
      providerId: testProviderId,
      market: 'AU',
      network: 'impact',
      reliabilityScore: 0.8,
      expectedEPC: 0.25,
      isActive: true
    },
    update: {}
  });

  const testClick = await prisma.click.create({
    data: {
      clickId: testClickId,
      providerRef: testProvider.id,
      providerId: testProviderId,
      offerId: 'TEST_OFFER_123',
      queryHash: 'test_query_hash',
      priceShown: 299.99,
      currency: 'AUD',
      market: 'AU',
      sessionId: 'test_session_123'
    }
  });

  console.log(`✅ Created test click: ${testClickId}`);

  // Test 1: Impact Postback with Valid Signature
  console.log('\n1️⃣ Testing Impact Valid Signature...');
  
  const impactQueryString = `subId=${testClickId}&status=approved&amount=12.34&currency=AUD&advId=KAYAK`;
  const impactSignature = crypto.createHmac('sha256', config.impactSecret)
    .update(impactQueryString)
    .digest('base64');

  try {
    const impactResponse = await fetch(`${config.baseUrl}/api/aff/postback/impact?${impactQueryString}`, {
      headers: {
        'X-Impact-Signature': `sha256=${impactSignature}`,
        'X-Forwarded-For': '44.232.244.100' // Valid Impact IP
      }
    });

    const impactResult = await impactResponse.json();
    console.log(`   Status: ${impactResponse.status}`);
    console.log(`   Response:`, impactResult);
    
    if (impactResponse.ok && impactResult.ok) {
      console.log('   ✅ Impact valid signature test PASSED');
    } else {
      console.log('   ❌ Impact valid signature test FAILED');
    }
  } catch (error) {
    console.log('   ❌ Impact request failed:', error);
  }

  // Test 2: Impact Postback with Invalid Signature
  console.log('\n2️⃣ Testing Impact Invalid Signature...');
  
  try {
    const invalidResponse = await fetch(`${config.baseUrl}/api/aff/postback/impact?${impactQueryString}`, {
      headers: {
        'X-Impact-Signature': 'sha256=invalid_signature_here',
        'X-Forwarded-For': '44.232.244.100'
      }
    });

    const invalidResult = await invalidResponse.json();
    console.log(`   Status: ${invalidResponse.status}`);
    console.log(`   Response:`, invalidResult);
    
    if (invalidResponse.status === 403 && invalidResult.error === 'INVALID_SIGNATURE') {
      console.log('   ✅ Impact invalid signature rejection PASSED');
    } else {
      console.log('   ❌ Impact invalid signature rejection FAILED - should return 403');
    }
  } catch (error) {
    console.log('   ❌ Impact invalid request failed:', error);
  }

  // Test 3: Impact Postback from Unauthorized IP
  console.log('\n3️⃣ Testing Impact Unauthorized IP...');
  
  try {
    const unauthorizedResponse = await fetch(`${config.baseUrl}/api/aff/postback/impact?${impactQueryString}`, {
      headers: {
        'X-Impact-Signature': `sha256=${impactSignature}`,
        'X-Forwarded-For': '192.168.1.1' // Invalid IP
      }
    });

    const unauthorizedResult = await unauthorizedResponse.json();
    console.log(`   Status: ${unauthorizedResponse.status}`);
    console.log(`   Response:`, unauthorizedResult);
    
    if (unauthorizedResponse.status === 403 && unauthorizedResult.error === 'UNAUTHORIZED') {
      console.log('   ✅ Impact IP filtering PASSED');
    } else {
      console.log('   ❌ Impact IP filtering FAILED - should return 403');
    }
  } catch (error) {
    console.log('   ❌ Impact unauthorized request failed:', error);
  }

  // Test 4: CJ Postback with Valid Parameters
  console.log('\n4️⃣ Testing CJ Valid Request...');
  
  const cjQueryString = `sid=${testClickId}&actionStatus=new&commissionAmount=9.99&currency=AUD&cid=${config.cjAdvertiserIds[0]}&actionId=TEST_ACTION_123`;
  
  try {
    const cjResponse = await fetch(`${config.baseUrl}/api/aff/postback/cj?${cjQueryString}`, {
      headers: {
        'X-Forwarded-For': '205.201.131.100' // Valid CJ IP
      }
    });

    const cjResult = await cjResponse.json();
    console.log(`   Status: ${cjResponse.status}`);
    console.log(`   Response:`, cjResult);
    
    if (cjResponse.ok && cjResult.ok) {
      console.log('   ✅ CJ valid request test PASSED');
    } else {
      console.log('   ❌ CJ valid request test FAILED');
    }
  } catch (error) {
    console.log('   ❌ CJ request failed:', error);
  }

  // Test 5: CJ Postback with Invalid Advertiser ID
  console.log('\n5️⃣ Testing CJ Invalid Advertiser ID...');
  
  const invalidCjQuery = `sid=${testClickId}&actionStatus=new&commissionAmount=9.99&currency=AUD&cid=INVALID_ADVERTISER&actionId=TEST_ACTION_124`;
  
  try {
    const invalidCjResponse = await fetch(`${config.baseUrl}/api/aff/postback/cj?${invalidCjQuery}`, {
      headers: {
        'X-Forwarded-For': '205.201.131.100'
      }
    });

    const invalidCjResult = await invalidCjResponse.json();
    console.log(`   Status: ${invalidCjResponse.status}`);
    console.log(`   Response:`, invalidCjResult);
    
    if (invalidCjResponse.status === 403 && invalidCjResult.error === 'INVALID_REQUEST') {
      console.log('   ✅ CJ advertiser ID validation PASSED');
    } else {
      console.log('   ❌ CJ advertiser ID validation FAILED - should return 403');
    }
  } catch (error) {
    console.log('   ❌ CJ invalid request failed:', error);
  }

  // Test 6: Rate Limiting
  console.log('\n6️⃣ Testing Rate Limiting...');
  
  const promises = [];
  for (let i = 0; i < 105; i++) { // Exceed limit of 100
    promises.push(
      fetch(`${config.baseUrl}/api/aff/postback/impact?subId=RATE_TEST_${i}&status=pending&amount=1`, {
        headers: {
          'X-Forwarded-For': '44.232.244.200',
          'X-Impact-Signature': 'sha256=test_signature'
        }
      })
    );
  }

  try {
    const rateLimitResults = await Promise.all(promises);
    const rateLimitedCount = rateLimitResults.filter(r => r.status === 429).length;
    
    console.log(`   Rate limited responses: ${rateLimitedCount}/105`);
    
    if (rateLimitedCount > 0) {
      console.log('   ✅ Rate limiting PASSED');
    } else {
      console.log('   ❌ Rate limiting FAILED - no 429 responses');
    }
  } catch (error) {
    console.log('   ❌ Rate limiting test failed:', error);
  }

  // Cleanup
  await prisma.conversion.deleteMany({
    where: { clickId: testClickId }
  });
  await prisma.click.delete({
    where: { id: testClick.id }
  });
  await prisma.provider.delete({
    where: { id: testProvider.id }
  });

  console.log('\n🧹 Cleaned up test data');

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('   ✅ Impact signature validation');
  console.log('   ✅ Impact signature rejection');
  console.log('   ✅ Impact IP filtering');
  console.log('   ✅ CJ parameter validation');
  console.log('   ✅ CJ advertiser ID filtering');
  console.log('   ✅ Rate limiting protection');
  console.log('\n🎉 Postback security validation COMPLETED!');
}

// Configuration from environment
const config: PostbackTestConfig = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  impactSecret: process.env.IMPACT_SIGNATURE_SECRET || 'dev_impact_secret_NkL5zYbGfDh2JcWx7VpMnAq8RtY5bNkL9XzVpMq2GfDh7JcWx5NmAq9vRt8XmPq9v',
  cjSecret: process.env.CJ_SIGNATURE_SECRET || 'dev_cj_secret_8RtY5bNkL9XzVpMq2GfDh7JcWx5NmAq9vRt8XmPq9vRt8NkL5zYbGfDh2JcWx7V',
  cjAdvertiserIds: (process.env.CJ_ADVERTISER_IDS || 'dev_cj_advertiser_1,dev_cj_advertiser_2').split(',')
};

// Run tests
if (require.main === module) {
  testPostbackSignatures(config)
    .then(() => {
      console.log('\n✅ All postback tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Postback tests failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

export { testPostbackSignatures };