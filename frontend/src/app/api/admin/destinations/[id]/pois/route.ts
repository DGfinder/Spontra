import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

function requireAuth(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization')
  if (!auth || !auth.startsWith('Bearer ')) return null
  return auth.substring(7)
}

function adminBase(): string | null {
  const base = process.env.POI_ADMIN_BASE_URL
  return base ? base.replace(/\/$/, '') : null
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const base = adminBase()
  if (!base) return NextResponse.json({ success: false, error: 'POI admin service unavailable' }, { status: 503 })
  const token = requireAuth(req)
  if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const id = (params?.id || '').toUpperCase()
  const upstream = new URL(`${base}/destinations/${id}/pois`)
  const qs = new URL(req.url).searchParams
  qs.forEach((v, k) => upstream.searchParams.set(k, v))

  const res = await fetch(upstream.toString(), { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const base = adminBase()
  if (!base) return NextResponse.json({ success: false, error: 'POI admin service unavailable' }, { status: 503 })
  const token = requireAuth(req)
  if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const id = (params?.id || '').toUpperCase()
  const body = await req.text()
  const res = await fetch(`${base}/destinations/${id}/pois`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const base = adminBase()
  if (!base) return NextResponse.json({ success: false, error: 'POI admin service unavailable' }, { status: 503 })
  const token = requireAuth(req)
  if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const id = (params?.id || '').toUpperCase()
  const body = await req.text()
  const res = await fetch(`${base}/destinations/${id}/pois`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
