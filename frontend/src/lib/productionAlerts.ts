/**
 * Production Alerting System - Day 1/Week 1 Guardrails
 * 
 * Defines critical alerts that page on-call and trigger auto-remediation
 * Covers money, trust, uptime, security, and abuse scenarios
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  category: 'MONEY' | 'TRUST' | 'UPTIME' | 'SECURITY' | 'ABUSE';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  threshold: {
    metric: string;
    operator: '>' | '<' | '>=' | '<=' | '=' | '!=';
    value: number;
    unit: string;
    timeWindow: string; // e.g., '15m', '1h', '24h'
  };
  actions: AlertAction[];
  autoRemediation?: AutoRemediation;
  enabled: boolean;
  cooldownMinutes: number; // Prevent alert spam
}

export interface AlertAction {
  type: 'PAGE' | 'SLACK' | 'EMAIL' | 'WEBHOOK' | 'AUTO_DISABLE' | 'AUTO_DOWNRANK';
  target: string;
  template: string;
}

export interface AutoRemediation {
  type: 'DISABLE_PROVIDER' | 'DOWNRANK_PROVIDER' | 'PAUSE_MARKET' | 'REDUCE_LIMITS';
  conditions: string[];
  duration?: string; // e.g., '2h', '24h'
  recovery?: {
    checkMetric: string;
    threshold: number;
    duration: string;
  };
}

/**
 * Day 1/Week 1 Production Alert Rules
 * Critical guardrails for safe revenue operations
 */
