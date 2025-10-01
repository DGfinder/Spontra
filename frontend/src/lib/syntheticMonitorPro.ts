/**
 * Production Synthetic Monitor with Auto-Disable
 * 
 * Monitors provider health and automatically disables failing providers
 * Runs every 15 minutes with geo-distributed test routes
 */

import { PrismaClient } from '@prisma/client';
import { buildDeeplink } from '../server/affiliates/buildDeeplink';

const prisma = new PrismaClient();

export interface SyntheticTestRoute {
  orig: string;
  dest: string;
  dep: string;
  ret?: string;
  currency: string;
  locale: string;
  description: string;
}

// 5 geo routes per market for comprehensive testing
export const GEO_TEST_ROUTES: Record<string, SyntheticTestRoute[]> = {
  AU: [
    { orig: 'SYD', dest: 'MEL', dep: '2025-11-01', ret: '2025-11-08', currency: 'AUD', locale: 'en-AU', description: 'Sydney-Melbourne domestic' },
    { orig: 'PER', dest: 'DPS', dep: '2025-11-15', ret: '2025-11-22', currency: 'AUD', locale: 'en-AU', description: 'Perth-Bali international' },
    { orig: 'BNE', dest: 'NRT', dep: '2025-12-01', ret: '2025-12-10', currency: 'AUD', locale: 'en-AU', description: 'Brisbane-Tokyo long-haul' },
    { orig: 'ADL', dest: 'SYD', dep: '2025-11-20', currency: 'AUD', locale: 'en-AU', description: 'Adelaide-Sydney one-way' },
    { orig: 'MEL', dest: 'AKL', dep: '2025-11-25', ret: '2025-12-02', currency: 'AUD', locale: 'en-AU', description: 'Melbourne-Auckland trans-Tasman' }
  ],
  NZ: [
    { orig: 'AKL', dest: 'CHC', dep: '2025-11-03', ret: '2025-11-10', currency: 'NZD', locale: 'en-NZ', description: 'Auckland-Christchurch domestic' },
    { orig: 'WLG', dest: 'SYD', dep: '2025-11-18', ret: '2025-11-25', currency: 'NZD', locale: 'en-NZ', description: 'Wellington-Sydney trans-Tasman' },
    { orig: 'AKL', dest: 'LAX', dep: '2025-12-05', ret: '2025-12-15', currency: 'NZD', locale: 'en-NZ', description: 'Auckland-Los Angeles long-haul' },
    { orig: 'CHC', dest: 'AKL', dep: '2025-11-28', currency: 'NZD', locale: 'en-NZ', description: 'Christchurch-Auckland one-way' },
    { orig: 'AKL', dest: 'FJI', dep: '2025-12-10', ret: '2025-12-17', currency: 'NZD', locale: 'en-NZ', description: 'Auckland-Fiji Pacific' }
  ],
  GB: [
    { orig: 'LHR', dest: 'CDG', dep: '2025-11-05', ret: '2025-11-08', currency: 'GBP', locale: 'en-GB', description: 'London-Paris short-haul' },
    { orig: 'MAN', dest: 'BCN', dep: '2025-11-12', ret: '2025-11-19', currency: 'GBP', locale: 'en-GB', description: 'Manchester-Barcelona European' },
    { orig: 'LHR', dest: 'JFK', dep: '2025-12-01', ret: '2025-12-08', currency: 'GBP', locale: 'en-GB', description: 'London-New York transatlantic' },
    { orig: 'EDI', dest: 'AMS', dep: '2025-11-22', currency: 'GBP', locale: 'en-GB', description: 'Edinburgh-Amsterdam one-way' },
    { orig: 'LGW', dest: 'DXB', dep: '2025-12-15', ret: '2025-12-25', currency: 'GBP', locale: 'en-GB', description: 'London-Dubai long-haul' }
  ],
  SG: [
    { orig: 'SIN', dest: 'KUL', dep: '2025-11-08', ret: '2025-11-11', currency: 'SGD', locale: 'en-SG', description: 'Singapore-Kuala Lumpur regional' },
    { orig: 'SIN', dest: 'BKK', dep: '2025-11-15', ret: '2025-11-22', currency: 'SGD', locale: 'en-SG', description: 'Singapore-Bangkok ASEAN' },
    { orig: 'SIN', dest: 'NRT', dep: '2025-12-03', ret: '2025-12-10', currency: 'SGD', locale: 'en-SG', description: 'Singapore-Tokyo North Asia' },
    { orig: 'SIN', dest: 'SYD', dep: '2025-11-25', ret: '2025-12-05', currency: 'SGD', locale: 'en-SG', description: 'Singapore-Sydney Australia' },
    { orig: 'SIN', dest: 'CGK', dep: '2025-11-30', currency: 'SGD', locale: 'en-SG', description: 'Singapore-Jakarta one-way' }
  ],
  JP: [
    { orig: 'NRT', dest: 'KIX', dep: '2025-11-15', ret: '2025-11-18', currency: 'JPY', locale: 'ja-JP', description: 'Tokyo-Osaka domestic' },
    { orig: 'NRT', dest: 'ICN', dep: '2025-11-20', ret: '2025-11-25', currency: 'JPY', locale: 'ja-JP', description: 'Tokyo-Seoul Northeast Asia' },
    { orig: 'KIX', dest: 'TPE', dep: '2025-12-01', ret: '2025-12-08', currency: 'JPY', locale: 'ja-JP', description: 'Osaka-Taipei East Asia' },
    { orig: 'NRT', dest: 'LAX', dep: '2025-12-10', ret: '2025-12-20', currency: 'JPY', locale: 'ja-JP', description: 'Tokyo-Los Angeles transpacific' },
    { orig: 'CTS', dest: 'NRT', dep: '2025-11-28', currency: 'JPY', locale: 'ja-JP', description: 'Sapporo-Tokyo domestic one-way' }
  ]
};

