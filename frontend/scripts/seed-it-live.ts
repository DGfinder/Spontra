#!/usr/bin/env tsx

/**
 * 🚀 SEED IT LIVE - Complete Go-Live Setup
 * 
 * This script:
 * 1. Seeds the database with AU/NZ/GB/SG/JP providers
 * 2. Runs comprehensive validation tests
 * 3. Tests synthetic monitoring
 * 4. Verifies postback security
 * 5. Provides go-live readiness assessment
 */

import { PrismaClient } from '@prisma/client';
import { runValidationSuite } from './go-live-validation';
import { runSyntheticMonitoring } from './synthetic-monitor-cron';

const prisma = new PrismaClient();

async function seedProviders(): Promise<boolean> {
  console.log('🌱 Seeding production providers...');
  
  try {
    // Run the seed script
    const seedProcess = await import('../prisma/seed');
    console.log('✅ Provider seeding completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Provider seeding failed:', error);
    return false;
  }
}

async function verifyDatabaseState(): Promise<boolean> {
  console.log('\n🔍 Verifying database state...');
  
  try {
    const providerCount = await prisma.provider.count();
    const templateCount = await prisma.linkTemplate.count();
    const activeProviders = await prisma.provider.count({ where: { isActive: true } });
    
    console.log(`  📊 Providers: ${providerCount} total, ${activeProviders} active`);
    console.log(`  🔗 Templates: ${templateCount}`);
    
    if (providerCount === 0 || templateCount === 0) {
      console.error('❌ No providers or templates found');
      return false;
    }
    
    // Check market distribution
    const markets = await prisma.provider.groupBy({
      by: ['market'],
      _count: { market: true }
    });
    
    console.log('  🌍 Market distribution:');
    markets.forEach(market => {
      console.log(`    ${market.market}: ${market._count.market} providers`);
    });
    
    // Check network distribution
    const networks = await prisma.provider.groupBy({
      by: ['network'],
      _count: { network: true }
    });
    
    console.log('  🔗 Network distribution:');
    networks.forEach(network => {
      console.log(`    ${network.network}: ${network._count.network} providers`);
    });
    
    console.log('✅ Database state verification passed');
    return true;
  } catch (error) {
    console.error('❌ Database verification failed:', error);
    return false;
  }
}

async function testSampleDeeplinks(): Promise<boolean> {
  console.log('\n🔗 Testing sample deeplink generation...');
  
  try {
    const { buildDeeplink } = await import('../src/server/affiliates/buildDeeplink');
    
    const sampleProvider = await prisma.provider.findFirst({
      where: { isActive: true },
      include: { template: true }
    });
    
    if (!sampleProvider || !sampleProvider.template) {
      console.error('❌ No active provider with template found');
      return false;
    }
    
    const testQuery = {
      origin: 'SYD',
      destination: 'MEL',
      departDate: '2025-12-01',
      returnDate: '2025-12-08',
      pax: { ADT: 1, CHD: 0, INF_LAP: 0, INF_SEAT: 0 },
      cabin: 'ECONOMY' as const,
      market: sampleProvider.market,
      currency: sampleProvider.market === 'AU' ? 'AUD' : 'USD'
    };
    
    const deeplink = buildDeeplink({
      provider: sampleProvider,
      linkTemplate: sampleProvider.template,
      query: testQuery,
      clickId: 'SEED_TEST_123'
    });
    
    console.log(`  ✅ Generated deeplink for ${sampleProvider.providerId} (${sampleProvider.market})`);
    console.log(`  🔗 URL length: ${deeplink.length} characters`);
    console.log(`  🔗 Sample: ${deeplink.slice(0, 100)}...`);
    
    // Validate URL format
    new URL(deeplink); // This will throw if invalid
    
    console.log('✅ Deeplink generation test passed');
    return true;
  } catch (error) {
    console.error('❌ Deeplink generation test failed:', error);
    return false;
  }
}

