import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({
    id: Boolean(process.env.AMADEUS_CLIENT_ID),
    secret: Boolean(process.env.AMADEUS_CLIENT_SECRET),
    env: process.env.AMADEUS_ENVIRONMENT || null,
  })
}

