import { NextRequest, NextResponse } from 'next/server'
import { ConversionEvent } from '@/services/affiliateService'
import { validateApiRequest, webhookConversionSchema } from '@/lib/validations'

// Partner-specific webhook data interfaces
interface ExpediaWebhookData {
  click_id: string
  booking_reference: string
  total_amount: string
  currency: string
  commission_amount?: string
  booking_date: string
  adult_count?: number
  child_count?: number
  infant_count?: number
  origin_airport: string
  destination_airport: string
  departure_date: string
  return_date?: string
  airline_code: string
  cabin_class: string
}

interface BookingWebhookData {
  click_id: string
  reservation_id: string
  amount: string
  currency: string
  commission?: string
  checkin_date: string
  origin: string
  destination: string
  departure: string
  airline: string
  class: string
}

interface KayakWebhookData {
  clickid: string
  order_id: string
  value: string
  currency: string
  commission?: string
  timestamp: string
  from: string
  to: string
  depart_date: string
  return_date?: string
  airline: string
  cabin: string
}

interface SkyscannerWebhookData {
  clickRef: string
  bookingId: string
  price: string
  currency: string
  partnerCommission?: string
  bookingDate: string
  originPlace: string
  destinationPlace: string
  outboundDate: string
  inboundDate?: string
  carrierId: string
  cabinClass: string
}

interface GenericWebhookData {
  clickId?: string
  click_id?: string
  bookingRef?: string
  booking_reference?: string
  value?: string
  amount?: string
  currency?: string
  commission?: string
  date?: string
  origin?: string
  destination?: string
  departureDate?: string
  airline?: string
  cabinClass?: string
}

type PartnerWebhookData = ExpediaWebhookData | BookingWebhookData | KayakWebhookData | SkyscannerWebhookData | GenericWebhookData

export const runtime = 'nodejs'

// In-memory storage for demo (use database in production)
const conversions: ConversionEvent[] = []

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const partnerSignature = req.headers.get('x-partner-signature')
    const partnerId = req.headers.get('x-partner-id')
    
    console.log('🎯 Conversion webhook received:', {
      partnerId,
      hasSignature: !!partnerSignature,
      bodyKeys: Object.keys(body)
    })

    // Validate webhook signature (implement proper verification in production)
    if (!partnerSignature) {
      console.warn('⚠️ Conversion webhook missing signature')
      return NextResponse.json(
        { success: false, error: 'Missing webhook signature' },
        { status: 401 }
      )
    }

    // Validate and sanitize request body
    const validation = validateApiRequest(webhookConversionSchema, body)
    if (!validation.success) {
      console.warn('⚠️ Invalid webhook payload:', validation.errors)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid webhook payload',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    // Parse conversion data based on partner format
    const conversion = await parseConversionData(partnerId, body)
    
    if (!conversion) {
      console.error('❌ Failed to parse conversion data')
      return NextResponse.json(
        { success: false, error: 'Invalid conversion data format' },
        { status: 400 }
      )
    }

    // Verify click attribution (check if click exists and is within attribution window)
    const isValidAttribution = await verifyAttribution(conversion.clickId)
    if (!isValidAttribution) {
      console.warn('⚠️ Conversion attribution failed or expired:', conversion.clickId)
      return NextResponse.json(
        { success: false, error: 'Attribution validation failed' },
        { status: 400 }
      )
    }

    // Store conversion
    conversions.push({
      ...conversion,
      status: 'confirmed'
    })

    // Process conversion for commission calculation
    await processConversion(conversion)

    console.log('✅ Conversion processed successfully:', {
      clickId: conversion.clickId,
      bookingValue: conversion.bookingValue,
      commissionValue: conversion.commissionValue
    })

    return NextResponse.json({
      success: true,
      conversionId: conversion.clickId,
      commissionValue: conversion.commissionValue,
      message: 'Conversion tracked successfully'
    })

  } catch (error) {
    console.error('💥 Conversion webhook error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process conversion',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const timeframe = url.searchParams.get('timeframe') || '24h'
    const partnerId = url.searchParams.get('partner')
    
    // Filter conversions
    let filteredConversions = conversions
    
    if (partnerId) {
      // Filter by partner (would need to store partner info with conversion)
      filteredConversions = conversions.filter(conv => 
        conv.clickId.includes(partnerId) // Simplified filtering
      )
    }

    // Calculate metrics
    const totalConversions = filteredConversions.length
    const totalRevenue = filteredConversions.reduce((sum, conv) => sum + conv.bookingValue, 0)
    const totalCommissions = filteredConversions.reduce((sum, conv) => sum + conv.commissionValue, 0)
    const averageBookingValue = totalConversions > 0 ? totalRevenue / totalConversions : 0

    // Group by status
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
        conversionRate: 0, // Would need click data to calculate
        statusBreakdown
      },
      conversions: filteredConversions.slice(0, 100) // Limit for performance
    })

  } catch (error) {
    console.error('❌ Conversion metrics error:', error)
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversion metrics' },
      { status: 500 }
    )
  }
}

