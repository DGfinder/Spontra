-- Production Monitoring and Alerting SQL Queries
-- Use these queries for dashboard alerts and performance monitoring

-- ============================================================================
-- EPC MONITORING (Critical for Revenue)
-- ============================================================================

-- 1. EPC by Provider (Last 7 Days) - Alert if any top provider drops >30%
SELECT 
    k.providerId,
    k.market,
    COUNT(*) AS clicks_7d,
    COUNT(c.id) AS conversions_7d,
    ROUND(100.0 * COUNT(c.id) / NULLIF(COUNT(*), 0), 2) AS conversion_rate_pct,
    ROUND(COALESCE(SUM(c.commission), 0)::numeric, 2) AS total_commission,
    ROUND((COALESCE(SUM(c.commission), 0) / NULLIF(COUNT(*), 0))::numeric, 4) AS actual_epc,
    p.expectedEPC as expected_epc,
    ROUND(100.0 * (COALESCE(SUM(c.commission), 0) / NULLIF(COUNT(*), 0)) / NULLIF(p.expectedEPC, 0), 1) AS epc_accuracy_pct
FROM "clicks" k
LEFT JOIN "conversions" c ON c.clickId = k.clickId AND c.status = 'APPROVED'
LEFT JOIN "providers" p ON p.id = k.providerRef
WHERE k.createdAt >= NOW() - INTERVAL '7 days'
    AND p.isActive = true
GROUP BY k.providerId, k.market, p.expectedEPC
ORDER BY actual_epc DESC;

-- 2. EPC Day-over-Day Change (Alert Trigger) - Page if any provider drops >30%
WITH daily_epc AS (
    SELECT 
        k.providerId,
        DATE(k.createdAt) as date,
        COUNT(*) AS clicks,
        COUNT(c.id) AS conversions,
        COALESCE(SUM(c.commission), 0) / NULLIF(COUNT(*), 0) AS daily_epc
    FROM "clicks" k
    LEFT JOIN "conversions" c ON c.clickId = k.clickId AND c.status = 'APPROVED'
    WHERE k.createdAt >= NOW() - INTERVAL '3 days'
    GROUP BY k.providerId, DATE(k.createdAt)
    HAVING COUNT(*) >= 10  -- Only include days with meaningful volume
),
epc_comparison AS (
    SELECT 
        providerId,
        date,
        daily_epc,
        LAG(daily_epc) OVER (PARTITION BY providerId ORDER BY date) AS prev_day_epc,
        daily_epc - LAG(daily_epc) OVER (PARTITION BY providerId ORDER BY date) AS epc_change,
        ROUND(100.0 * (daily_epc - LAG(daily_epc) OVER (PARTITION BY providerId ORDER BY date)) / NULLIF(LAG(daily_epc) OVER (PARTITION BY providerId ORDER BY date), 0), 1) AS epc_change_pct
    FROM daily_epc
)
SELECT 
    providerId,
    date,
    ROUND(daily_epc::numeric, 4) as daily_epc,
    ROUND(prev_day_epc::numeric, 4) as prev_day_epc,
    epc_change_pct,
    CASE 
        WHEN epc_change_pct < -30 THEN '🚨 CRITICAL DROP'
        WHEN epc_change_pct < -15 THEN '⚠️ WARNING'
        WHEN epc_change_pct > 20 THEN '📈 SIGNIFICANT INCREASE'
        ELSE '✅ NORMAL'
    END AS alert_level
FROM epc_comparison
WHERE date = CURRENT_DATE - INTERVAL '1 day'  -- Yesterday's performance
    AND prev_day_epc IS NOT NULL
ORDER BY epc_change_pct ASC;

-- ============================================================================
-- PRICE ACCURACY MONITORING (Provider Reliability)
-- ============================================================================

-- 3. Price Change Rate by Provider (Last 7 Days) - Alert if >15% change rate
SELECT 
    providerId,
    COUNT(*) AS total_checks,
    COUNT(*) FILTER (WHERE priceChanged = true) AS price_changes,
    ROUND(100.0 * COUNT(*) FILTER (WHERE priceChanged = true) / NULLIF(COUNT(*), 0), 1) AS price_change_rate_pct,
    ROUND(AVG(ABS(percentageChange)) FILTER (WHERE priceChanged = true), 1) AS avg_change_magnitude,
    COUNT(*) FILTER (WHERE percentageChange > 20) AS large_increases,
    COUNT(*) FILTER (WHERE percentageChange < -20) AS large_decreases,
    CASE 
        WHEN 100.0 * COUNT(*) FILTER (WHERE priceChanged = true) / NULLIF(COUNT(*), 0) > 15 THEN '⚠️ HIGH VOLATILITY'
        WHEN 100.0 * COUNT(*) FILTER (WHERE priceChanged = true) / NULLIF(COUNT(*), 0) > 10 THEN '⚠️ MODERATE VOLATILITY'
        ELSE '✅ STABLE'
    END AS reliability_status
