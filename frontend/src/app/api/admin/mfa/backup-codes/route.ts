import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { captureException } from '@sentry/nextjs'

export const dynamic = 'force-dynamic'
export const revalidate = 0

import { requireAdminContext } from '@/lib/adminAuth'
import { adminRepository } from '@/lib/adminRepository'
import { trackError } from '@/lib/monitoring'

const regenerateSchema = z.object({
  action: z.literal('regenerate')
})

export async function POST(request: NextRequest) {
  try {
    const adminContext = await requireAdminContext(request)
    const body = regenerateSchema.parse(await request.json())

    if (body.action === 'regenerate') {
      const newCodes = await adminRepository.generateNewBackupCodes(adminContext.userId)

      if (!newCodes) {
        return NextResponse.json({
          success: false,
          error: 'Failed to generate new backup codes'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: {
          backupCodes: newCodes
        },
        message: 'New backup codes generated successfully'
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

    console.error('MFA backup codes error:', error)
    captureException(error, {
      tags: { component: 'admin_mfa', endpoint: 'backup-codes' }
    })

    trackError({
      errorType: 'api',
      errorCode: 'admin_mfa_backup_codes_failed',
      endpoint: '/api/admin/mfa/backup-codes',
      severity: 'medium'
    })

    return NextResponse.json({
      success: false,
      error: 'Backup codes operation failed'
    }, { status: 500 })
  }
}