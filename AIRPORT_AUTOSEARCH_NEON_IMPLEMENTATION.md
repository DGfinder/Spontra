# Airport Autosearch Implementation - Neon PostgreSQL Migration

## Problem Summary
The airport autosearch is not working because:
- pg module has build/deployment issues in serverless environments
- Database is not populated with real airport data
- Complex dynamic imports causing silent failures

## Solution: Migrate to Neon Serverless Driver
Replace problematic `pg` module with `@neondatabase/serverless` - designed for Next.js/Vercel.

---

## STEP-BY-STEP IMPLEMENTATION

### Step 1: Set up Neon Database (10 minutes)

1. **Go to Vercel Dashboard**
   - Navigate to your project
   - Go to Storage tab
   - Click "Create Database"
   - Select "Neon" 
   - Follow setup wizard

2. **Get Connection String**
   - Copy the `DATABASE_URL` from Neon dashboard
   - Add to Vercel environment variables

3. **Pull Environment Variables Locally**
   ```bash
   cd frontend
   vercel env pull .env.development.local
   ```

### Step 2: Install Neon Driver (2 minutes)

```bash
cd frontend
npm install @neondatabase/serverless
```

### Step 3: Create Airport Schema (5 minutes)

**In Neon SQL Editor**, run this schema:

```sql
-- Create airports table with proper indexes
CREATE TABLE IF NOT EXISTS airports (
    iata_code VARCHAR(3) PRIMARY KEY,
    icao_code VARCHAR(4),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    timezone VARCHAR(50),
    elevation INTEGER,
    url TEXT,
    state VARCHAR(100),
    airport_type VARCHAR(10),
    city_code VARCHAR(5),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create search performance indexes
CREATE INDEX IF NOT EXISTS idx_airports_name ON airports USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_airports_city ON airports USING gin(to_tsvector('english', city));
CREATE INDEX IF NOT EXISTS idx_airports_country ON airports(country);
CREATE INDEX IF NOT EXISTS idx_airports_active ON airports(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_airports_search_combined ON airports(city, name, country) WHERE is_active = true;
```

### Step 4: Update Airport Search API (10 minutes)

**Replace entire `/src/app/api/airports/search/route.ts`:**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getAirportHubInfo, calculateHubScore, getContextualSuggestions } from '@/lib/airlineHubs'

// Simple, clean connection - no more dynamic imports!
const sql = neon(process.env.DATABASE_URL!)

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Airport {
  code: string
  icao_code?: string
  name: string
  city: string
  country: string
  latitude?: number
  longitude?: number
  timezone?: string
  type: 'AIRPORT' | 'CITY'
  importance_score: number
  search_score: number
  hub_info?: {
    airlines: Array<{
      code: string
      name: string
      alliance?: string
      hubType: 'primary' | 'secondary' | 'focus'
      routes: number
    }>
    isHub: boolean
    hubScore: number
  }
}

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  const { searchParams } = new URL(req.url)
  const query = (searchParams.get('q') || '').trim()
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 50)
  
  console.log(`🔍 Airport search: "${query}", limit=${limit}`)

  // Early validation
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      ok: false,
      error: 'Database not configured'
    }, { status: 503 })
  }

  try {
    let airports: Airport[] = []

    if (!query || query.length < 1) {
      // Return popular airports when no query
      console.log('🏆 Returning popular airports')
      const rows = await sql`
        SELECT iata_code, icao_code, name, city, country, latitude, longitude, timezone
        FROM airports 
        WHERE is_active = true 
          AND iata_code = ANY(${['LHR', 'CDG', 'FRA', 'AMS', 'JFK', 'LAX', 'ORD', 'ATL', 'DXB', 'SIN']})
        ORDER BY 
          CASE iata_code 
            WHEN 'LHR' THEN 1 WHEN 'CDG' THEN 2 WHEN 'FRA' THEN 3 
            WHEN 'AMS' THEN 4 WHEN 'JFK' THEN 5 WHEN 'LAX' THEN 6
            WHEN 'ORD' THEN 7 WHEN 'ATL' THEN 8 WHEN 'DXB' THEN 9 WHEN 'SIN' THEN 10
          END
      `
      
      airports = rows.map((row: any) => ({
        code: row.iata_code,
        icao_code: row.icao_code || '',
        name: row.name,
        city: row.city,
        country: row.country,
        latitude: row.latitude ? parseFloat(row.latitude) : undefined,
        longitude: row.longitude ? parseFloat(row.longitude) : undefined,
        timezone: row.timezone || '',
        type: 'AIRPORT' as const,
        importance_score: 100,
        search_score: 1000
      }))

    } else {
      // Search airports by query
      console.log(`🔍 Searching for: "${query}"`)
      
      const searchQuery = `%${query.toLowerCase()}%`
      const rows = await sql`
        SELECT iata_code, icao_code, name, city, country, latitude, longitude, timezone
        FROM airports
        WHERE is_active = true
          AND (
            LOWER(name) LIKE ${searchQuery} OR
            LOWER(city) LIKE ${searchQuery} OR
            LOWER(iata_code) LIKE ${searchQuery} OR
            LOWER(country) LIKE ${searchQuery}
          )
        ORDER BY 
          CASE 
            WHEN LOWER(iata_code) = ${query.toLowerCase()} THEN 1
            WHEN LOWER(name) LIKE ${query.toLowerCase() + '%'} THEN 2
            WHEN LOWER(city) LIKE ${query.toLowerCase() + '%'} THEN 3
            ELSE 4
          END,
          name
        LIMIT ${limit}
      `

      airports = rows.map((row: any) => {
        const airport: Airport = {
          code: row.iata_code,
          icao_code: row.icao_code || '',
          name: row.name,
          city: row.city,
          country: row.country,
          latitude: row.latitude ? parseFloat(row.latitude) : undefined,
          longitude: row.longitude ? parseFloat(row.longitude) : undefined,
          timezone: row.timezone || '',
          type: 'AIRPORT' as const,
          importance_score: 75,
          search_score: 100
        }

        // Add hub info if available
        const hubInfo = getAirportHubInfo(row.iata_code)
        if (hubInfo.length > 0) {
          airport.hub_info = {
            airlines: hubInfo.map(hub => ({
              code: hub.airline,
              name: hub.airlineName,
              alliance: hub.alliance,
              hubType: hub.hubType,
              routes: hub.routes
            })),
            isHub: true,
            hubScore: calculateHubScore(row.iata_code)
          }
        }

        return airport
      })
    }

    const duration = Date.now() - startTime
    console.log(`✅ Found ${airports.length} airports in ${duration}ms`)

    return NextResponse.json({
      ok: true,
      results: airports,
      totalCount: airports.length,
      searchType: query ? 'search' : 'popular',
      performance: { queryTimeMs: duration }
    })

  } catch (error: any) {
    console.error('❌ Airport search error:', error)
    return NextResponse.json({
      ok: false,
      error: 'Airport search failed',
      details: error.message
    }, { status: 500 })
  }
}
```

### Step 5: Clean Up Old Code (5 minutes)

1. **Remove dynamic imports** from all API routes
2. **Update next.config.js** - remove pg webpack configuration:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['cassandra-driver'], // Remove 'pg'
  },
  // Remove the entire webpack configuration for pg
  env: {
    API_BASE_URL: process.env.API_BASE_URL || '',
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || '',
    SEARCH_SERVICE_URL: process.env.SEARCH_SERVICE_URL || '',
    PRICING_SERVICE_URL: process.env.PRICING_SERVICE_URL || '',
  },
}

module.exports = nextConfig
```

