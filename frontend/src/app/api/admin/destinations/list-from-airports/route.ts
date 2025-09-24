import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAdminContext, AdminAuthError } from '@/lib/adminAuth'
import { getAdminDbClient } from '@/lib/dbAdmin'

export const runtime = 'nodejs'

const querySchema = z.object({
  country: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
})

const themeReadyRowSchema = z.object({
  theme_slug: z.string(),
  is_enabled: z.boolean(),
  min_media_required: z.number(),
  max_media_allowed: z.number(),
  reel_count: z.number(),
  is_ready: z.boolean().nullable(),
})

function mapThemeReadiness(rows: any[]) {
  const readiness: Record<string, Array<{ themeSlug: string; isEnabled: boolean; min: number; max: number; reelCount: number; isReady: boolean }>> = {}

  for (const row of rows) {
    const parsed = themeReadyRowSchema.parse(row)
    const iata = row.iata
    if (!readiness[iata]) readiness[iata] = []
    readiness[iata].push({
      themeSlug: parsed.theme_slug,
      isEnabled: parsed.is_enabled,
      min: parsed.min_media_required,
      max: parsed.max_media_allowed,
      reelCount: parsed.reel_count,
      isReady: parsed.is_ready ?? false,
    })
  }

  return readiness
}

export async function GET(request: NextRequest) {
  try {
    const admin = requireAdminContext(request, ['owner', 'admin', 'curator', 'analyst', 'support'])
    const query = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
    if (!query.success) {
      return NextResponse.json({ error: 'Invalid query parameters', details: query.error.issues }, { status: 400 })
    }

    const { country, isActive } = query.data

    const client = await getAdminDbClient()
    try {
      const params: any[] = []
      let paramIndex = 1

      const conditions: string[] = ['flight_stats.flight_count > 0']
      if (country) {
        conditions.push(`LOWER(a.country) = LOWER($${paramIndex})`)
        params.push(country)
        paramIndex += 1
      }
      if (isActive) {
        conditions.push(`a.is_active = $${paramIndex}`)
        params.push(isActive === 'true')
        paramIndex += 1
      }

      const destinationsResult = await client.query(
        `SELECT DISTINCT
            a.iata_code as airport_code,
            a.name,
            a.city,
            a.country,
            a.country_code,
            a.latitude,
            a.longitude,
            a.is_active,
            flight_stats.flight_count,
            dest.description,
            COALESCE(dest.highlights, '[]') as highlights,
            COALESCE(dest.activities, '{}') as activities,
            dest.hero_image
          FROM airports a
          LEFT JOIN (
            SELECT airport_code, COUNT(*) as flight_count
            FROM (
              SELECT destination_airport as airport_code FROM flight_durations
              UNION ALL
              SELECT origin_airport as airport_code FROM flight_durations
            ) flight_airports
            GROUP BY airport_code
          ) flight_stats ON flight_stats.airport_code = a.iata_code
          LEFT JOIN destinations_enhanced dest ON dest.airport_code = a.iata_code
          WHERE ${conditions.join(' AND ')}
          ORDER BY a.city ASC, a.country ASC`,
        params
      )

      const iataCodes = destinationsResult.rows.map((row) => row.airport_code)

      const readinessResult = await client.query(
        `SELECT
            ct.iata,
            ct."themeSlug" AS theme_slug,
            ct."isEnabled" AS is_enabled,
            ct."minMediaRequired" AS min_media_required,
            ct."maxMediaAllowed" AS max_media_allowed,
            COALESCE(view.reel_count, 0) AS reel_count,
            view.is_ready
         FROM "CityTheme" ct
         LEFT JOIN city_theme_ready view
           ON view.iata = ct.iata AND view.theme_slug = ct."themeSlug"
         WHERE ct.iata = ANY($1::text[])
         ORDER BY ct.iata, ct."themeSlug"`,
        [iataCodes]
      )

      const readinessByIata = mapThemeReadiness(readinessResult.rows)

      const destinations = destinationsResult.rows.map((row: any) => ({
        airport_code: row.airport_code,
        name: row.name,
        city: row.city,
        country: row.country,
        country_code: row.country_code,
        latitude: row.latitude ? parseFloat(row.latitude) : null,
        longitude: row.longitude ? parseFloat(row.longitude) : null,
        is_active: row.is_active,
        flight_count: parseInt(row.flight_count) || 0,
        themes: readinessByIata[row.airport_code] ?? [],
        description: row.description || '',
        highlights: typeof row.highlights === 'string' ? JSON.parse(row.highlights) : row.highlights || [],
        activities:
          typeof row.activities === 'string'
            ? JSON.parse(row.activities)
            : row.activities || {
                vibe: [],
                adventure: [],
                discover: [],
                indulge: [],
                nature: [],
              },
        hero_image: row.hero_image,
      }))

      return NextResponse.json({
        ok: true,
        data: destinations,
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

    console.error('Destinations list query failed:', error)
    return NextResponse.json({ ok: false, error: 'Query failed' }, { status: 500 })
  }
}

