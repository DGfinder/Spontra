/**
 * Slack/Webhook Alerting System
 * 
 * Critical issue notifications for production monitoring
 * Integrates with daily-ops triage pipeline
 * 
 * Usage:
 *   await sendCriticalAlert('EPC_DROP', { providerId: 'BA', changePct: -45 });
 */

interface AlertContext {
  providerId?: string;
  market?: string;
  changePct?: number;
  value?: number;
  threshold?: number;
  [key: string]: any;
}

interface AlertPayload {
  text: string;
  blocks?: any[];
  attachments?: any[];
}

type AlertType = 
  | 'EPC_DROP' 
  | 'PRICE_INSTABILITY' 
  | 'SYNTHETIC_FAILURE' 
  | 'LANDING_RATE_DROP'
  | 'SYSTEM_DEGRADED'
  | 'REVENUE_ANOMALY';

const ALERT_CONFIGS: Record<AlertType, { 
  emoji: string; 
  color: string; 
  urgency: 'critical' | 'warning' | 'info';
  minSampleSize?: number;
}> = {
  EPC_DROP: { emoji: '📉', color: '#FF0000', urgency: 'critical', minSampleSize: 10 },
  PRICE_INSTABILITY: { emoji: '💰', color: '#FFA500', urgency: 'warning' },
  SYNTHETIC_FAILURE: { emoji: '🚨', color: '#FF0000', urgency: 'critical' },
  LANDING_RATE_DROP: { emoji: '🔗', color: '#FF6600', urgency: 'critical' },
  SYSTEM_DEGRADED: { emoji: '⚠️', color: '#FFAA00', urgency: 'warning' },
  REVENUE_ANOMALY: { emoji: '💸', color: '#FF4444', urgency: 'critical', minSampleSize: 20 },
};

/**
 * Send critical alert to Slack/webhook
 */
export async function sendCriticalAlert(
  type: AlertType, 
  context: AlertContext = {},
  options: { 
    skipMinSampleCheck?: boolean;
    customMessage?: string;
  } = {}
): Promise<{ sent: boolean; reason?: string }> {
  
  const config = ALERT_CONFIGS[type];
  const webhookUrl = process.env.SLACK_WEBHOOK_URL || process.env.ALERT_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('⚠️  No webhook URL configured, skipping alert');
    return { sent: false, reason: 'NO_WEBHOOK_CONFIGURED' };
  }

  // Minimum sample size guard (prevents noisy alerts on low traffic)
  if (config.minSampleSize && !options.skipMinSampleCheck) {
    const sampleSize = context.clicks || context.checks || context.total || 0;
    if (sampleSize < config.minSampleSize) {
      console.log(`🔇 Alert ${type} skipped: sample size ${sampleSize} < ${config.minSampleSize}`);
      return { sent: false, reason: 'INSUFFICIENT_SAMPLE_SIZE' };
    }
  }

  // Construct alert message
  const message = options.customMessage || buildAlertMessage(type, context);
  
  const payload: AlertPayload = {
    text: `${config.emoji} ${message}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${config.emoji} ${type.replace('_', ' ')} ALERT*\n${message}`
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `🕒 ${new Date().toISOString()} | 🎯 Urgency: ${config.urgency.toUpperCase()}`
          }
        ]
      }
    ]
  };

  // Add action context if provided
  if (context.action && context.action !== 'NONE') {
    payload.blocks?.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*🎯 Recommended Action:* ${context.action}`
      }
    });
  }

  // Color-coded attachment for urgency
  if (config.urgency === 'critical') {
    payload.attachments = [{
      color: config.color,
      text: '🚨 This is a CRITICAL alert requiring immediate attention'
    }];
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook response: ${response.status} ${response.statusText}`);
    }

    console.log(`✅ Alert sent: ${type}`);
    return { sent: true };

  } catch (error) {
    console.error(`❌ Failed to send alert ${type}:`, error);
    return { sent: false, reason: 'WEBHOOK_ERROR' };
  }
}

/**
 * Build human-readable alert message
 */
