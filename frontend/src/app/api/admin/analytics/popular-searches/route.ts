import { NextRequest, NextResponse } from 'next/server'
import { Client as PgClient } from 'pg'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PopularSearch {
  query: string
  search_count: number
  result_count: number
  last_searched: string
  recency_category: string
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 100)

  const pgUrl = process.env.DATABASE_URL
  if (!pgUrl) {
    return NextResponse.json({ ok: false, error: 'Database not configured' }, { status: 503 })
  }

  const pg = new PgClient({ connectionString: pgUrl })

  try {
    await pg.connect()
    
    // Query the popular_searches view created by our SQL migration
    const { rows } = await pg.query(
      'SELECT * FROM popular_searches LIMIT $1',
      [limit]
    )

    const popularSearches: PopularSearch[] = rows.map((row: any) => ({
      query: row.query,
      search_count: parseInt(row.search_count),
      result_count: parseInt(row.result_count),
      last_searched: row.last_searched,
      recency_category: row.recency_category
    }))

    return NextResponse.json({
      ok: true,
      data: popularSearches,
      total: popularSearches.length
    })

  } catch (error: any) {
    console.error('❌ Popular searches error:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to fetch popular searches' },
      { status: 500 }
    )
  } finally {
    try { 
      await pg.end() 
    } catch {}
  }
}