# Spontra — Deployment Guide

## Deploy to Vercel (first time)

```bash
cd frontend
npx vercel --confirm
```

Vercel will:
- Auto-detect Next.js
- Create project `spontra`
- Give you a URL like `spontra-hayden-8295.vercel.app`

## Environment Variables to set in Vercel dashboard

Go to: vercel.com → spontra project → Settings → Environment Variables

### Required (prod won't work without these)
| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Neon dashboard → Connection string (pooled) |
| `DIRECT_URL` | Neon dashboard → Connection string (direct) |
| `AMADEUS_CLIENT_ID` | developers.amadeus.com |
| `AMADEUS_CLIENT_SECRET` | developers.amadeus.com |
| `NEXTAUTH_SECRET` | Run: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your Vercel URL e.g. `https://spontra-xxx.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | Same as NEXTAUTH_URL |

### Optional but recommended
| Variable | Value |
|---|---|
| `KV_URL` | Upstash Redis → REST URL (free tier) |
| `KV_REST_API_URL` | Upstash REST URL |
| `KV_REST_API_TOKEN` | Upstash token |
| `NEXT_PUBLIC_APP_ENV` | `production` |

## After deploying

1. Copy your Vercel URL (e.g. `https://spontra-abc.vercel.app`)
2. Update iOS `SpontraAPI.swift`:
   ```swift
   private let baseURL = "https://spontra-abc.vercel.app"
   ```
3. Update Vercel env var `NEXT_PUBLIC_APP_URL` to match

## Custom domain (when you have one)

```bash
npx vercel domains add spontra.app
```
Then update DNS at your registrar → CNAME `cname.vercel-dns.com`

## Re-deploy after code changes

```bash
cd frontend
git push   # if connected to GitHub (recommended)
# or
npx vercel --prod
```

## Neon DB (if you need a fresh one)

1. neon.tech → New Project → "spontra"
2. Copy connection strings into Vercel env vars
3. Run migrations:
   ```bash
   cd frontend
   DATABASE_URL="..." npx prisma migrate deploy
   ```
