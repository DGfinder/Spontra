#!/usr/bin/env tsx

/**
 * Go-Live Validation Suite
 * 
 * Comprehensive pre-launch validation to prove the metasearch platform works
 * and catch any regressions before production deployment.
 * 
 * Usage: ./scripts/go-live-validation.ts
 */

import { testPostbackSignatures } from './test-postback-signatures';
import { testClickIdempotency } from './test-click-idempotency';
import { testRepriceOutcomeGates } from './test-reprice-gates';
import { runSyntheticMonitoring } from './synthetic-monitor-cron';
import { testMetasearchArchitecture } from './test-metasearch';
import { getFeatureFlags, logFeatureFlags } from '../src/lib/featureFlags';

interface ValidationResult {
  testName: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

interface ValidationSuite {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
  results: ValidationResult[];
  criticalFailures: string[];
  warnings: string[];
}

/**
 * Run a test with error handling and timing
 */
async function runTest(
  testName: string,
  testFunction: () => Promise<any>,
  isCritical: boolean = true
): Promise<ValidationResult> {
  const startTime = Date.now();
  
  try {
    console.log(`\n🧪 Running ${testName}...`);
    const result = await testFunction();
    const duration = Date.now() - startTime;
    
    console.log(`✅ ${testName} PASSED (${duration}ms)`);
    return {
      testName,
      passed: true,
      duration,
      details: result
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.log(`❌ ${testName} FAILED (${duration}ms): ${errorMessage}`);
    return {
      testName,
      passed: false,
      duration,
      error: errorMessage
    };
  }
}

/**
 * Validate environment configuration
 */
async function validateEnvironment(): Promise<ValidationResult> {
  const requiredEnvVars = [
    'DATABASE_URL',
    'IMPACT_SIGNATURE_SECRET',
    'CJ_SIGNATURE_SECRET',
    'CJ_ADVERTISER_IDS'
  ];

  const missing: string[] = [];
  const configured: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      configured.push(envVar);
    } else {
      missing.push(envVar);
    }
  }

  // Check feature flags
  const flags = getFeatureFlags();
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    testName: 'Environment Configuration',
    passed: true,
    duration: 0,
    details: {
      configured,
      featureFlags: flags,
      environment: process.env.NODE_ENV
    }
  };
}

/**
 * Pre-flight safety checks
 */
async function preflightChecks(): Promise<ValidationResult> {
  const checks = [];
  
  // Check if we're in a safe environment for testing
  if (process.env.NODE_ENV === 'production') {
    checks.push('⚠️ Running in production environment - be careful!');
  }
  
  // Check database connectivity
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    checks.push('✅ Database connectivity verified');
  } catch (error) {
    throw new Error(`Database connection failed: ${error}`);
  }
  
  // Verify required tables exist
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const tables = ['providers', 'link_templates', 'clicks', 'conversions', 'price_accuracy', 'synthetic_checks'];
    for (const table of tables) {
      await prisma.$queryRawUnsafe(`SELECT 1 FROM "${table}" LIMIT 1`);
      checks.push(`✅ Table ${table} exists and accessible`);
    }
    
    await prisma.$disconnect();
  } catch (error) {
    throw new Error(`Required database tables missing or inaccessible: ${error}`);
  }

  return {
    testName: 'Pre-flight Safety Checks',
    passed: true,
    duration: 0,
    details: { checks }
  };
}

/**
 * Run the complete validation suite
 */
