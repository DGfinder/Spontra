import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { z } from 'zod'

export const runtime = 'nodejs'

const searchSessionSchema = z.object({
  origin: z.string().min(3).max(3).regex(/^[A-Z]{3}$/),
  destination: z.string().min(3).max(3).regex(/^[A-Z]{3}$/),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  passengers: z.number().min(1).max(9),
  preferences: z.object({
    activities: z.array(z.string()).optional(),
    budgetLevel: z.enum(['budget', 'mid_range', 'luxury', 'any']).optional(),
    maxFlightDuration: z.number().min(1).max(24).optional()
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = searchSessionSchema.parse(body)

    // Generate session ID
    const sessionId = crypto.randomUUID()
    
    // Create session in database
    const session = await prisma.searchSession.create({
      data: {
        id: sessionId,
        origin_airport: validatedData.origin,
        destination_airport: validatedData.destination,
        departure_date: validatedData.departureDate,
        return_date: validatedData.returnDate,
        passengers: validatedData.passengers,
        preferences: validatedData.preferences || {},
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        created_at: new Date(),
        updated_at: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      expiresAt: session.expires_at?.toISOString(),
      message: 'Search session created successfully'
    })

  } catch (error) {
    console.error('Search session creation failed:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.issues,
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create search session',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}