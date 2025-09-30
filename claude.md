# Spontra - Project Context for Claude

## Project Vision

**Spontra** is a revolutionary spontaneous travel discovery platform that transforms how people find destinations by prioritizing exploration over traditional flight search.

### Unique Value Proposition
- **Time-First Approach**: Users specify flight duration ranges (e.g., 2-4 hours) instead of destinations
- **Activity-Driven Discovery**: Match destinations to user interests (adventure, nightlife, culture, food, shopping)
- **Constellation UI Pattern**: Visual, spatial exploration replacing traditional lists and tables
- **Inspire Before Booking**: YouTube videos and community content to validate destination choices

### Business Model
- **Metasearch/Affiliate Platform**: Multi-provider flight comparison with affiliate commissions
- **Provider Networks**: Impact, CJ, Awin, Partnerize integration
- **Revenue Optimization**: EPC tracking, click-to-conversion funnel, price accuracy monitoring

---

## Tech Stack

### Frontend
- **Framework**: Next.js 15.5+ with App Router
- **React**: Version 19.0.0 (latest stable)
- **TypeScript**: Strict mode enabled, version 5.9+
- **Styling**: Tailwind CSS v4 with @tailwindcss/postcss
- **Forms**: react-hook-form + zod validation + @hookform/resolvers
- **State**: Zustand for global state
- **Data Fetching**: @tanstack/react-query
- **UI Components**: @headlessui/react, @heroicons/react, lucide-react

### Backend (Next.js Integrated)
- **API Routes**: Next.js App Router API routes (`frontend/src/app/api/`)
- **Server Actions**: React Server Actions for data mutations (`frontend/src/actions/`)
- **Database**: Neon PostgreSQL with Prisma ORM (48 models)
- **Architecture**: Serverless functions deployed to Vercel Edge Network

### Database & Caching
- **Primary Database**: PostgreSQL (via Neon serverless @neondatabase/serverless)
- **ORM**: Prisma 6.16+ with 48 models (full schema in `frontend/prisma/schema.prisma`)
- **Caching**:
  - Redis (via @vercel/kv and ioredis)
  - In-app OfferCache table for flight offers
  - Multi-tier caching strategy
- **Cassandra**: cassandra-driver (legacy, may be phased out)

### External APIs
- **Flight Data**: Amadeus Self-Service API
- **Video Content**: YouTube Data API v3
- **Email**: Resend + @react-email/components

### Monitoring & Observability
- **Error Tracking**: Sentry 8.x (@sentry/nextjs)
- **Telemetry**: OpenTelemetry (traces, metrics)
- **Analytics**: @vercel/analytics, @vercel/speed-insights
- **Metrics**: prom-client (Prometheus client)

### Testing
- **Framework**: Vitest 2.1+
- **Coverage**: @vitest/coverage-v8
- **UI Testing**: @vitest/ui
- **Contract Testing**: @pact-foundation/pact
- **Mocking**: MSW (Mock Service Worker)

### Deployment
- **Frontend & API**: Vercel Edge Network (automatic deployments)
- **Infrastructure**: Terraform IaC for cloud resources (infrastructure/)
- **Development**: Docker Compose for local infrastructure services (docker/)

---

## Architecture Patterns

### Next.js App Router Conventions

#### File-Based Routing
```
frontend/src/app/
├── page.tsx                    # Home page (/)
├── layout.tsx                  # Root layout
├── globals.css                 # Global styles
├── dashboard/
│   └── page.tsx               # /dashboard
├── flights/
│   └── page.tsx               # /flights
├── admin/
│   ├── (login)/               # Route group (no path segment)
│   │   └── login/page.tsx    # /admin/login
│   └── (panel)/               # Route group
│       ├── dashboard/page.tsx # /admin/dashboard
│       ├── airports/
│       ├── destinations/
│       └── moderation/
└── api/
    ├── admin/                 # Admin API routes
    └── flights/               # Public API routes
```

#### Server vs Client Components
- **Default: Server Components** - Use unless you need:
  - `useState`, `useEffect`, browser APIs
  - Event handlers (onClick, onChange)
  - Context providers
- **Mark Client with**: `'use client'` directive at top of file
- **Tip**: Keep client boundaries small, pass data from server to client components

