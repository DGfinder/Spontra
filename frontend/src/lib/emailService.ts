import { Resend } from 'resend'

const FROM_EMAIL = process.env.FROM_EMAIL || 'Spontra <hello@spontra.com>'
const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://spontra.com'

// Lazy initialization to avoid build-time errors
let _resend: Resend | null = null
function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

export async function sendWelcomeEmail(to: string, firstName: string) {
  try {
    const { WelcomeEmail } = await import('@/emails')
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Welcome to Spontra! 🌟',
      react: WelcomeEmail({ firstName, appUrl: APP_URL }),
    })

    if (error) {
      console.error('Failed to send welcome email:', error)
      return { ok: false, error }
    }

    return { ok: true, id: data?.id }
  } catch (error) {
    console.error('Email service error:', error)
    return { ok: false, error }
  }
}

export async function sendPasswordResetEmail(to: string, firstName: string, resetToken: string) {
  try {
    const { PasswordResetEmail } = await import('@/emails')
    const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`
    
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Reset your Spontra password',
      react: PasswordResetEmail({ firstName, resetUrl }),
    })

    if (error) {
      console.error('Failed to send password reset email:', error)
      return { ok: false, error }
    }

    return { ok: true, id: data?.id }
  } catch (error) {
    console.error('Email service error:', error)
    return { ok: false, error }
  }
}

export async function sendPasswordChangedEmail(to: string, firstName: string) {
  try {
    const { PasswordChangedEmail } = await import('@/emails')
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Your Spontra password was changed',
      react: PasswordChangedEmail({ firstName }),
    })

    if (error) {
      console.error('Failed to send password changed email:', error)
      return { ok: false, error }
    }

    return { ok: true, id: data?.id }
  } catch (error) {
    console.error('Email service error:', error)
    return { ok: false, error }
  }
}