### Step 6: Populate Airport Data (5 minutes)

**Create data population script** `scripts/populate_neon_airports.py`:

```python
#!/usr/bin/env python3
import os
import csv
import psycopg2
from urllib.parse import urlparse

# Get DATABASE_URL
database_url = os.environ.get('DATABASE_URL')
if not database_url:
    print("❌ DATABASE_URL not found")
    exit(1)

# Parse connection
url = urlparse(database_url)
conn = psycopg2.connect(
    host=url.hostname,
    port=url.port,
    database=url.path[1:],
    user=url.username,
    password=url.password,
    sslmode='require'
)

print("✅ Connected to Neon database")

# Read and insert airports
csv_path = 'frontend/airports.csv'
with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    
    with conn.cursor() as cur:
        count = 0
        for row in reader:
            if row['code'] and len(row['code']) == 3:
                try:
                    cur.execute("""
                        INSERT INTO airports (iata_code, icao_code, name, city, country, 
                                            latitude, longitude, timezone, elevation, 
                                            url, state, airport_type, city_code)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (iata_code) DO NOTHING
                    """, (
                        row['code'],
                        row['icao'] or None,
                        row['name'],
                        row['city'],
                        row['country'],
                        float(row['latitude']) if row['latitude'] else None,
                        float(row['longitude']) if row['longitude'] else None,
                        row['time_zone'],
                        int(row['elevation']) if row['elevation'] else None,
                        row['url'] or None,
                        row['state'] or None,
                        row['type'],
                        row['city_code'] or None
                    ))
                    count += 1
                except Exception as e:
                    print(f"⚠️  Error inserting {row['code']}: {e}")
        
        conn.commit()
        print(f"✅ Inserted {count} airports successfully")

conn.close()
```

**Run the population script:**
```bash
cd /mnt/c/Users/Hayden/Desktop/Spontra
python scripts/populate_neon_airports.py
```

### Step 7: Test & Deploy (5 minutes)

1. **Test locally:**
   ```bash
   npm run dev
   # Visit http://localhost:3000
   # Test autosearch - type "London", "Paris", "New York"
   ```

2. **Deploy to production:**
   ```bash
   git add .
   git commit -m "Implement Neon PostgreSQL for airport autosearch"
   git push
   ```

3. **Verify in production:**
   - Visit your deployed app
   - Test autosearch with various queries
   - Check `/api/debug/airport-search` for status

---

## Expected Results

✅ **Autosearch works like Skyscanner** with 9,804+ real airports
✅ **Fast search performance** - optimized queries and indexes
✅ **Global airport coverage** - London shows LHR, LGW, STN, LTN, LCY
✅ **No build issues** - serverless-native driver
✅ **Production ready** - reliable, scalable infrastructure

## Timeline
- **Setup Neon**: 10 minutes
- **Install driver**: 2 minutes  
- **Create schema**: 5 minutes
- **Update API**: 10 minutes
- **Clean up**: 5 minutes
- **Populate data**: 5 minutes
- **Deploy & test**: 5 minutes

**Total: 42 minutes to working autosearch**

## Troubleshooting

**Issue: No results in autosearch**
- Check `/api/debug/airport-search` for database status
- Verify DATABASE_URL is set in environment
- Confirm airports table has data: `SELECT COUNT(*) FROM airports;`

**Issue: Build errors**
- Make sure to remove old pg-related webpack config
- Verify @neondatabase/serverless is installed

**Issue: Connection errors**
- Check Neon database is active
- Verify connection string format
- Ensure SSL is enabled (default in Neon)

---

## Next Steps After Implementation

1. **Add search analytics** to track popular queries
2. **Implement caching** for frequently searched airports  
3. **Add autocomplete suggestions** based on search patterns
4. **Expand to include airline data** from your existing sources

---

*This implementation eliminates ALL the pg module issues and provides a production-ready, serverless-native solution that works immediately and scales automatically.*