#### Server Actions
- **File Convention**: Create in `frontend/src/actions/`
- **Always**: Start with `'use server'` directive
- **Use for**: Database mutations, form submissions, revalidation
- **Return**: Serializable data only (no functions, class instances)
- **Error Handling**: Return `{ success: boolean, error?: string, data?: T }`

```typescript
// frontend/src/actions/destinationActions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/server/db'

export async function updateDestination(id: string, data: DestinationInput) {
  try {
    const destination = await db.destination.update({
      where: { id },
      data: {
        cityName: data.cityName,
        description: data.description,
        // ... snake_case in DB, camelCase in code
      }
    })

    revalidatePath('/admin/destinations')
    return { success: true, data: destination }
  } catch (error) {
    return { success: false, error: 'Failed to update destination' }
  }
}
```

### Path Aliases (TypeScript)
```typescript
// Configured in frontend/tsconfig.json
import Component from '@/components/ui/Button'        // ./src/components/ui/Button
import { useAuth } from '@/hooks/useAuth'             // ./src/hooks/useAuth
import { searchFlights } from '@/lib/amadeus'         // ./src/lib/amadeus
import { db } from '@/server/db'                      // ./src/server/db
import type { Airport } from '@/types/database'       // ./src/types/database
import { formatDate } from '@/utils/date'             // ./src/utils/date
```

### Database Naming Conventions
- **Database columns**: `snake_case` (Prisma schema uses `@map`)
- **TypeScript/JavaScript**: `camelCase`
- **Prisma auto-converts** between them

```typescript
// Prisma schema
model Airport {
  iataCode     String    @id @map("iata_code")
  cityCode     String?   @map("city_code")
  isActive     Boolean?  @map("is_active")
  createdAt    DateTime? @map("created_at")
}

// TypeScript usage
const airport = await db.airport.findUnique({
  where: { iataCode: 'LAX' }  // camelCase in code
})
// DB query: SELECT iata_code FROM airports WHERE iata_code = 'LAX'
```

---

## Directory Structure

### Frontend Source Structure
```
frontend/src/
├── actions/              # Server Actions (mutations)
│   ├── destinationActions.ts
│   ├── airportActions.ts
│   └── exploreActions.ts
├── app/                  # Next.js App Router
│   ├── page.tsx         # Home page
│   ├── layout.tsx       # Root layout
│   ├── dashboard/
│   ├── flights/
│   ├── admin/           # Admin panel
│   │   ├── (login)/
│   │   └── (panel)/
│   └── api/             # API routes
│       └── admin/       # Admin API endpoints
├── components/          # React components
│   ├── ui/              # Generic UI components
│   ├── admin/           # Admin-specific components
│   ├── flights/         # Flight search components
│   └── explore/         # Destination explore components
├── config/              # Configuration files
├── contexts/            # React Context providers
├── data/                # Static data files
├── emails/              # React Email templates
├── hooks/               # Custom React hooks
├── lib/                 # Business logic & utilities
│   ├── amadeus.ts       # Amadeus API client
│   ├── auth.ts          # Authentication utilities
│   ├── cache.ts         # Caching utilities
│   └── validations.ts   # Zod schemas
├── middleware.ts        # Next.js middleware (auth, etc.)
├── server/              # Server-side code
│   ├── db.ts            # Prisma client singleton
│   └── services/        # Business logic services
├── services/            # API service clients
├── store/               # Zustand stores
├── types/               # TypeScript type definitions
├── utils/               # Pure utility functions
└── workers/             # Background workers

frontend/
├── prisma/              # Database
│   ├── schema.prisma    # Database schema (48 models)
│   ├── migrations/      # Migration history
│   └── seed.ts          # Database seeding
├── public/              # Static assets
├── scripts/             # Build/deploy scripts
│   ├── create-admin-user.ts
│   ├── test-metasearch.ts
│   └── synthetic-monitor-cron.ts
└── tests/               # Test files
    ├── integration/
    └── performance/
```

### Root Project Structure
```
Spontra/
├── services/            # Go microservices
│   ├── user-service/
│   ├── search-service/
│   ├── pricing-service/
│   └── data-ingestion-service/
├── frontend/            # Next.js application
├── infrastructure/      # Terraform IaC
├── docker/              # Docker configurations
├── k8s/                 # Kubernetes manifests
├── monitoring/          # Monitoring configs
├── scripts/             # Project-level scripts
├── shared/              # Shared code/configs
└── tools/               # Development tools
```

