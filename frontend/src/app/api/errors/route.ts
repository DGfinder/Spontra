import { NextRequest, NextResponse } from 'next/server'
import { validateApiRequest } from '@/lib/validations'
import { z } from 'zod'

export const runtime = 'nodejs'

// Error report validation schema
const errorReportSchema = z.object({
  message: z.string().min(1, 'Error message is required').max(1000, 'Error message too long'),
  stack: z.string().max(5000, 'Stack trace too long').optional(),
  componentStack: z.string().max(5000, 'Component stack too long').optional(),
  context: z.string().max(100, 'Context too long').optional(),
  url: z.string().url('Invalid URL').optional(),
  userAgent: z.string().max(500, 'User agent too long').optional(),
  timestamp: z.string().optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  tags: z.array(z.string()).optional()
})

// In-memory storage for demo (use database/external service in production)
const errorReports: Array<z.infer<typeof errorReportSchema> & { id: string; reportedAt: string }> = []

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate and sanitize error report
    const validation = validateApiRequest(errorReportSchema, body)
    if (!validation.success) {
      console.warn('⚠️ Invalid error report:', validation.errors)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid error report format',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    const errorReport = validation.data
    
    // Generate unique ID for this error report
    const reportId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Add metadata
    const enrichedReport = {
      ...errorReport,
      id: reportId,
      reportedAt: new Date().toISOString(),
      severity: errorReport.severity || 'medium'
    }
    
    // Store error report (in production, send to external service)
    errorReports.push(enrichedReport)
    
    // Log error for immediate debugging
    console.error('🚨 Client Error Report:', {
      id: reportId,
      message: errorReport.message,
      context: errorReport.context,
      url: errorReport.url,
      severity: enrichedReport.severity
    })
    
    // In production, you would:
    // 1. Send to error monitoring service (Sentry, LogRocket, Bugsnag)
    // 2. Store in database for analysis
    // 3. Alert on critical errors
    // 4. Aggregate similar errors
    // 5. Generate error reports for the team
    
    await processErrorReport(enrichedReport)
    
    return NextResponse.json({
      success: true,
      reportId,
      message: 'Error report received'
    })

  } catch (error) {
    console.error('💥 Error reporting API error:', error)
    
    // Never throw errors in error reporting to avoid infinite loops
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process error report'
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
    const severity = url.searchParams.get('severity')
    const context = url.searchParams.get('context')
    
    // Filter error reports
    let filteredReports = errorReports
    
    if (severity) {
      filteredReports = filteredReports.filter(report => report.severity === severity)
    }
    
    if (context) {
      filteredReports = filteredReports.filter(report => 
        report.context?.toLowerCase().includes(context.toLowerCase())
      )
    }
    
    // Sort by most recent first and limit results
    const recentReports = filteredReports
      .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())
      .slice(0, limit)
    
    // Generate summary statistics
    const totalReports = filteredReports.length
    const severityBreakdown = filteredReports.reduce((acc, report) => {
      acc[report.severity] = (acc[report.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const contextBreakdown = filteredReports.reduce((acc, report) => {
      const ctx = report.context || 'Unknown'
      acc[ctx] = (acc[ctx] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return NextResponse.json({
      success: true,
      summary: {
        totalReports,
        severityBreakdown,
        contextBreakdown
      },
      reports: recentReports.map(report => ({
        id: report.id,
        message: report.message,
        context: report.context,
        severity: report.severity,
        url: report.url,
        reportedAt: report.reportedAt,
        // Don't expose sensitive stack traces in GET responses
        hasStackTrace: !!report.stack
      }))
    })

  } catch (error) {
    console.error('❌ Error reports fetch error:', error)
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch error reports' },
      { status: 500 }
    )
  }
}

// Helper function to process error reports
async function processErrorReport(report: any): Promise<void> {
  try {
    // In production, this would:
    // 1. Send to external monitoring service
    // 2. Check for duplicate/similar errors
    // 3. Alert on critical errors
    // 4. Update error dashboards
    // 5. Trigger automated responses for known issues
    
    if (report.severity === 'critical') {
      console.warn('🚨 CRITICAL ERROR DETECTED:', {
        message: report.message,
        context: report.context,
        url: report.url
      })
      
      // In production: send immediate alerts via email/Slack/PagerDuty
    }
    
    // Simulate external service call
    if (process.env.ERROR_MONITORING_WEBHOOK) {
      try {
        await fetch(process.env.ERROR_MONITORING_WEBHOOK, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(report)
        })
      } catch (webhookError) {
        console.warn('Failed to send error to monitoring service:', webhookError)
      }
    }
    
  } catch (processingError) {
    console.warn('Error processing error report:', processingError)
  }
}