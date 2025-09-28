import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { sendBatchAlerts, AlertType } from "@/lib/alerts";
import { checkRateLimit } from "@/lib/rateLimit";

type Row = Record<string, any>;
const toNum = (v: any) => (v == null ? 0 : Number(v));

const ALLOWED_NETS = ["127.0.0.1", "::1"]; // Local access only for security

function unauthorized(msg = "UNAUTHORIZED") {
  return NextResponse.json({ error: msg }, { status: 401 });
}

/**
 * The 4 Critical Graphs for Daily Ops (15-20 min health check)
 * - EPC by provider+market (24h vs 7d) with change %
 * - Price change rates (24h) with throttle status
 * - Synthetic failures (15m) with auto-disable triggers
 * - Landing success rate (24h) for funnel health
 * 
 * SECURED: Requires ADMIN_API_KEY header and optional IP filtering
 */
export async function GET(req: NextRequest) {
  // Authentication: API key required
  const key = req.headers.get("x-api-key");
  if (process.env.ADMIN_API_KEY && key !== process.env.ADMIN_API_KEY) {
    return unauthorized("INVALID_API_KEY");
  }

  // Optional IP allowlist (production only)
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || req.ip || "unknown";
  
  if (process.env.NODE_ENV === "production" && process.env.ADMIN_IP_GUARD === "true") {
    if (ip !== "unknown" && !ALLOWED_NETS.includes(ip)) {
      console.warn(`⚠️ Blocked admin access from IP: ${ip}`);
      return unauthorized("IP_NOT_ALLOWED");
    }
  }

  // Enterprise rate limiting with KV
  const rateLimitResult = await checkRateLimit(ip, 'admin');
  
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { 
        error: 'RATE_LIMITED', 
        message: 'Too many requests', 
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      }, 
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '30',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
        }
      }
    );
  }
  // 1) EPC (24h vs 7d) by provider+market in one shot
  const epcRows = await prisma.$queryRaw<Row[]>`
    WITH
    clicks_24h AS (
      SELECT k."providerId", k."market", COUNT(*) AS clicks
      FROM "Click" k
      WHERE k."createdAt" >= NOW() - INTERVAL '24 hours'
      GROUP BY 1,2
    ),
    revenue_24h AS (
      SELECT k."providerId", k."market",
             COALESCE(SUM(c.commission),0) AS commission
      FROM "Click" k
      LEFT JOIN "Conversion" c ON c."clickId" = k."clickId"
      WHERE k."createdAt" >= NOW() - INTERVAL '24 hours'
      GROUP BY 1,2
    ),
    epc_24h AS (
      SELECT c."providerId", c."market",
             c.clicks,
             r.commission,
             (r.commission / GREATEST(c.clicks,1)) AS epc
      FROM clicks_24h c
      JOIN revenue_24h r USING ("providerId","market")
    ),
    clicks_7d AS (
      SELECT k."providerId", k."market", COUNT(*) AS clicks
      FROM "Click" k
      WHERE k."createdAt" >= NOW() - INTERVAL '7 days'
      GROUP BY 1,2
    ),
    revenue_7d AS (
      SELECT k."providerId", k."market",
             COALESCE(SUM(c.commission),0) AS commission
      FROM "Click" k
      LEFT JOIN "Conversion" c ON c."clickId" = k."clickId"
      WHERE k."createdAt" >= NOW() - INTERVAL '7 days'
      GROUP BY 1,2
    ),
    epc_7d AS (
      SELECT c."providerId", c."market",
             (r.commission / GREATEST(c.clicks,1)) AS epc
      FROM clicks_7d c
      JOIN revenue_7d r USING ("providerId","market")
    )
    SELECT e24."providerId", e24."market",
           e24.clicks AS clicks_24h,
           e24.commission AS commission_24h,
           e24.epc AS epc_24h,
           e7.epc AS epc_7d
    FROM epc_24h e24
    LEFT JOIN epc_7d e7
      ON e7."providerId" = e24."providerId" AND e7."market" = e24."market"
    ORDER BY epc_24h DESC;
  `;

  // 2) Price-change (24h) — keep tolerant if table not present
  const priceRows = await prisma.$queryRaw<Row[]>`
    SELECT "providerId",
           COUNT(*) AS checks,
           COUNT(*) FILTER (WHERE status = 'CHANGED') AS changed,
           ROUND(100.0 * COUNT(*) FILTER (WHERE status='CHANGED') / NULLIF(COUNT(*),0), 1) AS pct_changed
    FROM "RepriceLog"
    WHERE "createdAt" >= NOW() - INTERVAL '24 hours'
    GROUP BY 1 ORDER BY pct_changed DESC;
  `.catch(() => []);

  // 3) Synthetic (15m)
  const synthRows = await prisma.$queryRaw<Row[]>`
    SELECT "providerId","market",
           COUNT(*) AS checks,
           COUNT(*) FILTER (WHERE ok = false) AS failures,
           ROUND(100.0 * COUNT(*) FILTER (WHERE ok=false) / NULLIF(COUNT(*),0),1) AS pct_fail
    FROM "SyntheticCheck"
    WHERE "createdAt" >= NOW() - INTERVAL '15 minutes'
    GROUP BY 1,2 ORDER BY pct_fail DESC;
  `.catch(() => []);

  // 4) Landed rate (24h)
  const landedRows = await prisma.$queryRaw<Row[]>`
    SELECT (COUNT(*) FILTER (WHERE "landed200"=true) * 100.0 / NULLIF(COUNT(*),0)) AS landed_pct
    FROM "Click" WHERE "createdAt" >= NOW() - INTERVAL '24 hours';
  `;

  // Normalize numbers for JSON (Decimal -> number) and add triage status
  const epcByProviderMarket = epcRows.map(r => {
    const epc24h = toNum(r.epc_24h);
    const epc7d = toNum(r.epc_7d);
    const changePctVs7d = epc7d > 0 ? Math.round(((epc24h - epc7d) / epc7d) * 1000) / 10 : 0;
    const clicks = toNum(r.clicks_24h);
    const revenue = toNum(r.commission_24h);
    
    // Triage status with minimum sample size guard (10+ clicks)
    let status = 'HEALTHY';
    let action = 'NONE';
    
    // Only flag issues if we have sufficient sample size
    if (clicks >= 10) {
      if (changePctVs7d < -30 && revenue > 50) {
        status = 'CRITICAL';
        action = 'DOWNRANK_AND_TICKET';
      } else if (changePctVs7d < -15) {
        status = 'WARNING';
        action = 'MONITOR_CLOSELY';
      }
    }
    
    return {
      providerId: r.providerId,
      market: r.market,
      clicks24h: clicks,
      revenue24h: revenue,
      epc24h,
      epc7d,
      changePctVs7d,
      status,
      action,
      isTopProvider: revenue > 50
    };
  });

  const priceChangeRates = priceRows.map(r => {
    const pctChanged = toNum(r.pct_changed);
    let status = 'HEALTHY';
    let action = 'NONE';
    
    if (pctChanged > 25) {
      status = 'CRITICAL';
      action = 'AUTO_HIDE_2H';
    } else if (pctChanged > 15) {
      status = 'WARNING';
      action = 'THROTTLE';
    }
    
    return {
      providerId: r.providerId,
      checks: toNum(r.checks),
      changed: toNum(r.changed),
      pctChanged,
      status,
      action
    };
  });

  const syntheticFailures15m = synthRows.map(r => {
    const pctFail = toNum(r.pct_fail);
    let status = 'HEALTHY';
    let action = 'NONE';
    
    if (pctFail > 10) {
      status = 'CRITICAL';
      action = 'AUTO_DISABLE';
    } else if (pctFail > 5) {
      status = 'WARNING';
      action = 'MONITOR';
    }
    
    return {
      providerId: r.providerId,
      market: r.market,
      checks: toNum(r.checks),
      failures: toNum(r.failures),
      pctFail,
      status,
      action
    };
  });

  const landedRate24h = { 
    landedPct: toNum(landedRows[0]?.landed_pct || 0),
    status: toNum(landedRows[0]?.landed_pct || 0) < 60 ? 'CRITICAL' : 
            toNum(landedRows[0]?.landed_pct || 0) < 80 ? 'WARNING' : 'HEALTHY'
  };

  // Collect critical issues for alerting
  const criticalAlerts: Array<{ type: AlertType; context: any }> = [];

  // EPC drops
  epcByProviderMarket.filter(e => e.status === 'CRITICAL').forEach(e => {
    criticalAlerts.push({
      type: 'EPC_DROP' as AlertType,
      context: {
        providerId: e.providerId,
        market: e.market,
        changePct: e.changePctVs7d,
        clicks: e.clicks24h,
        value: e.revenue24h,
        action: e.action
      }
    });
  });

  // Price instability
  priceChangeRates.filter(p => p.status === 'CRITICAL').forEach(p => {
    criticalAlerts.push({
      type: 'PRICE_INSTABILITY' as AlertType,
      context: {
        providerId: p.providerId,
        changePct: p.pctChanged,
        checks: p.checks,
        action: p.action
      }
    });
  });

  // Synthetic failures
  syntheticFailures15m.filter(s => s.status === 'CRITICAL').forEach(s => {
    criticalAlerts.push({
      type: 'SYNTHETIC_FAILURE' as AlertType,
      context: {
        providerId: s.providerId,
        market: s.market,
        changePct: s.pctFail,
        failures: s.failures,
        checks: s.checks,
        action: s.action
      }
    });
  });

  // Landing rate drop
  if (landedRate24h.status === 'CRITICAL') {
    criticalAlerts.push({
      type: 'LANDING_RATE_DROP' as AlertType,
      context: {
        value: landedRate24h.landedPct,
        threshold: 80
      }
    });
  }

  // Send critical alerts if any (fire-and-forget)
  if (criticalAlerts.length > 0) {
    sendBatchAlerts(criticalAlerts).catch(error => {
      console.error('Failed to send critical alerts:', error);
    });
  }

  // Summary for quick triage
  const summary = {
    criticalIssues: [
      ...epcByProviderMarket.filter(e => e.status === 'CRITICAL').map(e => `EPC drop: ${e.providerId}/${e.market} (${e.changePctVs7d}%)`),
      ...priceChangeRates.filter(p => p.status === 'CRITICAL').map(p => `Price instability: ${p.providerId} (${p.pctChanged}%)`),
      ...syntheticFailures15m.filter(s => s.status === 'CRITICAL').map(s => `Synthetic failure: ${s.providerId}/${s.market} (${s.pctFail}%)`)
    ],
    overallHealth: Math.max(0, 100 - 
      (epcByProviderMarket.filter(e => e.status === 'CRITICAL').length * 30) -
      (priceChangeRates.filter(p => p.status === 'CRITICAL').length * 20) -
      (syntheticFailures15m.filter(s => s.status === 'CRITICAL').length * 25)
    ),
    alertsSent: criticalAlerts.length
  };

  const response = NextResponse.json({
    epcByProviderMarket,
    priceChangeRates,
    syntheticFailures15m,
    landedRate24h,
    summary,
    generatedAt: new Date().toISOString()
  });

  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', '30');
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

  return response;
}