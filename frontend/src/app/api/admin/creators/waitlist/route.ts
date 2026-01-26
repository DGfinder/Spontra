import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/admin/creators/waitlist — List all waitlist entries
export async function GET(req: NextRequest): Promise<Response> {
  try {
    const entries = await prisma.creatorWaitlist.findMany({
      orderBy: { position: 'asc' },
      take: 500,
    }).catch(() => [])

    return NextResponse.json({
      ok: true,
      entries: entries.map(e => ({
        id: e.id,
        email: e.email,
        position: e.position,
        status: e.status,
        source: e.source,
        createdAt: e.createdAt.toISOString(),
        invitedAt: e.invitedAt?.toISOString() || null,
        joinedAt: e.joinedAt?.toISOString() || null,
      })),
      total: entries.length,
    })
  } catch (error) {
    console.error('Failed to fetch waitlist:', error)
    return NextResponse.json({ ok: false, entries: [], error: 'Failed to fetch waitlist' }, { status: 500 })
  }
}

// PATCH /api/admin/creators/waitlist — Update entry status (invite, etc)
export async function PATCH(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ ok: false, error: 'Missing id or status' }, { status: 400 })
    }

    const updated = await prisma.creatorWaitlist.update({
      where: { id },
      data: {
        status,
        invitedAt: status === 'invited' ? new Date() : undefined,
        joinedAt: status === 'joined' ? new Date() : undefined,
      },
    }).catch(() => null)

    if (!updated) {
      return NextResponse.json({ ok: false, error: 'Entry not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, entry: updated })
  } catch (error) {
    console.error('Failed to update waitlist entry:', error)
    return NextResponse.json({ ok: false, error: 'Failed to update' }, { status: 500 })
  }
}
