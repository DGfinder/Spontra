# Spontra - Project Context for Claude

**Last Updated**: October 2025
**Current Status**: Ultra-MVP with modern 2025 dependencies

---

## Project Vision

**Spontra** is a spontaneous travel discovery platform that transforms how people find destinations by prioritizing exploration over traditional flight search.

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

## Tech Stack (2025 Latest)

### Core Framework
- **Next.js** 15.5.4 (App Router, React Server Components)
- **React** 19.1.0 (latest stable with enhanced RSC)
- **TypeScript** 5.9.2 (strict mode)
- **Node.js** 22.x (Recommended for Next.js 15)

### Styling
- **Tailwind CSS** 4.0.0 (stable, CSS-first configuration)
- **@tailwindcss/postcss** 4.0.0 (unified plugin)
- **lightningcss** 1.30.2 (native CSS processing)
- **PostCSS** 8.4.47

### Forms & Validation
- **react-hook-form** 7.63.0 (form state management)
- **Zod** 4.1.11 (schema validation)
- **@hookform/resolvers** 3.9.1 (Zod integration)

### State Management
- **Zustand** 5.0.8 (lightweight, no boilerplate)
- **React Context** (for auth, theme)

### Database & ORM
- **Neon PostgreSQL** (serverless, Vercel-integrated)
- **Prisma** 6.16.0 (Rust-free engine, GA)
- **@prisma/client** 6.16.0
- **@neondatabase/serverless** 0.10.2

### Caching
- **Vercel KV** (@vercel/kv 3.0.0) - Redis-backed edge cache
- **Prisma OfferCache table** - Flight offer deduplication
- **Next.js Cache** - ISR and Server Component caching

### External APIs
- **Amadeus Self-Service API** - Flight data (2 req/sec free tier)
- **YouTube Data API v3** - Video content
- **Resend** - Transactional email (planned)

### Authentication
- **jose** 5.9.6 (JWT signing/verification)
- **bcryptjs** 2.4.3 (password hashing)

### Utilities
- **axios** 1.7.9 (HTTP client)
- **uuid** 13.0.0 (built-in TS types)
- **clsx** 2.1.1 (classname utility)
- **tailwind-merge** 2.5.5 (Tailwind class merging)
- **lucide-react** 0.460.0 (icon library)
- **effect** 3.18.1 (functional effects library)

### Deployment & Monitoring
- **Vercel** (Edge Network, automatic deployments)
- **@vercel/analytics** 1.4.1
- **@vercel/speed-insights** 1.1.0
- **Sentry** (planned - error tracking)

---

## Architecture

### Simplified Monolith (Current)

```
Next.js Application (Vercel Serverless)
├── Frontend (React 19.1 + Tailwind v4)
├── API Routes (Next.js /api routes)
├── Server Actions (React Server Actions)
├── Database (Neon PostgreSQL + Prisma)
└── External APIs (Amadeus, YouTube)
```

**Key Decisions:**
- **No separate backend services** - Next.js handles everything
- **Serverless-first** - Runs on Vercel Edge + Serverless Functions
- **Neon for database** - Serverless Postgres, auto-scaling
- **Prisma for ORM** - Type-safe, great DX

### When to Split (Future)
Consider microservices only when:
- Background jobs exceed serverless limits (use Vercel Cron or BullMQ first)
- Need polyglot services (different languages)
- Team grows beyond 15 engineers
- You're hitting 100k+ concurrent users

---

## Directory Structure

### Project Root
```
Spontra/
├── frontend/            # Next.js application (main codebase)
├── docker/              # Docker configs (local dev only)
├── infrastructure/      # Terraform (legacy, may remove)
├── k8s/                 # Kubernetes (legacy, may remove)
├── package.json         # Monorepo root (workspaces)
└── CLAUDE.md            # This file
```

### Frontend Structure
```
frontend/
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── page.tsx       # Home page (Explore UI)
│   │   ├── layout.tsx     # Root layout
│   │   ├── globals.css    # Tailwind v4 imports + CSS vars
│   │   ├── global-error.tsx
│   │   └── api/           # API routes
│   │       └── search/    # Flight search endpoint
│   ├── components/        # React components
│   │   ├── ui/            # Button, Input, etc.
│   │   └── SearchForm.tsx # Main search interface
│   ├── lib/               # Utilities & business logic
│   │   ├── db.ts          # Prisma client singleton
│   │   ├── store.ts       # Zustand stores
│   │   └── validations.ts # Zod schemas (if needed)
│   ├── types/             # TypeScript types
│   └── middleware.ts      # Next.js middleware (auth)
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Migration history
│   └── seed.ts            # Database seeding
├── public/                # Static assets
├── .env.local             # Local environment variables
├── .eslintrc.json         # ESLint config
├── next.config.ts         # Next.js configuration
├── postcss.config.js      # PostCSS + Tailwind v4
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies
```