export const PRODUCTION_ALERT_RULES: AlertRule[] = [
  // === MONEY ALERTS - Revenue Protection ===
  {
    id: 'epc-drop-critical',
    name: 'EPC Drop Critical',
    description: 'EPC drops >30% day-over-day for top-3 provider',
    category: 'MONEY',
    severity: 'CRITICAL',
    threshold: {
      metric: 'epc_drop_percentage',
      operator: '>',
      value: 30,
      unit: 'percent',
      timeWindow: '24h'
    },
    actions: [
      {
        type: 'PAGE',
        target: 'oncall-revenue',
        template: '🚨 CRITICAL: EPC drop {{value}}% for {{provider}}/{{market}} - Revenue impact: ${{impact}}'
      },
      {
        type: 'AUTO_DOWNRANK',
        target: 'provider',
        template: 'Auto-downranking {{provider}} due to EPC collapse'
      }
    ],
    autoRemediation: {
      type: 'DOWNRANK_PROVIDER',
      conditions: ['epc_drop > 30%', 'is_top_3_provider = true'],
      duration: '4h',
      recovery: {
        checkMetric: 'epc_recovery_percentage',
        threshold: 15, // Must recover to within 15% of baseline
        duration: '2h'
      }
    },
    enabled: true,
    cooldownMinutes: 30
  },

  {
    id: 'revenue-anomaly',
    name: 'Revenue Anomaly Detection',
    description: 'Daily revenue deviates significantly from expected pattern',
    category: 'MONEY',
    severity: 'WARNING',
    threshold: {
      metric: 'daily_revenue_variance',
      operator: '>',
      value: 50,
      unit: 'percent',
      timeWindow: '24h'
    },
    actions: [
      {
        type: 'SLACK',
        target: '#revenue-alerts',
        template: '⚠️ Revenue anomaly: {{variance}}% deviation from expected ${{expected}} (actual: ${{actual}})'
      }
    ],
    enabled: true,
    cooldownMinutes: 60
  },

  // === TRUST ALERTS - Price Accuracy ===
  {
    id: 'price-change-high',
    name: 'High Price Change Rate',
    description: 'Price change rate >15% triggers throttling',
    category: 'TRUST',
    severity: 'WARNING',
    threshold: {
      metric: 'price_change_rate',
      operator: '>',
      value: 15,
      unit: 'percent',
      timeWindow: '24h'
    },
    actions: [
      {
        type: 'AUTO_DOWNRANK',
        target: 'provider',
        template: 'Auto-throttling {{provider}} - price change rate {{value}}%'
      },
      {
        type: 'SLACK',
        target: '#trust-alerts',
        template: '⚠️ Price instability: {{provider}} {{value}}% change rate'
      }
    ],
    autoRemediation: {
      type: 'DOWNRANK_PROVIDER',
      conditions: ['price_change_rate > 15%'],
      duration: '2h'
    },
    enabled: true,
    cooldownMinutes: 15
  },

  {
    id: 'price-change-critical',
    name: 'Critical Price Change Rate',
    description: 'Price change rate >25% auto-hides provider for 2h',
    category: 'TRUST',
    severity: 'CRITICAL',
    threshold: {
      metric: 'price_change_rate',
      operator: '>',
      value: 25,
      unit: 'percent',
      timeWindow: '24h'
    },
    actions: [
      {
        type: 'AUTO_DISABLE',
        target: 'provider',
        template: 'Auto-hiding {{provider}} - critical price instability {{value}}%'
      },
      {
        type: 'PAGE',
        target: 'oncall-trust',
        template: '🚨 Provider {{provider}} auto-hidden - {{value}}% price change rate'
      }
    ],
    autoRemediation: {
      type: 'DISABLE_PROVIDER',
      conditions: ['price_change_rate > 25%'],
      duration: '2h',
      recovery: {
        checkMetric: 'price_change_rate',
        threshold: 10,
        duration: '1h'
      }
    },
    enabled: true,
    cooldownMinutes: 5
  },

  // === UPTIME ALERTS - Provider Health ===
  {
    id: 'synthetic-failure-critical',
    name: 'Critical Synthetic Failure Rate',
    description: 'Synthetic failures >10% in 15min auto-disables provider',
    category: 'UPTIME',
    severity: 'CRITICAL',
    threshold: {
      metric: 'synthetic_failure_rate',
      operator: '>',
      value: 10,
      unit: 'percent',
      timeWindow: '15m'
    },
    actions: [
      {
        type: 'PAGE',
        target: 'oncall-ops',
        template: '🚨 Provider {{provider}}/{{market}} auto-disabled - {{value}}% failure rate'
      },
      {
        type: 'AUTO_DISABLE',
        target: 'provider',
        template: 'Auto-disabling {{provider}} due to high failure rate'
      }
    ],
    autoRemediation: {
      type: 'DISABLE_PROVIDER',
      conditions: ['synthetic_failure_rate > 10%', 'min_checks >= 3'],
      duration: '2h',
      recovery: {
        checkMetric: 'synthetic_failure_rate',
        threshold: 5,
        duration: '30m'
      }
    },
    enabled: true,
    cooldownMinutes: 5
  },

  {
    id: 'response-time-degraded',
    name: 'Response Time Degraded',
    description: 'Provider response time >10s consistently',
    category: 'UPTIME',
    severity: 'WARNING',
    threshold: {
      metric: 'avg_response_time',
      operator: '>',
      value: 10000,
      unit: 'milliseconds',
      timeWindow: '15m'
    },
    actions: [
      {
        type: 'SLACK',
        target: '#uptime-alerts',
        template: '⚠️ Slow provider: {{provider}} averaging {{value}}ms response time'
      }
    ],
    enabled: true,
    cooldownMinutes: 30
  },

  // === SECURITY ALERTS - Authentication & Abuse ===
  {
    id: 'postback-auth-failure',
    name: 'Postback Authentication Failure',
    description: 'Any postback signature verification failure',
    category: 'SECURITY',
    severity: 'CRITICAL',
    threshold: {
      metric: 'postback_auth_failures',
      operator: '>',
      value: 0,
      unit: 'count',
      timeWindow: '5m'
    },
    actions: [
      {
        type: 'PAGE',
        target: 'oncall-security',
        template: '🚨 SECURITY: Postback auth failure from {{network}} IP {{ip}} - signature mismatch'
      },
      {
        type: 'EMAIL',
        target: 'security-team@company.com',
        template: 'Immediate investigation required: postback authentication failure'
      }
    ],
    enabled: true,
    cooldownMinutes: 1 // Immediate alerting for security
  },

  {
    id: 'admin-auth-failures',
    name: 'Admin Authentication Failures',
    description: 'Multiple failed admin login attempts',
    category: 'SECURITY',
    severity: 'WARNING',
    threshold: {
      metric: 'admin_auth_failures',
      operator: '>',
      value: 5,
      unit: 'count',
      timeWindow: '15m'
    },
    actions: [
      {
        type: 'SLACK',
        target: '#security-alerts',
        template: '⚠️ {{value}} failed admin login attempts from IP {{ip}}'
      }
    ],
    enabled: true,
    cooldownMinutes: 15
  },

  // === ABUSE ALERTS - Traffic Anomalies ===
  {
    id: 'asn-click-abuse',
    name: 'ASN Click Volume Abuse',
    description: '>500 clicks/hour from single ASN',
    category: 'ABUSE',
    severity: 'WARNING',
    threshold: {
      metric: 'clicks_per_asn_per_hour',
      operator: '>',
      value: 500,
      unit: 'count',
      timeWindow: '1h'
    },
    actions: [
      {
        type: 'SLACK',
        target: '#abuse-alerts',
        template: '⚠️ High click volume: {{value}} clicks from ASN {{asn}} in 1h'
      }
    ],
    autoRemediation: {
      type: 'REDUCE_LIMITS',
      conditions: ['clicks_per_asn > 500'],
      duration: '24h'
    },
    enabled: true,
    cooldownMinutes: 60
  },

  {
    id: 'rate-limit-violations',
    name: 'Rate Limit Violations',
    description: '429 responses >2% of /out/* traffic',
    category: 'ABUSE',
    severity: 'WARNING',
    threshold: {
      metric: 'rate_limit_violation_percentage',
      operator: '>',
      value: 2,
      unit: 'percent',
      timeWindow: '15m'
    },
    actions: [
      {
        type: 'SLACK',
        target: '#traffic-alerts',
        template: '⚠️ High rate limiting: {{value}}% of traffic hitting 429s'
      }
    ],
    enabled: true,
    cooldownMinutes: 30
  },

  {
    id: 'session-click-explosion',
    name: 'Session Click Volume Explosion',
    description: 'P95 clicks per session exploding',
    category: 'ABUSE',
    severity: 'WARNING',
    threshold: {
      metric: 'clicks_per_session_p95',
      operator: '>',
      value: 50,
      unit: 'count',
      timeWindow: '1h'
    },
    actions: [
      {
        type: 'SLACK',
        target: '#abuse-alerts',
        template: '⚠️ Click pattern anomaly: P95 {{value}} clicks/session'
      }
    ],
    enabled: true,
    cooldownMinutes: 60
  }
];

