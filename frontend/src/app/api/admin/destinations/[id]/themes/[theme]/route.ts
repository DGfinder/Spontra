import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const revalidate = 0


import { requireAdminContext, AdminAuthError } from '@/lib/adminAuth'
import { getAdminDbClient } from '@/lib/dbAdmin'
import { consumeRateLimit } from '@/lib/rateLimit'

type DestinationThemeSlug = 'adventure' | 'nature' | 'vibe' | 'indulge' | 'discover'

const paramsSchema = z.object({
  id: z.string().min(3).max(3),
  theme: z.enum(['adventure', 'nature', 'vibe', 'indulge', 'discover']),
})

const bodySchema = z
  .object({
    isEnabled: z.boolean().optional(),
    min: z.number().int().min(0).max(50).optional(),
    max: z.number().int().min(0).max(50).optional(),
    notes: z.string().max(1024).nullable().optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'Payload must include at least one field to update',
  })

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; theme: string }> }) {
  try {
    const admin = await requireAdminContext(request)
    const { id, theme } = paramsSchema.parse(await params)
    const body = bodySchema.parse(await request.json())
    const iata = id.toUpperCase()
    const themeSlug = theme as DestinationThemeSlug

    const rateKey = `themes:patch:${admin.userId ?? admin.email ?? admin.role}`
    const rate = consumeRateLimit(rateKey, 20, 60_000)
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded', resetAt: rate.resetAt }, { status: 429 })
    }

    const client = await getAdminDbClient()
    try {
      const existingResult = await client.query(
        'SELECT id, "isEnabled" AS "isEnabled", "minMediaRequired" AS "minMediaRequired", "maxMediaAllowed" AS "maxMediaAllowed" FROM "CityTheme" WHERE iata = $1 AND "themeSlug" = $2',
        [iata, themeSlug]
      )

      if (existingResult.rowCount === 0) {
        return NextResponse.json({ error: 'Theme configuration not found' }, { status: 404 })
      }

      const existing = existingResult.rows[0] as {
        id: number
        isEnabled: boolean
        minMediaRequired: number
        maxMediaAllowed: number
      }

      const nextMin = body.min ?? existing.minMediaRequired
      const nextMax = body.max ?? existing.maxMediaAllowed

      if (nextMin > nextMax) {
        return NextResponse.json({ error: 'min cannot exceed max' }, { status: 400 })
      }

      const nextEnabled = body.isEnabled ?? existing.isEnabled

      if (nextEnabled) {
        const reelCountResult = await client.query(
          'SELECT COUNT(*) AS active_count FROM "Reel" WHERE iata = $1 AND "themeSlug" = $2 AND "isActive" = true',
          [iata, themeSlug]
        )
        const activeCount = Number(reelCountResult.rows[0]?.active_count ?? 0)

        if (activeCount < nextMin) {
          return NextResponse.json(
            {
              error: 'Not enough active reels to enable theme',
              required: nextMin,
              current: activeCount,
            },
            { status: 409 }
          )
        }

        if (activeCount > nextMax) {
          return NextResponse.json(
            {
              error: 'Too many active reels to enable theme',
              allowed: nextMax,
              current: activeCount,
            },
            { status: 409 }
          )
        }
      }

      const updateResult = await client.query(
        `UPDATE "CityTheme"
            SET "isEnabled" = $1,
                "minMediaRequired" = $2,
                "maxMediaAllowed" = $3,
                notes = COALESCE($4, notes),
                updated_at = NOW()
          WHERE id = $5
          RETURNING
            "themeSlug" AS theme_slug,
            "isEnabled" AS is_enabled,
            "minMediaRequired" AS min_media_required,
            "maxMediaAllowed" AS max_media_allowed`,
        [nextEnabled, nextMin, nextMax, body.notes ?? null, existing.id]
      )

      const readinessResult = await client.query(
        `SELECT
            COALESCE(view.reel_count, 0) AS reel_count,
            view.is_ready
         FROM city_theme_ready view
         WHERE view.iata = $1 AND view.theme_slug = $2`,
        [iata, themeSlug]
      )

      const refreshed = updateResult.rows[0]
      const readinessRow = readinessResult.rows[0] ?? { reel_count: 0, is_ready: false }

      console.info(
        JSON.stringify({
          component: 'admin-api',
          event: 'destinations.themes.updated',
          iata,
          theme: themeSlug,
          adminRole: admin.role,
          adminUser: admin.userId ?? admin.email,
          isEnabled: nextEnabled,
          min: nextMin,
          max: nextMax,
        })
      )

      return NextResponse.json({
        ok: true,
        data: {
          themeSlug: refreshed.theme_slug,
          isEnabled: refreshed.is_enabled,
          min: refreshed.min_media_required,
          max: refreshed.max_media_allowed,
          reelCount: Number(readinessRow.reel_count ?? 0),
          isReady: Boolean(readinessRow.is_ready),
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
      return NextResponse.json({ error: 'Invalid request', details: error.issues }, { status: 400 })
    }

    console.error('Admin theme update failed', error)
    return NextResponse.json({ error: 'Failed to update theme configuration' }, { status: 500 })
  }
}