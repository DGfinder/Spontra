import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * Mobile booking redirect endpoint.
 * iOS app calls this with flight params; we redirect to the best affiliate
 * or Skyscanner deep-link. Tracks the click in the DB if possible.
 *
 * GET /api/book?origin=SYD&destination=BCN&date=2026-04-01&returnDate=2026-04-08
 *              &passengers=1&class=ECONOMY&carrier=QF&price=450&currency=AUD
 */

const schema = z.object({
  origin:      z.string().length(3),
  destination: z.string().length(3),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  passengers:  z.coerce.number().min(1).max(9).default(1),
  class:       z.enum(['ECONOMY','PREMIUM_ECONOMY','BUSINESS','FIRST']).default('ECONOMY'),
  carrier:     z.string().max(4).optional(),
  price:       z.coerce.number().optional(),
  currency:    z.string().length(3).default('AUD'),
  source:      z.string().default('ios'),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const parsed = schema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid params' }, { status: 400 })
  }

  const p = parsed.data

  // Build Skyscanner deep-link (works without API key, great fallback)
  const skyscannerUrl = buildSkyscannerDeeplink(p)

  // Log the click (fire-and-forget, don't block redirect)
  logBookingClick(p).catch(() => {})

  // Redirect — Safari opens this natively on iOS
  return NextResponse.redirect(skyscannerUrl, { status: 302 })
}

function buildSkyscannerDeeplink(p: {
  origin: string
  destination: string
  date: string
  returnDate?: string
  passengers: number
  class: string
  carrier?: string
}) {
  const base = 'https://www.skyscanner.com.au/transport/flights'
  const dep  = p.date.replace(/-/g, '').slice(2)     // YYMMDD
  const ret  = p.returnDate?.replace(/-/g, '').slice(2)

  const tripType = p.returnDate ? 'return' : 'one-way'
  const cabin = p.class.toLowerCase().replace('_', '-')

  // Skyscanner URL format: /flights/ORIG/DEST/DEPDATE[/RETDATE]/
  let url = `${base}/${p.origin.toLowerCase()}/${p.destination.toLowerCase()}/${dep}/`
  if (ret) url += `${ret}/`
  url += `?adults=${p.passengers}&cabinclass=${cabin}&utm_source=spontra&utm_medium=mobile`

  return url
}

async function logBookingClick(p: typeof schema._type) {
  // TODO: Insert into casx_clicks or a spontra booking_clicks table
  // For now just console — replace with prisma insert when DB is wired
  console.log(`[api/book] click: ${p.origin}→${p.destination} ${p.date} src=${p.source}`)
}