/**
 * Alert state tracking
 */
interface AlertState {
  alertId: string;
  isActive: boolean;
  triggeredAt: Date;
  lastFiredAt: Date;
  fireCount: number;
  currentValue: number;
  resolvedAt?: Date;
}

const alertStates = new Map<string, AlertState>();

/**
 * Evaluate all alert rules and trigger actions
 */
export async function evaluateAlerts(): Promise<{
  triggered: AlertRule[];
  resolved: AlertRule[];
  errors: string[];
}> {
  const triggered: AlertRule[] = [];
  const resolved: AlertRule[] = [];
  const errors: string[] = [];

  for (const rule of PRODUCTION_ALERT_RULES) {
    if (!rule.enabled) continue;

    try {
      const currentValue = await getMetricValue(rule.threshold.metric, rule.threshold.timeWindow);
      const isTriggered = evaluateThreshold(currentValue, rule.threshold);
      const currentState = alertStates.get(rule.id);

      if (isTriggered && (!currentState || !currentState.isActive)) {
        // New alert triggered
        const newState: AlertState = {
          alertId: rule.id,
          isActive: true,
          triggeredAt: new Date(),
          lastFiredAt: new Date(),
          fireCount: 1,
          currentValue
        };
        alertStates.set(rule.id, newState);
        
        await fireAlert(rule, currentValue);
        triggered.push(rule);

      } else if (isTriggered && currentState?.isActive) {
        // Existing alert - check cooldown
        const minutesSinceLastFire = (Date.now() - currentState.lastFiredAt.getTime()) / (1000 * 60);
        if (minutesSinceLastFire >= rule.cooldownMinutes) {
          currentState.lastFiredAt = new Date();
          currentState.fireCount++;
          currentState.currentValue = currentValue;
          
          await fireAlert(rule, currentValue);
        }

      } else if (!isTriggered && currentState?.isActive) {
        // Alert resolved
        currentState.isActive = false;
        currentState.resolvedAt = new Date();
        
        await resolveAlert(rule, currentValue);
        resolved.push(rule);
      }

    } catch (error) {
      errors.push(`Failed to evaluate ${rule.id}: ${error}`);
    }
  }

  return { triggered, resolved, errors };
}

