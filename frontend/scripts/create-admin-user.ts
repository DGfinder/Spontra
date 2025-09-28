#!/usr/bin/env tsx

/**
 * Admin User Creation Script
 * Creates the initial admin user in Neon database with secure credentials
 */

import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/password'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

interface AdminUserData {
  email: string
  password: string
  firstName: string
  lastName: string
  username?: string
}

class AdminUserCreator {
  /**
   * Create initial admin user
   */
  async createAdminUser(data?: Partial<AdminUserData>): Promise<void> {
    console.log('🔧 Creating admin user in Neon database...')

    try {
      // Use provided data or get from environment/prompts
      const adminData = await this.getAdminUserData(data)
      
      // Check if admin user already exists
      const existingAdmin = await this.findExistingAdmin(adminData.email)
      if (existingAdmin) {
        console.log('⚠️ Admin user already exists:', existingAdmin.email)
        console.log('Use the update command to modify existing admin user')
        return
      }

      // Hash the password
      const passwordHash = await hashPassword(adminData.password)

      // Create admin user
      const adminUser = await prisma.user.create({
        data: {
          email: adminData.email,
          passwordHash,
          firstName: adminData.firstName,
          lastName: adminData.lastName,
          username: adminData.username,
          role: 'admin',
          isEmailVerified: true, // Admin users are pre-verified
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      console.log('✅ Admin user created successfully:')
      console.log(`   ID: ${adminUser.id}`)
      console.log(`   Email: ${adminUser.email}`)
      console.log(`   Name: ${adminUser.firstName} ${adminUser.lastName}`)
      console.log(`   Role: ${adminUser.role}`)
      console.log(`   Created: ${adminUser.createdAt.toISOString()}`)

      // Log the credentials securely
      this.logAdminCredentials(adminData)

    } catch (error) {
      console.error('❌ Failed to create admin user:', error)
      throw error
    }
  }

  /**
   * Update existing admin user
   */
  async updateAdminUser(email: string, updates: Partial<AdminUserData>): Promise<void> {
    console.log(`🔧 Updating admin user: ${email}`)

    try {
      const existingAdmin = await this.findExistingAdmin(email)
      if (!existingAdmin) {
        console.log('❌ Admin user not found:', email)
        return
      }

      const updateData: any = {}
      
      if (updates.email) updateData.email = updates.email
      if (updates.firstName) updateData.firstName = updates.firstName
      if (updates.lastName) updateData.lastName = updates.lastName
      if (updates.username) updateData.username = updates.username
      if (updates.password) {
        updateData.passwordHash = await hashPassword(updates.password)
      }

      updateData.updatedAt = new Date()

      const updatedUser = await prisma.user.update({
        where: { id: existingAdmin.id },
        data: updateData
      })

      console.log('✅ Admin user updated successfully:')
      console.log(`   ID: ${updatedUser.id}`)
      console.log(`   Email: ${updatedUser.email}`)
      console.log(`   Name: ${updatedUser.firstName} ${updatedUser.lastName}`)
      console.log(`   Updated: ${updatedUser.updatedAt.toISOString()}`)

      if (updates.password) {
        this.logAdminCredentials({ 
          email: updatedUser.email, 
          password: updates.password,
          firstName: updatedUser.firstName || '',
          lastName: updatedUser.lastName || ''
        })
      }

    } catch (error) {
      console.error('❌ Failed to update admin user:', error)
      throw error
    }
  }

  /**
   * List all admin users
   */
  async listAdminUsers(): Promise<void> {
    console.log('📋 Admin users in database:')

    try {
      const adminUsers = await prisma.user.findMany({
        where: { role: 'admin' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          username: true,
          isEmailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true
        }
      })

      if (adminUsers.length === 0) {
        console.log('   No admin users found')
        return
      }

      adminUsers.forEach((user, index) => {
        console.log(`\n   ${index + 1}. ${user.firstName} ${user.lastName}`)
        console.log(`      Email: ${user.email}`)
        console.log(`      Username: ${user.username || 'N/A'}`)
        console.log(`      Verified: ${user.isEmailVerified ? 'Yes' : 'No'}`)
        console.log(`      Last Login: ${user.lastLoginAt?.toISOString() || 'Never'}`)
        console.log(`      Created: ${user.createdAt.toISOString()}`)
      })

    } catch (error) {
      console.error('❌ Failed to list admin users:', error)
      throw error
    }
  }

  /**
   * Delete admin user (with confirmation)
   */
  async deleteAdminUser(email: string, force = false): Promise<void> {
    console.log(`🗑️ Deleting admin user: ${email}`)

    try {
      const existingAdmin = await this.findExistingAdmin(email)
      if (!existingAdmin) {
        console.log('❌ Admin user not found:', email)
        return
      }

      // Safety check - don't allow deleting the last admin
      const adminCount = await prisma.user.count({
        where: { role: 'admin' }
      })

      if (adminCount <= 1) {
        console.log('❌ Cannot delete the last admin user')
        return
      }

      if (!force) {
        console.log('⚠️ This will permanently delete the admin user')
        console.log('⚠️ Use --force flag to confirm deletion')
        return
      }

      // Delete associated sessions first
      await prisma.userSession.deleteMany({
        where: { userId: existingAdmin.id }
      })

      // Delete the user
      await prisma.user.delete({
        where: { id: existingAdmin.id }
      })

      console.log('✅ Admin user deleted successfully')

    } catch (error) {
      console.error('❌ Failed to delete admin user:', error)
      throw error
    }
  }

  /**
   * Get admin user data from environment or prompts
   */
  private async getAdminUserData(provided?: Partial<AdminUserData>): Promise<AdminUserData> {
    // Try environment variables first
    const envEmail = process.env.ADMIN_EMAIL
    const envPassword = process.env.ADMIN_PASSWORD
    const envFirstName = process.env.ADMIN_FIRST_NAME
    const envLastName = process.env.ADMIN_LAST_NAME

    const data: AdminUserData = {
      email: provided?.email || envEmail || 'admin@spontra.com',
      password: provided?.password || envPassword || this.generateSecurePassword(),
      firstName: provided?.firstName || envFirstName || 'Admin',
      lastName: provided?.lastName || envLastName || 'User',
      username: provided?.username || 'admin'
    }

    // Validate email format
    if (!this.isValidEmail(data.email)) {
      throw new Error('Invalid email format')
    }

    // Validate password strength
    if (!this.isStrongPassword(data.password)) {
      throw new Error('Password must be at least 12 characters with uppercase, lowercase, numbers, and symbols')
    }

    return data
  }

  /**
   * Find existing admin user by email
   */
  private async findExistingAdmin(email: string) {
    return await prisma.user.findFirst({
      where: { 
        email,
        role: 'admin'
      }
    })
  }

  /**
   * Generate secure random password
   */
  private generateSecurePassword(): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    const length = 16
    let password = ''
    
    for (let i = 0; i < length; i++) {
      const randomIndex = randomBytes(1)[0] % charset.length
      password += charset[randomIndex]
    }
    
    return password
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate password strength
   */
  private isStrongPassword(password: string): boolean {
    if (password.length < 12) return false
    if (!/[A-Z]/.test(password)) return false // uppercase
    if (!/[a-z]/.test(password)) return false // lowercase
    if (!/[0-9]/.test(password)) return false // numbers
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false // symbols
    return true
  }

  /**
   * Securely log admin credentials
   */
  private logAdminCredentials(data: AdminUserData): void {
    console.log('\n🔐 Admin Login Credentials:')
    console.log('================================')
    console.log(`Email: ${data.email}`)
    console.log(`Password: ${data.password}`)
    console.log('================================')
    console.log('⚠️ IMPORTANT: Store these credentials securely!')
    console.log('⚠️ This password will not be shown again.')
    
    if (process.env.NODE_ENV === 'production') {
      console.log('⚠️ Consider changing the password after first login in production.')
    }
  }
}

// CLI interface
async function main() {
  const creator = new AdminUserCreator()
  const command = process.argv[2]
  const args = process.argv.slice(3)

  try {
    switch (command) {
      case 'create':
        await creator.createAdminUser({
          email: args.find(arg => arg.startsWith('--email='))?.split('=')[1],
          password: args.find(arg => arg.startsWith('--password='))?.split('=')[1],
          firstName: args.find(arg => arg.startsWith('--first-name='))?.split('=')[1],
          lastName: args.find(arg => arg.startsWith('--last-name='))?.split('=')[1],
          username: args.find(arg => arg.startsWith('--username='))?.split('=')[1]
        })
        break

      case 'update':
        const updateEmail = args[0]
        if (!updateEmail) {
          console.log('❌ Email required for update command')
          console.log('Usage: npm run admin:update admin@spontra.com --password=newpass')
          process.exit(1)
        }
        await creator.updateAdminUser(updateEmail, {
          password: args.find(arg => arg.startsWith('--password='))?.split('=')[1],
          firstName: args.find(arg => arg.startsWith('--first-name='))?.split('=')[1],
          lastName: args.find(arg => arg.startsWith('--last-name='))?.split('=')[1],
          username: args.find(arg => arg.startsWith('--username='))?.split('=')[1]
        })
        break

      case 'list':
        await creator.listAdminUsers()
        break

      case 'delete':
        const deleteEmail = args[0]
        const force = args.includes('--force')
        if (!deleteEmail) {
          console.log('❌ Email required for delete command')
          console.log('Usage: npm run admin:delete admin@spontra.com --force')
          process.exit(1)
        }
        await creator.deleteAdminUser(deleteEmail, force)
        break

      default:
        console.log('Usage:')
        console.log('  npm run admin:create                                    - Create admin with env vars or defaults')
        console.log('  npm run admin:create --email=admin@spontra.com         - Create admin with specific email')
        console.log('  npm run admin:update admin@spontra.com --password=new  - Update admin password')
        console.log('  npm run admin:list                                     - List all admin users')
        console.log('  npm run admin:delete admin@spontra.com --force         - Delete admin user')
        console.log('')
        console.log('Environment variables:')
        console.log('  ADMIN_EMAIL        - Default admin email')
        console.log('  ADMIN_PASSWORD     - Default admin password')
        console.log('  ADMIN_FIRST_NAME   - Default admin first name')
        console.log('  ADMIN_LAST_NAME    - Default admin last name')
        process.exit(1)
    }

    console.log('\n✅ Operation completed successfully')

  } catch (error) {
    console.error('\n❌ Operation failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export default AdminUserCreator