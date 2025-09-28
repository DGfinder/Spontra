import { NextRequest, NextResponse } from 'next/server'
import { ConversionEvent } from '@/services/affiliateService'
import { validateApiRequest, webhookConversionSchema } from '@/lib/validations'
import { cacheGet, cacheSet } from '@/lib/cacheServer'

export const runtime = 'nodejs'

const STORE_KEY = 'analytics:conversions'
const MAX_EVENTS = 10000

async function readConversions(): Promise<ConversionEvent[]> {
  try {
    const raw = await cacheGet(STORE_KEY)
    return raw ? (JSON.parse(raw) as ConversionEvent[]) : []
  } catch {
    return []
  }
}

async function writeConversions(events: ConversionEvent[]): Promise<void> {
  const trimmed = events.slice(-MAX_EVENTS)
  await cacheSet(STORE_KEY, JSON.stringify(trimmed), { ttlSeconds: 604800 }).catch(() => {})
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const partnerSignature = req.headers.get('x-partner-signature')
    const partnerId = req.headers.get('x-partner-id')

    console.log('Conversion webhook received:', { partnerId, hasSignature: !!partnerSignature })

    if (!partnerSignature) {
      return NextResponse.json({ success: false, error: 'Missing webhook signature' }, { status: 401 })
    }

    const validation = validateApiRequest(webhookConversionSchema, body)
    if (!validation.success) {
      return NextResponse.json({ success: false, error: 'Invalid webhook payload', details: validation.errors }, { status: 400 })
    }

    const conversion = await parseConversionData(partnerId, body as any)
    if (!conversion) {
      return NextResponse.json({ success: false, error: 'Invalid conversion data format' }, { status: 400 })
    }

    const isValidAttribution = await verifyAttribution(conversion.clickId)
    if (!isValidAttribution) {
      return NextResponse.json({ success: false, error: 'Attribution validation failed' }, { status: 400 })
    }

    const current = await readConversions()
    current.push({ ...conversion, status: 'confirmed' })
    await writeConversions(current)

    await processConversion(conversion)

    return NextResponse.json({ success: true, conversionId: conversion.clickId, commissionValue: conversion.commissionValue })
  } catch (error) {
    console.error('Conversion webhook error:', error)
    return NextResponse.json({ success: false, error: 'Failed to process conversion' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const timeframe = url.searchParams.get('timeframe') || '24h'

    let filteredConversions = await readConversions()

    const totalConversions = filteredConversions.length
    const totalRevenue = filteredConversions.reduce((sum, conv) => sum + conv.bookingValue, 0)
    const totalCommissions = filteredConversions.reduce((sum, conv) => sum + conv.commissionValue, 0)
    const averageBookingValue = totalConversions > 0 ? totalRevenue / totalConversions : 0

    const statusBreakdown = filteredConversions.reduce((stats, conv) => {
      stats[conv.status] = (stats[conv.status] || 0) + 1
      return stats
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      timeframe,
      metrics: {
        totalConversions,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCommissions: Math.round(totalCommissions * 100) / 100,
        averageBookingValue: Math.round(averageBookingValue * 100) / 100,
        conversionRate: 0,
        statusBreakdown
      },
      conversions: filteredConversions.slice(0, 100)
    })
  } catch (error) {
    console.error('Conversion metrics error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch conversion metrics' }, { status: 500 })
  }
}

async function parseConversionData(partnerId: string | null, data: any): Promise<ConversionEvent | null> {
  try {
    const bookingValue = Number.parseFloat(data.total_amount || data.amount || data.value || '0')
    const commissionValue = Number.parseFloat(data.commission_amount || data.partnerCommission || data.commission || '0')
    const currency = data.currency || 'USD'
    const clickId = data.click_id || data.clickId || data.clickRef || data.clickid
    const bookingReference = data.booking_reference || data.bookingRef || data.bookingId || data.order_id || data.reservation_id || ''

    const conv: ConversionEvent = {
      clickId,
      bookingReference,
      bookingValue: Math.round((bookingValue || 0) * 100) / 100,
      currency,
      commissionValue: Math.round((commissionValue || 0) * 100) / 100,
      bookingDate: new Date().toISOString(),
      flightDetails: {
        origin: data.origin || data.origin_airport || data.from || '',
        destination: data.destination || data.destination_airport || data.to || '',
        departureDate: data.departure || data.departure_date || data.depart_date || data.outboundDate || '',
        returnDate: data.return_date || data.inboundDate || undefined,
        airline: data.airline || data.airline_code || data.carrierId || '',
        cabinClass: data.cabin || data.cabinClass || 'ECONOMY'
      },
      status: 'confirmed'
    }
    if (!conv.clickId) return null
    return conv
  } catch {
    return null
  }
}

async function verifyAttribution(clickId: string): Promise<boolean> {
  // In production, validate against click store with attribution window
  return Boolean(clickId)
}

async function processConversion(_conversion: ConversionEvent): Promise<void> {
  // In production, update partner payouts and dashboards
}

