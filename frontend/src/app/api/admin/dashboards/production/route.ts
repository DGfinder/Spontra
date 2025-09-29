/**
 * Production Observability Dashboard API
 * 
 * Real-time metrics for production monitoring and alerting
 * Critical for 3 AM paging decisions and revenue optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { getProviderHealthSummary } from '@/lib/syntheticMonitorPro';
import { getPriceAccuracyDashboard } from '@/lib/priceAccuracyThrottling';
import { getRolloutDashboard } from '@/lib/rolloutConfiguration';

export const runtime = 'nodejs';

// TypeScript interfaces for query results
interface HourlyRevenueRow {
  hour: Date;
  clicks: number;
  conversions: number;
  revenue: number;
}

interface EpcTrendRow {
  hour: Date;
  epc: number;
}

interface ErrorRateRow {
  endpoint: string;
  total_requests: number;
  errors: number;
  error_rate: number;
}

interface ResponseTimeStatsRow {
  endpoint: string;
  avg_response_time: number;
  p50: number;
  p95: number;
  p99: number;
}

interface RolloutMetricsRow {
  market: string;
  clicks: number;
  conversions: number;
  revenue: number;
}

interface CurrentEpcRow {
  epc: number;
}

export async function GET(request: NextRequest): Promise<Response> {
  const startTime = Date.now();
  
  try {
    const url = new URL(request.url);
    const dashboardType = url.searchParams.get('type') || 'overview';
    const timeRange = url.searchParams.get('range') || '24h';

    switch (dashboardType) {
      case 'overview':
        return NextResponse.json(await getOverviewDashboard(timeRange));
      case 'revenue':
        return NextResponse.json(await getRevenueDashboard(timeRange));
      case 'health':
        return NextResponse.json(await getHealthDashboard(timeRange));
      case 'security':
        return NextResponse.json(await getSecurityDashboard(timeRange));
      case 'rollout':
        return NextResponse.json(await getRolloutStatusDashboard());
      case 'alerts':
        return NextResponse.json(await getActiveAlerts());
      default:
        return NextResponse.json({ error: 'Unknown dashboard type' }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Dashboard unavailable', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Main overview dashboard - key metrics at a glance
 */
async function getOverviewDashboard(timeRange: string) {
  const since = getTimeRangeDate(timeRange);
  
  // Core metrics
  const [
    totalClicks,
    totalConversions,
    totalRevenue,
    activeProviders,
    averageEPC,
    conversionRate
  ] = await Promise.all([
    prisma.click.count({ where: { createdAt: { gte: since } } }),
    prisma.conversion.count({ where: { createdAt: { gte: since } } }),
    prisma.conversion.aggregate({
      where: { createdAt: { gte: since } },
      _sum: { commission: true }
    }),
    prisma.provider.count({ where: { isActive: true } }),
    prisma.conversion.aggregate({
      where: { createdAt: { gte: since } },
      _avg: { commission: true }
    }),
    // Conversion rate calculation
    Promise.resolve(0) // Will calculate below
  ]);

  const revenue = Number(totalRevenue._sum.commission || 0);
  const avgEPC = totalClicks > 0 ? revenue / totalClicks : 0;
  const convRate = totalClicks > 0 ? (Number(totalConversions) / Number(totalClicks)) * 100 : 0;

  // Market breakdown
  const marketStats = await prisma.click.groupBy({
    by: ['market'],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
    orderBy: { _count: { market: 'desc' } }
  });

  // Provider performance
  const providerStats = await prisma.click.groupBy({
    by: ['providerId'],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
    orderBy: { _count: { providerId: 'desc' } },
    take: 10
  });

  // Recent activity
  const recentActivity = await prisma.click.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } }, // Last 5 minutes
    select: {
      clickId: true,
      providerId: true,
      market: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  return {
    summary: {
      totalClicks,
      totalConversions,
      totalRevenue: revenue,
      activeProviders,
      averageEPC: avgEPC,
      conversionRate: convRate,
      timeRange
    },
    markets: marketStats.map(m => ({
      market: m.market,
      clicks: m._count._all
    })),
    topProviders: providerStats.map(p => ({
      providerId: p.providerId,
      clicks: p._count._all
    })),
    recentActivity: recentActivity.map(a => ({
      clickId: a.clickId,
      provider: a.providerId,
      market: a.market,
      timestamp: a.createdAt
    })),
    lastUpdated: new Date()
  };
}