async function runValidationSuite(): Promise<ValidationSuite> {
  console.log('🚀 Go-Live Validation Suite Starting...');
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  const results: ValidationResult[] = [];
  const criticalFailures: string[] = [];
  const warnings: string[] = [];

  // Show feature flags status
  console.log('\n🚩 Current Feature Flags:');
  logFeatureFlags();

  // 1. Environment and preflight checks
  results.push(await runTest('Environment Configuration', validateEnvironment, true));
  results.push(await runTest('Pre-flight Safety Checks', preflightChecks, true));

  // 2. Core metasearch architecture test
  results.push(await runTest(
    'Metasearch Architecture', 
    () => testMetasearchArchitecture(),
    true
  ));

  // 3. Security validation tests
  results.push(await runTest(
    'Postback Signature Security',
    () => testPostbackSignatures({
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      impactSecret: process.env.IMPACT_SIGNATURE_SECRET || 'dev_secret',
      cjSecret: process.env.CJ_SIGNATURE_SECRET || 'dev_secret',
      cjAdvertiserIds: (process.env.CJ_ADVERTISER_IDS || 'dev_advertiser').split(',')
    }),
    true
  ));

  // 4. Click tracking and deduplication
  results.push(await runTest(
    'Click Idempotency & Deduplication',
    () => testClickIdempotency({
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      sessionId: `validation_session_${Date.now()}`,
      offerId: `validation_offer_${Date.now()}`,
      providerId: 'validation-provider'
    }),
    true
  ));

  // 5. Reprice outcome gates
  results.push(await runTest(
    'Reprice Outcome Gates',
    () => testRepriceOutcomeGates({
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    }),
    true
  ));

  // 6. Synthetic monitoring (non-critical for go-live)
  results.push(await runTest(
    'Synthetic Provider Monitoring',
    () => runSyntheticMonitoring(),
    false
  ));

  // Calculate summary statistics
  const totalDuration = Date.now() - startTime;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = results.filter(r => !r.passed).length;

  // Identify critical failures
  for (const result of results) {
    if (!result.passed) {
      if (['Environment Configuration', 'Pre-flight Safety Checks', 'Metasearch Architecture', 'Postback Signature Security'].includes(result.testName)) {
        criticalFailures.push(`${result.testName}: ${result.error}`);
      } else {
        warnings.push(`${result.testName}: ${result.error}`);
      }
    }
  }

  return {
    totalTests: results.length,
    passedTests,
    failedTests,
    totalDuration,
    results,
    criticalFailures,
    warnings
  };
}

/**
 * Print validation report
 */
function printValidationReport(suite: ValidationSuite): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 GO-LIVE VALIDATION REPORT');
  console.log('='.repeat(60));
  
  console.log(`\n🧪 Test Summary:`);
  console.log(`   Total Tests: ${suite.totalTests}`);
  console.log(`   Passed: ${suite.passedTests} ✅`);
  console.log(`   Failed: ${suite.failedTests} ❌`);
  console.log(`   Duration: ${(suite.totalDuration / 1000).toFixed(2)}s`);
  console.log(`   Success Rate: ${((suite.passedTests / suite.totalTests) * 100).toFixed(1)}%`);

  if (suite.criticalFailures.length > 0) {
    console.log(`\n🚨 CRITICAL FAILURES (BLOCKING):`);
    suite.criticalFailures.forEach(failure => {
      console.log(`   ❌ ${failure}`);
    });
  }

  if (suite.warnings.length > 0) {
    console.log(`\n⚠️ WARNINGS (NON-BLOCKING):`);
    suite.warnings.forEach(warning => {
      console.log(`   ⚠️ ${warning}`);
    });
  }

  console.log(`\n📋 Detailed Results:`);
  suite.results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    const duration = `${result.duration}ms`;
    console.log(`   ${status} ${result.testName} (${duration})`);
    if (!result.passed && result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });

  // Go-live recommendation
  console.log(`\n🚀 GO-LIVE RECOMMENDATION:`);
  if (suite.criticalFailures.length === 0) {
    console.log(`   ✅ CLEARED FOR PRODUCTION DEPLOYMENT`);
    console.log(`   🎯 All critical systems validated and working`);
    
    if (suite.warnings.length > 0) {
      console.log(`   ⚠️ ${suite.warnings.length} non-critical warnings present`);
      console.log(`   📝 Review warnings but safe to proceed`);
    }
    
    console.log(`\n📋 Next Steps:`);
    console.log(`   1. Deploy to production with conservative feature flags`);
    console.log(`   2. Monitor dashboards closely for first 24h`);
    console.log(`   3. Gradually enable providers using feature flags`);
    console.log(`   4. Watch EPC and conversion rate metrics`);
    
  } else {
    console.log(`   ❌ DO NOT DEPLOY - CRITICAL FAILURES DETECTED`);
    console.log(`   🔧 Fix critical issues before attempting go-live`);
    console.log(`   🔄 Re-run validation suite after fixes`);
  }

  console.log('\n' + '='.repeat(60));
}

// Main execution
async function main() {
  try {
    const suite = await runValidationSuite();
    printValidationReport(suite);
    
    // Exit with appropriate code
    process.exit(suite.criticalFailures.length === 0 ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Validation suite crashed:', error);
    console.log('\n❌ CRITICAL ERROR - DO NOT DEPLOY');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down validation suite...');
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down validation suite...');
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main();
}

export { runValidationSuite, printValidationReport };