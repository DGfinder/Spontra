/**
 * Admin Repository
 * Database operations specific to admin users and management
 */

import { prisma } from './prisma'
import { hashPassword, verifyPassword } from './password'
import { UserWithoutPassword, userRepository } from './userRepository'
import { mfaService } from './mfaService'
import type { User, UserRole } from '@prisma/client'
import { captureException } from '@sentry/nextjs'

export interface AdminUser extends UserWithoutPassword {
  role: 'admin' | 'moderator'
}

export interface CreateAdminData {
  email: string
  password: string
  firstName: string
  lastName: string
  username?: string
  role?: 'admin' | 'moderator'
}

export interface AdminSession {
  id: string
  userId: string
  sessionToken: string
  expiresAt: Date
  createdAt: Date
  lastUsedAt: Date
  ipAddress?: string
  userAgent?: string
  deviceInfo?: string
  isActive: boolean
}

export interface AdminLoginResult {
  user: AdminUser
  session: AdminSession
  isValid: boolean
  requiresMFA?: boolean
}

export interface AdminActivityLog {
  id: string
  adminId: string
  action: string
  targetId?: string
  targetType?: string
  details: Record<string, any>
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  createdAt: Date
}

export interface MfaSetupData {
  secret: string
  backupCodes: string[]
  qrCodeUrl: string
  manualEntryKey: string
}

export interface MfaVerificationData {
  isValid: boolean
  requiresNewBackupCodes?: boolean
  remainingBackupCodes?: number
}

class AdminRepository {
  /**
   * Find admin user by email
   */
  async findAdminByEmail(email: string): Promise<AdminUser | null> {
    try {
      const user = await prisma.user.findFirst({
        where: { 
          email,
          role: { in: ['admin', 'moderator'] }
        }
      })

      if (!user) return null

      const { passwordHash, ...userWithoutPassword } = user
      return userWithoutPassword as AdminUser
    } catch (error) {
      console.error('Failed to find admin by email:', error)
      captureException(error)
      return null
    }
  }

  /**
   * Find admin user by ID
   */
  async findAdminById(id: string): Promise<AdminUser | null> {
    try {
      const user = await prisma.user.findFirst({
        where: { 
          id,
          role: { in: ['admin', 'moderator'] }
        }
      })

      if (!user) return null

      const { passwordHash, ...userWithoutPassword } = user
      return userWithoutPassword as AdminUser
    } catch (error) {
      console.error('Failed to find admin by ID:', error)
      captureException(error)
      return null
    }
  }

  /**
   * Verify admin credentials and return user info
   */
  async verifyAdminCredentials(email: string, password: string): Promise<AdminLoginResult | null> {
    try {
      const user = await prisma.user.findFirst({
        where: { 
          email,
          role: { in: ['admin', 'moderator'] }
        }
      })

      if (!user) {
        return null
      }

      const isValid = await verifyPassword(password, user.passwordHash)
      
      if (!isValid) {
        // Log failed login attempt
        await this.logAdminActivity({
          adminId: user.id,
          action: 'login_failed',
          details: { reason: 'invalid_password', email }
        })
        return null
      }

      const { passwordHash, ...userWithoutPassword } = user
      
      // Create a temporary session object for the login result
      const sessionData: AdminSession = {
        id: '', // Will be set when actual session is created
        userId: user.id,
        sessionToken: '', // Will be set when actual session is created
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isActive: true
      }

      return {
        user: userWithoutPassword as AdminUser,
        session: sessionData,
        isValid: true,
        requiresMFA: user.mfaEnabled || mfaService.shouldRequireMfa(user.role)
      }
    } catch (error) {
      console.error('Failed to verify admin credentials:', error)
      captureException(error)
      return null
    }
  }

