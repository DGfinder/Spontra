import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAdminContext, AdminAuthError } from '@/lib/adminAuth'
import { getAdminDbClient } from '@/lib/dbAdmin'

export const runtime = 'nodejs'

const paramsSchema = z.object({
  id: z.string().min(3).max(3),
})

const themeRowSchema = z.object({
  theme_slug: z.string(),
  is_enabled: z.boolean(),
  min_media_required: z.number(),
  max_media_allowed: z.number(),
  reel_count: z.number(),
  is_ready: z.boolean().nullable(),
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdminContext(request)
    const { id } = paramsSchema.parse(params)
    const iata = id.toUpperCase()

    const client = await getAdminDbClient()
    try {
      const overlayResult = await client.query(
        SELECT
            a.iata_code,
            a.name,
            a.city,
            a.country,
            dest.description,
            COALESCE(dest.highlights, '[]') AS highlights,
            COALESCE(dest.activities, '{}') AS activities,
            dest.hero_image
         FROM airports a
         LEFT JOIN destinations_enhanced dest ON dest.airport_code = a.iata_code
         WHERE a.iata_code = 
         LIMIT 1,
        [iata]
      )

      if (overlayResult.rowCount === 0) {
        return NextResponse.json({ ok: false, error: 'Destination not found' }, { status: 404 })
      }

      const readinessResult = await client.query(
        SELECT
            ct."themeSlug" AS theme_slug,
            ct."isEnabled" AS is_enabled,
            ct."minMediaRequired" AS min_media_required,
            ct."maxMediaAllowed" AS max_media_allowed,
            COALESCE(view.reel_count, 0) AS reel_count,
            view.is_ready
         FROM "CityTheme" ct
         LEFT JOIN city_theme_ready view
           ON view.iata = ct.iata AND view.theme_slug = ct."themeSlug"
         WHERE ct.iata = 
         ORDER BY ct."themeSlug",
        [iata]
      )

      const themes = readinessResult.rows.map((row) => {
        const parsed = themeRowSchema.parse(row)
        return {
          themeSlug: parsed.theme_slug,
          isEnabled: parsed.is_enabled,
          min: parsed.min_media_required,
          max: parsed.max_media_allowed,
          reelCount: parsed.reel_count,
          isReady: parsed.is_ready ?? false,
        }
      })

      const row = overlayResult.rows[0]
      return NextResponse.json({
        ok: true,
        data: {
          airportCode: row.iata_code,
          name: row.name,
          city: row.city,
          country: row.country,
          description: row.description ?? '',
          highlights: typeof row.highlights === 'string' ? JSON.parse(row.highlights) : row.highlights ?? [],
          activities: typeof row.activities === 'string' ? JSON.parse(row.activities) : row.activities ?? {},
          heroImage: row.hero_image,
          themes,
        },
      })
    } finally {
      await client.end()
    }
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid destination', details: error.issues }, { status: 400 })
    }
    console.error('Failed to load destination overlay:', error)
    return NextResponse.json({ ok: false, error: 'Failed to load destination' }, { status: 500 })
  }
}
