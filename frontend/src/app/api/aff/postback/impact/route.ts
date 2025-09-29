import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import crypto from "node:crypto";
import { 
  verifyImpactSignature, 
  isIpInRanges, 
  checkPostbackRateLimit,
  IMPACT_IPS 
} from "@/lib/postbackSecurity";
import { verifyHmacBase64 } from "@/server/affiliates/hmac";

export const runtime = 'nodejs';

/**
 * Impact Radius postback handler
 * Typical URL: ?subId=<clickId>&status=approved|rejected|pending&amount=12.34&currency=AUD&campaignId=...&advId=...
 * 
 * Security: In production, validate IP allowlist or HMAC signature
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    
    // Extract Impact-specific parameters
    const clickId = url.searchParams.get("subId") ?? url.searchParams.get("sid") ?? "";
    const statusRaw = url.searchParams.get("status") ?? "pending";
    const status = statusRaw.toUpperCase();
    const amount = Number(url.searchParams.get("amount") ?? "0");
    const currency = url.searchParams.get("currency") ?? "AUD";
    const advertiserId = url.searchParams.get("advId") ?? "impact";
    const campaignId = url.searchParams.get("campaignId") ?? "";
    
    // Validate required parameters
    if (!clickId) {
      console.warn("[Impact Postback] Missing clickId/subId");
      return NextResponse.json({ error: "MISSING_CLICKID" }, { status: 400 });
    }

    if (!["APPROVED", "PENDING", "REJECTED"].includes(status)) {
      console.warn(`[Impact Postback] Invalid status: ${status}`);
      return NextResponse.json({ error: "INVALID_STATUS" }, { status: 400 });
    }

    // Security: IP validation and rate limiting
    const clientIP = req.headers.get("x-forwarded-for")?.split(',')[0]?.trim() ?? 
                     req.headers.get("x-real-ip") ?? "";
    
    // Rate limiting
    const rateLimit = checkPostbackRateLimit(clientIP, 100, 60000);
    if (!rateLimit.allowed) {
      console.warn(`[Impact Postback] Rate limit exceeded from IP: ${clientIP}`);
      return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    }
    
    // IP allowlist validation (production only)
    if (process.env.NODE_ENV === "production" && !isIpInRanges(clientIP, IMPACT_IPS)) {
      console.warn(`[Impact Postback] Unauthorized IP: ${clientIP}`);
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 403 });
    }

    // HMAC signature verification (production only)
    if (process.env.NODE_ENV === "production" && process.env.IMPACT_SIGNATURE_SECRET) {
      const signature = req.headers.get("x-impact-signature");
      const queryString = new URL(req.url).search.substring(1); // Remove '?'
      
      if (!verifyImpactSignature(queryString, signature, process.env.IMPACT_SIGNATURE_SECRET)) {
        console.warn(`[Impact Postback] Invalid signature from IP: ${clientIP}`);
        return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 403 });
      }
    }

    // Verify click exists
    const click = await prisma.click.findUnique({
      where: { clickId }
    });

    if (!click) {
      console.warn(`[Impact Postback] Click not found: ${clickId}`);
      return NextResponse.json({ error: "CLICK_NOT_FOUND" }, { status: 404 });
    }

    // Create conversion record with strong deduplication
    // Include timestamp (rounded to hour) to allow legitimate status updates
    const hourTimestamp = Math.floor(Date.now() / (1000 * 60 * 60));
    const conversionId = crypto.createHash("sha256")
      .update(`${clickId}:${status}:${amount}:${currency}:${advertiserId}:${hourTimestamp}`)
      .digest("hex")
      .slice(0, 32);

    const conversion = await prisma.conversion.upsert({
      where: { id: conversionId },
      create: {
        id: conversionId,
        clickId,
        status,
        commission: amount,
        saleAmount: amount, // Impact typically sends commission, not sale amount
        currency,
        providerRef: click.providerRef,
        providerId: click.providerId,
        rawPayload: JSON.stringify({
          source: "impact",
          advertiserId,
          campaignId,
          originalUrl: req.url,
          timestamp: new Date().toISOString(),
          clientIP: clientIP.slice(0, 50) // Truncated for privacy
        })
      },
      update: {
        status,
        commission: amount,
        saleAmount: amount,
        rawPayload: JSON.stringify({
          source: "impact",
          advertiserId,
          campaignId,
          originalUrl: req.url,
          timestamp: new Date().toISOString(),
          clientIP: clientIP.slice(0, 50),
          updated: true
        })
      }
    });

    console.log(`[Impact Postback] Conversion recorded:`, {
      clickId,
      status,
      amount,
      currency,
      conversionId: conversion.id
    });

    return NextResponse.json({ 
      ok: true, 
      clickId, 
      conversionId: conversion.id,
      status: conversion.status
    });

  } catch (error) {
    console.error("[Impact Postback] Error:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// Some networks use POST instead of GET
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Convert POST body to query parameters for consistent handling
    const queryParams = new URLSearchParams();
    Object.entries(body).forEach(([key, value]) => {
      queryParams.set(key, String(value));
    });
    
    const mockReq = {
      ...req,
      url: `${req.url}?${queryParams.toString()}`
    };
    
    return await GET(mockReq as Request);
  } catch (error) {
    console.error("[Impact Postback POST] Error:", error);
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
}