// src/emails/account-verification.tsx
// Account verification email template using React Email
// T178: Verification link, welcome message, store branding, link expiration

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
} from '@react-email/components';

export interface AccountVerificationEmailProps {
  userName: string;
  verificationUrl: string;
  expiresAt: string;
  storeName?: string;
}

export default function AccountVerificationEmail({
  userName = 'Valued Customer',
  verificationUrl = '#',
  expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString(),
  storeName = 'StormCom',
}: AccountVerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerHeading}>
              Welcome to {storeName}! 🎉
            </Heading>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>Hi {userName},</Text>
            <Text style={paragraph}>
              Thank you for creating an account! Please verify your email
              address to complete your registration.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={verificationUrl}>
                Verify Email Address
              </Button>
            </Section>

            <Section style={infoBox}>
              <Text style={infoText}>
                • This link expires at {expiresAt}
              </Text>
              <Text style={infoText}>
                • You can request a new verification link if this one expires
              </Text>
            </Section>

            <Text style={secondaryText}>
              If the button doesn't work, copy and paste this link into your
              browser:
            </Text>
            <Text style={linkText}>{verificationUrl}</Text>

            <Text style={{ ...paragraph, marginTop: '30px' }}>
              Best regards,
              <br />
              <strong>{storeName}</strong>
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              {storeName === 'StormCom'
                ? 'StormCom Multi-tenant E-commerce Platform'
                : `${storeName} | Powered by StormCom`}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f9fafb',
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const container = {
  margin: '0 auto',
  padding: '20px',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#10b981',
  padding: '30px',
  textAlign: 'center' as const,
  borderRadius: '10px 10px 0 0',
};

const headerHeading = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '600',
  margin: '0',
};

const content = {
  backgroundColor: '#ffffff',
  padding: '30px',
  borderRadius: '0 0 10px 10px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#1f2937',
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#10b981',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '700',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const infoBox = {
  backgroundColor: '#f0fdf4',
  padding: '15px',
  borderRadius: '8px',
  margin: '20px 0',
  borderLeft: '4px solid #10b981',
};

const infoText = {
  margin: '5px 0',
  fontSize: '14px',
  color: '#374151',
};

const secondaryText = {
  fontSize: '14px',
  color: '#6b7280',
  marginTop: '20px',
};

const linkText = {
  fontSize: '12px',
  color: '#9ca3af',
  wordBreak: 'break-all' as const,
  marginTop: '10px',
};

const footer = {
  textAlign: 'center' as const,
  marginTop: '20px',
};

const footerText = {
  color: '#9ca3af',
  fontSize: '12px',
};
