/**
 * Postback Signature Verification
 *
 * Validates webhook signatures from affiliate networks:
 * - Impact Radius (HMAC-SHA256)
 * - Commission Junction (HMAC-SHA256)
 * - Awin (MD5)
 * - Partnerize (HMAC-SHA256)
 *
 * Prevents fake conversions and ensures legitimate postbacks only
 */

import crypto from 'crypto'
import { NextRequest } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export type AffilateNetwork = 'impact' | 'cj' | 'awin' | 'partnerize'

interface VerificationResult {
  valid: boolean
  network?: AffilateNetwork
  reason?: string
}

/**
 * Verify postback signature from Impact Radius
 *
 * Impact uses HMAC-SHA256 with format: sha256=<signature>
 */
export function verifyImpactSignature(
  payload: string | Record<string, any>,
  signature: string
): VerificationResult {
  try {
    const secret = process.env.IMPACT_SIGNATURE_SECRET

    if (!secret) {
      Sentry.captureMessage('Impact signature secret not configured', {
        level: 'error'
      })
      return { valid: false, reason: 'Secret not configured' }
    }

    // Payload should be the raw query string or JSON string
    const payloadString = typeof payload === 'string'
      ? payload
      : JSON.stringify(payload)

    // Remove 'sha256=' prefix if present
    const signatureValue = signature.replace(/^sha256=/, '')

    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('base64')

    const valid = crypto.timingSafeEqual(
      Buffer.from(signatureValue),
      Buffer.from(expectedSignature)
    )

    if (!valid) {
      Sentry.captureMessage('Impact signature verification failed', {
        level: 'warning',
        extra: {
          receivedSignature: signatureValue.substring(0, 10) + '...',
          payloadLength: payloadString.length
        }
      })
    }

    return { valid, network: 'impact' }
  } catch (error) {
    Sentry.captureException(error, {
      tags: { module: 'postbackVerifier', network: 'impact' }
    })
    return { valid: false, reason: 'Verification error' }
  }
}

/**
 * Verify postback signature from Commission Junction
 *
 * CJ uses HMAC-SHA256
 */
export function verifyCJSignature(
  payload: string | Record<string, any>,
  signature: string
): VerificationResult {
  try {
    const secret = process.env.CJ_SIGNATURE_SECRET

    if (!secret) {
      Sentry.captureMessage('CJ signature secret not configured', {
        level: 'error'
      })
      return { valid: false, reason: 'Secret not configured' }
    }

    const payloadString = typeof payload === 'string'
      ? payload
      : JSON.stringify(payload)

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex')

    const valid = crypto.timingSafeEqual(
      Buffer.from(signature.toLowerCase()),
      Buffer.from(expectedSignature.toLowerCase())
    )

    if (!valid) {
      Sentry.captureMessage('CJ signature verification failed', {
        level: 'warning',
        extra: {
          receivedSignature: signature.substring(0, 10) + '...',
          payloadLength: payloadString.length
        }
      })
    }

    return { valid, network: 'cj' }
  } catch (error) {
    Sentry.captureException(error, {
      tags: { module: 'postbackVerifier', network: 'cj' }
    })
    return { valid: false, reason: 'Verification error' }
  }
}

/**
 * Verify postback signature from Awin
 *
 * Awin uses MD5 hash
 */
export function verifyAwinSignature(
  payload: string | Record<string, any>,
  signature: string
): VerificationResult {
  try {
    const secret = process.env.AWIN_SIGNATURE_SECRET

    if (!secret) {
      Sentry.captureMessage('Awin signature secret not configured', {
        level: 'error'
      })
      return { valid: false, reason: 'Secret not configured' }
    }

    const payloadString = typeof payload === 'string'
      ? payload
      : JSON.stringify(payload)

    const expectedSignature = crypto
      .createHash('md5')
      .update(payloadString + secret)
      .digest('hex')

    const valid = crypto.timingSafeEqual(
      Buffer.from(signature.toLowerCase()),
      Buffer.from(expectedSignature.toLowerCase())
    )

    if (!valid) {
      Sentry.captureMessage('Awin signature verification failed', {
        level: 'warning',
        extra: {
          receivedSignature: signature.substring(0, 10) + '...',
          payloadLength: payloadString.length
        }
      })
    }

    return { valid, network: 'awin' }
  } catch (error) {
    Sentry.captureException(error, {
      tags: { module: 'postbackVerifier', network: 'awin' }
    })
    return { valid: false, reason: 'Verification error' }
  }
}

/**
 * Verify postback signature from Partnerize
 *
 * Partnerize uses HMAC-SHA1
 */
