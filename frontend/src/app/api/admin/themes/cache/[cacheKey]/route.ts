import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// DELETE /api/admin/themes/cache/[cacheKey]
export async function DELETE(_req: NextRequest, { params }: { params: { cacheKey: string } }) {
  try {
    const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'
    const res = await fetch(`${base}/api/v1/themes/cache/recommendations/${params.cacheKey}`, { method: 'DELETE' })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to delete cache entry:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete cache entry' }, { status: 500 })
  }
}


