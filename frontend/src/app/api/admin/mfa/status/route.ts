import { NextRequest, NextResponse } from 'next/server'
import { captureException } from '@sentry/nextjs'

export const dynamic = 'force-dynamic'
export const revalidate = 0

import { requireAdminContext } from '@/lib/adminAuth'
import { adminRepository } from '@/lib/adminRepository'
import { trackError } from '@/lib/monitoring'

export async function GET(request: NextRequest) {
  try {
    const adminContext = await requireAdminContext(request)

    const status = await adminRepository.getMfaStatus(adminContext.userId)

    if (!status) {
      return NextResponse.json({
        success: false,
        error: 'Failed to get MFA status'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: status
    })

  } catch (error) {
    console.error('MFA status error:', error)
    captureException(error, {
      tags: { component: 'admin_mfa', endpoint: 'status' }
    })

    trackError({
      errorType: 'api',
      errorCode: 'admin_mfa_status_failed',
      endpoint: '/api/admin/mfa/status',
      severity: 'low'
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to get MFA status'
    }, { status: 500 })
  }
}