---

## Database Schema (Prisma)

### Key Models (48 total)

#### Core Travel Data
```prisma
model Airport {
  iataCode     String    @id @map("iata_code")     // "LAX", "JFK"
  name         String
  city         String
  country      String
  latitude     Decimal?
  longitude    Decimal?
  isActive     Boolean?  @default(true)

  originFlights      FlightRoute[] @relation("OriginAirport")
  destinationFlights FlightRoute[] @relation("DestinationAirport")
  destinations       Destination[]
}

model FlightRoute {
  originAirportCode         String
  destinationAirportCode    String
  totalDurationMinutes      Int

  originAirport      Airport @relation("OriginAirport")
  destinationAirport Airport @relation("DestinationAirport")

  @@unique([originAirportCode, destinationAirportCode])
  @@index([totalDurationMinutes])
}

model Destination {
  id               String   @id @default(uuid())
  airportCode      String   @unique
  cityName         String
  countryName      String
  description      String?
  imageUrl         String?
  activities       Json?        // Array of activity objects
  popularityScore  Decimal?
  climateInfo      Json?        // Climate data object

  airport              Airport
  themeDestinations    ThemeDestination[]
  pois                 POI[]
}

model ThemeDestination {
  theme         String              // "adventure", "nightlife", "culture"
  airportCode   String
  themeScore    Decimal?
  flightTimeRange String?           // "2-4", "4-6"
  originAirport String?

  destination   Destination
  reels         Reel[]              // Video content

  @@unique([theme, airportCode, originAirport])
  @@index([theme])
}
```

#### User Management
```prisma
model User {
  id                   String              @id @default(uuid())
  email                String              @unique
  passwordHash         String              @map("password_hash")
  role                 UserRole            @default(user)  // user | admin | moderator | creator
  isEmailVerified      Boolean             @default(false)
  preferences          Json?

  sessions             UserSession[]
  searchHistory        SearchHistory[]
  userContent          UserContent[]
  creatorProfile       CreatorProfile?
}

model UserSession {
  id           String    @id @default(uuid())
  userId       String
  sessionToken String    @unique
  expiresAt    DateTime

  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([sessionToken])
  @@index([expiresAt])
}
```

#### Metasearch Core
```prisma
model Provider {
  id                String   @id @default(cuid())
  providerId        String       // 'expedia', 'kayak', 'QF', 'BA'
  market            String       // 'AU', 'NZ', 'SG'
  network           String       // 'impact', 'cj', 'awin'
  reliabilityScore  Float    @default(0.8)
  expectedEPC       Float    @default(0.0)     // Expected earnings per click
  isActive          Boolean  @default(true)

  template          LinkTemplate?
  clicks            Click[]
  conversions       Conversion[]

  @@unique([providerId, market])
  @@index([market, isActive])
}

model Click {
  id           String   @id @default(cuid())
  clickId      String   @unique
  providerId   String
  offerId      String
  priceShown   Decimal
  currency     String
  market       String
  landed200    Boolean  @default(false)     // Successfully landed on provider

  provider     Provider
  conversions  Conversion[]

  @@index([providerId, market, createdAt])
}

model Conversion {
  id          String   @id @default(cuid())
  clickId     String
  status      String       // 'APPROVED' | 'PENDING' | 'REJECTED'
  commission  Decimal
  saleAmount  Decimal?

  click       Click    @relation(fields: [clickId], references: [clickId])
  provider    Provider

  @@index([status, createdAt])
}
```

#### Caching
```prisma
model OfferCache {
  id            String   @id @default(cuid())
  queryHash     String   @db.VarChar(64)
  market        String
  query         Json         // NormalizedQuery
  offers        Json         // FlightOffer[]
  offerCount    Int
  dataSource    String   @default("amadeus")
  isStale       Boolean  @default(false)
  expiresAt     DateTime

  @@index([queryHash])
  @@index([expiresAt, isStale])
}

model VideoCache {
  id               String   @id @default(uuid())
  cityName         String
  theme            String
  videoData        Json         // Complete YouTube video metadata
  youtubeId        String?
  qualityScore     Decimal?

  @@index([cityName, theme])
}
```