/**
 * Get metric value for alert evaluation
 */
async function getMetricValue(metric: string, timeWindow: string): Promise<number> {
  const since = getTimeWindowDate(timeWindow);

  switch (metric) {
    case 'epc_drop_percentage':
      return await calculateEPCDrop(since);
    
    case 'price_change_rate':
      return await calculatePriceChangeRate(since);
    
    case 'synthetic_failure_rate':
      return await calculateSyntheticFailureRate(since);
    
    case 'postback_auth_failures':
      const authFailures = await prisma.postbackLog.count({
        where: {
          createdAt: { gte: since },
          verified: false
        }
      });
      return authFailures;
    
    case 'clicks_per_asn_per_hour':
      return await calculateClicksPerASN(since);
    
    case 'rate_limit_violation_percentage':
      return await calculateRateLimitViolationRate(since);
    
    default:
      throw new Error(`Unknown metric: ${metric}`);
  }
}

/**
 * Evaluate threshold condition
 */
function evaluateThreshold(value: number, threshold: AlertRule['threshold']): boolean {
  switch (threshold.operator) {
    case '>': return value > threshold.value;
    case '<': return value < threshold.value;
    case '>=': return value >= threshold.value;
    case '<=': return value <= threshold.value;
    case '=': return value === threshold.value;
    case '!=': return value !== threshold.value;
    default: return false;
  }
}

/**
 * Fire alert actions
 */
async function fireAlert(rule: AlertRule, currentValue: number): Promise<void> {
  console.warn(`🚨 ALERT TRIGGERED: ${rule.name} - ${currentValue}${rule.threshold.unit}`);

  for (const action of rule.actions) {
    try {
      await executeAlertAction(action, rule, currentValue);
    } catch (error) {
      console.error(`Failed to execute ${action.type} for ${rule.id}:`, error);
    }
  }

  // Execute auto-remediation if configured
  if (rule.autoRemediation) {
    await executeAutoRemediation(rule.autoRemediation, rule, currentValue);
  }

  // Log alert to database
  await prisma.alertLog.create({
    data: {
      alertId: rule.id,
      alertName: rule.name,
      severity: rule.severity,
      category: rule.category,
      currentValue,
      threshold: rule.threshold.value,
      status: 'TRIGGERED',
      metadata: { rule, currentValue }
    }
  });
}

/**
 * Execute specific alert action
 */
async function executeAlertAction(action: AlertAction, rule: AlertRule, currentValue: number): Promise<void> {
  const message = action.template
    .replace('{{value}}', currentValue.toString())
    .replace('{{provider}}', 'PROVIDER') // Extract from context
    .replace('{{market}}', 'MARKET'); // Extract from context

  switch (action.type) {
    case 'PAGE':
      await sendPage(action.target, message);
      break;
    case 'SLACK':
      await sendSlack(action.target, message);
      break;
    case 'EMAIL':
      await sendEmail(action.target, rule.name, message);
      break;
    case 'AUTO_DISABLE':
      await autoDisableProvider(action.target);
      break;
    case 'AUTO_DOWNRANK':
      await autoDownrankProvider(action.target);
      break;
  }
}