export interface SyntheticResult {
  providerId: string;
  market: string;
  route: SyntheticTestRoute;
  statusCode: number | null;
  responseTimeMs: number | null;
  finalHost: string | null;
  redirectCount: number;
  isHealthy: boolean;
  errorMessage: string | null;
}

export interface ProviderHealthStatus {
  providerId: string;
  market: string;
  totalChecks: number;
  healthyChecks: number;
  failureRate: number;
  avgResponseTime: number;
  shouldDisable: boolean;
  lastCheck: Date;
}

// Thresholds for auto-disable
export const HEALTH_THRESHOLDS = {
  CRITICAL_FAILURE_RATE: 0.10,  // 10% failure rate = auto-disable
  WARNING_FAILURE_RATE: 0.05,   // 5% failure rate = warning
  MAX_RESPONSE_TIME: 10000,      // 10 seconds max response time
  MIN_CHECKS_FOR_DECISION: 3,    // Need at least 3 checks to make decision
  AUTO_DISABLE_DURATION: 2 * 60 * 60 * 1000, // 2 hours auto-disable
};

/**
 * Test a single provider with a specific route
 */
async function testProviderRoute(
  provider: any,
  template: any,
  route: SyntheticTestRoute
): Promise<SyntheticResult> {
  const startTime = Date.now();
  const clickId = `SYN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const query = {
      origin: route.orig,
      destination: route.dest,
      departDate: route.dep,
      returnDate: route.ret,
      pax: { ADT: 1, CHD: 0, INF_LAP: 0, INF_SEAT: 0 },
      cabin: 'ECONOMY' as const,
      market: provider.market,
      currency: route.currency
    };

    const url = buildDeeplink({
      provider,
      linkTemplate: template,
      query,
      clickId
    });

    // Test the URL with redirect following
    let currentUrl = url;
    let redirectCount = 0;
    let finalResponse: Response | null = null;
    const maxRedirects = 5;

    while (redirectCount < maxRedirects) {
      const response = await fetch(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'SpontraSynthetic/2.0 (Health Monitor)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': route.locale,
          'X-Spontra-Monitor': '1',
          'X-Spontra-Route': route.description
        },
        redirect: 'manual',
        signal: AbortSignal.timeout(HEALTH_THRESHOLDS.MAX_RESPONSE_TIME)
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) break;
        
        currentUrl = new URL(location, currentUrl).toString();
        redirectCount++;
        continue;
      } else {
        finalResponse = response;
        break;
      }
    }

    const responseTime = Date.now() - startTime;
    const finalHost = finalResponse ? new URL(currentUrl).hostname : null;
    const statusCode = finalResponse?.status || null;
    
    // Determine if healthy
    const isHealthy = statusCode !== null && 
                     statusCode >= 200 && 
                     statusCode < 400 && 
                     responseTime < HEALTH_THRESHOLDS.MAX_RESPONSE_TIME &&
                     redirectCount <= maxRedirects;

    return {
      providerId: provider.providerId,
      market: provider.market,
      route,
      statusCode,
      responseTimeMs: responseTime,
      finalHost,
      redirectCount,
      isHealthy,
      errorMessage: null
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      providerId: provider.providerId,
      market: provider.market,
      route,
      statusCode: null,
      responseTimeMs: responseTime,
      finalHost: null,
      redirectCount: 0,
      isHealthy: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Calculate provider health status from recent checks
 */
async function calculateProviderHealth(
  providerId: string,
  market: string,
  since: Date = new Date(Date.now() - 60 * 60 * 1000) // Last hour
): Promise<ProviderHealthStatus> {
  const checks = await prisma.syntheticCheck.findMany({
    where: {
      providerId,
      market,
      checkedAt: { gte: since }
    },
    orderBy: { checkedAt: 'desc' }
  });

  const totalChecks = checks.length;
  const healthyChecks = checks.filter(c => c.isHealthy).length;
  const failureRate = totalChecks > 0 ? (totalChecks - healthyChecks) / totalChecks : 0;
  
  const responseTimes = checks
    .filter(c => c.responseTimeMs !== null)
    .map(c => c.responseTimeMs!);
  const avgResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    : 0;

  const shouldDisable = totalChecks >= HEALTH_THRESHOLDS.MIN_CHECKS_FOR_DECISION &&
                       failureRate >= HEALTH_THRESHOLDS.CRITICAL_FAILURE_RATE;

  return {
    providerId,
    market,
    totalChecks,
    healthyChecks,
    failureRate,
    avgResponseTime,
    shouldDisable,
    lastCheck: checks[0]?.checkedAt || new Date()
  };
}

/**
 * Auto-disable provider if health thresholds exceeded
 */
async function autoDisableIfUnhealthy(health: ProviderHealthStatus): Promise<boolean> {
  if (!health.shouldDisable) return false;

  console.warn(`🚨 Auto-disabling ${health.providerId}/${health.market} - Failure rate: ${(health.failureRate * 100).toFixed(1)}%`);

  // Update provider to inactive
  await prisma.provider.updateMany({
    where: {
      providerId: health.providerId,
      market: health.market
    },
    data: {
      isActive: false,
      // Could add an auto-re-enable timestamp if desired
    }
  });

  // Log the auto-disable action
  await prisma.syntheticCheck.create({
    data: {
      providerId: health.providerId,
      market: health.market,
      testQuery: { action: 'AUTO_DISABLE', reason: 'HEALTH_THRESHOLD_EXCEEDED' },
      statusCode: null,
      responseTimeMs: null,
      finalHost: null,
      titleHash: null,
      errorMessage: `Auto-disabled due to ${(health.failureRate * 100).toFixed(1)}% failure rate`,
      isHealthy: false
    }
  });

  return true;
}

/**
 * Run complete synthetic monitoring cycle
 */
export async function runSyntheticMonitoringPro(): Promise<{
  totalTests: number;
  healthyTests: number;
  failureRate: number;
  autoDisabledProviders: string[];
  warnings: string[];
}> {
  console.log('🤖 Starting Production Synthetic Monitoring');
  
  const results: SyntheticResult[] = [];
  const autoDisabledProviders: string[] = [];
  const warnings: string[] = [];

  try {
    // Get all active providers with templates
    const providers = await prisma.provider.findMany({
      where: { 
        isActive: true,
        template: { isNot: null }
      },
      include: { template: true }
    });

    console.log(`Testing ${providers.length} active providers across ${Object.keys(GEO_TEST_ROUTES).length} markets`);

    // Test each provider with all routes for their market
    for (const provider of providers) {
      if (!provider.template) continue;

      const routes = GEO_TEST_ROUTES[provider.market] || [];
      if (routes.length === 0) {
        warnings.push(`No test routes defined for market ${provider.market}`);
        continue;
      }

      console.log(`Testing ${provider.providerId} (${provider.market}) with ${routes.length} routes`);

      for (const route of routes) {
        try {
          const result = await testProviderRoute(provider, provider.template, route);
          results.push(result);

          // Log result to database
          await prisma.syntheticCheck.create({
            data: {
              providerId: result.providerId,
              market: result.market,
              testQuery: route as any,
              statusCode: result.statusCode,
              responseTimeMs: result.responseTimeMs,
              finalHost: result.finalHost,
              titleHash: null,
              errorMessage: result.errorMessage,
              isHealthy: result.isHealthy
            }
          });

          // Brief delay between tests to be respectful
          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
          console.error(`Failed to test ${provider.providerId} with route ${route.description}:`, error);
        }
      }

      // Calculate health for this provider after all route tests
      const health = await calculateProviderHealth(provider.providerId, provider.market);
      
      if (health.shouldDisable) {
        const disabled = await autoDisableIfUnhealthy(health);
        if (disabled) {
          autoDisabledProviders.push(`${health.providerId}/${health.market}`);
        }
      } else if (health.failureRate >= HEALTH_THRESHOLDS.WARNING_FAILURE_RATE) {
        warnings.push(`${health.providerId}/${health.market} has ${(health.failureRate * 100).toFixed(1)}% failure rate`);
      }
    }

    // Calculate overall statistics
    const totalTests = results.length;
    const healthyTests = results.filter(r => r.isHealthy).length;
    const overallFailureRate = totalTests > 0 ? (totalTests - healthyTests) / totalTests : 0;

    // Clean up old synthetic check records (keep 7 days)
    const cleanupResult = await prisma.syntheticCheck.deleteMany({
      where: {
        checkedAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    if (cleanupResult.count > 0) {
      console.log(`🧹 Cleaned up ${cleanupResult.count} old synthetic check records`);
    }

    console.log(`✅ Synthetic monitoring completed: ${healthyTests}/${totalTests} tests passed (${((1 - overallFailureRate) * 100).toFixed(1)}% success rate)`);

    if (autoDisabledProviders.length > 0) {
      console.warn(`🚨 Auto-disabled providers: ${autoDisabledProviders.join(', ')}`);
    }

    return {
      totalTests,
      healthyTests,
      failureRate: overallFailureRate,
      autoDisabledProviders,
      warnings
    };

  } catch (error) {
    console.error('❌ Synthetic monitoring failed:', error);
    throw error;
  }
}

/**
 * Get provider health summary for dashboard
 */
export async function getProviderHealthSummary(): Promise<ProviderHealthStatus[]> {
  const providers = await prisma.provider.findMany({
    select: { providerId: true, market: true }
  });

  const healthSummaries = await Promise.all(
    providers.map(p => calculateProviderHealth(p.providerId, p.market))
  );

  return healthSummaries.sort((a, b) => b.failureRate - a.failureRate);
}