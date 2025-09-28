import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const revalidate = 0


import { requireAdminContext, AdminAuthError } from '@/lib/adminAuth'
import { getAdminDbClient } from '@/lib/dbAdmin'
import { consumeRateLimit } from '@/lib/rateLimit'

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
    const admin = await requireAdminContext(request)
    const { id } = paramsSchema.parse(params)
    const iata = id.toUpperCase()

    const rateKey = `themes:list:${admin.userId ?? admin.email ?? admin.role}`
    const rate = consumeRateLimit(rateKey, 60, 60_000)
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded', resetAt: rate.resetAt }, { status: 429 })
    }

    const client = await getAdminDbClient()
    try {
      const result = await client.query(
        `SELECT
            ct."themeSlug" AS theme_slug,
            ct."isEnabled" AS is_enabled,
            ct."minMediaRequired" AS min_media_required,
            ct."maxMediaAllowed" AS max_media_allowed,
            COALESCE(view.reel_count, 0) AS reel_count,
            view.is_ready
         FROM "CityTheme" ct
         LEFT JOIN city_theme_ready view
           ON view.iata = ct.iata
          AND view.theme_slug = ct."themeSlug"
         WHERE ct.iata = $1
         ORDER BY ct."themeSlug"`,
        [iata]
      )

      const themes = result.rows.map((row: any) => {
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

      console.info(
        JSON.stringify({
          component: 'admin-api',
          event: 'destinations.themes.list',
          iata,
          adminRole: admin.role,
          adminUser: admin.userId ?? admin.email,
          count: themes.length,
        })
      )

      return NextResponse.json({ ok: true, data: themes })
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

    console.error('Admin themes listing failed', error)
    return NextResponse.json({ error: 'Failed to fetch destination themes' }, { status: 500 })
  }
}