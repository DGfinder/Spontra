import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// PATCH /api/admin/themes/definitions/[key]
export async function PATCH(req: NextRequest, { params }: { params: { key: string } }) {
  try {
    const body = await req.json()
    const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'
    const res = await fetch(`${base}/api/v1/themes/definitions/${params.key}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to update theme definition:', error)
    return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 })
  }
}

// DELETE /api/admin/themes/definitions/[key]
export async function DELETE(_req: NextRequest, { params }: { params: { key: string } }) {
  try {
    const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'
    const res = await fetch(`${base}/api/v1/themes/definitions/${params.key}`, {
      method: 'DELETE',
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to delete theme definition:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete' }, { status: 500 })
  }
}


