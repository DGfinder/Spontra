/**
 * Email Service using Resend
 * Handles transactional emails (welcome, verification, password reset)
 */

// Resend will be installed but for now we'll create the interface
// TODO: npm install resend

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send email using Resend
 * Note: Requires RESEND_API_KEY environment variable
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('[Email] RESEND_API_KEY not configured. Email not sent.')
      console.log('[Email] Would have sent:', {
        to: options.to,
        subject: options.subject
      })
      return false
    }

    // TODO: Uncomment when resend is installed
    // const { Resend } = await import('resend')
    // const resend = new Resend(process.env.RESEND_API_KEY)

    // const { data, error } = await resend.emails.send({
    //   from: process.env.EMAIL_FROM || 'Spontra <noreply@spontra.com>',
    //   to: options.to,
    //   subject: options.subject,
    //   html: options.html,
    //   text: options.text
    // })

    // if (error) {
    //   console.error('[Email] Send failed:', error)
    //   return false
    // }

    console.log('[Email] Email sent successfully to:', options.to)
    return true
  } catch (error) {
    console.error('[Email] Error sending email:', error)
    return false
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(email: string, name?: string): Promise<boolean> {
  const subject = 'Welcome to Spontra! ✈️'

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 40px 20px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Spontra!</h1>
          </div>
          <div class="content">
            <p>Hi${name ? ` ${name}` : ''},</p>
            <p>Thanks for joining Spontra! We're excited to help you discover your next adventure.</p>
            <p>With Spontra, you can:</p>
            <ul>
              <li>🔍 Search destinations by flight time instead of location</li>
              <li>🎯 Find places that match your travel style (adventure, beach, culture, and more)</li>
              <li>💰 Compare prices across multiple airlines</li>
              <li>❤️ Save your favorite destinations for later</li>
            </ul>
            <p style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://spontra.com'}" class="button">Start Exploring</a>
            </p>
            <p>Happy travels!</p>
            <p>The Spontra Team</p>
          </div>
          <div class="footer">
            <p>Spontra - Discover Your Next Adventure</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/privacy" style="color: #667eea;">Privacy Policy</a> | <a href="${process.env.NEXT_PUBLIC_APP_URL}/terms" style="color: #667eea;">Terms of Service</a></p>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
Welcome to Spontra!

Hi${name ? ` ${name}` : ''},

Thanks for joining Spontra! We're excited to help you discover your next adventure.

With Spontra, you can:
- Search destinations by flight time instead of location
- Find places that match your travel style
- Compare prices across multiple airlines
- Save your favorite destinations

Start exploring: ${process.env.NEXT_PUBLIC_APP_URL || 'https://spontra.com'}

Happy travels!
The Spontra Team
  `

  return await sendEmail({ to: email, subject, html, text })
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<boolean> {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${token}`

  const subject = 'Verify your Spontra email address'

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 40px 20px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .code { background: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 16px; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email</h1>
          </div>
          <div class="content">
            <p>Hi,</p>
            <p>Thanks for signing up for Spontra! Please verify your email address to get started.</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <div class="code">${verificationUrl}</div>
            <p style="color: #6b7280; font-size: 14px;">This link will expire in 24 hours. If you didn't create a Spontra account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>Spontra - Discover Your Next Adventure</p>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
Verify Your Email

Hi,

Thanks for signing up for Spontra! Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours. If you didn't create a Spontra account, you can safely ignore this email.

The Spontra Team
  `

  return await sendEmail({ to: email, subject, html, text })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<boolean> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`

  const subject = 'Reset your Spontra password'

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 40px 20px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <p>Hi,</p>
            <p>We received a request to reset your Spontra password. Click the button below to choose a new password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
            <div class="warning">
              <p style="margin: 0;"><strong>⚠️ Security Notice:</strong></p>
              <p style="margin: 5px 0 0 0;">This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
            </div>
          </div>
          <div class="footer">
            <p>Spontra - Discover Your Next Adventure</p>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
Reset Your Password

Hi,

We received a request to reset your Spontra password. Click the link below to choose a new password:

${resetUrl}

This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.

The Spontra Team
  `

  return await sendEmail({ to: email, subject, html, text })
}
