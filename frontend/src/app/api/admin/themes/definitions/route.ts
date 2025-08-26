import { NextRequest, NextResponse } from 'next/server'
import { apiClient } from '@/services/apiClient'

export const runtime = 'nodejs'

// GET /api/admin/themes/definitions -> proxy to data-ingestion service
export async function GET() {
  try {
    // The apiClient base points at data-ingestion (8081) per config
    const res = await fetch(`${process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'}/api/v1/themes/definitions`, { cache: 'no-store' })
    const data = await res.json()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Failed to fetch theme definitions:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch theme definitions' }, { status: 500 })
  }
}

// POST /api/admin/themes/definitions -> create/update
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await fetch(`${process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'}/api/v1/themes/definitions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to create/update theme definition:', error)
    return NextResponse.json({ success: false, error: 'Failed to save theme definition' }, { status: 500 })
  }
}