// Helper functions
async function parseConversionData(partnerId: string | null, data: PartnerWebhookData): Promise<ConversionEvent | null> {
  try {
    // Different partners send data in different formats
    switch (partnerId) {
      case 'expedia':
        return parseExpediaConversion(data as ExpediaWebhookData)
      case 'booking':
        return parseBookingConversion(data as BookingWebhookData)
      case 'kayak':
        return parseKayakConversion(data as KayakWebhookData)
      case 'skyscanner':
        return parseSkyscannerConversion(data as SkyscannerWebhookData)
      default:
        return parseGenericConversion(data as GenericWebhookData)
    }
  } catch (error) {
    console.error('Parse conversion error:', error)
    return null
  }
}

function parseExpediaConversion(data: ExpediaWebhookData): ConversionEvent {
  return {
    clickId: data.click_id,
    bookingReference: data.booking_reference,
    bookingValue: parseFloat(data.total_amount),
    currency: data.currency,
    commissionValue: parseFloat(data.commission_amount || '0'),
    bookingDate: data.booking_date,
    passengerDetails: {
      adults: data.adult_count || 1,
      children: data.child_count || 0,
      infants: data.infant_count || 0
    },
    flightDetails: {
      origin: data.origin_airport,
      destination: data.destination_airport,
      departureDate: data.departure_date,
      returnDate: data.return_date,
      airline: data.airline_code,
      cabinClass: data.cabin_class
    },
    status: 'pending'
  }
}

function parseBookingConversion(data: BookingWebhookData): ConversionEvent {
  return {
    clickId: data.click_id,
    bookingReference: data.reservation_id,
    bookingValue: parseFloat(data.amount),
    currency: data.currency,
    commissionValue: parseFloat(data.commission || '0'),
    bookingDate: data.checkin_date,
    flightDetails: {
      origin: data.origin,
      destination: data.destination,
      departureDate: data.departure,
      airline: data.airline,
      cabinClass: data.class
    },
    status: 'pending'
  }
}

function parseKayakConversion(data: KayakWebhookData): ConversionEvent {
  return {
    clickId: data.clickid,
    bookingReference: data.order_id,
    bookingValue: parseFloat(data.value),
    currency: data.currency,
    commissionValue: parseFloat(data.commission || '0'),
    bookingDate: data.timestamp,
    flightDetails: {
      origin: data.from,
      destination: data.to,
      departureDate: data.depart_date,
      returnDate: data.return_date,
      airline: data.airline,
      cabinClass: data.cabin
    },
    status: 'pending'
  }
}

function parseSkyscannerConversion(data: SkyscannerWebhookData): ConversionEvent {
  return {
    clickId: data.clickRef,
    bookingReference: data.bookingId,
    bookingValue: parseFloat(data.price),
    currency: data.currency,
    commissionValue: parseFloat(data.partnerCommission || '0'),
    bookingDate: data.bookingDate,
    flightDetails: {
      origin: data.originPlace,
      destination: data.destinationPlace,
      departureDate: data.outboundDate,
      returnDate: data.inboundDate,
      airline: data.carrierId,
      cabinClass: data.cabinClass
    },
    status: 'pending'
  }
}

function parseGenericConversion(data: GenericWebhookData): ConversionEvent {
  return {
    clickId: data.clickId || data.click_id || '',
    bookingReference: data.bookingRef || data.booking_reference || '',
    bookingValue: parseFloat(data.value || data.amount || '0'),
    currency: data.currency || 'EUR',
    commissionValue: parseFloat(data.commission || '0'),
    bookingDate: data.date || new Date().toISOString(),
    flightDetails: {
      origin: data.origin || '',
      destination: data.destination || '',
      departureDate: data.departureDate || '',
      airline: data.airline || '',
      cabinClass: data.cabinClass || 'ECONOMY'
    },
    status: 'pending'
  }
}

async function verifyAttribution(clickId: string): Promise<boolean> {
  // In production, this would:
  // 1. Look up the click in your database
  // 2. Check if it's within the attribution window (typically 7-30 days)
  // 3. Verify it hasn't already been converted
  // 4. Check for fraud patterns
  
  // Simplified verification for demo
  if (!clickId || clickId.length < 10) return false
  
  // Simulate database lookup
  const click = {
    timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000), // 2 days ago
    converted: false
  }
  
  const attributionWindow = 30 * 24 * 60 * 60 * 1000 // 30 days
  const isWithinWindow = (Date.now() - click.timestamp) < attributionWindow
  
  return isWithinWindow && !click.converted
}

async function processConversion(conversion: ConversionEvent): Promise<void> {
  // In production, this would:
  // 1. Update click record as converted
  // 2. Calculate final commission amount
  // 3. Update revenue metrics
  // 4. Trigger commission payment workflows
  // 5. Update partner dashboards
  // 6. Send notifications
  
  console.log('💰 Processing conversion:', {
    booking: conversion.bookingReference,
    value: conversion.bookingValue,
    commission: conversion.commissionValue
  })
  
  // Update metrics (would be stored in database/cache)
  // updateRevenueMetrics(conversion)
  // triggerCommissionPayment(conversion)
  // notifyPartner(conversion)
}