function buildAlertMessage(type: AlertType, context: AlertContext): string {
  const { providerId, market, changePct, value } = context;
  const provider = providerId ? `${providerId}${market ? `/${market}` : ''}` : 'Unknown Provider';

  switch (type) {
    case 'EPC_DROP':
      return `EPC dropped ${changePct}% for ${provider} (${context.clicks || 0} clicks, $${value || 0} revenue)`;
      
    case 'PRICE_INSTABILITY':
      return `Price instability detected: ${provider} - ${changePct}% of prices changed in 24h (${context.checks || 0} checks)`;
      
    case 'SYNTHETIC_FAILURE':
      return `Synthetic monitoring failure: ${provider} - ${changePct}% failure rate (${context.failures || 0}/${context.checks || 0} checks)`;
      
    case 'LANDING_RATE_DROP':
      return `Landing rate dropped to ${value}% (threshold: ${context.threshold || 80}%)`;
      
    case 'SYSTEM_DEGRADED':
      return `System health degraded: ${context.component || 'Unknown'} - ${context.details || 'No details'}`;
      
    case 'REVENUE_ANOMALY':
      return `Revenue anomaly detected: ${provider} - Expected $${context.expected || 0}, Actual $${value || 0}`;
      
    default:
      return `Alert: ${type} - ${JSON.stringify(context)}`;
  }
}

/**
 * Send batch alerts for multiple critical issues
 */
export async function sendBatchAlerts(
  issues: Array<{ type: AlertType; context: AlertContext }>
): Promise<{ sent: number; failed: number; results: Array<{ sent: boolean; reason?: string }> }> {
  
  if (issues.length === 0) {
    return { sent: 0, failed: 0, results: [] };
  }

  // Group by urgency and send as batch if multiple critical
  const critical = issues.filter(issue => ALERT_CONFIGS[issue.type].urgency === 'critical');
  
  if (critical.length > 1) {
    // Send as digest for multiple critical issues
    const digest = critical.map(issue => 
      `• ${ALERT_CONFIGS[issue.type].emoji} ${buildAlertMessage(issue.type, issue.context)}`
    ).join('\n');

    const batchResult = await sendCriticalAlert('SYSTEM_DEGRADED', {
      component: 'Multiple Systems',
      details: `${critical.length} critical issues detected`
    }, {
      customMessage: `🚨 MULTIPLE CRITICAL ISSUES DETECTED\n\n${digest}`,
      skipMinSampleCheck: true
    });

    return { 
      sent: batchResult.sent ? 1 : 0, 
      failed: batchResult.sent ? 0 : 1, 
      results: [batchResult] 
    };
  }

  // Send individual alerts
  const results = await Promise.all(
    issues.map(issue => sendCriticalAlert(issue.type, issue.context))
  );

  const sent = results.filter(r => r.sent).length;
  const failed = results.filter(r => !r.sent).length;

  return { sent, failed, results };
}

/**
 * Health check for alerting system
 */
export async function alertingHealthCheck(): Promise<{ 
  configured: boolean; 
  reachable: boolean; 
  lastTest?: string;
}> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL || process.env.ALERT_WEBHOOK_URL;
  
  if (!webhookUrl) {
    return { configured: false, reachable: false };
  }

  try {
    // Send a minimal test ping (most webhooks accept this)
    const testPayload = { text: 'Spontra alerting system health check' };
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    });

    return {
      configured: true,
      reachable: response.ok,
      lastTest: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Alerting health check failed:', error);
    return { configured: true, reachable: false };
  }
}

/**
 * Quick helpers for common alert patterns
 */
export const Alerts = {
  epcDrop: (providerId: string, market: string, changePct: number, clicks: number, revenue: number) =>
    sendCriticalAlert('EPC_DROP', { providerId, market, changePct, clicks, value: revenue }),
    
  priceInstability: (providerId: string, changePct: number, checks: number) =>
    sendCriticalAlert('PRICE_INSTABILITY', { providerId, changePct, checks }),
    
  syntheticFailure: (providerId: string, market: string, failPct: number, failures: number, checks: number) =>
    sendCriticalAlert('SYNTHETIC_FAILURE', { providerId, market, changePct: failPct, failures, checks }),
    
  landingDrop: (landingPct: number) =>
    sendCriticalAlert('LANDING_RATE_DROP', { value: landingPct, threshold: 80 }),
}