export function verifyPartnerizeSignature(
  payload: string | Record<string, any>,
  signature: string
): VerificationResult {
  try {
    const secret = process.env.PARTNERIZE_SIGNATURE_SECRET

    if (!secret) {
      Sentry.captureMessage('Partnerize signature secret not configured', {
        level: 'error'
      })
      return { valid: false, reason: 'Secret not configured' }
    }

    const payloadString = typeof payload === 'string'
      ? payload
      : JSON.stringify(payload)

    const expectedSignature = crypto
      .createHmac('sha1', secret)
      .update(payloadString)
      .digest('hex')

    const valid = crypto.timingSafeEqual(
      Buffer.from(signature.toLowerCase()),
      Buffer.from(expectedSignature.toLowerCase())
    )

    if (!valid) {
      Sentry.captureMessage('Partnerize signature verification failed', {
        level: 'warning',
        extra: {
          receivedSignature: signature.substring(0, 10) + '...',
          payloadLength: payloadString.length
        }
      })
    }

    return { valid, network: 'partnerize' }
  } catch (error) {
    Sentry.captureException(error, {
      tags: { module: 'postbackVerifier', network: 'partnerize' }
    })
    return { valid: false, reason: 'Verification error' }
  }
}

/**
 * Verify IP address is from known affiliate network
 *
 * Provides additional layer of security beyond signature verification
 */
export function verifyIPWhitelist(
  network: AffilateNetwork,
  ipAddress: string
): boolean {
  const whitelists: Record<AffilateNetwork, string[]> = {
    impact: [
      // Impact Radius IP ranges (update with actual IPs from Impact)
      '52.4.0.0/14',
      '54.164.0.0/16',
      '34.192.0.0/12'
    ],
    cj: [
      // Commission Junction IP ranges (update with actual IPs from CJ)
      '208.71.44.0/24',
      '208.71.45.0/24'
    ],
    awin: [
      // Awin IP ranges (update with actual IPs from Awin)
      '213.127.80.0/24',
      '213.127.81.0/24'
    ],
    partnerize: [
      // Partnerize IP ranges (update with actual IPs from Partnerize)
      '185.78.72.0/24',
      '185.78.73.0/24'
    ]
  }

  const allowedRanges = whitelists[network] || []

  // Simple CIDR check (for production, use a proper IP range library)
  for (const range of allowedRanges) {
    if (ipMatchesCIDR(ipAddress, range)) {
      return true
    }
  }

  // Log potential security issue
  Sentry.captureMessage('Postback from non-whitelisted IP', {
    level: 'warning',
    extra: { network, ipAddress }
  })

  return false
}

/**
 * Simple CIDR match (replace with proper library in production)
 */
function ipMatchesCIDR(ip: string, cidr: string): boolean {
  // Simplified implementation - use 'ip-range-check' or similar in production
  const [range, bits] = cidr.split('/')

  if (!bits) {
    // Exact IP match
    return ip === range
  }

  // For proper CIDR matching, use a library
  // This is a placeholder that checks exact match only
  return ip.startsWith(range.split('.').slice(0, 2).join('.'))
}

/**
 * Main verification function - use this in webhook endpoints
 */
export function verifyPostback(
  req: NextRequest,
  network: AffilateNetwork,
  payload: string | Record<string, any>
): VerificationResult {
  // Get signature from headers
  const signatureHeader = req.headers.get('x-signature') ||
                          req.headers.get('x-impact-signature') ||
                          req.headers.get('x-cj-signature')

  if (!signatureHeader) {
    return { valid: false, reason: 'Missing signature header' }
  }

  // Verify signature based on network
  let result: VerificationResult

  switch (network) {
    case 'impact':
      result = verifyImpactSignature(payload, signatureHeader)
      break
    case 'cj':
      result = verifyCJSignature(payload, signatureHeader)
      break
    case 'awin':
      result = verifyAwinSignature(payload, signatureHeader)
      break
    case 'partnerize':
      result = verifyPartnerizeSignature(payload, signatureHeader)
      break
    default:
      return { valid: false, reason: 'Unknown network' }
  }

  // Optional: Additional IP whitelist check
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] ||
                    req.headers.get('x-real-ip') ||
                    'unknown'

  if (result.valid && process.env.FEATURE_IP_ALLOWLIST_ENFORCEMENT === 'true') {
    const ipValid = verifyIPWhitelist(network, ipAddress)
    if (!ipValid) {
      return { valid: false, reason: 'IP not whitelisted' }
    }
  }

  return result
}

/**
 * Log verification attempt for security monitoring
 */
export async function logVerificationAttempt(
  network: AffilateNetwork,
  result: VerificationResult,
  ipAddress: string
): Promise<void> {
  try {
    const { db } = await import('@/server/db')

    await db.postbackLog.create({
      data: {
        network,
        ipAddress,
        verified: result.valid,
        reason: result.reason,
        signature: 'hidden', // Don't log full signature for security
        payload: 'hidden'    // Don't log full payload for security
      }
    })
  } catch (error) {
    // Don't fail main flow if logging fails
    console.error('[PostbackVerifier] Failed to log verification attempt:', error)
  }
}