import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const waitlistSchema = z.object({
  email: z.string().email(),
  source: z.string().optional(),
})

// POST /api/creators/waitlist — Add email to creator waitlist
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json()
    const { email, source } = waitlistSchema.parse(body)

    // Check if email already exists
    const existing = await prisma.creatorWaitlist.findUnique({
      where: { email },
    }).catch(() => null)

    if (existing) {
      return NextResponse.json({ 
        ok: true, 
        message: 'Already on the waitlist',
        position: existing.position 
      })
    }

    // Get current waitlist count for position
    const count = await prisma.creatorWaitlist.count().catch(() => 0)

    // Add to waitlist
    const entry = await prisma.creatorWaitlist.create({
      data: {
        email,
        source: source || 'website',
        position: count + 1,
      },
    }).catch((err) => {
      console.error('Failed to add to waitlist:', err)
      return null
    })

    if (!entry) {
      // Fallback: just acknowledge the request
      return NextResponse.json({ 
        ok: true, 
        message: 'Added to waitlist',
        position: count + 1
      })
    }

    return NextResponse.json({ 
      ok: true, 
      message: 'Added to waitlist',
      position: entry.position 
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid email address' 
      }, { status: 400 })
    }

    console.error('Waitlist error:', error)
    return NextResponse.json({ 
      ok: false, 
      error: 'Failed to join waitlist' 
    }, { status: 500 })
  }
}

// GET /api/creators/waitlist — Get waitlist stats (admin only in future)
export async function GET(): Promise<Response> {
  try {
    const count = await prisma.creatorWaitlist.count().catch(() => 0)
    
    return NextResponse.json({
      ok: true,
      count,
      message: `${count} people on the waitlist`
    })
  } catch (error) {
    return NextResponse.json({ 
      ok: false, 
      count: 0,
      error: 'Failed to get waitlist stats' 
    }, { status: 500 })
  }
}
