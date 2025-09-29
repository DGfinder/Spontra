import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { captureException } from '@sentry/nextjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { requireAdminContext } from '@/lib/adminAuth'
import { adminRepository } from '@/lib/adminRepository'
import { trackError } from '@/lib/monitoring'

const disableSchema = z.object({
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
  targetUserId: z.string().optional() // For super admins to disable MFA for other admins
})

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const adminContext = await requireAdminContext(request)
    const body = disableSchema.parse(await request.json())

    // Determine target user ID (self or other admin if specified)
    const targetUserId = body.targetUserId || adminContext.userId
    
    // Verify password for security
    const admin = await adminRepository.findAdminById(adminContext.userId)
    if (!admin) {
      return NextResponse.json({
        success: false,
        error: 'Admin not found'
      }, { status: 404 })
    }

    // Verify the requesting admin's password
    const { verifyPassword } = await import('@/lib/password')
    const adminUser = await adminRepository.findAdminByEmail(admin.email)
    if (!adminUser) {
      return NextResponse.json({
        success: false,
        error: 'Admin verification failed'
      }, { status: 401 })
    }

    // Get full user data including password hash
    const { userRepository } = await import('@/lib/userRepository')
    const fullAdminUser = await userRepository.findUserByEmail(admin.email)
    if (!fullAdminUser) {
      return NextResponse.json({
        success: false,
        error: 'Admin verification failed'
      }, { status: 401 })
    }

    const isPasswordValid = await verifyPassword(body.confirmPassword, fullAdminUser.passwordHash)
    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid password'
      }, { status: 401 })
    }

    // Check permissions for disabling MFA for other users
    if (targetUserId !== adminContext.userId) {
      if (admin.role !== 'admin') {
        return NextResponse.json({
          success: false,
          error: 'Insufficient permissions to disable MFA for other admins'
        }, { status: 403 })
      }
    }

    // Disable MFA
    const success = await adminRepository.disableMfa(targetUserId, adminContext.userId)

    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to disable MFA'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: targetUserId === adminContext.userId 
        ? 'MFA disabled successfully'
        : 'MFA disabled for target admin successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.issues
      }, { status: 400 })
    }

    console.error('MFA disable error:', error)
    captureException(error, {
      tags: { component: 'admin_mfa', endpoint: 'disable' }
    })

    trackError({
      errorType: 'api',
      errorCode: 'admin_mfa_disable_failed',
      endpoint: '/api/admin/mfa/disable',
      severity: 'high'
    })

    return NextResponse.json({
      success: false,
      error: 'MFA disable failed'
    }, { status: 500 })
  }
}