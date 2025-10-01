/**
 * Multi-Factor Authentication Service
 * Handles TOTP (Time-based One-Time Password) authentication for admin users
 */


// This module uses Node.js-only dependencies (crypto)
export const runtime = 'nodejs'

// Runtime check to prevent crypto import in edge runtime
let crypto: typeof import('crypto') | null = null
try {
  // Only import crypto if we're in a Node.js environment
  if (typeof process !== 'undefined' && process.versions?.node) {
    crypto = require('crypto')
  }
} catch (error) {
  console.warn('Crypto module not available in this runtime')
}

// We'll need to install these packages
// npm install otplib qrcode

interface MfaSetupResult {
  secret: string
  backupCodes: string[]
  qrCodeUrl: string
  manualEntryKey: string
}

interface MfaVerificationResult {
  isValid: boolean
  type: 'totp' | 'backup' | 'invalid'
  usedBackupCode?: string
}

class MfaService {
  private readonly APP_NAME = 'Spontra Admin'
  private readonly ISSUER = 'Spontra'
  private readonly WINDOW = 1 // Allow 1 window tolerance (30 seconds before/after)

  /**
   * Generate a new MFA secret and setup data for a user
   */
  async generateMfaSetup(userEmail: string): Promise<MfaSetupResult> {
    try {
      // Generate a base32-encoded secret (32 bytes = 52 base32 chars)
      const secret = this.generateBase32Secret()
      
      // Generate backup codes
      const backupCodes = this.generateBackupCodes()
      
      // Create TOTP URL for QR code
      const totpUrl = this.createTotpUrl(userEmail, secret)
      
      // Generate QR code data URL (would need qrcode library)
      const qrCodeUrl = await this.generateQrCode(totpUrl)
      
      return {
        secret,
        backupCodes,
        qrCodeUrl,
        manualEntryKey: this.formatSecretForManualEntry(secret)
      }
    } catch (error) {
      console.error('Failed to generate MFA setup:', error)
      console.error("MFA Error:", error)
      throw new Error('Failed to generate MFA setup')
    }
  }

  /**
   * Verify a TOTP code or backup code
   */
  async verifyMfaCode(
    secret: string,
    code: string,
    hashedBackupCodes?: string[]
  ): Promise<MfaVerificationResult> {
    try {
      // First try TOTP verification
      if (this.verifyTotpCode(secret, code)) {
        return { isValid: true, type: 'totp' }
      }

      // If TOTP fails, try backup codes
      if (hashedBackupCodes && hashedBackupCodes.length > 0) {
        const backupResult = this.verifyBackupCode(code, hashedBackupCodes)
        if (backupResult.isValid) {
          return {
            isValid: true,
            type: 'backup',
            usedBackupCode: backupResult.usedCode
          }
        }
      }

      return { isValid: false, type: 'invalid' }
    } catch (error) {
      console.error('Failed to verify MFA code:', error)
      console.error("MFA Error:", error)
      return { isValid: false, type: 'invalid' }
    }
  }

  /**
   * Generate a base32-encoded secret
   */
  private generateBase32Secret(): string {
    if (!crypto) {
      throw new Error('Crypto module not available in this runtime')
    }
    const buffer = crypto.randomBytes(20) // 160 bits
    return this.base32Encode(buffer)
  }

  /**
   * Generate backup codes (10 codes, 8 characters each)
   */
  private generateBackupCodes(): string[] {
    if (!crypto) {
      throw new Error('Crypto module not available in this runtime')
    }
    const codes: string[] = []
    for (let i = 0; i < 10; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase()
      codes.push(code.substring(0, 4) + '-' + code.substring(4, 8))
    }
    return codes
  }

  /**
   * Hash backup codes for storage
   */
  hashBackupCodes(codes: string[]): string[] {
    if (!crypto) {
      throw new Error('Crypto module not available in this runtime')
    }
    return codes.map(code => 
      crypto!.createHash('sha256').update(code.replace('-', '')).digest('hex')
    )
  }

  /**
   * Create TOTP URL for QR code generation
   */
  private createTotpUrl(email: string, secret: string): string {
    const params = new URLSearchParams({
      secret,
      issuer: this.ISSUER,
      algorithm: 'SHA1',
      digits: '6',
      period: '30'
    })
    
    return `otpauth://totp/${encodeURIComponent(this.ISSUER)}:${encodeURIComponent(email)}?${params}`
  }

