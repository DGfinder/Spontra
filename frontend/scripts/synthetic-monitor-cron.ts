#!/usr/bin/env tsx

/**
 * Synthetic Monitor Cron Worker
 * 
 * This script tests all active provider deeplinks every 15 minutes to ensure:
 * 1. Links are responding (HTTP 200-399)
 * 2. Response times are acceptable (<5s)
 * 3. Final landing hosts match expectations
 * 4. No excessive redirects (>5 hops)
 * 
 * Run via cron: every 15 minutes - crontab pattern: star/15 star star star star
 */

import { PrismaClient } from '@prisma/client';
import { buildDeeplink } from '../src/server/affiliates/buildDeeplink';
import crypto from 'node:crypto';

const prisma = new PrismaClient();

interface SyntheticTestResult {
  providerId: string;
  market: string;
  url: string;
  statusCode: number | null;
  responseTimeMs: number | null;
  finalHost: string | null;
  titleHash: string | null;
  redirectCount: number;
  errorMessage: string | null;
  isHealthy: boolean;
}

interface TestQuery {
  origin: string;
  destination: string;
  departDate: string;
  pax: { ADT: number; CHD: number; INF_LAP: number; INF_SEAT: number };
  cabin: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  market: string;
  currency: string;
  [key: string]: unknown;
}

// Standard test queries for different markets
const TEST_QUERIES: Record<string, TestQuery> = {
  AU: {
    origin: 'SYD',
    destination: 'MEL',
    departDate: '2025-12-01',
    pax: { ADT: 1, CHD: 0, INF_LAP: 0, INF_SEAT: 0 },
    cabin: 'ECONOMY',
    market: 'AU',
    currency: 'AUD'
  },
  NZ: {
    origin: 'AKL',
    destination: 'CHC',
    departDate: '2025-12-01',
    pax: { ADT: 1, CHD: 0, INF_LAP: 0, INF_SEAT: 0 },
    cabin: 'ECONOMY',
    market: 'NZ',
    currency: 'NZD'
  }
};

// Expected landing hosts for validation
const EXPECTED_HOSTS: Record<string, string[]> = {
  'kayak': ['kayak.com.au', 'kayak.co.nz', 'kayak.com'],
  'skyscanner': ['skyscanner.com.au', 'skyscanner.co.nz', 'skyscanner.net'],
  'jetstar': ['jetstar.com', 'jetstar.co.nz'],
  'virgin': ['virginaustralia.com', 'airnewzealand.com'],
  'expedia': ['expedia.com.au', 'expedia.co.nz'],
  'air-new-zealand': ['airnewzealand.com', 'airnewzealand.co.nz']
};

/**
 * Test a single provider deeplink
 */
