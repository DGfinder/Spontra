/**
 * Landed Beacon Endpoint
 * 
 * Tracks when users successfully land on provider booking pages
 * Critical for attribution and conversion rate optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { checkRateLimit, getClientFingerprint } from '@/lib/productionRateLimits';
import { generateBeaconUrl } from '@/lib/beaconUtils';

export const runtime = 'nodejs';

const prisma = new PrismaClient();

// Beacon rate limiting - very permissive for user experience
const BEACON_RATE_LIMIT = {
  requests: 200,    // 200 beacons per minute per IP
  windowMs: 60000,  // 1 minute window
  burst: 50         // Allow bursts for page loads
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Rate limiting
    const fingerprint = getClientFingerprint(request);
    const rateLimitResult = checkRateLimit(
      fingerprint.ip, 
      '/api/beacon/landed', 
      BEACON_RATE_LIMIT
    );

    if (!rateLimitResult.allowed) {
      return new NextResponse('Rate limit exceeded for beacon', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'Retry-After': Math.ceil((rateLimitResult.retryAfter || 60000) / 1000).toString()
        }
      });
    }

    // Extract parameters from URL
    const url = new URL(request.url);
    const clickId = url.searchParams.get('clickId');
    const providerId = url.searchParams.get('providerId');
    const market = url.searchParams.get('market');
    const finalUrl = url.searchParams.get('finalUrl');
    const responseTime = url.searchParams.get('responseTime');
    const referrer = request.headers.get('referer') || '';
    
    // Validate required parameters
    if (!clickId || !providerId) {
      console.warn('🔶 Beacon missing required parameters:', { clickId, providerId });
      return new NextResponse('Missing required parameters', { status: 400 });
    }

    // Find the original click
    const click = await prisma.click.findUnique({
      where: { clickId },
      include: {
        searchQuery: true
      }
    });

    if (!click) {
      console.warn('🔶 Beacon for unknown click:', { clickId, providerId });
      // Still return 200 to avoid breaking user experience
      return createBeaconResponse({ status: 'click_not_found' });
    }

    // Check if this is a legitimate landing (from our redirect)
    const expectedReferrer = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const isValidReferrer = referrer.includes(expectedReferrer) || 
                           referrer.includes('spontra') ||
                           referrer === ''; // Direct access also OK

    // Record the landing event
    const landingData = {
      clickId: click.clickId,
      providerId,
      market: market || click.market,
      finalUrl: finalUrl || '',
      responseTimeMs: responseTime ? parseInt(responseTime) : null,
      referrer,
      userAgent: request.headers.get('user-agent') || '',
      ipHash: hashIP(fingerprint.ip),
      isValidReferrer,
      landedAt: new Date()
    };

    // Store landing event
    await prisma.landing.create({
      data: landingData
    });

    // Update click with landing information
    await prisma.click.update({
      where: { id: click.id },
      data: {
        hasLanded: true,
        landedAt: new Date(),
        finalUrl: finalUrl || click.finalUrl
      }
    });

    // Calculate funnel metrics for real-time monitoring
    const funnelMetrics = await calculateFunnelMetrics(providerId, market || click.market);

    console.log(`✅ Beacon: ${clickId} → ${providerId} (${funnelMetrics.landingRate.toFixed(1)}% landing rate)`);

    // Return tracking pixel response
    return createBeaconResponse({
      status: 'success',
      clickId,
      providerId,
      landingRate: funnelMetrics.landingRate,
      responseTime: Date.now() - startTime
    });

  } catch (error) {
    console.error('❌ Beacon error:', error);
    
    // Always return 200 to avoid breaking user experience
    return createBeaconResponse({ 
      status: 'error',
      responseTime: Date.now() - startTime 
    });
  }
}

/**
 * POST endpoint for enhanced beacon data (optional)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { clickId, providerId, performance, viewport, connection } = body;

    if (!clickId || !providerId) {
      return new NextResponse('Missing required parameters', { status: 400 });
    }

    // Store enhanced beacon data
    await prisma.beaconData.create({
      data: {
        clickId,
        providerId,
        performanceMetrics: performance || {},
        viewportInfo: viewport || {},
        connectionInfo: connection || {},
        timestamp: new Date()
      }
    });

    return new NextResponse(JSON.stringify({ status: 'success' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Enhanced beacon error:', error);
    return new NextResponse(JSON.stringify({ status: 'error' }), {
      status: 200, // Always 200 to avoid breaking UX
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Create a 1x1 transparent tracking pixel response
 */
function createBeaconResponse(data: any): NextResponse {
  // 1x1 transparent GIF in base64
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );

  const headers = new Headers({
    'Content-Type': 'image/gif',
    'Content-Length': pixel.length.toString(),
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Beacon-Status': data.status,
    'X-Beacon-Response-Time': data.responseTime?.toString() || '0'
  });

  // Add custom headers for debugging (only in non-production)
  if (process.env.NODE_ENV !== 'production') {
    headers.set('X-Beacon-Data', JSON.stringify(data));
  }

  return new NextResponse(pixel, {
    status: 200,
    headers
  });
}

/**
 * Calculate funnel conversion metrics
 */
async function calculateFunnelMetrics(providerId: string, market: string): Promise<{
  clicks: number;
  landings: number;
  landingRate: number;
  conversions: number;
  conversionRate: number;
}> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours

  // Get clicks for this provider/market in last 24h
  const clicks = await prisma.click.count({
    where: {
      providerId,
      market,
      createdAt: { gte: since }
    }
  });

  // Get landings
  const landings = await prisma.landing.count({
    where: {
      providerId,
      market,
      landedAt: { gte: since }
    }
  });

  // Get conversions
  const conversions = await prisma.conversion.count({
    where: {
      providerId,
      market,
      createdAt: { gte: since }
    }
  });

  const landingRate = clicks > 0 ? (landings / clicks) * 100 : 0;
  const conversionRate = landings > 0 ? (conversions / landings) * 100 : 0;

  return {
    clicks,
    landings,
    landingRate,
    conversions,
    conversionRate
  };
}

/**
 * Hash IP address for privacy compliance
 */
function hashIP(ip: string): string {
  // Simple hash for privacy (use crypto.createHash('sha256') in production)
  return Buffer.from(ip).toString('base64').slice(0, 12);
}


