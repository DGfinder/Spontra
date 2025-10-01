/**
 * Price Accuracy Throttling System
 * 
 * Automatically downranks or hides providers with high price change rates
 * Protects user experience from unreliable pricing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PriceAccuracyMetrics {
  providerId: string;
  market: string;
  totalChecks: number;
  priceChanges: number;
  changeRate: number;
  avgChangePercent: number;
  lastCheck: Date;
  reliabilityScore: number;
  throttleStatus: ThrottleStatus;
}

export enum ThrottleStatus {
  HEALTHY = 'HEALTHY',           // <5% change rate
  WARNING = 'WARNING',           // 5-15% change rate  
  DOWNRANKED = 'DOWNRANKED',     // 15-25% change rate - show but rank lower
  HIDDEN = 'HIDDEN'              // >25% change rate - hide for 2 hours
}

// Thresholds for price accuracy throttling
export const PRICE_ACCURACY_THRESHOLDS = {
  WARNING_CHANGE_RATE: 0.05,     // 5% - start monitoring
  DOWNRANK_CHANGE_RATE: 0.15,    // 15% - lower ranking
  HIDE_CHANGE_RATE: 0.25,        // 25% - hide completely
  MIN_CHECKS_FOR_DECISION: 10,   // Need 10+ checks to make throttling decision
  EVALUATION_WINDOW_HOURS: 24,   // Look at last 24 hours
  HIDE_DURATION_HOURS: 2,        // Hide for 2 hours when threshold exceeded
  RELIABILITY_DECAY_FACTOR: 0.1  // How much to decay reliability score
};

/**
 * Calculate price accuracy metrics for a provider
 */
export async function calculatePriceAccuracy(
  providerId: string,
  market: string,
  windowHours: number = PRICE_ACCURACY_THRESHOLDS.EVALUATION_WINDOW_HOURS
): Promise<PriceAccuracyMetrics> {
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
  
  const checks = await prisma.priceAccuracy.findMany({
    where: {
      providerId,
      checkedAt: { gte: since }
    },
    orderBy: { checkedAt: 'desc' }
  });

  const totalChecks = checks.length;
  const priceChanges = checks.filter(c => c.priceChanged).length;
  const changeRate = totalChecks > 0 ? priceChanges / totalChecks : 0;

  // Calculate average price change percentage for changed prices only
  const changedChecks = checks.filter(c => c.priceChanged && c.percentageChange !== null);
  const avgChangePercent = changedChecks.length > 0
    ? changedChecks.reduce((sum, c) => sum + Math.abs(Number(c.percentageChange!)), 0) / changedChecks.length
    : 0;

  // Get current provider reliability score
  const provider = await prisma.provider.findFirst({
    where: { providerId, market },
    select: { reliabilityScore: true }
  });

  const currentReliability = provider?.reliabilityScore || 0.8;

  // Determine throttle status
  let throttleStatus: ThrottleStatus;
  if (totalChecks < PRICE_ACCURACY_THRESHOLDS.MIN_CHECKS_FOR_DECISION) {
    throttleStatus = ThrottleStatus.HEALTHY; // Not enough data
  } else if (changeRate >= PRICE_ACCURACY_THRESHOLDS.HIDE_CHANGE_RATE) {
    throttleStatus = ThrottleStatus.HIDDEN;
  } else if (changeRate >= PRICE_ACCURACY_THRESHOLDS.DOWNRANK_CHANGE_RATE) {
    throttleStatus = ThrottleStatus.DOWNRANKED;
  } else if (changeRate >= PRICE_ACCURACY_THRESHOLDS.WARNING_CHANGE_RATE) {
    throttleStatus = ThrottleStatus.WARNING;
  } else {
    throttleStatus = ThrottleStatus.HEALTHY;
  }

  return {
    providerId,
    market,
    totalChecks,
    priceChanges,
    changeRate,
    avgChangePercent,
    lastCheck: checks[0]?.checkedAt || new Date(),
    reliabilityScore: currentReliability,
    throttleStatus
  };
}

/**
 * Apply throttling based on price accuracy metrics
 */
export async function applyPriceAccuracyThrottling(
  metrics: PriceAccuracyMetrics
): Promise<{ applied: boolean; action: string; duration?: number }> {
  const { providerId, market, throttleStatus, changeRate } = metrics;

  switch (throttleStatus) {
    case ThrottleStatus.HIDDEN:
      // Temporarily disable provider
      await prisma.provider.updateMany({
        where: { providerId, market },
        data: {
          isActive: false,
          // Store when to re-enable (could add a field for this)
        }
      });

      // Log the throttling action
      await prisma.priceAccuracy.create({
        data: {
          providerId,
          offerId: 'THROTTLE_ACTION',
          originalPrice: 0,
          repricedPrice: 0,
          currency: 'USD',
          priceChanged: false,
          percentageChange: changeRate * 100,
          checkType: 'throttle_hide'
        }
      });

      console.warn(`🚨 HIDDEN provider ${providerId}/${market} - Price change rate: ${(changeRate * 100).toFixed(1)}%`);
      return { 
        applied: true, 
        action: 'HIDDEN', 
        duration: PRICE_ACCURACY_THRESHOLDS.HIDE_DURATION_HOURS * 60 * 60 * 1000 
      };

    case ThrottleStatus.DOWNRANKED:
      // Lower reliability score to affect ranking
      const newReliability = Math.max(0.1, 
        metrics.reliabilityScore * (1 - PRICE_ACCURACY_THRESHOLDS.RELIABILITY_DECAY_FACTOR)
      );

      await prisma.provider.updateMany({
        where: { providerId, market },
        data: { reliabilityScore: newReliability }
      });

      console.warn(`⚠️ DOWNRANKED provider ${providerId}/${market} - Price change rate: ${(changeRate * 100).toFixed(1)}%`);
      return { applied: true, action: 'DOWNRANKED' };

    case ThrottleStatus.WARNING:
      console.warn(`⚠️ WARNING: ${providerId}/${market} price change rate: ${(changeRate * 100).toFixed(1)}%`);
      return { applied: true, action: 'WARNING' };

    default:
      return { applied: false, action: 'NO_ACTION' };
  }
}