/**
 * Alert action implementations
 */
async function sendPage(target: string, message: string): Promise<void> {
  // Integrate with PagerDuty, OpsGenie, etc.
  console.log(`📟 PAGE ${target}: ${message}`);
  // await pagerDuty.createIncident({ message, target });
}

async function sendSlack(channel: string, message: string): Promise<void> {
  // Integrate with Slack webhooks
  console.log(`💬 SLACK ${channel}: ${message}`);
  // await slack.sendMessage(channel, message);
}

async function sendEmail(email: string, subject: string, message: string): Promise<void> {
  // Integrate with email service
  console.log(`📧 EMAIL ${email}: ${subject} - ${message}`);
  // await emailService.send({ to: email, subject, body: message });
}

async function autoDisableProvider(providerId: string): Promise<void> {
  await prisma.provider.updateMany({
    where: { providerId },
    data: { isActive: false }
  });
  console.log(`🛑 AUTO-DISABLED provider: ${providerId}`);
}

async function autoDownrankProvider(providerId: string): Promise<void> {
  await prisma.provider.updateMany({
    where: { providerId },
    data: { 
      reliabilityScore: { multiply: 0.7 } // Reduce by 30%
    }
  });
  console.log(`📉 AUTO-DOWNRANKED provider: ${providerId}`);
}

// Metric calculation helpers
async function calculateEPCDrop(since: Date): Promise<number> {
  // Implement EPC drop calculation
  return 0; // Placeholder
}

async function calculatePriceChangeRate(since: Date): Promise<number> {
  const total = await prisma.priceAccuracy.count({
    where: { checkedAt: { gte: since } }
  });
  const changed = await prisma.priceAccuracy.count({
    where: { 
      checkedAt: { gte: since },
      priceChanged: true
    }
  });
  return total > 0 ? (changed / total) * 100 : 0;
}

async function calculateSyntheticFailureRate(since: Date): Promise<number> {
  const total = await prisma.syntheticCheck.count({
    where: { checkedAt: { gte: since } }
  });
  const failed = await prisma.syntheticCheck.count({
    where: { 
      checkedAt: { gte: since },
      isHealthy: false
    }
  });
  return total > 0 ? (failed / total) * 100 : 0;
}

async function calculateClicksPerASN(since: Date): Promise<number> {
  // Implementation would group by ASN and find max
  return 0; // Placeholder
}

async function calculateRateLimitViolationRate(since: Date): Promise<number> {
  // Implementation would calculate 429 response rate
  return 0; // Placeholder
}

function getTimeWindowDate(timeWindow: string): Date {
  const now = new Date();
  const match = timeWindow.match(/^(\d+)([mhd])$/);
  if (!match) throw new Error(`Invalid time window: ${timeWindow}`);
  
  const [, amount, unit] = match;
  const multiplier = { m: 60000, h: 3600000, d: 86400000 }[unit];
  return new Date(now.getTime() - parseInt(amount) * multiplier);
}

/**
 * Resolve alert
 */
async function resolveAlert(rule: AlertRule, currentValue: number): Promise<void> {
  console.log(`✅ ALERT RESOLVED: ${rule.name} - ${currentValue}${rule.threshold.unit}`);
  
  await prisma.alertLog.create({
    data: {
      alertId: rule.id,
      alertName: rule.name,
      severity: rule.severity,
      category: rule.category,
      currentValue,
      threshold: rule.threshold.value,
      status: 'RESOLVED',
      metadata: { rule, currentValue }
    }
  });
}

/**
 * Execute auto-remediation
 */
async function executeAutoRemediation(
  remediation: AutoRemediation, 
  rule: AlertRule, 
  currentValue: number
): Promise<void> {
  console.log(`🤖 AUTO-REMEDIATION: ${remediation.type} for ${rule.name}`);
  // Implementation depends on remediation type
}