#### Analytics & Monitoring
```prisma
model SearchHistory {
  userId           String?
  origin           String?
  theme            String?
  flightTimeRange  String?
  resultCount      Int
  clickedResult    String?
  searchedAt       DateTime @default(now())

  @@index([theme])
  @@index([searchedAt])
}

model SyntheticCheck {
  providerId      String
  market          String
  statusCode      Int?
  responseTimeMs  Int?
  finalHost       String?
  isHealthy       Boolean  @default(true)
  checkedAt       DateTime @default(now())

  @@index([providerId, market, checkedAt])
}

model PriceAccuracy {
  providerId        String
  offerId           String
  originalPrice     Decimal
  repricedPrice     Decimal?
  priceChanged      Boolean  @default(false)
  percentageChange  Decimal?

  @@index([priceChanged, checkedAt])
}
```

### Important Enums
```prisma
enum ActivityType {
  activities | shopping | restaurants | nature | culture |
  nightlife | beaches | sightseeing | adventure | relaxation
}

enum UserRole {
  user | admin | moderator | creator
}

enum BudgetLevel {
  budget | mid_range | luxury | any
}

enum NotificationType {
  price_alert | system | marketing | creator_program
}
```

---

## Development Workflows

### Database Operations
```bash
# Frontend (where Prisma lives)
cd frontend

# Generate Prisma Client (after schema changes)
npm run db:generate

# Create migration (development)
npm run db:migrate

# Apply migrations (production)
npm run db:migrate:deploy

# View database in browser
npm run db:studio

# Seed database
npm run db:seed

# Check migration status
npm run db:migrate:status
```

### Admin User Management
```bash
# Create admin user
npm run admin:create

# Update existing user to admin
npm run admin:update

# List all admin users
npm run admin:list

# Delete admin user
npm run admin:delete
```

### Testing
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Integration tests
npm run test:integration

# Performance tests
npm run test:performance

# Contract tests (API contracts)
npm run test:contracts

# User journey tests
npm run test:user-journey

# With coverage
npm run test:coverage

# UI mode (browser)
npm run test:ui
```

### Metasearch Operations
```bash
# Seed metasearch providers
npm run metasearch:seed

# Test metasearch functionality
npm run metasearch:test

# Run synthetic monitoring
npm run monitor:synthetic

# Check daily ops dashboard
npm run ops:daily

# Critical issues only
npm run ops:critical

# Performance regressions
npm run ops:regressions

# Triage report
npm run ops:triage
```

### Validation & Pre-launch
```bash
# Run all pre-launch validations
npm run validation:all

# Test postback signatures
npm run validation:postback

# Test click idempotency
npm run validation:clicks

# Test reprice gates
npm run validation:reprice
```

### Performance
```bash
# Lighthouse audit
npm run perf:audit

# Lighthouse CI
npm run perf:ci

# Bundle size check
npm run bundle:size

# Analyze bundle (with ANALYZE=true)
npm run analyze

# Audit RSC boundaries
npm run perf:audit-rsc
```

### Operations
```bash
# Nightly reconciliation
npm run ops:reconcile

# Data hygiene (cleanup)
npm run hygiene:nightly

# Hygiene report only
npm run hygiene:report

# Dry run (no changes)
npm run hygiene:dry-run
```

---

## Authentication Patterns

### JWT with jose
```typescript
// frontend/src/lib/auth.ts
import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function createToken(payload: { userId: string, role: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch {
    return null
  }
}
```

### Middleware Protection
```typescript
// frontend/src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value

  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}
```

---

## Form Handling Patterns

### react-hook-form + zod
```typescript
// frontend/src/lib/validations.ts
import { z } from 'zod'

export const destinationSchema = z.object({
  cityName: z.string().min(2, 'City name required'),
  countryName: z.string().min(2, 'Country name required'),
  airportCode: z.string().length(3, 'Must be 3-letter IATA code').regex(/^[A-Z]{3}$/),
  description: z.string().optional(),
  popularityScore: z.number().min(0).max(10).optional(),
})

export type DestinationInput = z.infer<typeof destinationSchema>
```

```typescript
// frontend/src/components/admin/DestinationForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { destinationSchema, type DestinationInput } from '@/lib/validations'
import { updateDestination } from '@/actions/destinationActions'

