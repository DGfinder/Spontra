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

export interface WelcomeEmailProps {
  firstName: string
  appUrl?: string
}

export const WelcomeEmail = ({
  firstName,
  appUrl = 'https://spontra.com'
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Spontra - Your Journey Begins!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>Spontra</Heading>
            <Text style={subtitle}>Travel Beyond Boundaries</Text>
          </Section>
          
          <Section style={section}>
            <Heading style={h2}>Welcome {firstName}! 🌟</Heading>
            <Text style={text}>
              Thank you for joining Spontra! We're excited to help you discover amazing 
              destinations and plan unforgettable journeys.
            </Text>
            
            <Section style={featureSection}>
              <Heading style={h3}>What you can do with Spontra:</Heading>
              <ul style={featureList}>
                <li style={featureItem}>🔍 Search for flights and destinations</li>
                <li style={featureItem}>🎯 Discover curated travel experiences</li>
                <li style={featureItem}>✈️ Find the best deals and routes</li>
                <li style={featureItem}>📱 Manage your travel preferences</li>
              </ul>
            </Section>
            
            <Section style={buttonContainer}>
              <Button pX={20} pY={12} style={button} href={appUrl}>
                Start Exploring
              </Button>
            </Section>
          </Section>
          
          <Hr style={hr} />
          
          <Section style={footer}>
            <Text style={footerText}>
              If you have any questions, our support team is here to help!
            </Text>
            <Text style={footerText}>
              Happy travels,<br />
              The Spontra Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default WelcomeEmail

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

const h3 = {
  color: '#2563eb',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '24px',
  margin: '20px 0 10px',
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const featureSection = {
  margin: '30px 0',
}

const featureList = {
  color: '#4b5563',
  fontSize: '16px',
  lineHeight: '26px',
  paddingLeft: '20px',
}

const featureItem = {
  margin: '8px 0',
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