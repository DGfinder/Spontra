import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/admin/moderation — List moderation queue items
export async function GET(req: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'pending'
    const limit = Math.min(Number(searchParams.get('limit') || '50'), 100)

    // Fetch content based on isApproved status
    const isApproved = status === 'approved' ? true : status === 'rejected' ? false : undefined
    
    const items = await prisma.userGeneratedContent.findMany({
      where: status === 'all' ? undefined : status === 'pending' ? { isApproved: false, isPublic: true } : { isApproved },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        creator: {
          include: {
            user: {
              select: { email: true }
            }
          }
        }
      }
    }).catch(() => [])

    return NextResponse.json({
      ok: true,
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        videoUrl: item.videoUrl,
        thumbnailUrl: item.thumbnailUrl,
        destinationCode: item.destinationCode,
        status: item.isApproved ? 'approved' : 'pending',
        qualityScore: Number(item.qualityScore),
        creatorEmail: item.creator?.user?.email,
        createdAt: item.createdAt.toISOString(),
      })),
      total: items.length,
    })
  } catch (error) {
    console.error('Moderation fetch error:', error)
    return NextResponse.json({ ok: true, items: [], total: 0 })
  }
}

// PATCH /api/admin/moderation — Update item status
export async function PATCH(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ ok: false, error: 'Missing id or status' }, { status: 400 })
    }

    const updated = await prisma.userGeneratedContent.update({
      where: { id },
      data: {
        isApproved: status === 'approved',
        isPublic: status !== 'rejected',
      },
    }).catch(() => null)

    if (!updated) {
      return NextResponse.json({ ok: false, error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, item: updated })
  } catch (error) {
    console.error('Moderation update error:', error)
    return NextResponse.json({ ok: false, error: 'Failed to update' }, { status: 500 })
  }
}