export function DestinationForm({ destination }: { destination: Destination }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<DestinationInput>({
    resolver: zodResolver(destinationSchema),
    defaultValues: destination
  })

  const onSubmit = async (data: DestinationInput) => {
    const result = await updateDestination(destination.id, data)
    if (!result.success) {
      alert(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('cityName')} />
      {errors.cityName && <span>{errors.cityName.message}</span>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}
```

---

## Caching Strategy

### Multi-Tier Caching
1. **Redis (Vercel KV)**: Short-term, volatile data (5-15 minutes)
2. **OfferCache Table**: Deduplicated flight offers (30 minutes)
3. **Next.js Cache**: Static/ISR pages, Server Component output
4. **CDN**: Static assets (immutable, 1 year)

### Caching Best Practices
```typescript
// frontend/src/lib/cache.ts
import { kv } from '@vercel/kv'
import { db } from '@/server/db'
import crypto from 'crypto'

export async function getCachedOffers(query: NormalizedQuery) {
  const queryHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(query))
    .digest('hex')

  // Check Redis first (fastest)
  const cached = await kv.get(`offers:${queryHash}`)
  if (cached) return cached

  // Check database cache
  const dbCache = await db.offerCache.findFirst({
    where: {
      queryHash,
      expiresAt: { gt: new Date() },
      isStale: false
    }
  })

  if (dbCache) {
    // Populate Redis for next request
    await kv.setex(`offers:${queryHash}`, 900, dbCache.offers) // 15 min
    return dbCache.offers
  }

  // Cache miss - fetch from Amadeus
  const offers = await fetchFromAmadeus(query)

  // Store in both caches
  await Promise.all([
    kv.setex(`offers:${queryHash}`, 900, offers),
    db.offerCache.create({
      data: {
        queryHash,
        query,
        offers,
        offerCount: offers.length,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 min
      }
    })
  ])

  return offers
}
```

### Revalidation Patterns
```typescript
// In Server Actions
import { revalidatePath, revalidateTag } from 'next/cache'

// Revalidate specific page
revalidatePath('/admin/destinations')

// Revalidate all pages under path
revalidatePath('/admin/destinations', 'layout')

// Revalidate by cache tag
revalidateTag('destinations')
```

```typescript
// In fetch calls
const res = await fetch('https://api.example.com/data', {
  next: {
    revalidate: 3600, // Revalidate every hour
    tags: ['destinations'] // For revalidateTag()
  }
})
```

---

## Error Handling Patterns

### Server Actions Error Handling
```typescript
'use server'

import { db } from '@/server/db'
import * as Sentry from '@sentry/nextjs'

export async function dangerousAction(data: unknown) {
  try {
    // Validate input
    const validated = schema.parse(data)

    // Perform operation
    const result = await db.model.create({ data: validated })

    return { success: true, data: result }
  } catch (error) {
    // Log to Sentry
    Sentry.captureException(error, {
      tags: { action: 'dangerousAction' },
      extra: { input: data }
    })

    // Return user-friendly error
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' }
    }

    return { success: false, error: 'An unexpected error occurred' }
  }
}
```

### API Route Error Handling
```typescript
// frontend/src/app/api/admin/destinations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export async function GET(request: NextRequest) {
  try {
    const destinations = await db.destination.findMany()
    return NextResponse.json({ success: true, data: destinations })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch destinations' },
      { status: 500 }
    )
  }
}
```

### Client Component Error Boundaries
```typescript
// frontend/src/app/error.tsx (route segment error boundary)
'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

---

## Performance Optimization

### Bundle Size Budgets
```json
// package.json
{
  "bundlesize": [
    {
      "path": ".next/static/js/pages/index.js",
      "maxSize": "120 kB",
      "compression": "gzip"
    },
    {
      "path": ".next/static/js/pages/flights.js",
      "maxSize": "150 kB"
    },
    {
      "path": ".next/static/js/pages/booking.js",
      "maxSize": "180 kB"
    }
  ]
}
```

### Code Splitting (next.config.ts)
```typescript
// Already configured with optimal chunks:
// - react: React + ReactDOM
// - ui-libs: @headlessui, @heroicons, lucide-react
// - forms: react-hook-form, zod
// - state: zustand
// - date-utils: date-fns
// - vendors: other node_modules
```

### Image Optimization
```typescript
// Use Next.js Image component
import Image from 'next/image'

<Image
  src="/images/destination.jpg"
  alt="Destination"
  width={1920}
  height={1080}
  quality={80}
  priority={false}  // Only true for above-the-fold
  placeholder="blur"
  blurDataURL="data:image/..."
/>
```

