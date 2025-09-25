import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAdminContext, AdminAuthError } from '@/lib/adminAuth'
import { getAdminDbClient } from '@/lib/dbAdmin'
import { consumeRateLimit } from '@/lib/rateLimit'

export const runtime = 'nodejs'

const updateSchema = z.object({
  airport_code: z.string().length(3),
  city: z.string().optional(),
  country: z.string().optional(),
  country_code: z.string().length(2).optional(),
  description: z.string().max(2000).optional(),
  highlights: z.array(z.string().max(200)).optional(),
  activities: z.record(z.string(), z.array(z.string().max(200))).optional(),
  hero_image: z.string().url().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminContext(req)
    const payload = updateSchema.parse(await req.json())
    const airportCode = payload.airport_code.toUpperCase()

    const rate = consumeRateLimit(`destinations:update:${admin.userId ?? admin.email ?? admin.role}`, 40, 60_000)
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded', resetAt: rate.resetAt }, { status: 429 })
    }

    const pg = await getAdminDbClient()
    try {
      await pg.query(
        `CREATE TABLE IF NOT EXISTS destinations_enhanced (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          airport_code VARCHAR(3) NOT NULL UNIQUE,
          city_name VARCHAR(255),
          country_name VARCHAR(255),
          country_code VARCHAR(2),
          themes JSONB DEFAULT '{}',
          description TEXT,
          highlights JSONB DEFAULT '[]',
          activities JSONB DEFAULT '{}',
          videos JSONB DEFAULT '{}',
          hero_image VARCHAR(512),
          is_featured BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )`
      )

      await pg.query(
        `CREATE INDEX IF NOT EXISTS idx_destinations_enhanced_airport ON destinations_enhanced(airport_code)`
      )

      const result = await pg.query(
        `INSERT INTO destinations_enhanced (
            airport_code,
            city_name,
            country_name,
            country_code,
            description,
            highlights,
            activities,
            hero_image,
            updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT (airport_code) DO UPDATE SET
            city_name = COALESCE(EXCLUDED.city_name, destinations_enhanced.city_name),
            country_name = COALESCE(EXCLUDED.country_name, destinations_enhanced.country_name),
            country_code = COALESCE(EXCLUDED.country_code, destinations_enhanced.country_code),
            description = COALESCE(EXCLUDED.description, destinations_enhanced.description),
            highlights = COALESCE(EXCLUDED.highlights, destinations_enhanced.highlights),
            activities = COALESCE(EXCLUDED.activities, destinations_enhanced.activities),
            hero_image = COALESCE(EXCLUDED.hero_image, destinations_enhanced.hero_image),
            updated_at = NOW()
         RETURNING airport_code, city_name, country_name, country_code, description, highlights, activities, hero_image, updated_at`,
        [
          airportCode,
          payload.city ?? null,
          payload.country ?? null,
          payload.country_code ?? null,
          payload.description ?? null,
          JSON.stringify(payload.highlights ?? []),
          JSON.stringify(payload.activities ?? {}),
          payload.hero_image ?? null,
        ]
      )

      console.info(
        JSON.stringify({
          component: 'admin-api',
          event: 'destinations.overlay.updated',
          airportCode,
          adminRole: admin.role,
          adminUser: admin.userId ?? admin.email,
        })
      )

      return NextResponse.json({ ok: true, data: result.rows[0] })
    } finally {
      await pg.end()
    }
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.issues }, { status: 400 })
    }

    console.error('Destination update failed:', error)
    return NextResponse.json({ ok: false, error: 'Update failed' }, { status: 500 })
  }
}

