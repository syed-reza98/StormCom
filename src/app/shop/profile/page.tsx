/**
 * Customer Profile Page
 * 
 * Customer-facing profile management page for updating personal information,
 * viewing order history, and managing account settings.
 */

import { Metadata } from 'next';
import { Section, Container, Flex, Heading, Text, Card, Button, Tabs } from '@radix-ui/themes';
import {
  PersonIcon,
  EnvelopeClosedIcon,
  LockClosedIcon,
  BellIcon,
  HomeIcon,
  GearIcon
} from '@radix-ui/react-icons';

export const metadata: Metadata = {
  title: 'My Profile | StormCom',
  description: 'Manage your profile and account settings',
};

export default function ProfilePage() {
  return (
    <Section size="2">
      <Container size="4">
        <Flex direction="column" gap="6">
          {/* Page Header */}
          <Flex align="center" gap="3">
            <PersonIcon width="32" height="32" color="teal" />
            <div>
              <Heading size="8">My Profile</Heading>
              <Text size="3" color="gray">
                Manage your personal information and preferences
              </Text>
            </div>
          </Flex>

          {/* Profile Content */}
          <Tabs.Root defaultValue="personal">
            <Tabs.List>
              <Tabs.Trigger value="personal">
                <PersonIcon width="16" height="16" />
                Personal Info
              </Tabs.Trigger>
              <Tabs.Trigger value="addresses">
                <HomeIcon width="16" height="16" />
                Addresses
              </Tabs.Trigger>
              <Tabs.Trigger value="security">
                <LockClosedIcon width="16" height="16" />
                Security
              </Tabs.Trigger>
              <Tabs.Trigger value="notifications">
                <BellIcon width="16" height="16" />
                Notifications
              </Tabs.Trigger>
            </Tabs.List>

            {/* Personal Information Tab */}
            <Tabs.Content value="personal">
              <Card size="3" style={{ marginTop: '24px' }}>
                <Flex direction="column" gap="4">
                  <Heading size="5">Personal Information</Heading>
                  <Text size="2" color="gray">
                    Update your personal details and contact information
                  </Text>
                  
                  {/* Form fields would go here */}
                  <Flex direction="column" gap="3">
                    <div>
                      <Text size="2" weight="medium">Name</Text>
                      <Text size="2" color="gray">John Doe</Text>
                    </div>
                    <div>
                      <Text size="2" weight="medium">
                        <Flex align="center" gap="2">
                          <EnvelopeClosedIcon width="14" height="14" />
                          Email
                        </Flex>
                      </Text>
                      <Text size="2" color="gray">john.doe@example.com</Text>
                    </div>
                  </Flex>
                  
                  <Flex gap="3" style={{ marginTop: '16px' }}>
                    <Button size="3">
                      <GearIcon width="16" height="16" />
                      Edit Profile
                    </Button>
                  </Flex>
                </Flex>
              </Card>
            </Tabs.Content>

            {/* Addresses Tab */}
            <Tabs.Content value="addresses">
              <Card size="3" style={{ marginTop: '24px' }}>
                <Flex direction="column" gap="4">
                  <Heading size="5">Saved Addresses</Heading>
                  <Text size="2" color="gray">
                    Manage your shipping and billing addresses
                  </Text>
                  
                  <Flex gap="3" style={{ marginTop: '16px' }}>
                    <Button size="3">
                      <HomeIcon width="16" height="16" />
                      Add New Address
                    </Button>
                  </Flex>
                </Flex>
              </Card>
            </Tabs.Content>

            {/* Security Tab */}
            <Tabs.Content value="security">
              <Card size="3" style={{ marginTop: '24px' }}>
                <Flex direction="column" gap="4">
                  <Heading size="5">Security Settings</Heading>
                  <Text size="2" color="gray">
                    Manage your password and security preferences
                  </Text>
                  
                  <Flex gap="3" style={{ marginTop: '16px' }}>
                    <Button size="3" variant="outline">
                      <LockClosedIcon width="16" height="16" />
                      Change Password
                    </Button>
                  </Flex>
                </Flex>
              </Card>
            </Tabs.Content>

            {/* Notifications Tab */}
            <Tabs.Content value="notifications">
              <Card size="3" style={{ marginTop: '24px' }}>
                <Flex direction="column" gap="4">
                  <Heading size="5">Notification Preferences</Heading>
                  <Text size="2" color="gray">
                    Choose how you want to receive updates
                  </Text>
                  
                  {/* Toggle switches would go here */}
                  <Text size="2" color="gray" style={{ marginTop: '16px' }}>
                    Email notifications, SMS alerts, and push notifications settings
                  </Text>
                </Flex>
              </Card>
            </Tabs.Content>
          </Tabs.Root>
        </Flex>
      </Container>
    </Section>
  );
}
