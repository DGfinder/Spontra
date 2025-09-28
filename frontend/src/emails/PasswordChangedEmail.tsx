import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export interface PasswordChangedEmailProps {
  firstName: string
  changeDate?: Date
}

export const PasswordChangedEmail = ({
  firstName,
  changeDate = new Date()
}: PasswordChangedEmailProps) => {
  const formattedDate = changeDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  })

  return (
    <Html>
      <Head />
      <Preview>Your Spontra password has been changed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>Spontra</Heading>
            <Text style={subtitle}>Travel Beyond Boundaries</Text>
          </Section>
          
          <Section style={successSection}>
            <Heading style={h2}>Password Changed Successfully ✅</Heading>
            <Text style={text}>
              Hi {firstName},
            </Text>
            <Text style={text}>
              Your Spontra account password has been successfully changed on {formattedDate}.
            </Text>
            <Text style={text}>
              <strong>If you made this change:</strong> You're all set! Your account is secure.
            </Text>
          </Section>
          
          <Section style={warningSection}>
            <Text style={warningText}>
              <strong>If you didn't make this change:</strong>
            </Text>
            <Text style={warningText}>
              Please contact our support team immediately at support@spontra.com
            </Text>
          </Section>
          
          <Hr style={hr} />
          
          <Section style={footer}>
            <Text style={footerText}>
              For your security, we recommend:
            </Text>
            <ul style={securityList}>
              <li style={securityItem}>Using a unique, strong password</li>
              <li style={securityItem}>Not sharing your password with anyone</li>
              <li style={securityItem}>Signing out of devices you don't recognize</li>
            </ul>
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

export default PasswordChangedEmail

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

const successSection = {
  padding: '0 48px',
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  margin: '20px 48px',
}

const h2 = {
  color: '#166534',
  fontSize: '20px',
  fontWeight: '600',
  lineHeight: '28px',
  margin: '20px 0 15px',
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const warningSection = {
  padding: '20px 48px',
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  margin: '20px 48px',
}

const warningText = {
  color: '#991b1b',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '10px 0',
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

const securityList = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '24px',
  paddingLeft: '20px',
  margin: '10px 0',
}

const securityItem = {
  margin: '5px 0',
}