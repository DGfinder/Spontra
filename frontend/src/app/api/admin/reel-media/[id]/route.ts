import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const revalidate = 0


import { requireAdminContext, AdminAuthError } from '@/lib/adminAuth'
import { getAdminDbClient } from '@/lib/dbAdmin'
import { consumeRateLimit } from '@/lib/rateLimit'

const paramsSchema = z.object({
  id: z.string(),
})

const patchBodySchema = z.object({
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(1000).nullable().optional(),
  altText: z.string().max(500).nullable().optional(),
  credit: z.string().max(200).nullable().optional(),
  license: z.string().max(200).nullable().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdminContext(request)
    const { id } = paramsSchema.parse(params)
    const mediaId = Number(id)
    if (!Number.isInteger(mediaId) || mediaId <= 0) {
      return NextResponse.json({ error: 'Invalid media id' }, { status: 400 })
    }

    const body = patchBodySchema.parse(await request.json())
    if (Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const rateKey = `reel-media:patch:${admin.userId ?? admin.email ?? admin.role}`
    const rate = consumeRateLimit(rateKey, 40, 60_000)
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded', resetAt: rate.resetAt }, { status: 429 })
    }

    const client = await getAdminDbClient()
    try {
      const existingResult = await client.query('SELECT id FROM "ReelMedia" WHERE id = $1', [mediaId])
      if (existingResult.rowCount === 0) {
        return NextResponse.json({ error: 'Reel media not found' }, { status: 404 })
      }

      const updates: string[] = []
      const values: Array<string | number | boolean | null> = []
      let index = 1

      if (body.isActive !== undefined) {
        updates.push(`"isActive" = $${index}`)
        values.push(body.isActive)
        index += 1
      }
      if (body.sortOrder !== undefined) {
        updates.push(`"sortOrder" = $${index}`)
        values.push(body.sortOrder)
        index += 1
      }
      if (body.altText !== undefined) {
        updates.push(`"altText" = $${index}`)
        values.push(body.altText ?? null)
        index += 1
      }
      if (body.credit !== undefined) {
        updates.push(`credit = $${index}`)
        values.push(body.credit ?? null)
        index += 1
      }
      if (body.license !== undefined) {
        updates.push(`license = $${index}`)
        values.push(body.license ?? null)
        index += 1
      }

      if (updates.length === 0) {
        return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
      }

      updates.push(`"updatedAt" = NOW()`)
      values.push(mediaId)

      const updateSql = `UPDATE "ReelMedia"
        SET ${updates.join(', ')}
        WHERE id = $${index}
        RETURNING id, "reelId", kind, "sourceUrl", "providerId", aspect, "durationMs", width, height, "altText", credit, license, "sortOrder", "isActive", "createdAt", "updatedAt"`

      const updateResult = await client.query(updateSql, values)
      const row = updateResult.rows[0]

      console.info(
        JSON.stringify({
          component: 'admin-api',
          event: 'destinations.reelMedia.updated',
          mediaId,
          adminRole: admin.role,
          adminUser: admin.userId ?? admin.email,
          updates: Object.keys(body),
        })
      )

      return NextResponse.json({ ok: true, data: row })
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

    console.error('Admin reel media patch failed', error)
    return NextResponse.json({ error: 'Failed to update media' }, { status: 500 })
  }
}