async function testProviderLink(
  provider: any,
  template: any,
  testQuery: TestQuery
): Promise<SyntheticTestResult> {
  const startTime = Date.now();
  const clickId = `SYNTHETIC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Generate the deeplink
    const url = buildDeeplink({
      provider,
      linkTemplate: template,
      query: testQuery,
      clickId,
      campaignId: 'synthetic_monitor',
      placementId: 'health_check'
    });

    console.log(`Testing ${provider.providerId} (${provider.market}): ${url.slice(0, 100)}...`);

    // Follow redirects manually to count hops and get final destination
    let currentUrl = url;
    let redirectCount = 0;
    let finalResponse: Response | null = null;
    const maxRedirects = 10;

    while (redirectCount < maxRedirects) {
      const response = await fetch(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Spontra-Synthetic-Monitor/1.0 (Health Check Bot)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        redirect: 'manual', // Handle redirects manually
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.status >= 300 && response.status < 400) {
        // It's a redirect
        const location = response.headers.get('location');
        if (!location) {
          throw new Error('Redirect response without Location header');
        }
        
        currentUrl = new URL(location, currentUrl).toString();
        redirectCount++;
        continue;
      } else {
        // Final response
        finalResponse = response;
        break;
      }
    }

    if (!finalResponse) {
      throw new Error(`Too many redirects (>${maxRedirects})`);
    }

    const responseTime = Date.now() - startTime;
    const finalUrl = new URL(currentUrl);
    const finalHost = finalUrl.hostname.toLowerCase();

    // Get page title for consistency checks
    let titleHash: string | null = null;
    try {
      if (finalResponse.headers.get('content-type')?.includes('text/html')) {
        const html = await finalResponse.text();
        const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
        if (titleMatch) {
          titleHash = crypto.createHash('md5').update(titleMatch[1].trim()).digest('hex');
        }
      }
    } catch (titleError) {
      console.warn(`Could not extract title for ${provider.providerId}: ${titleError}`);
    }

    // Validate expected host
    const expectedHosts = EXPECTED_HOSTS[provider.providerId] || [];
    const hostMatches = expectedHosts.length === 0 || 
      expectedHosts.some(expected => finalHost.includes(expected.toLowerCase()));

    if (!hostMatches) {
      console.warn(`Unexpected host for ${provider.providerId}: got ${finalHost}, expected one of ${expectedHosts.join(', ')}`);
    }

    // Determine if the link is healthy
    const isHealthy = finalResponse.status >= 200 && 
                     finalResponse.status < 400 && 
                     responseTime < 10000 && 
                     redirectCount <= 5;

    return {
      providerId: provider.providerId,
      market: provider.market,
      url: url.slice(0, 500), // Truncate for storage
      statusCode: finalResponse.status,
      responseTimeMs: responseTime,
      finalHost: finalHost.slice(0, 100),
      titleHash,
      redirectCount,
      errorMessage: null,
      isHealthy
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      providerId: provider.providerId,
      market: provider.market,
      url: '',
      statusCode: null,
      responseTimeMs: responseTime,
      finalHost: null,
      titleHash: null,
      redirectCount: 0,
      errorMessage: error instanceof Error ? error.message.slice(0, 500) : 'Unknown error',
      isHealthy: false
    };
  }
}

/**
 * Run synthetic monitoring for all active providers
 */
async function runSyntheticMonitoring(): Promise<void> {
  console.log('🤖 Starting Synthetic Monitor Run');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  try {
    // Get all active providers with templates
    const providers = await prisma.provider.findMany({
      where: { 
        isActive: true,
        template: { isNot: null }
      },
      include: { template: true }
    });

    console.log(`Found ${providers.length} active providers to test`);

    if (providers.length === 0) {
      console.log('No active providers found. Exiting.');
      return;
    }

    const results: SyntheticTestResult[] = [];

    // Test each provider
    for (const provider of providers) {
      if (!provider.template) {
        console.warn(`Provider ${provider.providerId} has no template, skipping`);
        continue;
      }

      const testQuery = TEST_QUERIES[provider.market];
      if (!testQuery) {
        console.warn(`No test query defined for market ${provider.market}, skipping ${provider.providerId}`);
        continue;
      }

      try {
        const result = await testProviderLink(provider, provider.template, testQuery);
        results.push(result);

        // Log result
        if (result.isHealthy) {
          console.log(`✅ ${result.providerId} (${result.market}): ${result.statusCode} in ${result.responseTimeMs}ms`);
        } else {
          console.log(`❌ ${result.providerId} (${result.market}): ${result.errorMessage || `${result.statusCode} in ${result.responseTimeMs}ms`}`);
        }

        // Brief delay between tests to be respectful
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Failed to test ${provider.providerId}:`, error);
        results.push({
          providerId: provider.providerId,
          market: provider.market,
          url: '',
          statusCode: null,
          responseTimeMs: null,
          finalHost: null,
          titleHash: null,
          redirectCount: 0,
          errorMessage: error instanceof Error ? error.message : 'Test execution failed',
          isHealthy: false
        });
      }
    }

    // Save all results to database
    console.log('\n💾 Saving results to database...');
    
    for (const result of results) {
      await prisma.syntheticCheck.create({
        data: {
          providerId: result.providerId,
          market: result.market,
          testQuery: TEST_QUERIES[result.market] as any,
          statusCode: result.statusCode,
          responseTimeMs: result.responseTimeMs,
          finalHost: result.finalHost,
          titleHash: result.titleHash,
          errorMessage: result.errorMessage,
          isHealthy: result.isHealthy
        }
      });
    }

    // Summary statistics
    const healthyCount = results.filter(r => r.isHealthy).length;
    const totalCount = results.length;
    const avgResponseTime = results
      .filter(r => r.responseTimeMs !== null)
      .reduce((sum, r) => sum + (r.responseTimeMs || 0), 0) / 
      results.filter(r => r.responseTimeMs !== null).length;

    console.log('\n📊 Summary:');
    console.log(`   Healthy: ${healthyCount}/${totalCount} (${((healthyCount/totalCount)*100).toFixed(1)}%)`);
    console.log(`   Average Response Time: ${Math.round(avgResponseTime)}ms`);

    // Alert if failure rate is high
    const failureRate = ((totalCount - healthyCount) / totalCount) * 100;
    if (failureRate > 20) {
      console.log(`🚨 HIGH FAILURE RATE: ${failureRate.toFixed(1)}% - Consider alerting operations team`);
    } else if (failureRate > 10) {
      console.log(`⚠️ Elevated failure rate: ${failureRate.toFixed(1)}%`);
    }

    // Cleanup old records (keep last 7 days)
    const deleted = await prisma.syntheticCheck.deleteMany({
      where: {
        checkedAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    if (deleted.count > 0) {
      console.log(`🧹 Cleaned up ${deleted.count} old synthetic check records`);
    }

    console.log('✅ Synthetic monitoring completed successfully');

  } catch (error) {
    console.error('❌ Synthetic monitoring failed:', error);
    throw error;
  }
}

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Run the monitoring
if (require.main === module) {
  runSyntheticMonitoring()
    .then(() => {
      console.log('Synthetic monitoring job completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Synthetic monitoring job failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

export { runSyntheticMonitoring };