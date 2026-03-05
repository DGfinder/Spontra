import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const querySchema = z.object({
  origin: z.string().min(3).max(3),
  theme: z.enum(['adventure', 'nature', 'vibe', 'indulge', 'discover']),
  maxFlightMinutes: z.coerce.number().min(30).max(600).optional().default(180),
  minFlightMinutes: z.coerce.number().min(0).max(600).optional().default(0),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    const params = querySchema.safeParse({
      origin: searchParams.get('origin'),
      theme: searchParams.get('theme'),
      maxFlightMinutes: searchParams.get('maxFlightMinutes'),
      minFlightMinutes: searchParams.get('minFlightMinutes'),
      limit: searchParams.get('limit'),
    });

    if (!params.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid parameters', details: params.error.issues },
        { status: 400 }
      );
    }

    const { origin, theme, maxFlightMinutes, minFlightMinutes, limit } = params.data;

    // Get destinations with curated reels within flight time range
    // Join with flight duration data and filter by theme
    const feedItems = await prisma.$queryRaw<Array<{
      reel_id: number;
      iata: string;
      theme_slug: string;
      title: string | null;
      caption: string | null;
      language: string;
      sort_order: number;
      created_at: Date;
      updated_at: Date;
      media_id: number;
      media_kind: string;
      source_url: string;
      credit: string | null;
      alt_text: string | null;
      city_name: string;
      country_name: string;
      country_code: string;
      flight_duration_minutes: number | null;
      estimated_price: number | null;
    }>>`
      SELECT 
        r.id as reel_id,
        r.iata,
        r."themeSlug" as theme_slug,
        r.title,
        r.caption,
        r.language,
        r."sortOrder" as sort_order,
        r."createdAt" as created_at,
        r."updatedAt" as updated_at,
        rm.id as media_id,
        rm.kind as media_kind,
        rm."sourceUrl" as source_url,
        rm.credit,
        rm."altText" as alt_text,
        COALESCE(d.city_name, a.city, r.iata) as city_name,
        COALESCE(a.country, 'Unknown') as country_name,
        'XX' as country_code,
        fr.total_duration_minutes as flight_duration_minutes,
        NULL::numeric as estimated_price
      FROM "Reel" r
      INNER JOIN "ReelMedia" rm ON rm."reelId" = r.id AND rm."isActive" = true
      LEFT JOIN destinations d ON d.airport_code = r.iata
      LEFT JOIN airports a ON a.iata_code = r.iata
      LEFT JOIN flight_routes fr ON fr.origin_airport_code = ${origin} AND fr.destination_airport_code = r.iata
      WHERE r."isActive" = true
        AND r."themeSlug" = ${theme}
        AND (
          fr.total_duration_minutes IS NULL 
          OR (fr.total_duration_minutes >= ${minFlightMinutes} AND fr.total_duration_minutes <= ${maxFlightMinutes})
        )
      ORDER BY 
        fr.total_duration_minutes ASC NULLS LAST,
        r."sortOrder" ASC,
        r."createdAt" DESC
      LIMIT ${limit}
    `;

    // Group by reel and format response
    const reelMap = new Map<string, any>();
    
    for (const item of feedItems) {
      const reelIdStr = item.reel_id.toString();
      if (!reelMap.has(reelIdStr)) {
        reelMap.set(reelIdStr, {
          id: reelIdStr,
          reel: {
            id: reelIdStr,
            iata: item.iata,
            themeSlug: item.theme_slug,
            title: item.title,
            caption: item.caption,
            language: item.language,
            isActive: true,
            sortOrder: item.sort_order,
            createdAt: item.created_at.toISOString(),
            updatedAt: item.updated_at.toISOString(),
            media: [],
          },
          destination: {
            iata: item.iata,
            cityName: item.city_name,
            countryName: item.country_name,
            countryCode: item.country_code,
            flightDurationMinutes: item.flight_duration_minutes,
            estimatedPrice: item.estimated_price,
            currency: '€',
          },
          theme: item.theme_slug,
        });
      }
      
      // Add media to the reel
      const reel = reelMap.get(reelIdStr);
      reel.reel.media.push({
        id: item.media_id.toString(),
        reelId: reelIdStr,
        kind: item.media_kind,
        sourceUrl: item.source_url,
        credit: item.credit,
        altText: item.alt_text,
        sortOrder: 1,
        isActive: true,
      });
    }

    const feedContent = Array.from(reelMap.values());

    console.log(`[api/feed] Returning ${feedContent.length} items for ${origin} → ${theme} (${minFlightMinutes}-${maxFlightMinutes}min)`);

    return NextResponse.json({
      ok: true,
      data: feedContent,
      meta: {
        origin,
        theme,
        maxFlightMinutes,
        minFlightMinutes,
        count: feedContent.length,
      },
    });
  } catch (error) {
    console.error('[api/feed] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to load feed content' },
      { status: 500 }
    );
  }
}