### React 19 Optimizations
- **Already configured** in next.config.ts
- Automatic JSX runtime optimizations
- Enhanced split chunks for React 19
- `optimizePackageImports` for @heroicons, @headlessui, lucide-react

---

## Security Best Practices

### Input Validation
```typescript
// ALWAYS validate with Zod before database operations
import { z } from 'zod'

const userInputSchema = z.object({
  email: z.string().email(),
  airportCode: z.string().length(3).regex(/^[A-Z]{3}$/),
  date: z.coerce.date().min(new Date())
})

// In Server Actions
export async function handleUserInput(rawInput: unknown) {
  const validated = userInputSchema.parse(rawInput) // Throws on invalid
  // Now safe to use validated data
}
```

### SQL Injection Prevention
- **Use Prisma exclusively** - automatically parameterizes queries
- **Never** use raw SQL with user input
- If raw SQL needed, use parameterized queries:

```typescript
// SAFE
await db.$queryRaw`SELECT * FROM airports WHERE iata_code = ${userInput}`

// UNSAFE - DO NOT USE
await db.$queryRawUnsafe(`SELECT * FROM airports WHERE iata_code = '${userInput}'`)
```

### Environment Variables
- **Never commit** `.env` files
- Use `.env.example` for documentation
- **Prefix client vars** with `NEXT_PUBLIC_`
- Access server vars only in Server Components/Actions

```typescript
// Server-only (safe)
const apiKey = process.env.AMADEUS_API_KEY

// Client-accessible (public)
const publicUrl = process.env.NEXT_PUBLIC_API_URL
```

### Admin Authentication
- **Always check role** in Server Actions
- Middleware protects routes, but **also check in actions**

```typescript
'use server'

import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function adminOnlyAction() {
  const token = (await cookies()).get('auth_token')?.value
  const payload = await verifyToken(token)

  if (!payload || payload.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  // Proceed with admin operation
}
```

---

## Common Patterns & Best Practices

### When to Use Server Actions vs API Routes

**Use Server Actions for:**
- Form submissions
- Database mutations
- Simple data fetching for Server Components
- Operations triggered by user interactions

**Use API Routes for:**
- Webhooks (external services calling your app)
- Third-party integrations
- RESTful API for external clients
- Operations needing custom HTTP status codes
- Metasearch postback endpoints

### Amadeus API Integration

```typescript
// frontend/src/lib/amadeus.ts
import axios from 'axios'

let cachedToken: { value: string, expiresAt: number } | null = null

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value
  }

  const response = await axios.post(
    'https://api.amadeus.com/v1/security/oauth2/token',
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.AMADEUS_API_KEY!,
      client_secret: process.env.AMADEUS_API_SECRET!
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  )

  cachedToken = {
    value: response.data.access_token,
    expiresAt: Date.now() + (response.data.expires_in * 1000) - 60000 // 1min buffer
  }

  return cachedToken.value
}

export async function searchFlights(params: FlightSearchParams) {
  const token = await getAccessToken()

  try {
    const response = await axios.get(
      'https://api.amadeus.com/v2/shopping/flight-offers',
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          originLocationCode: params.origin,
          destinationLocationCode: params.destination,
          departureDate: params.departureDate,
          adults: params.adults,
          currencyCode: 'EUR',
          max: 50
        }
      }
    )

    return response.data.data
  } catch (error) {
    // Handle rate limiting (429)
    if (error.response?.status === 429) {
      // Implement exponential backoff
      throw new Error('Rate limited - retry later')
    }
    throw error
  }
}
```

**Rate Limits**: Amadeus Free Tier = 2 requests/second
- **Use caching aggressively**
- Cache flight offers for 30+ minutes
- Deduplicate requests with queryHash

### Metasearch Click Tracking

```typescript
// Click generation (before user clicks to provider)
'use server'

export async function generateClickId(offerId: string, providerId: string) {
  const clickId = `${providerId}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`

  await db.click.create({
    data: {
      clickId,
      providerId,
      offerId,
      priceShown: offer.price,
      currency: offer.currency,
      market: 'AU',
      sessionId: getSessionId()
    }
  })

  return clickId
}

// Landed page (user arrives from provider)
// frontend/src/app/landed/page.tsx
export default async function LandedPage({ searchParams }: { searchParams: { clickId: string } }) {
  if (searchParams.clickId) {
    await db.click.update({
      where: { clickId: searchParams.clickId },
      data: { landed200: true }
    })
  }

  return <div>Thank you for booking!</div>
}
```

