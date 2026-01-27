import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
  iata: z.string().min(3).max(3),
});

const querySchema = z.object({
  theme: z.enum(['adventure', 'nature', 'vibe', 'indulge', 'discover']).optional(),
  limit: z.coerce.number().min(1).max(50).optional().default(10),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ iata: string }> }
) {
  try {
    const { iata } = paramsSchema.parse(await params);
    const { searchParams } = new URL(req.url);
    
    const query = querySchema.safeParse({
      theme: searchParams.get('theme'),
      limit: searchParams.get('limit'),
    });

    if (!query.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid parameters', details: query.error.issues },
        { status: 400 }
      );
    }

    const { theme, limit } = query.data;
    const iataUpper = iata.toUpperCase();

    // Build where clause
    const where: any = {
      iata: iataUpper,
      isActive: true,
    };
    
    if (theme) {
      where.themeSlug = theme;
    }

    const reels = await prisma.reel.findMany({
      where,
      include: {
        media: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    // Get destination info
    const destination = await prisma.destination.findUnique({
      where: { airportCode: iataUpper },
      select: {
        cityName: true,
        countryName: true,
        countryCode: true,
        description: true,
        imageUrl: true,
      },
    });

    // Fallback to airport if no destination
    let destInfo = destination;
    if (!destInfo) {
      const airport = await prisma.airport.findUnique({
        where: { iataCode: iataUpper },
        select: {
          city: true,
          country: true,
          countryCode: true,
        },
      });
      if (airport) {
        destInfo = {
          cityName: airport.city,
          countryName: airport.country,
          countryCode: airport.countryCode,
          description: null,
          imageUrl: null,
        };
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        destination: destInfo ? {
          iata: iataUpper,
          ...destInfo,
        } : {
          iata: iataUpper,
          cityName: iataUpper,
          countryName: 'Unknown',
          countryCode: 'XX',
        },
        reels: reels.map(reel => ({
          id: reel.id.toString(),
          iata: reel.iata,
          themeSlug: reel.themeSlug,
          title: reel.title,
          caption: reel.caption,
          language: reel.language,
          isActive: reel.isActive,
          sortOrder: reel.sortOrder,
          createdAt: reel.createdAt.toISOString(),
          updatedAt: reel.updatedAt.toISOString(),
          media: reel.media.map(m => ({
            id: m.id.toString(),
            reelId: m.reelId.toString(),
            kind: m.kind,
            sourceUrl: m.sourceUrl,
            credit: m.credit,
            altText: m.altText,
            sortOrder: m.sortOrder,
            isActive: m.isActive,
          })),
        })),
      },
    });
  } catch (error) {
    console.error('[api/destinations/reels] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to load reels' },
      { status: 500 }
    );
  }
}