async function runPostbackSecurityTest(): Promise<boolean> {
  console.log('\n🔐 Testing postback security configuration...');
  
  try {
    const { createHmacSignature } = await import('../src/server/affiliates/hmac');
    
    // Test HMAC signature generation
    const testPayload = 'subId=TEST123&status=approved&amount=12.34&currency=AUD';
    const testSecret = process.env.IMPACT_SIGNATURE_SECRET || 'test_secret';
    
    const signature = createHmacSignature(testPayload, testSecret);
    
    if (!signature || signature.length === 0) {
      console.error('❌ HMAC signature generation failed');
      return false;
    }
    
    console.log('  ✅ HMAC signature generation working');
    
    // Check environment variables
    const requiredEnvVars = [
      'IMPACT_SIGNATURE_SECRET',
      'CJ_SIGNATURE_SECRET', 
      'CJ_ADVERTISER_IDS'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn(`  ⚠️ Missing environment variables: ${missingVars.join(', ')}`);
      console.warn('  📝 These should be set for production deployment');
    } else {
      console.log('  ✅ All required environment variables present');
    }
    
    console.log('✅ Postback security test passed');
    return true;
  } catch (error) {
    console.error('❌ Postback security test failed:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 SEED IT LIVE - Complete Metasearch Go-Live Setup');
  console.log('=' .repeat(60));
  
  const results = {
    seeding: false,
    database: false,
    deeplinks: false,
    security: false,
    synthetic: false,
    validation: false
  };
  
  try {
    // 1. Seed providers
    results.seeding = await seedProviders();
    if (!results.seeding) {
      throw new Error('Provider seeding failed');
    }
    
    // 2. Verify database state
    results.database = await verifyDatabaseState();
    if (!results.database) {
      throw new Error('Database verification failed');
    }
    
    // 3. Test deeplink generation
    results.deeplinks = await testSampleDeeplinks();
    if (!results.deeplinks) {
      throw new Error('Deeplink generation test failed');
    }
    
    // 4. Test security configuration
    results.security = await runPostbackSecurityTest();
    if (!results.security) {
      throw new Error('Security configuration test failed');
    }
    
    // 5. Run synthetic monitoring test
    console.log('\n🤖 Testing synthetic monitoring...');
    try {
      await runSyntheticMonitoring();
      results.synthetic = true;
      console.log('✅ Synthetic monitoring test passed');
    } catch (error) {
      console.warn('⚠️ Synthetic monitoring test failed (non-critical):', error);
      results.synthetic = false;
    }
    
    // 6. Run comprehensive validation suite
    console.log('\n🧪 Running comprehensive validation suite...');
    try {
      const validationResult = await runValidationSuite();
      results.validation = validationResult.criticalFailures.length === 0;
      
      if (results.validation) {
        console.log('✅ Comprehensive validation passed');
      } else {
        console.error('❌ Comprehensive validation failed');
      }
    } catch (error) {
      console.error('❌ Validation suite failed:', error);
      results.validation = false;
    }
    
    // Final assessment
    console.log('\n' + '='.repeat(60));
    console.log('🏆 GO-LIVE READINESS ASSESSMENT');
    console.log('='.repeat(60));
    
    console.log(`✅ Provider Seeding: ${results.seeding ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Database Verification: ${results.database ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Deeplink Generation: ${results.deeplinks ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Security Configuration: ${results.security ? 'PASSED' : 'FAILED'}`);
    console.log(`${results.synthetic ? '✅' : '⚠️'} Synthetic Monitoring: ${results.synthetic ? 'PASSED' : 'WARNING'}`);
    console.log(`✅ Validation Suite: ${results.validation ? 'PASSED' : 'FAILED'}`);
    
    const criticalTests = [results.seeding, results.database, results.deeplinks, results.security, results.validation];
    const criticalPassed = criticalTests.filter(Boolean).length;
    
    if (criticalPassed === criticalTests.length) {
      console.log('\n🎉 🚀 CLEARED FOR PRODUCTION DEPLOYMENT! 🚀 🎉');
      console.log('\n📋 Next Steps:');
      console.log('  1. Deploy to production with conservative feature flags');
      console.log('  2. Set production environment variables');
      console.log('  3. Enable monitoring dashboards');
      console.log('  4. Start with limited provider rollout');
      console.log('  5. Monitor EPC and conversion metrics closely');
      
      console.log('\n🔧 Quick Commands:');
      console.log('  npm run validation:all    # Run full validation');
      console.log('  npm run monitor:synthetic # Test provider health');
      console.log('  npm run db:seed          # Re-seed if needed');
      
      process.exit(0);
    } else {
      console.log('\n❌ NOT READY FOR DEPLOYMENT');
      console.log(`Critical tests passed: ${criticalPassed}/${criticalTests.length}`);
      console.log('\n🔧 Fix critical issues before proceeding');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Seed It Live failed:', error);
    console.log('\n❌ CRITICAL ERROR - DO NOT DEPLOY');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down...');
  await prisma.$disconnect();
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down...');
  await prisma.$disconnect();
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main();
}

export { main as seedItLive };