### Zustand State Management

```typescript
// frontend/src/store/searchStore.ts
import { create } from 'zustand'

interface SearchState {
  origin: string | null
  theme: string | null
  flightTimeRange: [number, number] | null
  setOrigin: (origin: string) => void
  setTheme: (theme: string) => void
  setFlightTimeRange: (range: [number, number]) => void
  reset: () => void
}

export const useSearchStore = create<SearchState>((set) => ({
  origin: null,
  theme: null,
  flightTimeRange: null,
  setOrigin: (origin) => set({ origin }),
  setTheme: (theme) => set({ theme }),
  setFlightTimeRange: (range) => set({ flightTimeRange: range }),
  reset: () => set({ origin: null, theme: null, flightTimeRange: null })
}))
```

```typescript
// In a Client Component
'use client'

import { useSearchStore } from '@/store/searchStore'

export function SearchForm() {
  const { origin, setOrigin } = useSearchStore()

  return (
    <input
      value={origin ?? ''}
      onChange={(e) => setOrigin(e.target.value)}
    />
  )
}
```

---

## Common Pitfalls & How to Avoid

### ❌ Don't: Use client state for data that should be in URL
```typescript
// BAD - state lost on refresh
const [selectedTheme, setSelectedTheme] = useState('adventure')
```

```typescript
// GOOD - state persisted in URL
'use client'
import { useRouter, useSearchParams } from 'next/navigation'

const searchParams = useSearchParams()
const router = useRouter()
const theme = searchParams.get('theme') ?? 'adventure'

function setTheme(newTheme: string) {
  const params = new URLSearchParams(searchParams)
  params.set('theme', newTheme)
  router.push(`?${params.toString()}`)
}
```

### ❌ Don't: Forget to revalidate after mutations
```typescript
// BAD - UI won't update
export async function updateDestination(id: string, data: DestinationInput) {
  await db.destination.update({ where: { id }, data })
  return { success: true }
}
```

```typescript
// GOOD
import { revalidatePath } from 'next/cache'

export async function updateDestination(id: string, data: DestinationInput) {
  await db.destination.update({ where: { id }, data })
  revalidatePath('/admin/destinations')
  return { success: true }
}
```

### ❌ Don't: Use `useState` in Server Components
```typescript
// BAD - will error
export default function ServerComponent() {
  const [count, setCount] = useState(0) // ❌ Error
}
```

```typescript
// GOOD - mark as client component
'use client'

export default function ClientComponent() {
  const [count, setCount] = useState(0) // ✅ Works
}
```

### ❌ Don't: Import Server-only code in Client Components
```typescript
// BAD - will bundle Prisma in client
'use client'
import { db } from '@/server/db' // ❌ Server-only

export function ClientComponent() {
  // Can't use db here
}
```

```typescript
// GOOD - use Server Action
'use client'

import { fetchData } from '@/actions/dataActions' // Server Action

export function ClientComponent() {
  async function handleClick() {
    const data = await fetchData() // ✅ Calls server
  }
}
```

### ❌ Don't: Hardcode API URLs
```typescript
// BAD
const response = await fetch('http://localhost:3000/api/flights')
```

```typescript
// GOOD - use environment variables
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ''
const response = await fetch(`${baseUrl}/api/flights`)
```

### ❌ Don't: Return non-serializable data from Server Actions
```typescript
// BAD - functions can't be serialized
export async function getData() {
  return {
    date: new Date(), // ❌ Date object
    callback: () => {} // ❌ Function
  }
}
```

```typescript
// GOOD - return plain objects
export async function getData() {
  return {
    date: new Date().toISOString(), // ✅ String
    timestamp: Date.now() // ✅ Number
  }
}
```

---

## Testing Patterns

### Vitest Setup
```typescript
// frontend/vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

### Integration Tests
```typescript
// frontend/tests/integration/destination-explore.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '@/server/db'
import { exploreDestinations } from '@/actions/exploreActions'

