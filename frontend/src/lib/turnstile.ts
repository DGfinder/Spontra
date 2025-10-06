/**
 * Cloudflare Turnstile CAPTCHA Verification
 *
 * Provides server-side verification of Turnstile tokens
 * https://developers.cloudflare.com/turnstile/
 */

interface TurnstileVerificationResponse {
  success: boolean
  'error-codes'?: string[]
  challenge_ts?: string
  hostname?: string
}

/**
 * Verify Cloudflare Turnstile token
 *
 * @param token - Turnstile token from client
 * @param remoteIp - Optional client IP address
 * @returns Verification result
 */
export async function verifyTurnstile(
  token: string,
  remoteIp?: string
): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  if (!secretKey) {
    console.error('[Turnstile] Secret key not configured')
    // In development or if not configured, allow requests to pass through
    return { success: true }
  }

  try {
    const formData = new URLSearchParams()
    formData.append('secret', secretKey)
    formData.append('response', token)
    if (remoteIp) {
      formData.append('remoteip', remoteIp)
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const data: TurnstileVerificationResponse = await response.json()

    if (!data.success) {
      console.error('[Turnstile] Verification failed:', data['error-codes'])
      return {
        success: false,
        error: 'CAPTCHA verification failed. Please try again.',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[Turnstile] Error verifying token:', error)
    // On error, allow the request to continue (fail open)
    // You may want to change this to fail closed in production
    return { success: true }
  }
}