---

## Database Schema (Prisma)

### Core Models

#### Airports & Flight Routes
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
  originAirportCode         String   @map("origin_airport_code")
  destinationAirportCode    String   @map("destination_airport_code")
  totalDurationMinutes      Int      @map("total_duration_minutes")

  originAirport      Airport @relation("OriginAirport", fields: [originAirportCode], references: [iataCode])
  destinationAirport Airport @relation("DestinationAirport", fields: [destinationAirportCode], references: [iataCode])

  @@unique([originAirportCode, destinationAirportCode])
  @@index([totalDurationMinutes])
}
```

#### Destinations
```prisma
model Destination {
  id               String   @id @default(uuid())
  airportCode      String   @unique @map("airport_code")
  cityName         String   @map("city_name")
  countryName      String   @map("country_name")
  description      String?
  imageUrl         String?  @map("image_url")
  popularityScore  Decimal? @map("popularity_score")

  airport Airport @relation(fields: [airportCode], references: [iataCode])
}
```

#### User Management
```prisma
model User {
  id                   String   @id @default(uuid())
  email                String   @unique
  passwordHash         String   @map("password_hash")
  role                 UserRole @default(user)
  isEmailVerified      Boolean  @default(false) @map("is_email_verified")
  createdAt            DateTime @default(now()) @map("created_at")
}

enum UserRole {
  user
  admin
  moderator
}
```

### Database Naming Conventions
- **Database columns**: `snake_case` (Prisma `@map` directive)
- **TypeScript/JavaScript**: `camelCase`
- Prisma automatically converts between them

**Example:**
```typescript
// In code (camelCase)
const destination = await db.destination.create({
  data: {
    airportCode: 'LAX',    // camelCase
    cityName: 'Los Angeles',
    popularityScore: 9.5
  }
})

// In database (snake_case)
// INSERT INTO destinations (airport_code, city_name, popularity_score) ...
```

---

## Next.js App Router Patterns

### Server vs Client Components

**Default: Server Components**
- No `'use client'` needed
- Can access database directly
- Async by default
- Better performance (less JS shipped)

**Client Components** (add `'use client'`)
Use when you need:
- `useState`, `useEffect`, browser APIs
- Event handlers (`onClick`, `onChange`)
- Context providers (`useContext`)
- Zustand stores

**Best Practice**: Keep client boundaries small
```tsx
// Server Component (default)
export default async function Page() {
  const data = await db.destination.findMany() // ✅ Direct DB access

  return <ClientForm data={data} /> // Pass data to client
}

// Client Component
'use client'
export function ClientForm({ data }) {
  const [selected, setSelected] = useState(null) // ✅ Client hooks
  return <form>...</form>
}
```

### Server Actions

Create in separate files or inline with `'use server'` directive:

```typescript
// app/actions/destinations.ts
'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

export async function updateDestination(id: string, data: { cityName: string }) {
  try {
    const destination = await db.destination.update({
      where: { id },
      data: { cityName: data.cityName }
    })

    revalidatePath('/destinations') // Revalidate cached page
    return { success: true, data: destination }
  } catch (error) {
    return { success: false, error: 'Update failed' }
  }
}
```

**Call from Client Component:**
```tsx
'use client'

import { updateDestination } from '@/app/actions/destinations'

export function Form() {
  async function handleSubmit(formData: FormData) {
    const result = await updateDestination(id, {
      cityName: formData.get('cityName') as string
    })

    if (result.success) {
      // Success
    }
  }

  return <form action={handleSubmit}>...</form>
}
```

### Caching & Revalidation

```typescript
// Revalidate specific path
revalidatePath('/destinations')

// Revalidate layout + all pages under it
revalidatePath('/destinations', 'layout')

// Revalidate by tag
revalidateTag('destinations')

// In fetch calls
const res = await fetch('https://api.example.com/data', {
  next: {
    revalidate: 3600, // Revalidate every hour
    tags: ['destinations']
  }
})
```

---

## Tailwind CSS v4 (2025)

### Migration Completed ✅

**What Changed:**
- No more `tailwind.config.js` / `tailwind.config.ts`
- CSS-first configuration using `@import` and CSS variables
- Unified PostCSS plugin: `@tailwindcss/postcss`
- Faster builds (5x full, 100x+ incremental)

### Configuration

**postcss.config.js:**
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {}
  }
}
```

**globals.css:**
```css
@import "tailwindcss";

:root {
  /* Custom CSS variables */
  --color-brand-blue: #3b82f6;
  --color-brand-purple: #8b5cf6;
}

/* Custom utilities using @utility */
@utility container-custom {
  max-width: 1280px;
  margin-inline: auto;
  padding-inline: 1rem;
}
```

