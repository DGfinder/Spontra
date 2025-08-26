import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// PATCH /api/admin/destinations/[id]
// For now, accept updates and noop (stub). Later, wire to backend write API.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const destinationId = params.id
    const body = await req.json()

    // Convert frontend 0-10 theme scores to backend 0-100 if provided
    let theme_scores: Record<string, number> | undefined
    if (body.themeScores) {
      theme_scores = Object.fromEntries(Object.entries(body.themeScores).map(([k, v]) => [k, Math.round(Number(v) * 10)]))
    }

    const payload: any = {
      description: body.description,
      highlights: body.highlights,
      ...(theme_scores ? { theme_scores } : {}),
    }

    const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'
    const res = await fetch(`${base}/api/v1/data/destinations/${destinationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to update destination:', error)
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 })
  }
}