  /**
   * Create admin user
   */
  async createAdmin(data: CreateAdminData): Promise<AdminUser> {
    try {
      const hashedPassword = await hashPassword(data.password)
      
      const user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          username: data.username,
          role: data.role || 'admin',
          isEmailVerified: true, // Admin users are pre-verified
        }
      })

      const { passwordHash, ...userWithoutPassword } = user
      
      // Log admin creation
      await this.logAdminActivity({
        adminId: user.id,
        action: 'admin_created',
        details: { email: data.email, role: data.role || 'admin' }
      })

      return userWithoutPassword as AdminUser
    } catch (error) {
      console.error('Failed to create admin:', error)
      captureException(error)
      throw error
    }
  }

  /**
   * Update admin user
   */
  async updateAdmin(adminId: string, updates: Partial<CreateAdminData>): Promise<AdminUser> {
    try {
      const updateData: any = {}
      
      if (updates.email) updateData.email = updates.email
      if (updates.firstName) updateData.firstName = updates.firstName
      if (updates.lastName) updateData.lastName = updates.lastName
      if (updates.username) updateData.username = updates.username
      if (updates.role) updateData.role = updates.role
      if (updates.password) updateData.passwordHash = await hashPassword(updates.password)

      updateData.updatedAt = new Date()

      const user = await prisma.user.update({
        where: { id: adminId },
        data: updateData
      })

      const { passwordHash, ...userWithoutPassword } = user
      
      // Log admin update
      await this.logAdminActivity({
        adminId,
        action: 'admin_updated',
        details: { updates: Object.keys(updates) }
      })

      return userWithoutPassword as AdminUser
    } catch (error) {
      console.error('Failed to update admin:', error)
      captureException(error)
      throw error
    }
  }

  /**
   * List all admin users
   */
  async listAdmins(): Promise<AdminUser[]> {
    try {
      const users = await prisma.user.findMany({
        where: { 
          role: { in: ['admin', 'moderator'] }
        },
        orderBy: { createdAt: 'desc' }
      })

      return users.map(user => {
        const { passwordHash, ...userWithoutPassword } = user
        return userWithoutPassword as AdminUser
      })
    } catch (error) {
      console.error('Failed to list admins:', error)
      captureException(error)
      return []
    }
  }

  /**
   * Create admin session in database
   */
  async createAdminSession(
    userId: string,
    sessionToken: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AdminSession> {
    try {
      const session = await prisma.userSession.create({
        data: {
          userId,
          sessionToken,
          expiresAt,
          ipAddress,
          userAgent
        }
      })

      // Log successful login
      await this.logAdminActivity({
        adminId: userId,
        action: 'login_success',
        details: { sessionId: session.id },
        ipAddress,
        userAgent,
        sessionId: session.id
      })

      return {
        id: session.id,
        userId: session.userId,
        sessionToken: session.sessionToken,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        lastUsedAt: session.lastUsedAt,
        ipAddress: session.ipAddress || undefined,
        userAgent: session.userAgent || undefined,
        isActive: true
      }
    } catch (error) {
      console.error('Failed to create admin session:', error)
      captureException(error)
      throw error
    }
  }

  /**
   * Find active admin session
   */
  async findAdminSession(sessionToken: string): Promise<AdminSession | null> {
    try {
      const session = await prisma.userSession.findFirst({
        where: {
          sessionToken,
          expiresAt: { gt: new Date() }
        },
        include: {
          user: true
        }
      })

      if (!session || !['admin', 'moderator'].includes(session.user.role)) {
        return null
      }

      return {
        id: session.id,
        userId: session.userId,
        sessionToken: session.sessionToken,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        lastUsedAt: session.lastUsedAt,
        ipAddress: session.ipAddress || undefined,
        userAgent: session.userAgent || undefined,
        isActive: true
      }
    } catch (error) {
      console.error('Failed to find admin session:', error)
      captureException(error)
      return null
    }
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionToken: string): Promise<void> {
    try {
      await prisma.userSession.update({
        where: { sessionToken },
        data: { lastUsedAt: new Date() }
      })
    } catch (error) {
      console.error('Failed to update session activity:', error)
      captureException(error)
    }
  }

  /**
   * Invalidate admin session
   */
  async invalidateAdminSession(sessionToken: string): Promise<void> {
    try {
      const session = await prisma.userSession.findUnique({
        where: { sessionToken }
      })

      if (session) {
        await prisma.userSession.delete({
          where: { sessionToken }
        })

        // Log logout
        await this.logAdminActivity({
          adminId: session.userId,
          action: 'logout',
          details: { sessionId: session.id },
          sessionId: session.id
        })
      }
    } catch (error) {
      console.error('Failed to invalidate admin session:', error)
      captureException(error)
    }
  }

  /**
   * Invalidate all sessions for admin user
   */
  async invalidateAllAdminSessions(userId: string): Promise<void> {
    try {
      const deletedSessions = await prisma.userSession.deleteMany({
        where: { userId }
      })

      // Log session invalidation
      await this.logAdminActivity({
        adminId: userId,
        action: 'all_sessions_invalidated',
        details: { sessionCount: deletedSessions.count }
      })
    } catch (error) {
      console.error('Failed to invalidate all admin sessions:', error)
      captureException(error)
    }
  }

  /**
   * Get active sessions for admin
   */
  async getAdminSessions(userId: string): Promise<AdminSession[]> {
    try {
      const sessions = await prisma.userSession.findMany({
        where: {
          userId,
          expiresAt: { gt: new Date() }
        },
        orderBy: { lastUsedAt: 'desc' }
      })

      return sessions.map(session => ({
        id: session.id,
        userId: session.userId,
        sessionToken: session.sessionToken,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        lastUsedAt: session.lastUsedAt,
        ipAddress: session.ipAddress || undefined,
        userAgent: session.userAgent || undefined,
        isActive: true
      }))
    } catch (error) {
      console.error('Failed to get admin sessions:', error)
      captureException(error)
      return []
    }
  }

  /**
   * Update admin last login time
   */
  async updateAdminLastLogin(userId: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() }
      })
    } catch (error) {
      console.error('Failed to update admin last login:', error)
      captureException(error)
    }
  }

  /**
   * Log admin activity to database
   */
  async logAdminActivity(activity: {
    adminId: string
    action: string
    targetId?: string
    targetType?: string
    details?: Record<string, any>
    ipAddress?: string
    userAgent?: string
    sessionId?: string
  }): Promise<AdminActivityLog | null> {
    try {
      // Save to database
      const auditLog = await prisma.adminAuditLog.create({
        data: {
          adminId: activity.adminId,
          action: activity.action,
          targetId: activity.targetId,
          targetType: activity.targetType,
          details: activity.details || {},
          ipAddress: activity.ipAddress,
          userAgent: activity.userAgent,
          sessionId: activity.sessionId
        }
      })

      const logEntry: AdminActivityLog = {
        id: auditLog.id,
        adminId: auditLog.adminId,
        action: auditLog.action,
        targetId: auditLog.targetId || undefined,
        targetType: auditLog.targetType || undefined,
        details: auditLog.details as Record<string, any>,
        ipAddress: auditLog.ipAddress || undefined,
        userAgent: auditLog.userAgent || undefined,
        sessionId: auditLog.sessionId || undefined,
        createdAt: auditLog.createdAt
      }

      // Also log to console for development
      console.log('📋 Admin Activity:', {
        id: logEntry.id,
        admin: activity.adminId,
        action: activity.action,
        target: activity.targetId ? `${activity.targetType}:${activity.targetId}` : undefined,
        timestamp: logEntry.createdAt.toISOString()
      })

      // Send to Sentry for monitoring
      captureException(new Error('Admin Activity Log'), {
        level: 'info',
        tags: { 
          component: 'admin_audit',
          action: activity.action 
        },
        extra: {
          auditLogId: logEntry.id,
          adminId: activity.adminId,
          action: activity.action,
          targetType: activity.targetType,
          targetId: activity.targetId
        }
      })

      return logEntry
    } catch (error) {
      console.error('Failed to log admin activity to database:', error)
      captureException(error, {
        tags: { 
          component: 'admin_audit',
          error_type: 'audit_log_failed'
        },
        extra: activity
      })
      return null
    }
  }

  /**
   * Check if user has admin privileges
   */
  async hasAdminPrivileges(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      })

      return user?.role === 'admin' || user?.role === 'moderator'
    } catch (error) {
      console.error('Failed to check admin privileges:', error)
      return false
    }
  }

  /**
   * Setup MFA for an admin user
   */
  async setupMfa(adminId: string): Promise<MfaSetupData | null> {
    try {
      const admin = await this.findAdminById(adminId)
      if (!admin) {
        throw new Error('Admin user not found')
      }

      // Generate MFA setup data
      const setupData = await mfaService.generateMfaSetup(admin.email)
      
      // Hash backup codes for storage
      const hashedBackupCodes = mfaService.hashBackupCodes(setupData.backupCodes)

      // Store encrypted secret and hashed backup codes
      await prisma.user.update({
        where: { id: adminId },
        data: {
          mfaSecret: setupData.secret, // In production, this should be encrypted
          mfaBackupCodes: hashedBackupCodes
        }
      })

      // Log MFA setup initiation
      await this.logAdminActivity({
        adminId,
        action: 'mfa_setup_initiated',
        details: { email: admin.email }
      })

      return setupData
    } catch (error) {
      console.error('Failed to setup MFA:', error)
      captureException(error)
      return null
    }
  }

  /**
   * Complete MFA setup by verifying the first code
   */
  async completeMfaSetup(adminId: string, verificationCode: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: adminId },
        select: { 
          id: true, 
          email: true, 
          mfaSecret: true, 
          mfaEnabled: true 
        }
      })

      if (!user || !user.mfaSecret) {
        return false
      }

      if (user.mfaEnabled) {
        throw new Error('MFA is already enabled for this user')
      }

      // Verify the code
      const verification = await mfaService.verifyMfaCode(
        user.mfaSecret,
        verificationCode
      )

      if (!verification.isValid) {
        // Log failed verification
        await this.logAdminActivity({
          adminId,
          action: 'mfa_setup_verification_failed',
          details: { email: user.email }
        })
        return false
      }

      // Enable MFA
      await prisma.user.update({
        where: { id: adminId },
        data: {
          mfaEnabled: true,
          mfaLastUsedAt: new Date()
        }
      })

      // Log successful MFA setup
      await this.logAdminActivity({
        adminId,
        action: 'mfa_setup_completed',
        details: { email: user.email }
      })

      return true
    } catch (error) {
      console.error('Failed to complete MFA setup:', error)
      captureException(error)
      return false
    }
  }

  /**
   * Verify MFA code for an admin user
   */
  async verifyMfaCode(adminId: string, code: string): Promise<MfaVerificationData> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: adminId },
        select: {
          id: true,
          email: true,
          mfaSecret: true,
          mfaBackupCodes: true,
          mfaEnabled: true
        }
      })

      if (!user || !user.mfaEnabled || !user.mfaSecret) {
        return { isValid: false }
      }

      const backupCodes = user.mfaBackupCodes as string[] || []
      
      // Verify the code
      const verification = await mfaService.verifyMfaCode(
        user.mfaSecret,
        code,
        backupCodes
      )

      if (!verification.isValid) {
        // Log failed verification
        await this.logAdminActivity({
          adminId,
          action: 'mfa_verification_failed',
          details: { 
            email: user.email,
            codeType: 'unknown'
          }
        })
        return { isValid: false }
      }

      // Update last used time
      const updateData: any = { mfaLastUsedAt: new Date() }

      // If a backup code was used, remove it
      if (verification.type === 'backup' && verification.usedBackupCode) {
        const remainingCodes = mfaService.removeUsedBackupCode(
          backupCodes,
          verification.usedBackupCode
        )
        updateData.mfaBackupCodes = remainingCodes

        // Log backup code usage
        await this.logAdminActivity({
          adminId,
          action: 'mfa_backup_code_used',
          details: { 
            email: user.email,
            remainingCodes: remainingCodes.length
          }
        })
      }

      await prisma.user.update({
        where: { id: adminId },
        data: updateData
      })

      // Log successful verification
      await this.logAdminActivity({
        adminId,
        action: 'mfa_verification_success',
        details: { 
          email: user.email,
          codeType: verification.type
        }
      })

      const remainingBackupCodes = verification.type === 'backup' 
        ? (updateData.mfaBackupCodes?.length || 0)
        : backupCodes.length

      return {
        isValid: true,
        requiresNewBackupCodes: remainingBackupCodes <= 2,
        remainingBackupCodes
      }
    } catch (error) {
      console.error('Failed to verify MFA code:', error)
      captureException(error)
      return { isValid: false }
    }
  }

  /**
   * Disable MFA for an admin user
   */
  async disableMfa(adminId: string, requesterId: string): Promise<boolean> {
    try {
      const user = await prisma.user.update({
        where: { id: adminId },
        data: {
          mfaEnabled: false,
          mfaSecret: null,
          mfaBackupCodes: null,
          mfaLastUsedAt: null
        }
      })

      // Log MFA disable
      await this.logAdminActivity({
        adminId: requesterId,
        action: 'mfa_disabled',
        targetId: adminId,
        targetType: 'admin_user',
        details: { 
          disabledForEmail: user.email,
          requestedBy: requesterId
        }
      })

      return true
    } catch (error) {
      console.error('Failed to disable MFA:', error)
      captureException(error)
      return false
    }
  }

  /**
   * Generate new backup codes for an admin user
   */
  async generateNewBackupCodes(adminId: string): Promise<string[] | null> {
    try {
      const user = await this.findAdminById(adminId)
      if (!user) {
        return null
      }

      // Generate new backup codes
      const newCodes = mfaService.generateNewBackupCodes()
      const hashedCodes = mfaService.hashBackupCodes(newCodes)

      // Update in database
      await prisma.user.update({
        where: { id: adminId },
        data: { mfaBackupCodes: hashedCodes }
      })

      // Log backup code regeneration
      await this.logAdminActivity({
        adminId,
        action: 'mfa_backup_codes_regenerated',
        details: { email: user.email }
      })

      return newCodes
    } catch (error) {
      console.error('Failed to generate new backup codes:', error)
      captureException(error)
      return null
    }
  }

  /**
   * Get MFA status for an admin user
   */
  async getMfaStatus(adminId: string): Promise<{
    isEnabled: boolean
    isRequired: boolean
    backupCodesCount: number
    lastUsedAt?: Date
  } | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: adminId },
        select: {
          role: true,
          mfaEnabled: true,
          mfaBackupCodes: true,
          mfaLastUsedAt: true
        }
      })

      if (!user) {
        return null
      }

      const backupCodes = user.mfaBackupCodes as string[] || []

      return {
        isEnabled: user.mfaEnabled,
        isRequired: mfaService.shouldRequireMfa(user.role),
        backupCodesCount: backupCodes.length,
        lastUsedAt: user.mfaLastUsedAt || undefined
      }
    } catch (error) {
      console.error('Failed to get MFA status:', error)
      captureException(error)
      return null
    }
  }

  /**
   * Get admin audit logs with pagination and filtering
   */
  async getAdminAuditLogs(options: {
    adminId?: string
    action?: string
    targetType?: string
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  } = {}): Promise<{
    logs: AdminActivityLog[]
    total: number
  }> {
    try {
      const {
        adminId,
        action,
        targetType,
        startDate,
        endDate,
        limit = 50,
        offset = 0
      } = options

      const where: any = {}
      
      if (adminId) where.adminId = adminId
      if (action) where.action = action
      if (targetType) where.targetType = targetType
      if (startDate || endDate) {
        where.createdAt = {}
        if (startDate) where.createdAt.gte = startDate
        if (endDate) where.createdAt.lte = endDate
      }

      const [logs, total] = await Promise.all([
        prisma.adminAuditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          include: {
            admin: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
                role: true
              }
            }
          }
        }),
        prisma.adminAuditLog.count({ where })
      ])

      return {
        logs: logs.map(log => ({
          id: log.id,
          adminId: log.adminId,
          action: log.action,
          targetId: log.targetId || undefined,
          targetType: log.targetType || undefined,
          details: log.details as Record<string, any>,
          ipAddress: log.ipAddress || undefined,
          userAgent: log.userAgent || undefined,
          sessionId: log.sessionId || undefined,
          createdAt: log.createdAt
        })),
        total
      }
    } catch (error) {
      console.error('Failed to get admin audit logs:', error)
      captureException(error)
      return { logs: [], total: 0 }
    }
  }

  /**
   * Get audit log statistics
   */
  async getAuditLogStats(): Promise<{
    totalLogs: number
    recentActivity: number
    topActions: Array<{ action: string; count: number }>
    topAdmins: Array<{ adminId: string; email: string; count: number }>
  }> {
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      
      const [totalLogs, recentActivity, actionCounts, adminCounts] = await Promise.all([
        prisma.adminAuditLog.count(),
        prisma.adminAuditLog.count({
          where: { createdAt: { gte: yesterday } }
        }),
        prisma.adminAuditLog.groupBy({
          by: ['action'],
          _count: { action: true },
          orderBy: { _count: { action: 'desc' } },
          take: 10
        }),
        prisma.adminAuditLog.groupBy({
          by: ['adminId'],
          _count: { adminId: true },
          orderBy: { _count: { adminId: 'desc' } },
          take: 10
        })
      ])

      // Get admin details for top admins
      const adminIds = adminCounts.map(item => item.adminId)
      const adminDetails = await prisma.user.findMany({
        where: { id: { in: adminIds } },
        select: { id: true, email: true }
      })

      const topAdmins = adminCounts.map(item => {
        const admin = adminDetails.find(a => a.id === item.adminId)
        return {
          adminId: item.adminId,
          email: admin?.email || 'Unknown',
          count: item._count.adminId
        }
      })

      return {
        totalLogs,
        recentActivity,
        topActions: actionCounts.map(item => ({
          action: item.action,
          count: item._count.action
        })),
        topAdmins
      }
    } catch (error) {
      console.error('Failed to get audit log stats:', error)
      captureException(error)
      return {
        totalLogs: 0,
        recentActivity: 0,
        topActions: [],
        topAdmins: []
      }
    }
  }

  /**
   * Clean up old audit logs (older than specified days)
   */
  async cleanupOldAuditLogs(retentionDays: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
      
      const result = await prisma.adminAuditLog.deleteMany({
        where: {
          createdAt: { lt: cutoffDate }
        }
      })

      console.log(`🧹 Cleaned up ${result.count} old audit logs older than ${retentionDays} days`)
      
      return result.count
    } catch (error) {
      console.error('Failed to cleanup old audit logs:', error)
      captureException(error)
      return 0
    }
  }

  /**
   * Get admin statistics
   */
  async getAdminStats(): Promise<{
    totalAdmins: number
    activeSessions: number
    recentLogins: number
    lastActivity?: Date
  }> {
    try {
      const [totalAdmins, activeSessions, recentLogins, lastLogin] = await Promise.all([
        prisma.user.count({
          where: { role: { in: ['admin', 'moderator'] } }
        }),
        prisma.userSession.count({
          where: {
            expiresAt: { gt: new Date() },
            user: { role: { in: ['admin', 'moderator'] } }
          }
        }),
        prisma.user.count({
          where: {
            role: { in: ['admin', 'moderator'] },
            lastLoginAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        }),
        prisma.user.findFirst({
          where: { role: { in: ['admin', 'moderator'] } },
          orderBy: { lastLoginAt: 'desc' },
          select: { lastLoginAt: true }
        })
      ])

      return {
        totalAdmins,
        activeSessions,
        recentLogins,
        lastActivity: lastLogin?.lastLoginAt || undefined
      }
    } catch (error) {
      console.error('Failed to get admin stats:', error)
      return {
        totalAdmins: 0,
        activeSessions: 0,
        recentLogins: 0
      }
    }
  }
}

// Singleton instance
export const adminRepository = new AdminRepository()
export default adminRepository