FROM "price_accuracy"
WHERE checkedAt >= NOW() - INTERVAL '7 days'
GROUP BY providerId
HAVING COUNT(*) >= 20  -- Only providers with meaningful check volume
ORDER BY price_change_rate_pct DESC;

-- ============================================================================
-- SYNTHETIC MONITOR HEALTH (Provider Uptime)
-- ============================================================================

-- 4. Provider Health Status (Last 4 Hours) - Alert if >5% failure rate
SELECT 
    providerId,
    market,
    COUNT(*) AS total_checks,
    COUNT(*) FILTER (WHERE isHealthy = false) AS failed_checks,
    ROUND(100.0 * COUNT(*) FILTER (WHERE isHealthy = false) / NULLIF(COUNT(*), 0), 1) AS failure_rate_pct,
    AVG(responseTimeMs) FILTER (WHERE isHealthy = true) AS avg_response_ms,
    MAX(checkedAt) AS last_check,
    CASE 
        WHEN 100.0 * COUNT(*) FILTER (WHERE isHealthy = false) / NULLIF(COUNT(*), 0) > 10 THEN '🚨 CRITICAL'
        WHEN 100.0 * COUNT(*) FILTER (WHERE isHealthy = false) / NULLIF(COUNT(*), 0) > 5 THEN '⚠️ WARNING'
        ELSE '✅ HEALTHY'
    END AS health_status
FROM "synthetic_checks"
WHERE checkedAt >= NOW() - INTERVAL '4 hours'
GROUP BY providerId, market
ORDER BY failure_rate_pct DESC, avg_response_ms DESC;

-- ============================================================================
-- CLICK VOLUME AND ABUSE MONITORING
-- ============================================================================

-- 5. Click Volume by Hour (Last 24h) - Detect unusual spikes
SELECT 
    DATE_TRUNC('hour', createdAt) AS hour,
    COUNT(*) AS clicks,
    COUNT(DISTINCT sessionId) AS unique_sessions,
    COUNT(DISTINCT ipHash) AS unique_ips,
    ROUND(COUNT(*) / NULLIF(COUNT(DISTINCT sessionId), 0)::numeric, 1) AS clicks_per_session,
    CASE 
        WHEN COUNT(*) / NULLIF(COUNT(DISTINCT sessionId), 0) > 10 THEN '⚠️ POTENTIAL BOT ACTIVITY'
        WHEN COUNT(*) > 1000 THEN '📈 HIGH VOLUME'
        ELSE '✅ NORMAL'
    END AS volume_status
FROM "clicks"
WHERE createdAt >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', createdAt)
ORDER BY hour DESC;

-- 6. Suspicious IP Activity - Alert for potential abuse
WITH ip_activity AS (
    SELECT 
        ipHash,
        COUNT(*) AS clicks_24h,
        COUNT(DISTINCT offerId) AS unique_offers,
        COUNT(DISTINCT providerId) AS unique_providers,
        MIN(createdAt) AS first_click,
        MAX(createdAt) AS last_click
    FROM "clicks"
    WHERE createdAt >= NOW() - INTERVAL '24 hours'
        AND ipHash IS NOT NULL
    GROUP BY ipHash
    HAVING COUNT(*) >= 50  -- Flag IPs with high click volume
)
SELECT 
    ipHash,
    clicks_24h,
    unique_offers,
    unique_providers,
    ROUND(clicks_24h / NULLIF(unique_offers, 0)::numeric, 1) AS clicks_per_offer,
    EXTRACT(EPOCH FROM (last_click - first_click)) / 3600 AS activity_hours,
    CASE 
        WHEN clicks_24h > 500 THEN '🚨 CRITICAL - POSSIBLE BOT'
        WHEN clicks_24h > 200 THEN '⚠️ WARNING - SUSPICIOUS'
        WHEN clicks_24h / NULLIF(unique_offers, 0) > 20 THEN '⚠️ WARNING - REPEATED CLICKS'
        ELSE '✅ NORMAL'
    END AS threat_level
FROM ip_activity
ORDER BY clicks_24h DESC
LIMIT 20;

