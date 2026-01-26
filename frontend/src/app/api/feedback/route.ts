import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'general', 'complaint']),
  subject: z.string().min(5).max(200),
  message: z.string().min(10).max(5000),
  email: z.string().email().optional(),
  url: z.string().url().optional(),
})

// POST /api/feedback — Submit user feedback
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = feedbackSchema.parse(await request.json())
    
    // Get user info from headers
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    
    // Log feedback (in production, this would go to a database or service)
    console.log('📬 User Feedback Received:', {
      ...body,
      userAgent,
      ip: ip.split(',')[0], // First IP if behind proxy
      timestamp: new Date().toISOString(),
    })

    // TODO: In production, save to database or send to Slack/Discord
    // TODO: Send confirmation email if email provided

    return NextResponse.json({
      ok: true,
      message: 'Thank you for your feedback! We read every submission.',
      ticketId: `FB-${Date.now().toString(36).toUpperCase()}`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid feedback data', 
        details: error.issues 
      }, { status: 400 })
    }

    console.error('Feedback submission error:', error)
    return NextResponse.json({ 
      ok: false, 
      error: 'Failed to submit feedback' 
    }, { status: 500 })
  }
}
