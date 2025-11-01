// src/app/(dashboard)/settings/privacy/page.tsx
// Privacy Settings Page - GDPR compliance with data export and deletion

import { Metadata } from 'next';
import { Flex, Heading, Text, Container, Section, Card, Button, Separator, Badge } from '@radix-ui/themes';
import { LockClosedIcon, DownloadIcon, TrashIcon, CheckCircledIcon } from '@radix-ui/react-icons';
import { PrivacySettingsClient } from './privacy-settings-client';

// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {
  title: 'Privacy Settings | Dashboard',
  description: 'Manage your privacy settings, data export, and account deletion',
};

// ============================================================================
// MAIN COMPONENT (Server Component)
// ============================================================================

export default function PrivacySettingsPage() {
  return (
    <Section size="2">
      <Container size="3">
        <Flex direction="column" gap="6">
          {/* Page Header */}
          <Flex direction="column" gap="2">
            <Flex align="center" gap="3">
              <LockClosedIcon width="32" height="32" color="teal" />
              <Heading size="8">Privacy Settings</Heading>
            </Flex>
            <Text size="3" color="gray">
              Manage your data, privacy preferences, and GDPR compliance
            </Text>
          </Flex>

          {/* GDPR Information Banner */}
          <Card>
            <Flex direction="column" gap="3" p="4">
              <Flex align="center" gap="2">
                <CheckCircledIcon width="20" height="20" color="green" />
                <Heading size="4">Your Rights Under GDPR</Heading>
              </Flex>
              <Text size="2" color="gray">
                As a user of StormCom, you have the following rights under the General Data Protection Regulation (GDPR):
              </Text>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-4">
                <li><strong>Right of Access</strong>: Request a copy of your personal data</li>
                <li><strong>Right to Erasure</strong>: Request deletion of your personal data</li>
                <li><strong>Right to Withdraw Consent</strong>: Opt out of marketing and analytics</li>
                <li><strong>Right to Data Portability</strong>: Receive your data in a machine-readable format</li>
              </ul>
            </Flex>
          </Card>

          {/* Client Component with Interactive Features */}
          <PrivacySettingsClient />

          {/* Data Retention Policy */}
          <Card>
            <Flex direction="column" gap="3" p="4">
              <Heading size="4">Data Retention Policy</Heading>
              <Text size="2" color="gray">
                We retain your personal data as follows:
              </Text>
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <strong>Account Data:</strong> Retained while your account is active
                </div>
                <div>
                  <strong>Order History:</strong> Retained for 3 years for accounting and tax compliance
                </div>
                <div>
                  <strong>Audit Logs:</strong> Retained for 1 year for security purposes
                </div>
                <div>
                  <strong>Marketing Consent:</strong> Retained until consent is withdrawn
                </div>
              </div>
              <Text size="2" color="gray" mt="2">
                After account deletion, your personal data will be anonymized within 30 days, 
                while order history will be preserved for legal compliance.
              </Text>
            </Flex>
          </Card>
        </Flex>
      </Container>
    </Section>
  );
}