/**
 * Revenue-focused dashboard for financial monitoring
 */
async function getRevenueDashboard(timeRange: string) {
  const since = getTimeRangeDate(timeRange);

  // Revenue by provider
  const revenueByProvider = await prisma.$queryRaw`
    SELECT 
      c.providerId,
      c.market,
      COUNT(c.id) as clicks,
      COUNT(conv.id) as conversions,
      COALESCE(SUM(conv.commission), 0) as revenue,
      ROUND(COALESCE(SUM(conv.commission) / COUNT(c.id), 0), 4) as epc,
      ROUND(100.0 * COUNT(conv.id) / COUNT(c.id), 2) as conversion_rate
    FROM clicks c
    LEFT JOIN conversions conv ON conv.clickId = c.clickId
    WHERE c.createdAt >= ${since}
    GROUP BY c.providerId, c.market
    ORDER BY revenue DESC
  ` as Array<{
    providerId: string;
    market: string;
    clicks: number;
    conversions: number;
    revenue: number;
    epc: number;
    conversion_rate: number;
  }>;

  // Hourly revenue trend
  const hourlyRevenue = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('hour', c.createdAt) as hour,
      COUNT(c.id) as clicks,
      COUNT(conv.id) as conversions,
      COALESCE(SUM(conv.commission), 0) as revenue
    FROM clicks c
    LEFT JOIN conversions conv ON conv.clickId = c.clickId
    WHERE c.createdAt >= ${since}
    GROUP BY hour
    ORDER BY hour
  ` as HourlyRevenueRow[];

  // EPC trend (last 24 hours)
  const epcTrend = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('hour', c.createdAt) as hour,
      ROUND(COALESCE(SUM(conv.commission) / COUNT(c.id), 0), 4) as epc
    FROM clicks c
    LEFT JOIN conversions conv ON conv.clickId = c.clickId
    WHERE c.createdAt >= NOW() - INTERVAL '24 hours'
    GROUP BY hour
    ORDER BY hour
  ` as EpcTrendRow[];

  // Revenue alerts
  const alerts = await checkRevenueAlerts(since);

  return {
    summary: {
      totalRevenue: revenueByProvider.reduce((sum: number, p: any) => sum + Number(p.revenue), 0),
      avgEPC: revenueByProvider.reduce((sum: number, p: any) => sum + Number(p.epc), 0) / revenueByProvider.length,
      topPerformer: revenueByProvider[0],
      timeRange
    },
    providerBreakdown: revenueByProvider,
    hourlyTrend: hourlyRevenue,
    epcTrend: epcTrend,
    alerts,
    lastUpdated: new Date()
  };
}

/**
 * Health monitoring dashboard
 */