describe('Destination Explore', () => {
  beforeAll(async () => {
    // Seed test data
    await db.destination.createMany({
      data: [
        { airportCode: 'LAX', cityName: 'Los Angeles', countryName: 'USA' },
        { airportCode: 'JFK', cityName: 'New York', countryName: 'USA' }
      ]
    })
  })

  it('should return destinations within flight time range', async () => {
    const result = await exploreDestinations({
      origin: 'SFO',
      minHours: 2,
      maxHours: 4,
      theme: 'adventure'
    })

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.data.length).toBeGreaterThan(0)
  })
})
```

### Contract Testing (Amadeus API)
```typescript
// frontend/tests/integration/amadeus-contract.test.ts
import { describe, it, expect } from 'vitest'
import { searchFlights } from '@/lib/amadeus'

describe('Amadeus API Contract', () => {
  it('should return flight offers with expected shape', async () => {
    const offers = await searchFlights({
      origin: 'LAX',
      destination: 'JFK',
      departureDate: '2025-12-01',
      adults: 1
    })

    expect(offers).toBeInstanceOf(Array)
    expect(offers[0]).toHaveProperty('id')
    expect(offers[0]).toHaveProperty('price')
    expect(offers[0]).toHaveProperty('itineraries')
    expect(offers[0].price).toHaveProperty('total')
    expect(offers[0].price).toHaveProperty('currency')
  })
})
```

---

## Documentation & Resources

### Internal Documentation
- **README.md**: Project overview and quick start
- **docs/architecture.md**: Architecture deep dive
- **docs/development.md**: Development setup guide
- **docs/deployment.md**: Deployment instructions
- **docs/ADMIN_PANEL_QUICKSTART.md**: Admin panel guide
- **docs/ADMIN_PANEL_CHEATSHEET.md**: Quick reference
- **SECURITY_GUIDELINES.md**: Security best practices
- **frontend/CACHE_STRATEGY.md**: Caching implementation details
- **frontend/GO_LIVE_CHECKLIST.md**: Pre-launch checklist

### Key Implementation Notes
- **CORE_SEARCH_CACHING_STRATEGY.md**: Search caching details
- **AMADEUS_TEST_REPORT.md**: Amadeus integration learnings
- **DATA_POPULATION_STRATEGY.md**: How destination data is populated
- **FUTURE_TODO.md**: Planned features and improvements

---

## Quick Reference Commands

```bash
# Development
cd frontend && npm run dev               # Start dev server

# Database
npm run db:migrate                       # Create & apply migration
npm run db:studio                        # Open Prisma Studio
npm run db:seed                          # Seed database

# Admin
npm run admin:create                     # Create admin user

# Testing
npm test                                 # Run tests
npm run test:integration                # Integration tests
npm run test:coverage                   # With coverage

# Deployment
npm run build                           # Production build
npm start                               # Start production server

# Operations
npm run ops:daily                       # Daily ops dashboard
npm run monitor:synthetic              # Run synthetic checks
npm run validation:all                 # Pre-launch validation

# Performance
npm run analyze                         # Bundle analysis
npm run perf:audit                     # Lighthouse audit
```

---

## Final Notes

### Project Maturity
- **Production-ready** frontend with comprehensive monitoring
- **Go services** present but frontend can operate standalone via Amadeus API
- **Active development** on metasearch optimization and creator program

### Code Quality Standards
- **TypeScript strict mode** - no any types
- **Prisma** - all database access
- **Zod** - all input validation
- **Error boundaries** - comprehensive error handling
- **Sentry** - error tracking in production
- **Vitest** - tests for critical paths

### When Working on This Project
1. **Always** read relevant docs in `docs/` directory first
2. **Check** existing patterns before creating new ones
3. **Validate** all user input with Zod
4. **Revalidate** cache after mutations
5. **Test** locally with `npm test`
6. **Monitor** Sentry for errors after deployment
7. **Use** existing npm scripts for operations
8. **Keep** Server/Client boundaries clear
9. **Cache** Amadeus responses aggressively
10. **Track** metasearch clicks for revenue attribution

### Performance Targets
- **First Contentful Paint**: < 1.8s
- **Time to Interactive**: < 3.8s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Bundle Size**: See bundlesize config in package.json

---

**This is a comprehensive, production-ready platform. Take time to understand patterns before making changes. When in doubt, check existing implementations or ask for clarification.**