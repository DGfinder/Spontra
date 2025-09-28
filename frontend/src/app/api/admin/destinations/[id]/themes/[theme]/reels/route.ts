import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const revalidate = 0


import { requireAdminContext, AdminAuthError } from '@/lib/adminAuth'
import { getAdminDbClient } from '@/lib/dbAdmin'
import { consumeRateLimit } from '@/lib/rateLimit'
import { normaliseMediaUrls } from '@/lib/mediaValidation'

const paramsSchema = z.object({
  id: z.string().min(3).max(3),
  theme: z.enum(['adventure', 'nature', 'vibe', 'indulge', 'discover']),
})

const postBodySchema = z.object({
  title: z.string().max(200).optional(),
  caption: z.string().max(500).optional(),
  language: z.string().max(8).optional(),
  urls: z.array(z.string()).min(1),
})

function detectMediaKind(url: string): 'video' | 'image' {
  const lower = url.toLowerCase()
  if (
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.png') ||
    lower.endsWith('.gif') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.avif')
  ) {
    return 'image'
  }
  return 'video'
}

function mapReelRow(row: any) {
  return {
    id: row.id,
    iata: row.iata,
    themeSlug: row.theme_slug,
    title: row.title,
    caption: row.caption,
    language: row.language,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    media: (row.media ?? []).map((media: any) => ({
      id: media.id,
      reelId: media.reel_id,
      kind: media.kind,
      sourceUrl: media.source_url,
      providerId: media.provider_id,
      aspect: media.aspect,
      durationMs: media.duration_ms,
      width: media.width,
      height: media.height,
      altText: media.alt_text,
      credit: media.credit,
      license: media.license,
      sortOrder: media.sort_order,
      isActive: media.is_active,
    })),
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; theme: string }> }) {
  try {
    const admin = await requireAdminContext(request)
    const { id, theme } = paramsSchema.parse(await params)
    const iata = id.toUpperCase()
    const themeSlug = theme

    const rate = consumeRateLimit(`reels:list:${admin.userId ?? admin.email ?? admin.role}`, 60, 60_000)
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded', resetAt: rate.resetAt }, { status: 429 })
    }

    const client = await getAdminDbClient()
    try {
      const result = await client.query(
        `SELECT
           r.id,
           r.iata,
           r."themeSlug" AS theme_slug,
           r.title,
           r.caption,
           r.language,
           r."isActive" AS is_active,
           r."sortOrder" AS sort_order,
           r."createdAt" AS created_at,
           r."updatedAt" AS updated_at,
           COALESCE(
             json_agg(
               json_build_object(
                 'id', rm.id,
                 'reel_id', rm."reelId",
                 'kind', rm.kind,
                 'source_url', rm."sourceUrl",
                 'provider_id', rm."providerId",
                 'aspect', rm.aspect,
                 'duration_ms', rm."durationMs",
                 'width', rm.width,
                 'height', rm.height,
                 'alt_text', rm."altText",
                 'credit', rm.credit,
                 'license', rm.license,
                 'sort_order', rm."sortOrder",
                 'is_active', rm."isActive"
               )
             ) FILTER (WHERE rm.id IS NOT NULL),
             '[]'
           ) AS media
         FROM "Reel" r
         LEFT JOIN "ReelMedia" rm ON rm."reelId" = r.id
         WHERE r.iata = $1 AND r."themeSlug" = $2
         GROUP BY r.id
         ORDER BY r."sortOrder", r.id`,
        [iata, themeSlug]
      )

      const reels = result.rows.map(mapReelRow)

      console.info(
        JSON.stringify({
          component: 'admin-api',
          event: 'destinations.reels.list',
          iata,
          theme: themeSlug,
          adminRole: admin.role,
          count: reels.length,
        })
      )

      return NextResponse.json({ ok: true, data: reels })
    } finally {
      await client.end()
    }
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.issues }, { status: 400 })
    }
    console.error('Admin reels fetch failed', error)
    return NextResponse.json({ error: 'Failed to load reels' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; theme: string }> }) {
  try {
    const admin = await requireAdminContext(request)
    const { id, theme } = paramsSchema.parse(await params)
    const body = postBodySchema.parse(await request.json())
    const iata = id.toUpperCase()
    const themeSlug = theme

    const normalised = normaliseMediaUrls(body.urls)
    if (!normalised.ok) {
      return NextResponse.json({ error: normalised.error }, { status: 400 })
    }

    const rate = consumeRateLimit(`reels:create:${admin.userId ?? admin.email ?? admin.role}`, 20, 60_000)
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded', resetAt: rate.resetAt }, { status: 429 })
    }

    const client = await getAdminDbClient()
    try {
      await client.query('BEGIN')

      const themeConfigResult = await client.query(
        `SELECT "minMediaRequired", "maxMediaAllowed" FROM "CityTheme" WHERE iata = $1 AND "themeSlug" = $2`,
        [iata, themeSlug]
      )
      if (themeConfigResult.rowCount === 0) {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: 'Theme configuration not found' }, { status: 404 })
      }

      const themeConfig = themeConfigResult.rows[0] as { minMediaRequired: number; maxMediaAllowed: number }
      const activeCountResult = await client.query(
        `SELECT COUNT(*) AS active_count FROM "Reel" WHERE iata = $1 AND "themeSlug" = $2 AND "isActive" = true`,
        [iata, themeSlug]
      )
      const activeCount = Number(activeCountResult.rows[0]?.active_count ?? 0)

      if (activeCount + normalised.urls.length > themeConfig.maxMediaAllowed) {
        await client.query('ROLLBACK')
        return NextResponse.json(
          {
            error: 'Adding these reels would exceed the maximum allowance',
            allowed: themeConfig.maxMediaAllowed,
            current: activeCount,
            attempted: normalised.urls.length,
          },
          { status: 409 }
        )
      }

      const sortBaseResult = await client.query(
        `SELECT COALESCE(MAX("sortOrder"), 0) AS max_sort FROM "Reel" WHERE iata = $1 AND "themeSlug" = $2`,
        [iata, themeSlug]
      )
      let nextSort = Number(sortBaseResult.rows[0]?.max_sort ?? 0) + 1

      const createdReels: any[] = []

      for (const url of normalised.urls) {
        const reelInsert = await client.query(
          `INSERT INTO "Reel" (iata, "themeSlug", title, caption, language, "sortOrder")
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, iata, "themeSlug", title, caption, language, "isActive", "sortOrder", "createdAt", "updatedAt"`,
          [iata, themeSlug, body.title ?? null, body.caption ?? null, body.language ?? 'en', nextSort]
        )
        const reel = reelInsert.rows[0]

        const mediaInsert = await client.query(
          `INSERT INTO "ReelMedia" ("reelId", kind, "sourceUrl")
           VALUES ($1, $2, $3)
           RETURNING id, "reelId", kind, "sourceUrl", "providerId", aspect, "durationMs", width, height, "altText", credit, license, "sortOrder", "isActive"`,
          [reel.id, detectMediaKind(url), url]
        )

        createdReels.push(
          mapReelRow({
            ...reel,
            media: [mediaInsert.rows[0]],
          })
        )

        nextSort += 1
      }

      await client.query('COMMIT')

      console.info(
        JSON.stringify({
          component: 'admin-api',
          event: 'destinations.reels.created',
          iata,
          theme: themeSlug,
          adminRole: admin.role,
          createdCount: createdReels.length,
        })
      )

      return NextResponse.json({ ok: true, data: createdReels })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      await client.end()
    }
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.issues }, { status: 400 })
    }
    console.error('Admin reels creation failed', error)
    return NextResponse.json({ error: 'Failed to create reels' }, { status: 500 })
  }
}