  /**
   * Generate QR code data URL (placeholder - would need qrcode library)
   */
  private async generateQrCode(totpUrl: string): Promise<string> {
    try {
      // This would use the qrcode library in a real implementation
      // For now, return a placeholder that can be used to generate QR codes client-side
      return `data:text/plain;base64,${Buffer.from(totpUrl).toString('base64')}`
    } catch (error) {
      console.error('Failed to generate QR code:', error)
      return ''
    }
  }

  /**
   * Format secret for manual entry (with spaces every 4 characters)
   */
  private formatSecretForManualEntry(secret: string): string {
    return secret.match(/.{1,4}/g)?.join(' ') || secret
  }

  /**
   * Verify TOTP code against secret
   */
  private verifyTotpCode(secret: string, code: string): boolean {
    try {
      const now = Math.floor(Date.now() / 1000)
      const counter = Math.floor(now / 30) // 30-second window

      // Check current window and ±1 window for clock drift tolerance
      for (let i = -this.WINDOW; i <= this.WINDOW; i++) {
        const testCounter = counter + i
        const expectedCode = this.generateTotpCode(secret, testCounter)
        if (this.constantTimeCompare(code.replace(/\\s/g, ''), expectedCode)) {
          return true
        }
      }

      return false
    } catch (error) {
      console.error('Failed to verify TOTP code:', error)
      return false
    }
  }

  /**
   * Generate TOTP code for a given counter
   */
  private generateTotpCode(secret: string, counter: number): string {
    try {
      const key = this.base32Decode(secret)
      const counterBuffer = Buffer.alloc(8)
      counterBuffer.writeBigUInt64BE(BigInt(counter), 0)

      // HMAC-SHA1
      const crypto = require('crypto')
      const hmac = crypto.createHmac('sha1', key)
      hmac.update(counterBuffer)
      const hash = hmac.digest()

      // Dynamic truncation
      const offset = hash[hash.length - 1] & 0x0f
      const code = (
        ((hash[offset] & 0x7f) << 24) |
        ((hash[offset + 1] & 0xff) << 16) |
        ((hash[offset + 2] & 0xff) << 8) |
        (hash[offset + 3] & 0xff)
      ) % 1000000

      return code.toString().padStart(6, '0')
    } catch (error) {
      console.error('Failed to generate TOTP code:', error)
      return '000000'
    }
  }

  /**
   * Verify backup code
   */
  private verifyBackupCode(
    inputCode: string, 
    hashedCodes: string[]
  ): { isValid: boolean; usedCode?: string } {
    if (!crypto) {
      throw new Error('Crypto module not available in this runtime')
    }
    const cleanCode = inputCode.replace(/[^A-F0-9]/gi, '').toUpperCase()
    const hashedInput = crypto.createHash('sha256').update(cleanCode).digest('hex')

    for (const hashedCode of hashedCodes) {
      if (this.constantTimeCompare(hashedInput, hashedCode)) {
        return { isValid: true, usedCode: hashedCode }
      }
    }

    return { isValid: false }
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false
    }

    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }

    return result === 0
  }

  /**
   * Base32 encoding (RFC 4648)
   */
  private base32Encode(buffer: Buffer): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    let result = ''
    let bits = 0
    let value = 0

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i]
      bits += 8

      while (bits >= 5) {
        result += alphabet[(value >>> (bits - 5)) & 31]
        bits -= 5
      }
    }

    if (bits > 0) {
      result += alphabet[(value << (5 - bits)) & 31]
    }

    return result
  }

  /**
   * Base32 decoding (RFC 4648)
   */
  private base32Decode(input: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    const cleanInput = input.toUpperCase().replace(/[^A-Z2-7]/g, '')
    
    let bits = 0
    let value = 0
    const result: number[] = []

    for (let i = 0; i < cleanInput.length; i++) {
      const index = alphabet.indexOf(cleanInput[i])
      if (index === -1) continue

      value = (value << 5) | index
      bits += 5

      if (bits >= 8) {
        result.push((value >>> (bits - 8)) & 255)
        bits -= 8
      }
    }

    return Buffer.from(result)
  }

  /**
   * Remove a used backup code from the list
   */
  removeUsedBackupCode(hashedCodes: string[], usedCode: string): string[] {
    return hashedCodes.filter(code => code !== usedCode)
  }

  /**
   * Check if user should be required to setup MFA based on role
   */
  shouldRequireMfa(userRole: string): boolean {
    // Require MFA for admin users, optional for moderators
    return userRole === 'admin'
  }

  /**
   * Generate new backup codes (for when user runs low)
   */
  generateNewBackupCodes(): string[] {
    return this.generateBackupCodes()
  }
}

export const mfaService = new MfaService()
export default mfaService