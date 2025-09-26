import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const revalidate = 0


import { requireAdminContext, AdminAuthError } from '@/lib/adminAuth'
import { getAdminDbClient } from '@/lib/dbAdmin'
import { consumeRateLimit } from '@/lib/rateLimit'

const paramsSchema = z.object({
  id: z.string().min(1),
})

const patchBodySchema = z.object({
  title: z.string().max(200).nullable().optional(),
  caption: z.string().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdminContext(request)
    const { id } = paramsSchema.parse(params)
    const reelId = Number(id)
    if (Number.isNaN(reelId)) {
      return NextResponse.json({ error: 'Invalid reel id' }, { status: 400 })
    }

    const body = patchBodySchema.parse(await request.json())
    if (Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const rate = consumeRateLimit(`reels:patch:${admin.userId ?? admin.email ?? admin.role}`, 40, 60_000)
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded', resetAt: rate.resetAt }, { status: 429 })
    }

    const client = await getAdminDbClient()
    try {
      const existingResult = await client.query('SELECT id FROM "Reel" WHERE id = $1', [reelId])
      if (existingResult.rowCount === 0) {
        return NextResponse.json({ error: 'Reel not found' }, { status: 404 })
      }

      const updates: string[] = []
      const values: any[] = []
      let index = 1

      if (body.title !== undefined) {
        updates.push(`title = $${index}`)
        values.push(body.title)
        index += 1
      }
      if (body.caption !== undefined) {
        updates.push(`caption = $${index}`)
        values.push(body.caption)
        index += 1
      }
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

      values.push(reelId)

      const updateResult = await client.query(
        `UPDATE "Reel"
         SET ${updates.join(', ')}, "updatedAt" = NOW()
         WHERE id = $${index}
         RETURNING id, iata, "themeSlug", title, caption, language, "isActive", "sortOrder", "createdAt", "updatedAt"`,
        values
      )

      const row = updateResult.rows[0]

      console.info(
        JSON.stringify({
          component: 'admin-api',
          event: 'destinations.reels.updated',
          reelId,
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

    console.error('Admin reel patch failed', error)
    return NextResponse.json({ error: 'Failed to update reel' }, { status: 500 })
  }
}