// src/emails/password-reset.tsx
// Password reset email template using React Email
// T177: Reset link, expiration time, security notice, IP address

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

export interface PasswordResetEmailProps {
  userName: string;
  resetUrl: string;
  expiresAt: string;
  ipAddress?: string;
}

export default function PasswordResetEmail({
  userName = 'Valued Customer',
  resetUrl = '#',
  expiresAt = new Date(Date.now() + 60 * 60 * 1000).toLocaleString(),
  ipAddress,
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerHeading}>🔒 Reset Your Password</Heading>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>Hi {userName},</Text>
            <Text style={paragraph}>
              We received a request to reset your password. Click the button
              below to create a new password.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={resetUrl}>
                Reset Password
              </Button>
            </Section>

            <Section style={securityBox}>
              <Text style={securityTitle}>
                <strong>Security Notice:</strong>
              </Text>
              <Text style={securityText}>
                • This link expires at {expiresAt}
              </Text>
              {ipAddress && (
                <Text style={securityText}>• Request from IP: {ipAddress}</Text>
              )}
              <Text style={securityText}>
                • If you didn&apos;t request this, you can safely ignore this email
              </Text>
            </Section>

            <Text style={secondaryText}>
              If the button doesn&apos;t work, copy and paste this link into your
              browser:
            </Text>
            <Text style={linkText}>{resetUrl}</Text>

            <Text style={{ ...paragraph, marginTop: '30px' }}>
              Best regards,
              <br />
              <strong>The StormCom Team</strong>
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              StormCom Multi-tenant E-commerce Platform
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
  backgroundColor: '#ef4444',
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
  backgroundColor: '#ef4444',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '700',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const securityBox = {
  backgroundColor: '#fef2f2',
  padding: '15px',
  borderRadius: '8px',
  margin: '20px 0',
  borderLeft: '4px solid #ef4444',
};

const securityTitle = {
  margin: '5px 0',
  fontSize: '14px',
  color: '#1f2937',
};

const securityText = {
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