async function getHealthDashboard(timeRange: string) {
  const since = getTimeRangeDate(timeRange);

  // Get provider health data
  const [providerHealth, priceAccuracy] = await Promise.all([
    getProviderHealthSummary(),
    getPriceAccuracyDashboard()
  ]);

  // Error rate by endpoint (using simplified aggregation)
  const errorRates = await prisma.apiLog.groupBy({
    by: ['endpoint'],
    where: {
      createdAt: { gte: since }
    },
    _count: true
  }).then(results => 
    results.map(r => ({
      endpoint: r.endpoint,
      total_requests: r._count,
      errors: 0, // Would need separate query for errors >= 400
      error_rate: 0 // Would need proper calculation
    }))
  ).catch(() => []) as ErrorRateRow[];

  // Response time percentiles  
  const responseTimeStats = await prisma.apiLog.groupBy({
    by: ['endpoint'],
    where: {
      createdAt: { gte: since },
      responseTimeMs: { not: null }
    },
    _avg: {
      responseTimeMs: true
    },
    _count: { _all: true }
  }).then(results => 
    results.map(r => ({
      endpoint: r.endpoint,
      avg_response_time: Math.round(r._avg.responseTimeMs || 0),
      p50: Math.round(r._avg.responseTimeMs || 0), // Simplified - would need proper percentile calculation
      p95: Math.round((r._avg.responseTimeMs || 0) * 1.5), // Approximation
      p99: Math.round((r._avg.responseTimeMs || 0) * 2) // Approximation
    }))
  ).catch(() => []) as ResponseTimeStatsRow[];

  // Health alerts
  const healthAlerts = await checkHealthAlerts();

  return {
    providerHealth: providerHealth.map(p => ({
      provider: p.providerId,
      market: p.market,
      healthScore: 100 - (p.failureRate * 100),
      failureRate: p.failureRate,
      avgResponseTime: p.avgResponseTime,
      lastCheck: p.lastCheck,
      status: p.shouldDisable ? 'CRITICAL' : p.failureRate > 0.05 ? 'WARNING' : 'HEALTHY'
    })),
    priceAccuracy: priceAccuracy.map(p => ({
      provider: p.providerId,
      market: p.market,
      accuracyScore: 100 - (p.changeRate * 100),
      changeRate: p.changeRate,
      status: p.throttleStatus
    })),
    systemHealth: {
      errorRates,
      responseTimeStats
    },
    alerts: healthAlerts,
    lastUpdated: new Date()
  };
}

/**
 * Security monitoring dashboard
 */
