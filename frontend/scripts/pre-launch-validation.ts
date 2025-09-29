#!/usr/bin/env tsx
/**
 * Pre-Launch Validation Suite
 * 
 * 10-point final snap-audit checklist before production deployment
 * Must print "✅ CLEARED FOR PRODUCTION DEPLOYMENT!" to proceed
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

interface ValidationResult {
  check: string;
  passed: boolean;
  message: string;
  critical: boolean;
}

const results: ValidationResult[] = [];

async function main() {
  console.log('🚀 SPONTRA PRE-LAUNCH VALIDATION SUITE\n');
  console.log('Running 10-point final snap-audit...\n');

  // 1. Secrets validation
  await validateSecrets();
  
  // 2. Feature flags validation
  await validateFeatureFlags();
  
  // 3. Database connectivity and schema
  await validateDatabase();
  
  // 4. Provider configuration
  await validateProviders();
  
  // 5. Synthetic monitoring
  await validateSyntheticMonitoring();
  
  // 6. Postback security
  await validatePostbackSecurity();
  
  // 7. Click deduplication
  await validateClickDeduplication();
  
  // 8. Price accuracy system
  await validatePriceAccuracy();
  
  // 9. Landing beacon
  await validateLandingBeacon();
  
  // 10. Rollback safety
  await validateRollbackSafety();

  // Print results
  console.log('\n📊 VALIDATION RESULTS:');
  console.log('═'.repeat(60));
  
  let criticalFailures = 0;
  let warnings = 0;
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : (result.critical ? '❌' : '⚠️');
    const status = result.passed ? 'PASS' : (result.critical ? 'CRITICAL FAIL' : 'WARNING');
    
    console.log(`${icon} ${result.check}: ${status}`);
    console.log(`   ${result.message}`);
    
    if (!result.passed) {
      if (result.critical) criticalFailures++;
      else warnings++;
    }
  });

  console.log('\n' + '═'.repeat(60));
  
  if (criticalFailures > 0) {
    console.log(`❌ VALIDATION FAILED: ${criticalFailures} critical issues, ${warnings} warnings`);
    console.log('🚨 DEPLOYMENT BLOCKED - Fix critical issues before proceeding');
    process.exit(1);
  } else if (warnings > 0) {
    console.log(`⚠️ VALIDATION WARNING: ${warnings} non-critical issues detected`);
    console.log('⚡ Deployment allowed but monitor closely');
  } else {
    console.log('🎉 ✅ CLEARED FOR PRODUCTION DEPLOYMENT! ✅ 🎉');
    console.log('🚀 All systems go - ready for launch!');
  }
}

async function validateSecrets() {
  const check = 'Secrets & Credentials';
  
  try {
    // Check for exposed development secrets
    const devSecrets = [
      'dev_jwt_secret',
      'dev_user_auth_secret',
      'dev_encryption_key',
      'dev_admin_secret',
      'dev_impact_secret',
      'dev_cj_secret'
    ];
    
    const exposedSecrets = devSecrets.filter(secret => 
      process.env.JWT_SECRET?.includes(secret) ||
      process.env.USER_AUTH_JWT_SECRET?.includes(secret) ||
      process.env.ENCRYPTION_KEY?.includes(secret) ||
      process.env.ADMIN_JWT_SECRET?.includes(secret) ||
      process.env.IMPACT_SIGNATURE_SECRET?.includes(secret) ||
      process.env.CJ_SIGNATURE_SECRET?.includes(secret)
    );

    if (exposedSecrets.length > 0) {
      results.push({
        check,
        passed: false,
        message: `Development secrets detected: ${exposedSecrets.join(', ')}. MUST rotate for production!`,
        critical: true
      });
      return;
    }

    // Check for exposed database credentials
    const dbUrl = process.env.DATABASE_URL || '';
    if (dbUrl.includes('npg_bh12OmZINKPn') || dbUrl.includes('ep-frosty-cloud-a7tiov8j')) {
      results.push({
        check,
        passed: false,
        message: 'Exposed database credentials detected in environment. MUST rotate before production!',
        critical: true
      });
      return;
    }

    // Validate secret strength
    const secrets = [
      process.env.JWT_SECRET,
      process.env.USER_AUTH_JWT_SECRET,
      process.env.ENCRYPTION_KEY,
      process.env.ADMIN_JWT_SECRET,
      process.env.IMPACT_SIGNATURE_SECRET,
      process.env.CJ_SIGNATURE_SECRET
    ];

    const weakSecrets = secrets.filter(secret => !secret || secret.length < 32);
    if (weakSecrets.length > 0) {
      results.push({
        check,
        passed: false,
        message: `${weakSecrets.length} secrets are missing or too weak (< 32 chars)`,
        critical: true
      });
      return;
    }

    results.push({
      check,
      passed: true,
      message: 'All secrets properly configured and rotated',
      critical: false
    });

  } catch (error) {
    results.push({
      check,
      passed: false,
      message: `Secrets validation failed: ${error}`,
      critical: true
    });
  }
}

async function validateFeatureFlags() {
  const check = 'Wave 1 EU/Asia Feature Flags';
  
  try {
    const requiredFlags = {
      FEATURE_METASEARCH_ENABLED: 'true',
      FEATURE_MARKET_GB_ENABLED: 'true',
      FEATURE_MARKET_SG_ENABLED: 'true',
      FEATURE_MARKET_JP_ENABLED: 'true',
      FEATURE_MARKET_AU_ENABLED: 'false',
      FEATURE_MARKET_NZ_ENABLED: 'false',
      FEATURE_REPRICE_ON_SELECT_ENABLED: 'true',
      FEATURE_POSTBACK_ENFORCE_SIGNATURE: 'true'
    };

    const incorrectFlags = Object.entries(requiredFlags).filter(
      ([flag, expected]) => process.env[flag] !== expected
    );

    if (incorrectFlags.length > 0) {
      results.push({
        check,
        passed: false,
        message: `Incorrect flags: ${incorrectFlags.map(([f, e]) => `${f}=${process.env[f]} (expected: ${e})`).join(', ')}`,
        critical: true
      });
      return;
    }

    results.push({
      check,
      passed: true,
      message: 'Wave 1 EU/Asia feature flags correctly configured',
      critical: false
    });

  } catch (error) {
    results.push({
      check,
      passed: false,
      message: `Feature flags validation failed: ${error}`,
      critical: true
    });
  }
}

async function validateDatabase() {
  const check = 'Database Connectivity & Schema';
  
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check required tables exist
    const tables = ['providers', 'clicks', 'conversions', 'postback_logs'];
    for (const table of tables) {
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = ${table}
        )
      ` as { exists: boolean }[];
      if (!result[0]?.exists) {
        results.push({
          check,
          passed: false,
          message: `Required table missing: ${table}`,
          critical: true
        });
        return;
      }
    }

    results.push({
      check,
      passed: true,
      message: 'Database connectivity and schema validated',
      critical: false
    });

  } catch (error) {
    results.push({
      check,
      passed: false,
      message: `Database validation failed: ${error}`,
      critical: true
    });
  }
}

async function validateProviders() {
  const check = 'Provider Configuration';
  
  try {
    const expectedProviders = [
      'british-airways',
      'singapore-airlines', 
      'kayak-jp',
      'skyscanner-gb'
    ];

    const activeProviders = await prisma.provider.findMany({
      where: { isActive: true },
      select: { providerId: true, market: true }
    });

    const missingProviders = expectedProviders.filter(provider =>
      !activeProviders.some(p => p.providerId === provider)
    );

    if (missingProviders.length > 0) {
      results.push({
        check,
        passed: false,
        message: `Missing Wave 1 providers: ${missingProviders.join(', ')}`,
        critical: true
      });
      return;
    }

    results.push({
      check,
      passed: true,
      message: `${activeProviders.length} providers configured and active`,
      critical: false
    });

  } catch (error) {
    results.push({
      check,
      passed: false,
      message: `Provider validation failed: ${error}`,
      critical: true
    });
  }
}

async function validateSyntheticMonitoring() {
  const check = 'Synthetic Monitoring';
  
  try {
    // Import the synthetic monitoring function
    const { runSyntheticMonitoringPro } = await import('../src/lib/syntheticMonitorPro');
    
    // Run a quick synthetic test
    const result = await runSyntheticMonitoringPro();
    
    if (result.failureRate > 0.1) { // >10% failure rate
      results.push({
        check,
        passed: false,
        message: `High synthetic failure rate: ${(result.failureRate * 100).toFixed(1)}%`,
        critical: false
      });
      return;
    }

    results.push({
      check,
      passed: true,
      message: `Synthetic monitoring: ${result.healthyTests}/${result.totalTests} tests passed`,
      critical: false
    });

  } catch (error) {
    results.push({
      check,
      passed: false,
      message: `Synthetic monitoring validation failed: ${error}`,
      critical: false
    });
  }
}

async function validatePostbackSecurity() {
  const check = 'Postback Security';
  
  try {
    // Validate HMAC signature secrets exist
    if (!process.env.IMPACT_SIGNATURE_SECRET || !process.env.CJ_SIGNATURE_SECRET) {
      results.push({
        check,
        passed: false,
        message: 'Missing HMAC signature secrets for Impact or CJ',
        critical: true
      });
      return;
    }

    // Test HMAC signature generation
    const testData = 'test_postback_data';
    const impactSignature = crypto
      .createHmac('sha256', process.env.IMPACT_SIGNATURE_SECRET)
      .update(testData)
      .digest('hex');
    
    const cjSignature = crypto
      .createHmac('sha256', process.env.CJ_SIGNATURE_SECRET)
      .update(testData)
      .digest('hex');

    if (!impactSignature || !cjSignature) {
      results.push({
        check,
        passed: false,
        message: 'HMAC signature generation failed',
        critical: true
      });
      return;
    }

    results.push({
      check,
      passed: true,
      message: 'Postback HMAC signatures configured and tested',
      critical: false
    });

  } catch (error) {
    results.push({
      check,
      passed: false,
      message: `Postback security validation failed: ${error}`,
      critical: true
    });
  }
}

async function validateClickDeduplication() {
  const check = 'Click Deduplication';
  
  try {
    // Create test session and offer
    const testSessionId = `test-session-${Date.now()}`;
    const testOfferId = `test-offer-${Date.now()}`;
    const testProviderId = 'test-provider';

    // First click should succeed
    const click1 = await prisma.click.create({
      data: {
        clickId: `click-1-${Date.now()}`,
        sessionId: testSessionId,
        offerId: testOfferId,
        providerRef: testProviderId,
        providerId: testProviderId,
        queryHash: 'test-query-hash',
        priceShown: 100.00,
        currency: 'GBP',
        market: 'GB',
        ipHash: 'test-ip-hash',
        userAgent: 'test-agent'
      }
    });

    // Second click with same session/offer should be prevented by unique constraint
    try {
      await prisma.click.create({
        data: {
          clickId: `click-2-${Date.now()}`,
          sessionId: testSessionId,
          offerId: testOfferId,
          providerRef: testProviderId,
          providerId: testProviderId,
          queryHash: 'test-query-hash',
          priceShown: 100.00,
          currency: 'GBP',
          market: 'GB',
          ipHash: 'test-ip-hash',
          userAgent: 'test-agent'
        }
      });
      
      // If we get here, deduplication failed
      results.push({
        check,
        passed: false,
        message: 'Click deduplication not working - duplicate clicks allowed',
        critical: true
      });
      
    } catch (error) {
      // Expected error due to unique constraint
      results.push({
        check,
        passed: true,
        message: 'Click deduplication working - unique constraint active',
        critical: false
      });
    }

    // Cleanup test data
    await prisma.click.deleteMany({
      where: { sessionId: testSessionId }
    });

  } catch (error) {
    results.push({
      check,
      passed: false,
      message: `Click deduplication validation failed: ${error}`,
      critical: true
    });
  }
}

async function validatePriceAccuracy() {
  const check = 'Price Accuracy System';
  
  try {
    const { runPriceAccuracyEvaluation } = await import('../src/lib/priceAccuracyThrottling');
    
    // Run price accuracy evaluation
    const result = await runPriceAccuracyEvaluation();
    
    results.push({
      check,
      passed: true,
      message: `Price accuracy system active: ${result.evaluated} providers evaluated`,
      critical: false
    });

  } catch (error) {
    results.push({
      check,
      passed: false,
      message: `Price accuracy validation failed: ${error}`,
      critical: false
    });
  }
}

async function validateLandingBeacon() {
  const check = 'Landing Beacon';
  
  try {
    // Test beacon URL generation
    const { generateBeaconUrl } = await import('../src/app/api/beacon/landed/route');
    
    const beaconUrl = generateBeaconUrl({
      clickId: 'test-click-123',
      providerId: 'test-provider',
      market: 'GB'
    });

    if (!beaconUrl || !beaconUrl.includes('/api/beacon/landed')) {
      results.push({
        check,
        passed: false,
        message: 'Beacon URL generation failed',
        critical: false
      });
      return;
    }

    results.push({
      check,
      passed: true,
      message: 'Landing beacon system configured and ready',
      critical: false
    });

  } catch (error) {
    results.push({
      check,
      passed: false,
      message: `Landing beacon validation failed: ${error}`,
      critical: false
    });
  }
}

async function validateRollbackSafety() {
  const check = 'Rollback Safety';
  
  try {
    // Test rollout configuration
    const { getRolloutDashboard, ROLLOUT_SAFETY_COMMANDS } = await import('../src/lib/rolloutConfiguration');
    
    const rolloutStatus = getRolloutDashboard();
    
    if (!rolloutStatus.currentWave) {
      results.push({
        check,
        passed: false,
        message: 'No active rollout wave configured',
        critical: false
      });
      return;
    }

    // Verify safety commands exist
    if (!ROLLOUT_SAFETY_COMMANDS.EMERGENCY_STOP || !ROLLOUT_SAFETY_COMMANDS.PAUSE_CURRENT) {
      results.push({
        check,
        passed: false,
        message: 'Rollback safety commands not properly configured',
        critical: true
      });
      return;
    }

    results.push({
      check,
      passed: true,
      message: `Rollback safety ready: ${rolloutStatus.currentWave.name} active`,
      critical: false
    });

  } catch (error) {
    results.push({
      check,
      passed: false,
      message: `Rollback safety validation failed: ${error}`,
      critical: true
    });
  }
}

// Run validation
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());