import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { requireAdminContext } from '@/lib/adminAuth'
import { adminRepository } from '@/lib/adminRepository'
import { trackError } from '@/lib/monitoring'

const setupSchema = z.object({
  action: z.enum(['initiate', 'complete']),
  verificationCode: z.string().optional()
})

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const adminContext = await requireAdminContext(request)
    const body = setupSchema.parse(await request.json())

    if (body.action === 'initiate') {
      // Initiate MFA setup
      const setupData = await adminRepository.setupMfa(adminContext.userId)
      
      if (!setupData) {
        return NextResponse.json({
          success: false,
          error: 'Failed to initiate MFA setup'
        }, { status: 500 })
      }

      // Don't return the actual secret to the client
      return NextResponse.json({
        success: true,
        data: {
          qrCodeUrl: setupData.qrCodeUrl,
          manualEntryKey: setupData.manualEntryKey,
          backupCodes: setupData.backupCodes
        }
      })
    }

    if (body.action === 'complete') {
      if (!body.verificationCode) {
        return NextResponse.json({
          success: false,
          error: 'Verification code is required'
        }, { status: 400 })
      }

      const success = await adminRepository.completeMfaSetup(
        adminContext.userId,
        body.verificationCode
      )

      if (!success) {
        return NextResponse.json({
          success: false,
          error: 'Invalid verification code'
        }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: 'MFA setup completed successfully'
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.issues
      }, { status: 400 })
    }

    console.error('MFA setup error:', error)
    captureException(error, {
      tags: { component: 'admin_mfa', endpoint: 'setup' }
    })

    trackError(new Error("Monitoring error"), {
      errorType: 'api',
      errorCode: 'admin_mfa_setup_failed',
      endpoint: '/api/admin/mfa/setup',
      severity: 'high'
    })

    return NextResponse.json({
      success: false,
      error: 'MFA setup failed'
    }, { status: 500 })
  }
}