-- ============================================================================
-- POSTBACK SECURITY MONITORING
-- ============================================================================

-- 7. Postback Authentication Failures - Alert immediately on any failures
SELECT 
    'impact' AS network,
    COUNT(*) FILTER (WHERE status = 403 AND message LIKE '%INVALID_SIGNATURE%') AS signature_failures,
    COUNT(*) FILTER (WHERE status = 403 AND message LIKE '%UNAUTHORIZED%') AS ip_failures,
    COUNT(*) FILTER (WHERE status = 429) AS rate_limit_hits,
    COUNT(*) AS total_attempts,
    MAX(timestamp) AS last_attempt
FROM postback_logs  -- This would need to be implemented
WHERE timestamp >= NOW() - INTERVAL '1 hour'
    AND network = 'impact'

UNION ALL

SELECT 
    'cj' AS network,
    COUNT(*) FILTER (WHERE status = 403 AND message LIKE '%INVALID_REQUEST%') AS signature_failures,
    COUNT(*) FILTER (WHERE status = 403 AND message LIKE '%UNAUTHORIZED%') AS ip_failures,
    COUNT(*) FILTER (WHERE status = 429) AS rate_limit_hits,
    COUNT(*) AS total_attempts,
    MAX(timestamp) AS last_attempt
FROM postback_logs
WHERE timestamp >= NOW() - INTERVAL '1 hour'
    AND network = 'cj';

-- ============================================================================
-- REVENUE DASHBOARD QUERIES
-- ============================================================================

-- 8. Daily Revenue Summary (For Executive Dashboard)
SELECT 
    DATE(c.createdAt) AS date,
    COUNT(DISTINCT k.clickId) AS total_clicks,
    COUNT(DISTINCT c.id) AS total_conversions,
    ROUND(100.0 * COUNT(DISTINCT c.id) / NULLIF(COUNT(DISTINCT k.clickId), 0), 2) AS conversion_rate_pct,
    ROUND(SUM(c.commission)::numeric, 2) AS total_commission,
    ROUND(AVG(c.commission)::numeric, 2) AS avg_commission,
    COUNT(DISTINCT k.providerId) AS active_providers
FROM "conversions" c
JOIN "clicks" k ON k.clickId = c.clickId
WHERE c.createdAt >= NOW() - INTERVAL '30 days'
    AND c.status = 'APPROVED'
GROUP BY DATE(c.createdAt)
ORDER BY date DESC;

-- 9. Provider Performance Leaderboard (Monthly)
SELECT 
    k.providerId,
    k.market,
    COUNT(DISTINCT k.clickId) AS clicks,
    COUNT(DISTINCT c.id) AS conversions,
    ROUND(100.0 * COUNT(DISTINCT c.id) / NULLIF(COUNT(DISTINCT k.clickId), 0), 2) AS conversion_rate,
    ROUND(SUM(c.commission)::numeric, 2) AS total_revenue,
    ROUND(AVG(c.commission)::numeric, 2) AS avg_commission,
    ROUND((SUM(c.commission) / NULLIF(COUNT(DISTINCT k.clickId), 0))::numeric, 4) AS actual_epc,
    RANK() OVER (ORDER BY SUM(c.commission) DESC) AS revenue_rank
FROM "clicks" k
LEFT JOIN "conversions" c ON c.clickId = k.clickId AND c.status = 'APPROVED'
WHERE k.createdAt >= DATE_TRUNC('month', NOW())
GROUP BY k.providerId, k.market
HAVING COUNT(DISTINCT k.clickId) >= 50  -- Minimum volume for ranking
ORDER BY total_revenue DESC;

-- ============================================================================
-- ALERTING THRESHOLDS (Copy these into your monitoring system)
-- ============================================================================

/*
CRITICAL ALERTS (Page immediately):
1. Any EPC drop >30% day-over-day for top-3 providers
2. Any provider failure rate >10% in last 4 hours  
3. Any postback authentication failures (signature/IP)
4. Any IP with >500 clicks in 24h
5. Total site conversion rate drops >50% from 7-day average

WARNING ALERTS (Slack/Email):
1. EPC drop 15-30% for any provider
2. Provider failure rate 5-10% in last 4 hours
3. Price change rate >15% for any provider  
4. Unusual click spikes (>2x hourly average)
5. IP with 200-500 clicks showing suspicious patterns

MONITORING QUERIES TO RUN:
- Every 5 minutes: Provider health checks
- Every 15 minutes: EPC monitoring  
- Every hour: Price accuracy and click volume analysis
- Every 4 hours: Full revenue and performance review
*/