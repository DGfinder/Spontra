import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "node:crypto";
import { 
  verifyCjRequest, 
  isIpInRanges, 
  checkPostbackRateLimit,
  CJ_IPS 
} from "@/lib/postbackSecurity";
import { verifyHmacBase64 } from "@/server/affiliates/hmac";

/**
 * Commission Junction (CJ Affiliate) postback handler
 * Typical URL: ?sid=<clickId>&actionStatus=new|modify|void&commissionAmount=12.34&currency=AUD&cid=...&actionId=...
 * 
 * CJ Documentation: https://developers.cj.com/docs/tracking/postback-tracking
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    
    // Extract CJ-specific parameters
    const clickId = url.searchParams.get("sid") ?? url.searchParams.get("websiteId") ?? "";
    const actionStatus = url.searchParams.get("actionStatus") ?? "new";
    const commissionAmount = Number(url.searchParams.get("commissionAmount") ?? "0");
    const saleAmount = Number(url.searchParams.get("orderAmount") ?? commissionAmount);
    const currency = url.searchParams.get("currency") ?? "USD";
    const advertiserId = url.searchParams.get("cid") ?? "cj";
    const actionId = url.searchParams.get("actionId") ?? "";
    const eventDate = url.searchParams.get("eventDate") ?? new Date().toISOString();
    
    // Map CJ status to our standard format
    const statusMap: Record<string, string> = {
      "new": "APPROVED",
      "modify": "APPROVED", 
      "void": "REJECTED",
      "locked": "PENDING"
    };
    const status = statusMap[actionStatus.toLowerCase()] ?? "PENDING";

    // Validate required parameters
    if (!clickId) {
      console.warn("[CJ Postback] Missing clickId/sid");
      return NextResponse.json({ error: "MISSING_CLICKID" }, { status: 400 });
    }

    // Security: IP validation, rate limiting, and request verification
    const clientIP = req.headers.get("x-forwarded-for")?.split(',')[0]?.trim() ?? 
                     req.headers.get("x-real-ip") ?? "";
    
    // Rate limiting
    const rateLimit = checkPostbackRateLimit(clientIP, 100, 60000);
    if (!rateLimit.allowed) {
      console.warn(`[CJ Postback] Rate limit exceeded from IP: ${clientIP}`);
      return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    }
    
    // IP allowlist validation (production only)
    if (process.env.NODE_ENV === "production" && !isIpInRanges(clientIP, CJ_IPS)) {
      console.warn(`[CJ Postback] Unauthorized IP: ${clientIP}`);
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 403 });
    }

    // CJ request validation with signature
    const urlParams = new URL(req.url).searchParams;
    const expectedAdvertisers = (process.env.CJ_ADVERTISER_IDS || "").split(",").filter(Boolean);
    const signature = req.headers.get("x-cj-signature");
    const cjSecret = process.env.CJ_SIGNATURE_SECRET;
    
    if (process.env.NODE_ENV === "production") {
      // Validate advertiser ID
      if (expectedAdvertisers.length > 0 && !expectedAdvertisers.includes(advertiserId)) {
        console.warn(`[CJ Postback] Unauthorized advertiser: ${advertiserId} from IP: ${clientIP}`);
        return NextResponse.json({ error: "UNAUTHORIZED_ADVERTISER" }, { status: 403 });
      }
      
      // Validate HMAC signature if secret is configured
      if (cjSecret && signature) {
        const queryString = new URL(req.url).search.substring(1); // Remove '?'
        if (!verifyHmacBase64(queryString, signature, cjSecret)) {
          console.warn(`[CJ Postback] Invalid signature from IP: ${clientIP}`);
          return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 403 });
        }
      }
    }

    // Verify click exists
    const click = await prisma.click.findUnique({
      where: { clickId }
    });

    if (!click) {
      console.warn(`[CJ Postback] Click not found: ${clickId}`);
      return NextResponse.json({ error: "CLICK_NOT_FOUND" }, { status: 404 });
    }

    // Create conversion record (use actionId for idempotency if available)
    const conversionId = actionId || crypto.createHash("sha256")
      .update(`${clickId}:${status}:${commissionAmount}:${currency}:${eventDate}`)
      .digest("hex")
      .slice(0, 32);

    const conversion = await prisma.conversion.upsert({
      where: { id: conversionId },
      create: {
        id: conversionId,
        clickId,
        status,
        commission: commissionAmount,
        saleAmount,
        currency,
        providerRef: click.providerRef,
        providerId: click.providerId,
        rawPayload: JSON.stringify({
          source: "cj",
          actionStatus,
          actionId,
          advertiserId,
          eventDate,
          originalUrl: req.url,
          timestamp: new Date().toISOString(),
          clientIP: clientIP.slice(0, 50)
        })
      },
      update: {
        status,
        commission: commissionAmount,
        saleAmount,
        rawPayload: JSON.stringify({
          source: "cj",
          actionStatus,
          actionId,
          advertiserId,
          eventDate,
          originalUrl: req.url,
          timestamp: new Date().toISOString(),
          clientIP: clientIP.slice(0, 50),
          updated: true
        })
      }
    });

    console.log(`[CJ Postback] Conversion recorded:`, {
      clickId,
      actionStatus,
      status,
      commissionAmount,
      saleAmount,
      currency,
      conversionId: conversion.id
    });

    return NextResponse.json({ 
      ok: true, 
      clickId, 
      conversionId: conversion.id,
      status: conversion.status,
      actionId
    });

  } catch (error) {
    console.error("[CJ Postback] Error:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// CJ may also use POST for some postbacks
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
    console.error("[CJ Postback POST] Error:", error);
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
}