/**
 * Get providers that should be filtered from search results
 */
export async function getFilteredProviders(market: string): Promise<{
  hidden: string[];
  downranked: string[];
  warnings: string[];
}> {
  // Get all providers for market
  const providers = await prisma.provider.findMany({
    where: { market, isActive: true },
    select: { providerId: true }
  });

  const hidden: string[] = [];
  const downranked: string[] = [];
  const warnings: string[] = [];

  for (const provider of providers) {
    const metrics = await calculatePriceAccuracy(provider.providerId, market);
    
    switch (metrics.throttleStatus) {
      case ThrottleStatus.HIDDEN:
        hidden.push(provider.providerId);
        break;
      case ThrottleStatus.DOWNRANKED:
        downranked.push(provider.providerId);
        break;
      case ThrottleStatus.WARNING:
        warnings.push(provider.providerId);
        break;
    }
  }

  return { hidden, downranked, warnings };
}

/**
 * Run price accuracy evaluation for all providers
 */
export async function runPriceAccuracyEvaluation(): Promise<{
  evaluated: number;
  hidden: number;
  downranked: number;
  warnings: number;
  actions: Array<{ providerId: string; market: string; action: string }>;
}> {
  console.log('📊 Running Price Accuracy Evaluation');

  const providers = await prisma.provider.findMany({
    where: { isActive: true },
    select: { providerId: true, market: true }
  });

  let evaluated = 0;
  let hidden = 0;
  let downranked = 0;
  let warnings = 0;
  const actions: Array<{ providerId: string; market: string; action: string }> = [];

  for (const provider of providers) {
    try {
      const metrics = await calculatePriceAccuracy(provider.providerId, provider.market);
      evaluated++;

      if (metrics.totalChecks >= PRICE_ACCURACY_THRESHOLDS.MIN_CHECKS_FOR_DECISION) {
        const result = await applyPriceAccuracyThrottling(metrics);
        
        if (result.applied) {
          actions.push({
            providerId: provider.providerId,
            market: provider.market,
            action: result.action
          });

          switch (result.action) {
            case 'HIDDEN':
              hidden++;
              break;
            case 'DOWNRANKED':
              downranked++;
              break;
            case 'WARNING':
              warnings++;
              break;
          }
        }
      }
    } catch (error) {
      console.error(`Failed to evaluate ${provider.providerId}/${provider.market}:`, error);
    }
  }

  console.log(`✅ Price accuracy evaluation completed: ${evaluated} providers evaluated`);
  if (actions.length > 0) {
    console.log(`📊 Actions taken: ${hidden} hidden, ${downranked} downranked, ${warnings} warnings`);
  }

  return { evaluated, hidden, downranked, warnings, actions };
}

/**
 * Re-enable providers that were temporarily hidden
 */
export async function reEnableThrottledProviders(): Promise<number> {
  // This would check for providers that have been hidden for the duration
  // and re-enable them. For now, this is a manual process but could be automated
  // with a timestamp field in the provider table.
  
  // Get providers with low reliability that might have been throttled
  const throttledProviders = await prisma.provider.findMany({
    where: {
      isActive: false,
      reliabilityScore: { lt: 0.7 } // Likely throttled
    }
  });

  let reEnabled = 0;

  for (const provider of throttledProviders) {
    // Check recent price accuracy
    const recentMetrics = await calculatePriceAccuracy(
      provider.providerId, 
      provider.market, 
      4 // Last 4 hours
    );

    // Re-enable if recent checks show improvement
    if (recentMetrics.changeRate < PRICE_ACCURACY_THRESHOLDS.DOWNRANK_CHANGE_RATE) {
      await prisma.provider.update({
        where: { id: provider.id },
        data: { 
          isActive: true,
          reliabilityScore: Math.min(0.9, provider.reliabilityScore + 0.1) // Gradual recovery
        }
      });

      console.log(`✅ Re-enabled ${provider.providerId}/${provider.market} - Improved accuracy`);
      reEnabled++;
    }
  }

  return reEnabled;
}

/**
 * Get price accuracy dashboard data
 */
export async function getPriceAccuracyDashboard(): Promise<PriceAccuracyMetrics[]> {
  const providers = await prisma.provider.findMany({
    select: { providerId: true, market: true }
  });

  const metrics = await Promise.all(
    providers.map(p => calculatePriceAccuracy(p.providerId, p.market))
  );

  return metrics.sort((a, b) => b.changeRate - a.changeRate);
}