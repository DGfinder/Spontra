# Spontra — Travel Discovery Frontend

Spontra is a travel discovery platform that helps users find flight destinations based on their vibes, budget, and flight-time preferences. Built with Next.js 15 App Router, Prisma (Neon PostgreSQL), and Amadeus flights API.

---

## Architecture Overview

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/                # REST API endpoints (auth, book, feed, health, reprice, …)
│   ├── admin/              # Admin panel (login + protected dashboard)
│   ├── feed/               # Destination swipe-feed (TikTok-style)
│   ├── flights/            # Flight search results
│   └── settings/           # User preferences
│
├── components/             # React components
│   ├── server/             # RSC-only components (no 'use client')
│   ├── ui/                 # Design-system primitives (Button, Card, Badge…)
│   ├── feed/               # Swipe-card feed components
│   ├── city/               # City selection & filtering
│   └── admin/              # Admin-only UI
│
├── hooks/                  # Custom React hooks
│   ├── useSearchForm.ts    # React Hook Form + Zod-validated search form
│   ├── useOptimizedSearch.ts # Debounced, memoised search with abort control
│   ├── useDestinationExplore.ts  # Destination discovery orchestration
│   └── useAnalytics.ts     # Client-side event tracking
│
├── lib/                    # Server-side utilities & services
│   ├── amadeus*.ts         # Amadeus flight API client + failover + resilience
│   ├── userAuth.ts         # JWT-based user authentication (jose)
│   ├── adminAuth.ts        # Separate admin JWT auth with MFA support
│   ├── validations.ts      # Zod schemas for all API inputs
│   ├── cache*.ts           # Multi-layer cache (Redis / Vercel KV / edge)
│   ├── logger.ts           # Structured logger with correlation IDs
│   ├── rateLimit*.ts       # Rate limiting (per-IP, per-user, production-tuned)
│   ├── circuitBreaker.ts   # Circuit breaker for external API calls
│   └── sentry.ts           # Sentry helpers and error capture utilities
│
├── contexts/               # React context providers
│   └── UserAuthContext.tsx # User session state
│
└── emails/                 # React Email templates (Resend)
```

### Data Flow

```
User → Next.js App Router
         ├── RSC page (server render)
         │   └── Prisma → Neon PostgreSQL
         └── Client component
             └── fetch → /api/* route
                 ├── Zod validation
                 ├── Rate limit check (Redis)
                 ├── Amadeus API (with circuit breaker + failover)
                 └── Response
```

### Auth Architecture

| Layer       | Mechanism                        | Cookie          |
|-------------|----------------------------------|-----------------|
| User auth   | JWT (jose) — 30-day session      | `user_session`  |
| Admin auth  | JWT + TOTP MFA                   | `admin_session` |
| CSRF        | Double-submit token              | `csrf_token`    |

---

## Tech Stack

| Concern       | Technology                              |
|---------------|-----------------------------------------|
| Framework     | Next.js 15 (App Router, RSC)            |
| Language      | TypeScript 5                            |
| Styling       | Tailwind CSS v4                         |
| Database      | Neon PostgreSQL via Prisma              |
| Cache         | Vercel KV (Redis) + edge cache          |
| Auth          | Custom JWT (jose) + bcrypt              |
| Flights API   | Amadeus for Developers                  |
| Emails        | Resend + React Email                    |
| Error tracking| Sentry                                  |
| Observability | OpenTelemetry + Prometheus              |
| Testing       | Vitest + MSW                            |
| Deployment    | Vercel                                  |

---

## Getting Started

### Prerequisites

- Node.js 20+
- A Neon PostgreSQL database
- Amadeus API credentials
- Resend API key (optional for dev)

### Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
# Fill in DATABASE_URL, JWT_SECRET, AMADEUS_CLIENT_ID, AMADEUS_CLIENT_SECRET

# Generate Prisma client & push schema
npm run db:push

# Seed development data
npm run db:seed

# Start dev server
npm run dev
```

### Environment Variables

| Variable                  | Required | Description                          |
|---------------------------|----------|--------------------------------------|
| `DATABASE_URL`            | ✅       | Neon PostgreSQL connection string     |
| `JWT_SECRET`              | ✅       | ≥32 char secret for user JWT signing  |
| `ADMIN_JWT_SECRET`        | ✅       | ≥32 char secret for admin JWT signing |
| `AMADEUS_CLIENT_ID`       | ✅       | Amadeus API key                       |
| `AMADEUS_CLIENT_SECRET`   | ✅       | Amadeus API secret                    |
| `RESEND_API_KEY`          | ✅ prod  | Email delivery                        |
| `REDIS_URL`               | optional | Vercel KV / Upstash Redis             |
| `NEXT_PUBLIC_SENTRY_DSN`  | optional | Sentry error tracking                 |
| `ADMIN_API_KEY`           | optional | Internal admin API key                |

---

## Development

```bash
npm run dev           # Start dev server
npm run lint          # ESLint
npm run type-check    # TypeScript (no emit)
npm test              # Vitest (watch mode)
npm run test:coverage # Coverage report
npm run build         # Production build
```

### Testing

Tests live in `tests/` (API, integration, e2e, contract, performance) and `src/lib/__tests__/` (unit). All use Vitest with MSW for API mocking.

```bash
npm test                    # Watch mode
npm run test:coverage       # With coverage (≥70% threshold)
npm run test:integration    # Integration tests
npm run test:contracts      # Pact contract tests
```

### Database

```bash
npm run db:studio         # Prisma Studio GUI
npm run db:migrate        # Create & apply migration
npm run db:migrate:deploy # Apply pending migrations (production)
npm run db:seed           # Seed with sample data
```

---

## Deployment

The app deploys to Vercel automatically on push to `main`.

1. All environment variables must be set in Vercel project settings
2. `prisma migrate deploy` runs automatically during build
3. See `PRODUCTION_DEPLOYMENT_GUIDE.md` for full go-live checklist

---

## Revenue Model

Spontra earns via affiliate click-through on flight searches (CPC model). Key files:
- `src/app/api/book/route.ts` — Affiliate redirect with Skyscanner deep-links
- `src/lib/postbackSecurity.ts` — Postback signature verification for conversion tracking
- `src/lib/priceAnalytics.ts` — EPC and revenue analytics

---

## Contributing

1. Branch from `develop`
2. Run `npm run type-check && npm test` before pushing
3. CI runs lint, type-check, unit tests, and a production build on every PR
