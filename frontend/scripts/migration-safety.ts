#!/usr/bin/env tsx

/**
 * Database Migration Safety System
 * Automated backup, migration, and rollback procedures for production safety
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import { env, isProduction } from '../src/config/environment'

const execAsync = promisify(exec)

interface MigrationConfig {
  backupDir: string
  maxBackups: number
  migrationTimeout: number
  rollbackEnabled: boolean
}

class MigrationSafetyManager {
  private config: MigrationConfig
  private timestamp: string

  constructor() {
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    this.config = {
      backupDir: process.env.MIGRATION_BACKUP_DIR || './backups/migrations',
      maxBackups: parseInt(process.env.MAX_MIGRATION_BACKUPS || '10'),
      migrationTimeout: parseInt(process.env.MIGRATION_TIMEOUT_MS || '300000'), // 5 minutes
      rollbackEnabled: process.env.MIGRATION_ROLLBACK_ENABLED !== 'false'
    }
  }

  /**
   * Run migration with safety procedures
   */
  async runSafeMigration(): Promise<void> {
    console.log('🔄 Starting database migration with safety procedures...')
    
    try {
      // Step 1: Pre-migration validation
      await this.validateEnvironment()
      
      // Step 2: Create backup
      const backupPath = await this.createDatabaseBackup()
      
      // Step 3: Check migration status
      await this.checkMigrationStatus()
      
      // Step 4: Run migration with timeout
      await this.runMigrationWithTimeout()
      
      // Step 5: Verify migration success
      await this.verifyMigration()
      
      // Step 6: Cleanup old backups
      await this.cleanupOldBackups()
      
      console.log('✅ Migration completed successfully')
      
    } catch (error) {
      console.error('❌ Migration failed:', error)
      
      if (this.config.rollbackEnabled && isProduction) {
        console.log('🔄 Initiating automatic rollback...')
        await this.rollbackMigration()
      }
      
      throw error
    }
  }

  /**
   * Validate environment for migration
   */
  private async validateEnvironment(): Promise<void> {
    console.log('🔍 Validating environment...')
    
    // Check database connection
    try {
      await execAsync('npx prisma db execute --preview-feature --stdin < /dev/null')
    } catch (error) {
      throw new Error('Database connection failed. Cannot proceed with migration.')
    }
    
    // Check required environment variables
    if (isProduction) {
      const requiredVars = ['DATABASE_URL', 'POSTGRES_URL_NON_POOLING']
      for (const varName of requiredVars) {
        if (!process.env[varName]) {
          throw new Error(`Required environment variable ${varName} is missing`)
        }
      }
    }
    
    // Ensure backup directory exists
    await fs.mkdir(this.config.backupDir, { recursive: true })
    
    console.log('✅ Environment validation passed')
  }

  /**
   * Create database backup before migration
   */
  private async createDatabaseBackup(): Promise<string> {
    console.log('💾 Creating database backup...')
    
    const backupFileName = `backup-${this.timestamp}.sql`
    const backupPath = path.join(this.config.backupDir, backupFileName)
    
    try {
      // Get direct database URL (non-pooling for pg_dump)
      const dbUrl = env.POSTGRES_URL_NON_POOLING || env.DATABASE_URL
      
      // Create backup using pg_dump
      const command = `pg_dump "${dbUrl}" > "${backupPath}"`
      await execAsync(command)
      
      // Verify backup file was created and has content
      const stats = await fs.stat(backupPath)
      if (stats.size === 0) {
        throw new Error('Backup file is empty')
      }
      
      console.log(`✅ Backup created: ${backupPath} (${Math.round(stats.size / 1024)}KB)`)
      return backupPath
      
    } catch (error) {
      throw new Error(`Failed to create database backup: ${error}`)
    }
  }

  /**
   * Check current migration status
   */
  private async checkMigrationStatus(): Promise<void> {
    console.log('📋 Checking migration status...')
    
    try {
      const { stdout } = await execAsync('npx prisma migrate status')
      console.log('Current migration status:')
      console.log(stdout)
      
      // Check if there are pending migrations
      if (stdout.includes('Following migration have not yet been applied')) {
        console.log('⚠️ Pending migrations detected')
      } else {
        console.log('ℹ️ No pending migrations found')
      }
      
    } catch (error) {
      console.warn('⚠️ Could not check migration status:', error)
    }
  }

  /**
   * Run migration with timeout protection
   */
  private async runMigrationWithTimeout(): Promise<void> {
    console.log('🚀 Running database migration...')
    
    const migrationPromise = execAsync('npx prisma migrate deploy')
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Migration timed out after ${this.config.migrationTimeout}ms`))
      }, this.config.migrationTimeout)
    })
    
    try {
      const { stdout, stderr } = await Promise.race([migrationPromise, timeoutPromise])
      
      if (stderr && !stderr.includes('warning')) {
        throw new Error(`Migration stderr: ${stderr}`)
      }
      
      console.log('Migration output:')
      console.log(stdout)
      
    } catch (error) {
      throw new Error(`Migration execution failed: ${error}`)
    }
  }

  /**
   * Verify migration was successful
   */
  private async verifyMigration(): Promise<void> {
    console.log('🔍 Verifying migration...')
    
    try {
      // Check migration status again
      const { stdout } = await execAsync('npx prisma migrate status')
      
      if (stdout.includes('Database schema is up to date')) {
        console.log('✅ Migration verification passed')
      } else {
        throw new Error('Migration verification failed - database not up to date')
      }
      
      // Test basic database connectivity
      await execAsync('npx prisma db execute --preview-feature --stdin < /dev/null')
      console.log('✅ Database connectivity verified')
      
    } catch (error) {
      throw new Error(`Migration verification failed: ${error}`)
    }
  }

  /**
   * Rollback migration using backup
   */
  private async rollbackMigration(): Promise<void> {
    console.log('🔄 Rolling back migration...')
    
    try {
      // Find the most recent backup
      const backupFiles = await fs.readdir(this.config.backupDir)
      const sqlBackups = backupFiles
        .filter(file => file.endsWith('.sql'))
        .sort()
        .reverse()
      
      if (sqlBackups.length === 0) {
        throw new Error('No backup files found for rollback')
      }
      
      const latestBackup = path.join(this.config.backupDir, sqlBackups[0])
      console.log(`📁 Using backup: ${latestBackup}`)
      
      // Get direct database URL for restoration
      const dbUrl = env.POSTGRES_URL_NON_POOLING || env.DATABASE_URL
      
      // Restore from backup
      const command = `psql "${dbUrl}" < "${latestBackup}"`
      await execAsync(command)
      
      console.log('✅ Database rollback completed')
      
      // Reset Prisma migration state
      await execAsync('npx prisma migrate resolve --rolled-back')
      
      console.log('✅ Migration state reset')
      
    } catch (error) {
      console.error('❌ Rollback failed:', error)
      throw new Error(`Rollback procedure failed: ${error}`)
    }
  }

  /**
   * Cleanup old backup files
   */
  private async cleanupOldBackups(): Promise<void> {
    console.log('🧹 Cleaning up old backups...')
    
    try {
      const backupFiles = await fs.readdir(this.config.backupDir)
      const sqlBackups = backupFiles
        .filter(file => file.endsWith('.sql'))
        .sort()
      
      if (sqlBackups.length > this.config.maxBackups) {
        const filesToDelete = sqlBackups.slice(0, sqlBackups.length - this.config.maxBackups)
        
        for (const file of filesToDelete) {
          await fs.unlink(path.join(this.config.backupDir, file))
          console.log(`🗑️ Deleted old backup: ${file}`)
        }
      }
      
      console.log(`✅ Backup cleanup completed (keeping ${Math.min(sqlBackups.length, this.config.maxBackups)} backups)`)
      
    } catch (error) {
      console.warn('⚠️ Backup cleanup failed:', error)
    }
  }

  /**
   * Get migration information
   */
  async getMigrationInfo(): Promise<void> {
    console.log('📊 Migration Information:')
    console.log(`- Environment: ${env.NODE_ENV}`)
    console.log(`- Backup directory: ${this.config.backupDir}`)
    console.log(`- Max backups: ${this.config.maxBackups}`)
    console.log(`- Migration timeout: ${this.config.migrationTimeout}ms`)
    console.log(`- Rollback enabled: ${this.config.rollbackEnabled}`)
    
    try {
      const { stdout } = await execAsync('npx prisma migrate status')
      console.log('\nCurrent migration status:')
      console.log(stdout)
    } catch (error) {
      console.warn('⚠️ Could not fetch migration status')
    }
  }
}

// CLI interface
async function main() {
  const manager = new MigrationSafetyManager()
  const command = process.argv[2]

  try {
    switch (command) {
      case 'migrate':
        await manager.runSafeMigration()
        break
      case 'info':
        await manager.getMigrationInfo()
        break
      default:
        console.log('Usage:')
        console.log('  npm run migrate:safe         - Run migration with safety procedures')
        console.log('  npm run migrate:info          - Show migration information')
        process.exit(1)
    }
  } catch (error) {
    console.error('❌ Operation failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export default MigrationSafetyManager