import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const revalidate = 0


import { requireAdminContext, AdminAuthError } from '@/lib/adminAuth'
import { getAdminDbClient } from '@/lib/dbAdmin'
import { consumeRateLimit } from '@/lib/rateLimit'
import { normaliseMediaUrls } from '@/lib/mediaValidation'

const paramsSchema = z.object({
  id: z.string().min(1),
})

const postBodySchema = z.object({
  urls: z.array(z.string()).min(1),
})

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdminContext(request)
    const { id } = paramsSchema.parse(params)
    const reelId = Number(id)
    if (Number.isNaN(reelId)) {
      return NextResponse.json({ error: 'Invalid reel id' }, { status: 400 })
    }

    const body = postBodySchema.parse(await request.json())
    const normalised = normaliseMediaUrls(body.urls)
    if (!normalised.ok) {
      return NextResponse.json({ error: normalised.error }, { status: 400 })
    }

    const rate = consumeRateLimit(`reel-media:create:${admin.userId ?? admin.email ?? admin.role}`, 20, 60_000)
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded', resetAt: rate.resetAt }, { status: 429 })
    }

    const client = await getAdminDbClient()
    try {
      const reelResult = await client.query('SELECT id FROM "Reel" WHERE id = $1', [reelId])
      if (reelResult.rowCount === 0) {
        return NextResponse.json({ error: 'Reel not found' }, { status: 404 })
      }

      const mediaInserts = await client.query(
        `INSERT INTO "ReelMedia" ("reelId", kind, "sourceUrl")
         SELECT $1,
           CASE
             WHEN LOWER(url) LIKE '%.jpg' OR LOWER(url) LIKE '%.jpeg' OR LOWER(url) LIKE '%.png' OR LOWER(url) LIKE '%.gif' OR LOWER(url) LIKE '%.webp' OR LOWER(url) LIKE '%.avif'
               THEN 'image'
             ELSE 'video'
           END AS kind,
           url
         FROM UNNEST($2::text[]) AS t(url)
         RETURNING id, "reelId", kind, "sourceUrl", "providerId", aspect, "durationMs", width, height, "altText", credit, license, "sortOrder", "isActive"`,
        [reelId, normalised.urls]
      )

      console.info(
        JSON.stringify({
          component: 'admin-api',
          event: 'destinations.reelMedia.created',
          reelId,
          createdCount: mediaInserts.rowCount,
          adminRole: admin.role,
          adminUser: admin.userId ?? admin.email,
        })
      )

      return NextResponse.json({ ok: true, data: mediaInserts.rows })
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
    console.error('Admin reel media creation failed', error)
    return NextResponse.json({ error: 'Failed to add reel media' }, { status: 500 })
  }
}