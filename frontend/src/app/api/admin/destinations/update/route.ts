import { NextRequest, NextResponse } from 'next/server'
import { Client as PgClient } from 'pg'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const destination = await req.json()

    if (!destination.airport_code) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Airport code is required' 
      }, { status: 400 })
    }

    const pgUrl = process.env.SEARCH_DATABASE_URL || process.env.DATABASE_URL
    if (!pgUrl) {
      return NextResponse.json({ ok: false, error: 'Database URL not configured' }, { status: 503 })
    }

    const pg = new PgClient({ connectionString: pgUrl })
    await pg.connect()
    
    try {
      // First, ensure the destinations_enhanced table exists
      await pg.query(`
        CREATE TABLE IF NOT EXISTS destinations_enhanced (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          airport_code VARCHAR(3) NOT NULL UNIQUE,
          city_name VARCHAR(255),
          country_name VARCHAR(255),
          country_code VARCHAR(2),
          
          -- Theme associations (boolean flags)
          themes JSONB DEFAULT '{}',
          
          -- Content
          description TEXT,
          highlights JSONB DEFAULT '[]',
          activities JSONB DEFAULT '{}',
          videos JSONB DEFAULT '{}',
          
          -- Media
          hero_image VARCHAR(512),
          
          -- Status
          is_featured BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          
          -- Metadata
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)

      // Create index if it doesn't exist
      await pg.query(`
        CREATE INDEX IF NOT EXISTS idx_destinations_enhanced_airport 
        ON destinations_enhanced(airport_code);
      `)

      // Upsert the destination data
      const { rowCount } = await pg.query(`
        INSERT INTO destinations_enhanced (
          airport_code, city_name, country_name, country_code,
          themes, description, highlights, activities, videos, hero_image,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        ON CONFLICT (airport_code) DO UPDATE SET
          city_name = EXCLUDED.city_name,
          country_name = EXCLUDED.country_name,
          country_code = EXCLUDED.country_code,
          themes = EXCLUDED.themes,
          description = EXCLUDED.description,
          highlights = EXCLUDED.highlights,
          activities = EXCLUDED.activities,
          videos = EXCLUDED.videos,
          hero_image = EXCLUDED.hero_image,
          updated_at = NOW()
      `, [
        destination.airport_code.toUpperCase(),
        destination.city,
        destination.country,
        destination.country_code,
        JSON.stringify(destination.themes || {}),
        destination.description || null,
        JSON.stringify(destination.highlights || []),
        JSON.stringify(destination.activities || {}),
        JSON.stringify(destination.videos || {}),
        destination.hero_image || null
      ])

      return NextResponse.json({ 
        ok: true, 
        data: { 
          airport_code: destination.airport_code.toUpperCase(),
          message: 'Destination updated successfully'
        }
      })
    } finally {
      await pg.end()
    }
  } catch (e: any) {
    console.error('Destination update failed:', e)
    return NextResponse.json({ ok: false, error: e?.message || 'Update failed' }, { status: 500 })
  }
}