**Usage in Components:**
```tsx
<div className="bg-brand-blue text-white p-4 container-custom">
  Content
</div>
```

### Custom Theme via CSS Variables
Instead of a config file, define theme in CSS:

```css
@theme {
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;

  --font-display: "Inter", sans-serif;

  --breakpoint-tablet: 768px;
  --breakpoint-desktop: 1024px;
}
```

---

## Database Workflows

### Prisma Commands
```bash
cd frontend

# Generate Prisma Client (after schema changes)
npm run db:generate

# Create migration (development)
npm run db:migrate

# Apply migrations (production - Vercel auto-runs this)
npx prisma migrate deploy

# View database in browser
npm run db:studio

# Seed database
npm run db:seed
```

### Schema Changes Workflow
1. Edit `prisma/schema.prisma`
2. Run `npm run db:generate` (updates Prisma Client types)
3. Run `npm run db:migrate` (creates migration SQL file)
4. Commit both schema and migration files
5. Vercel automatically applies migrations on deploy

### Seeding
```bash
# Runs prisma/seed.ts
npm run db:seed
```

**Example Seed:**
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  await db.airport.createMany({
    data: [
      { iataCode: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'United States' },
      { iataCode: 'JFK', name: 'John F Kennedy International', city: 'New York', country: 'United States' },
    ]
  })
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
```

---

## Authentication (JWT with jose)

### JWT Signing & Verification
```typescript
// lib/auth.ts
import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function createToken(userId: string, role: string) {
  return await new SignJWT({ userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as { userId: string; role: string }
  } catch {
    return null
  }
}
```

### Middleware Protection
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value

  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}
```

---

## Amadeus API Integration

### Rate Limits & Caching Strategy
- **Free Tier**: 2 requests/second, 2000/month
- **Strategy**: Aggressive caching (30+ minutes for flight offers)
- **Deduplication**: Hash query params, store in OfferCache table

### API Client
```typescript
// lib/amadeus.ts
import axios from 'axios'

let tokenCache: { value: string, expiresAt: number } | null = null

async function getAccessToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.value
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

  tokenCache = {
    value: response.data.access_token,
    expiresAt: Date.now() + (response.data.expires_in * 1000) - 60000
  }

  return tokenCache.value
}

export async function searchFlights(params: {
  origin: string
  destination: string
  departureDate: string
  adults: number
}) {
  const token = await getAccessToken()

  const response = await axios.get(
    'https://api.amadeus.com/v2/shopping/flight-offers',
    {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        originLocationCode: params.origin,
        destinationLocationCode: params.destination,
        departureDate: params.departureDate,
        adults: params.adults,
        currencyCode: 'USD',
        max: 50
      }
    }
  )

  return response.data.data
}
```

---

## Form Handling (react-hook-form + Zod)

### Schema Definition
```typescript
// lib/validations.ts
import { z } from 'zod'

export const searchSchema = z.object({
  departureAirport: z.string().length(3).regex(/^[A-Z]{3}$/),
  theme: z.enum(['adventure', 'beach', 'city', 'culture', 'nature']),
  minFlightTime: z.number().min(1).max(12),
  maxFlightTime: z.number().min(1).max(12)
}).refine(data => data.maxFlightTime >= data.minFlightTime, {
  message: 'Max flight time must be greater than min'
})

export type SearchInput = z.infer<typeof searchSchema>
```

### Form Component
```tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { searchSchema, type SearchInput } from '@/lib/validations'

export function SearchForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<SearchInput>({
    resolver: zodResolver(searchSchema)
  })

  const onSubmit = async (data: SearchInput) => {
    // Submit to API or Server Action
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('departureAirport')} />
      {errors.departureAirport && <span>{errors.departureAirport.message}</span>}

      {/* ... */}
    </form>
  )
}
```

---

## Zustand State Management

```typescript
// lib/store.ts
import { create } from 'zustand'

interface SearchState {
  filters: {
    departureAirport: string
    theme: string
    minFlightTime: number
    maxFlightTime: number
  }
  updateFilter: <K extends keyof SearchState['filters']>(
    key: K,
    value: SearchState['filters'][K]
  ) => void
  reset: () => void
}

export const useSearchStore = create<SearchState>((set) => ({
  filters: {
    departureAirport: '',
    theme: '',
    minFlightTime: 2,
    maxFlightTime: 8
  },
  updateFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value }
    })),
  reset: () => set({
    filters: {
      departureAirport: '',
      theme: '',
      minFlightTime: 2,
      maxFlightTime: 8
    }
  })
}))
```

**Usage:**
```tsx
'use client'

import { useSearchStore } from '@/lib/store'

export function Component() {
  const { filters, updateFilter } = useSearchStore()

  return (
    <input
      value={filters.departureAirport}
      onChange={(e) => updateFilter('departureAirport', e.target.value)}
    />
  )
}
```

---

## Environment Variables

### Required Variables
```bash
# Database (Neon)
DATABASE_URL="postgresql://..."

# Amadeus API
AMADEUS_API_KEY="your_key"
AMADEUS_API_SECRET="your_secret"

# Authentication
JWT_SECRET="generate_random_secret_256_bits"

# YouTube (optional)
YOUTUBE_API_KEY="your_key"

# Vercel KV (Redis - optional)
KV_URL="redis://..."
KV_REST_API_URL="https://..."
KV_REST_API_TOKEN="..."
```

### .env.local (Development)
```bash
DATABASE_URL="postgresql://localhost:5432/spontra"
AMADEUS_API_KEY="test_key"
AMADEUS_API_SECRET="test_secret"
JWT_SECRET="dev_secret_change_in_production"
```

### Vercel (Production)
Set in Vercel Dashboard → Project → Settings → Environment Variables

---

## Deployment (Vercel)

### Automatic Deployments
1. Push to GitHub
2. Vercel auto-detects Next.js
3. Runs `npm run build`
4. Deploys to Edge Network

### Build Configuration
Vercel automatically:
- Detects Next.js framework
- Installs dependencies
- Generates Prisma Client
- Runs migrations
- Builds Next.js app
- Deploys to serverless functions + edge

### Manual Deploy
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production
vercel --prod
```

---

## Performance Targets (2025)

### Core Web Vitals
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Bundle Size
- **First Load JS**: < 120 kB (currently: 109 kB ✅)
- **Route chunks**: < 50 kB each

### Monitoring
- `@vercel/analytics` - User analytics
- `@vercel/speed-insights` - Performance metrics
- Vercel Dashboard - Build times, function logs

---

## Common Pitfalls & Solutions

### ❌ Don't: Use client state for URL-shareable data
```tsx
// BAD - state lost on refresh
const [theme, setTheme] = useState('adventure')
```

```tsx
// GOOD - state in URL
const searchParams = useSearchParams()
const theme = searchParams.get('theme') ?? 'adventure'
```

### ❌ Don't: Forget to revalidate after mutations
```typescript
// BAD
export async function updateData() {
  await db.model.update(...)
  return { success: true }
}
```

```typescript
// GOOD
import { revalidatePath } from 'next/cache'

export async function updateData() {
  await db.model.update(...)
  revalidatePath('/data')
  return { success: true }
}
```

### ❌ Don't: Import Prisma in Client Components
```tsx
// BAD
'use client'
import { db } from '@/lib/db' // ❌
```

```tsx
// GOOD - use Server Action
'use client'
import { getData } from '@/app/actions/data' // ✅

async function handleClick() {
  const data = await getData() // Calls server
}
```

---

## Quick Reference Commands

```bash
# Development
cd frontend
npm run dev                    # Start dev server (http://localhost:3000)

# Database
npm run db:generate            # Generate Prisma Client
npm run db:migrate             # Create migration
npm run db:studio              # Open Prisma Studio
npm run db:seed                # Seed database

# Build & Deploy
npm run build                  # Production build
vercel                         # Deploy to Vercel

# Monorepo (if using)
npm install                    # Install all dependencies
npm run -w frontend dev        # Run frontend dev
npm run -w frontend build      # Build frontend
```

---

## Project Status (October 2025)

### ✅ Complete
- Modern dependency stack (React 19.1, Tailwind v4, Zod 4)
- Prisma + Neon integration
- Ultra-minimal MVP UI (Explore page)
- Authentication scaffolding (JWT with jose)
- Vercel deployment ready

### 🚧 In Progress
- Amadeus API integration
- Flight search implementation
- Metasearch affiliate tracking

### 📋 Planned
- YouTube video integration
- User accounts & preferences
- Admin panel
- Creator program

### 🗑️ Removed
- Go microservices (simplified to Next.js monolith)
- Separate testing frameworks (Vitest, Pact, MSW)
- Complex infrastructure (K8s, Terraform - may re-add at scale)
- Cassandra (using PostgreSQL only)

---

## When to Revisit Architecture

**Add background jobs when:**
- Need processing > 10 seconds (use Vercel Cron or BullMQ)
- Need scheduled tasks (use Vercel Cron first)

**Split into microservices when:**
- Team grows > 15 engineers
- Need polyglot services
- Hitting 100k+ concurrent users
- Regulatory requirements (data isolation)

**Until then:**
- Keep it simple
- Next.js + Neon + Vercel is plenty
- Focus on product, not infrastructure

---

**Last Updated**: October 2, 2025
**Maintained By**: Development Team
**Questions**: Check existing code patterns before creating new ones