async function getSecurityDashboard(timeRange: string) {
  const since = getTimeRangeDate(timeRange);

  // Failed authentication attempts
  const authFailures = await prisma.authLog.groupBy({
    by: ['ipAddress', 'reason'],
    where: {
      createdAt: { gte: since },
      success: false
    },
    _count: true,
    orderBy: {
      _count: {
        _all: 'desc'
      }
    },
    take: 20
  });

  // Postback verification failures
  const postbackFailures = await prisma.postbackLog.findMany({
    where: {
      createdAt: { gte: since },
      verified: false
    },
    select: {
      network: true,
      ipAddress: true,
      reason: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  // Rate limit violations
  const rateLimitViolations = await prisma.rateLimitLog.groupBy({
    by: ['ipAddress', 'endpoint'],
    where: { createdAt: { gte: since } },
    _count: true,
    orderBy: {
      _count: {
        _all: 'desc'
      }
    },
    take: 20
  });

  // Security alerts
  const securityAlerts = await checkSecurityAlerts(since);

  return {
    authFailures: authFailures.map(f => ({
      ip: f.ipAddress,
      reason: f.reason,
      attempts: f._count
    })),
    postbackFailures: postbackFailures.map(p => ({
      network: p.network,
      ip: p.ipAddress,
      reason: p.reason,
      timestamp: p.createdAt
    })),
    rateLimitViolations: rateLimitViolations.map(r => ({
      ip: r.ipAddress,
      endpoint: r.endpoint,
      violations: r._count
    })),
    alerts: securityAlerts,
    lastUpdated: new Date()
  };
}

/**
 * Rollout status dashboard
 */
async function getRolloutStatusDashboard() {
  const rolloutStatus = getRolloutDashboard();
  
  // Get rollout performance metrics
  const rolloutMetrics: RolloutMetricsRow[] = rolloutStatus.currentWave ? await prisma.$queryRaw`
    SELECT 
      market,
      COUNT(*) as clicks,
      COUNT(conv.id) as conversions,
      COALESCE(SUM(conv.commission), 0) as revenue
    FROM clicks c
    LEFT JOIN conversions conv ON conv.clickId = c.clickId
    WHERE c.market = ANY(${rolloutStatus.allowedMarkets})
      AND c.providerId = ANY(${rolloutStatus.allowedProviders})
      AND c.createdAt >= CURRENT_DATE
    GROUP BY market
  ` as RolloutMetricsRow[] : [];

  return {
    ...rolloutStatus,
    metrics: rolloutMetrics,
    lastUpdated: new Date()
  };
}

/**
 * Active alerts aggregation
 */
async function getActiveAlerts() {
  const [revenueAlerts, healthAlerts, securityAlerts] = await Promise.all([
    checkRevenueAlerts(new Date(Date.now() - 24 * 60 * 60 * 1000)),
    checkHealthAlerts(),
    checkSecurityAlerts(new Date(Date.now() - 24 * 60 * 60 * 1000))
  ]);

  const allAlerts = [
    ...revenueAlerts.map(a => ({ ...a, category: 'REVENUE' })),
    ...healthAlerts.map(a => ({ ...a, category: 'HEALTH' })),
    ...securityAlerts.map(a => ({ ...a, category: 'SECURITY' }))
  ].sort((a, b) => b.severity.localeCompare(a.severity));

  return {
    alerts: allAlerts,
    summary: {
      critical: allAlerts.filter(a => a.severity === 'CRITICAL').length,
      warning: allAlerts.filter(a => a.severity === 'WARNING').length,
      info: allAlerts.filter(a => a.severity === 'INFO').length
    },
    lastUpdated: new Date()
  };
}

// Helper functions for alert checking
interface Alert {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  timestamp: Date;
}

async function checkRevenueAlerts(since: Date): Promise<Alert[]> {
  const alerts: Alert[] = [];
  
  // EPC drop alert
  const currentEPC = await prisma.$queryRaw`
    SELECT COALESCE(SUM(conv.commission) / COUNT(c.id), 0) as epc
    FROM clicks c
    LEFT JOIN conversions conv ON conv.clickId = c.clickId
    WHERE c.createdAt >= ${since}
  ` as CurrentEpcRow[];
  
  // Add EPC comparison logic here
  return alerts;
}

async function checkHealthAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];
  const providerHealth = await getProviderHealthSummary();
  
  providerHealth.forEach(provider => {
    if (provider.shouldDisable) {
      alerts.push({
        id: `health-critical-${provider.providerId}`,
        severity: 'CRITICAL',
        title: `Provider ${provider.providerId} auto-disabled`,
        message: `Failure rate: ${(provider.failureRate * 100).toFixed(1)}%`,
        timestamp: provider.lastCheck
      });
    } else if (provider.failureRate > 0.05) {
      alerts.push({
        id: `health-warning-${provider.providerId}`,
        severity: 'WARNING',
        title: `Provider ${provider.providerId} degraded`,
        message: `Failure rate: ${(provider.failureRate * 100).toFixed(1)}%`,
        timestamp: provider.lastCheck
      });
    }
  });
  
  return alerts;
}

async function checkSecurityAlerts(since: Date): Promise<Alert[]> {
  const alerts: Alert[] = [];
  
  // Check for postback authentication failures
  const postbackFailures = await prisma.postbackLog.count({
    where: {
      createdAt: { gte: since },
      verified: false
    }
  });
  
  if (postbackFailures > 10) {
    alerts.push({
      id: 'security-postback-failures',
      severity: 'CRITICAL',
      title: 'High postback authentication failures',
      message: `${postbackFailures} failures in last 24h`,
      timestamp: new Date()
    });
  }
  
  return alerts;
}

function getTimeRangeDate(range: string): Date {
  const now = new Date();
  switch (range) {
    case '1h': return new Date(now.getTime() - 60 * 60 * 1000);
    case '6h': return new Date(now.getTime() - 6 * 60 * 60 * 1000);
    case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default: return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
}