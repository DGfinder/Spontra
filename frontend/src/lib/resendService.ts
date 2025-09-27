import { Resend } from 'resend'
import { render } from '@react-email/render'
import { PasswordResetEmail, WelcomeEmail, PasswordChangedEmail } from '@/emails'

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailTemplate {
  from: string
  to: string | string[]
  subject: string
  html?: string
  text?: string
  react?: any // React Email component
}

export interface EmailResponse {
  success: boolean
  messageId?: string
  error?: string
}

// Email service class
export class ResendEmailService {
  private readonly fromEmail: string
  private readonly isConfigured: boolean

  constructor() {
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@spontra.com'
    this.isConfigured = !!process.env.RESEND_API_KEY
  }

  async sendEmail(template: EmailTemplate): Promise<EmailResponse> {
    if (!this.isConfigured) {
      console.warn('Resend email service not configured - email will not be sent')
      return {
        success: false,
        error: 'Email service not configured'
      }
    }

    try {
      const response = await resend.emails.send({
        from: template.from || this.fromEmail,
        to: template.to,
        subject: template.subject,
        html: template.html,
        text: template.text,
        react: template.react
      })

      return {
        success: true,
        messageId: response.data?.id
      }
    } catch (error) {
      console.error('Failed to send email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error'
      }
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string, firstName?: string): Promise<EmailResponse> {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://spontra.com'}/auth/reset-password?token=${resetToken}`
    
    try {
      const emailHtml = render(PasswordResetEmail({ 
        resetUrl, 
        firstName 
      }))

      const emailTemplate: EmailTemplate = {
        from: this.fromEmail,
        to: email,
        subject: 'Reset Your Spontra Password',
        html: emailHtml
      }

      return await this.sendEmail(emailTemplate)
    } catch (error) {
      console.error('Failed to render password reset email:', error)
      // Fallback to basic HTML
      const emailTemplate: EmailTemplate = {
        from: this.fromEmail,
        to: email,
        subject: 'Reset Your Spontra Password',
        html: `
          <p>Hi ${firstName || 'User'},</p>
          <p>Please reset your password by clicking this link: <a href="${resetUrl}">Reset Password</a></p>
          <p>This link expires in 1 hour.</p>
          <p>Best regards,<br>The Spontra Team</p>
        `
      }
      return await this.sendEmail(emailTemplate)
    }
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<EmailResponse> {
    try {
      const emailHtml = render(WelcomeEmail({ 
        firstName,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://spontra.com'
      }))

      const emailTemplate: EmailTemplate = {
        from: this.fromEmail,
        to: email,
        subject: 'Welcome to Spontra - Your Journey Begins!',
        html: emailHtml
      }

      return await this.sendEmail(emailTemplate)
    } catch (error) {
      console.error('Failed to render welcome email:', error)
      // Fallback to basic HTML
      const emailTemplate: EmailTemplate = {
        from: this.fromEmail,
        to: email,
        subject: 'Welcome to Spontra - Your Journey Begins!',
        html: `
          <p>Welcome ${firstName}!</p>
          <p>Thank you for joining Spontra! We're excited to help you discover amazing destinations.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://spontra.com'}">Start Exploring</a></p>
          <p>Happy travels,<br>The Spontra Team</p>
        `
      }
      return await this.sendEmail(emailTemplate)
    }
  }

  async sendPasswordChangeNotification(email: string, firstName: string): Promise<EmailResponse> {
    try {
      const emailHtml = render(PasswordChangedEmail({ 
        firstName,
        changeDate: new Date()
      }))

      const emailTemplate: EmailTemplate = {
        from: this.fromEmail,
        to: email,
        subject: 'Spontra Password Changed Successfully',
        html: emailHtml
      }

      return await this.sendEmail(emailTemplate)
    } catch (error) {
      console.error('Failed to render password changed email:', error)
      // Fallback to basic HTML
      const emailTemplate: EmailTemplate = {
        from: this.fromEmail,
        to: email,
        subject: 'Spontra Password Changed Successfully',
        html: `
          <p>Hi ${firstName},</p>
          <p>Your Spontra account password has been successfully changed on ${new Date().toLocaleDateString()}.</p>
          <p><strong>If you made this change:</strong> You're all set! Your account is secure.</p>
          <p><strong>If you didn't make this change:</strong> Please contact our support team immediately at support@spontra.com</p>
          <p>Best regards,<br>The Spontra Team</p>
        `
      }
      return await this.sendEmail(emailTemplate)
    }
  }

  // Health check for email service
  async healthCheck(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured) {
      return {
        success: false,
        message: 'Resend API key not configured'
      }
    }

    try {
      // Test if we can initialize the service (basic connectivity check)
      // In production, you might want to send a test email to a known address
      return {
        success: true,
        message: 'Email service is configured and ready'
      }
    } catch (error) {
      return {
        success: false,
        message: `Email service error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}

// Export singleton instance
export const emailService = new ResendEmailService()
export default emailService