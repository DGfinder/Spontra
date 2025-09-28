import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export interface PasswordResetEmailProps {
  resetUrl: string
  firstName?: string
}

export const PasswordResetEmail = ({
  resetUrl,
  firstName = 'User'
}: PasswordResetEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your Spontra password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>Spontra</Heading>
            <Text style={subtitle}>Travel Beyond Boundaries</Text>
          </Section>
          
          <Section style={section}>
            <Heading style={h2}>Password Reset Request</Heading>
            <Text style={text}>
              Hi {firstName},
            </Text>
            <Text style={text}>
              We received a request to reset your password for your Spontra account.
            </Text>
            <Text style={text}>
              Click the button below to reset your password. This link will expire in 1 hour for security reasons.
            </Text>
            
            <Section style={buttonContainer}>
              <Button pX={20} pY={12} style={button} href={resetUrl}>
                Reset Password
              </Button>
            </Section>
            
            <Text style={linkText}>
              If the button doesn't work, copy and paste this link into your browser:
            </Text>
            <Link href={resetUrl} style={link}>
              {resetUrl}
            </Link>
          </Section>
          
          <Hr style={hr} />
          
          <Section style={footer}>
            <Text style={footerText}>
              <strong>Didn't request this?</strong> If you didn't request a password reset, 
              you can safely ignore this email. Your password won't be changed.
            </Text>
            <Text style={footerText}>
              For security reasons, this link will expire in 1 hour.
            </Text>
            <Text style={footerText}>
              Best regards,<br />
              The Spontra Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default PasswordResetEmail

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const header = {
  textAlign: 'center' as const,
  marginBottom: '30px',
}

const h1 = {
  color: '#2563eb',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '28px',
  margin: '0',
}

const subtitle = {
  color: '#64748b',
  fontSize: '14px',
  margin: '5px 0 0 0',
}

const section = {
  padding: '0 48px',
}

const h2 = {
  color: '#1e293b',
  fontSize: '20px',
  fontWeight: '600',
  lineHeight: '28px',
  margin: '30px 0 15px',
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
}

const linkText = {
  color: '#64748b',
  fontSize: '14px',
  margin: '16px 0 8px',
}

const link = {
  color: '#2563eb',
  fontSize: '14px',
  wordBreak: 'break-all' as const,
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
}

const footer = {
  padding: '0 48px',
}

const footerText = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
}