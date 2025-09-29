import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { captureException } from '@sentry/nextjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { requireAdminContext } from '@/lib/adminAuth'
import { adminRepository } from '@/lib/adminRepository'
import { trackError } from '@/lib/monitoring'

const verifySchema = z.object({
  code: z.string().min(6, 'Code must be at least 6 characters').max(8, 'Code must be at most 8 characters')
})

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const adminContext = await requireAdminContext(request)
    const body = verifySchema.parse(await request.json())

    const verification = await adminRepository.verifyMfaCode(
      adminContext.userId,
      body.code
    )

    if (!verification.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid MFA code'
      }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      data: {
        verified: true,
        requiresNewBackupCodes: verification.requiresNewBackupCodes || false,
        remainingBackupCodes: verification.remainingBackupCodes || 0
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.issues
      }, { status: 400 })
    }

    console.error('MFA verification error:', error)
    captureException(error, {
      tags: { component: 'admin_mfa', endpoint: 'verify' }
    })

    trackError({
      errorType: 'api',
      errorCode: 'admin_mfa_verify_failed',
      endpoint: '/api/admin/mfa/verify',
      severity: 'medium'
    })

    return NextResponse.json({
      success: false,
      error: 'MFA verification failed'
    }, { status: 500 })
  }
}