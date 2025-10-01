import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * Business Metrics API - Currently Disabled
 *
 * This feature is not part of the MVP and has been temporarily disabled.
 * It will be re-enabled in a future release after Prisma type issues are resolved.
 */

export async function GET(request: NextRequest): Promise<Response> {
  return NextResponse.json({
    success: false,
    error: 'Business metrics feature is not available in this version',
    code: 'FEATURE_NOT_IMPLEMENTED',
    timestamp: new Date().toISOString()
  }, { status: 501 })
}

export async function POST(request: NextRequest): Promise<Response> {
  return NextResponse.json({
    success: false,
    error: 'Business metrics feature is not available in this version',
    code: 'FEATURE_NOT_IMPLEMENTED',
    timestamp: new Date().toISOString()
  }, { status: 501 })
}
