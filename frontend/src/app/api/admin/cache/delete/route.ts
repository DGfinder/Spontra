import { NextRequest, NextResponse } from 'next/server'
import { cacheDel } from '@/lib/cacheServer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: NextRequest) {
  try {
    const { keys } = await req.json()
    if (!Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json({ ok: false, error: 'No keys provided' }, { status: 400 })
    }
    await Promise.all(keys.map((k: string) => cacheDel(k)))
    return NextResponse.json({ ok: true, deleted: keys.length })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to delete' }, { status: 500 })
  }
}
