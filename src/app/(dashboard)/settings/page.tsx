// src/app/(dashboard)/settings/page.tsx
// Settings Page - User preferences, store settings, and account management

import { Metadata } from 'next';
import { Flex, Heading, Text, Container, Section, Tabs, Card, Switch } from '@radix-ui/themes';
import { GearIcon, PersonIcon, BellIcon, LockClosedIcon, CreditCardIcon } from '@radix-ui/react-icons';

// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {
  title: 'Settings | Dashboard',
  description: 'Manage your account settings, preferences, and notifications',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SettingsPage() {
  return (
    <Section size="2">
      <Container size="4">
        <Flex direction="column" gap="6">
          {/* Page Header */}
          <Flex direction="column" gap="2">
            <Flex align="center" gap="3">
              <GearIcon width="32" height="32" color="teal" />
              <Heading size="8">Settings</Heading>
            </Flex>
            <Text size="3" color="gray">
              Manage your account preferences and store settings
            </Text>
          </Flex>

          {/* Settings Tabs */}
          <Tabs.Root defaultValue="profile">
            <Tabs.List>
              <Tabs.Trigger value="profile">
                <Flex align="center" gap="2">
                  <PersonIcon />
                  Profile
                </Flex>
              </Tabs.Trigger>
              <Tabs.Trigger value="notifications">
                <Flex align="center" gap="2">
                  <BellIcon />
                  Notifications
                </Flex>
              </Tabs.Trigger>
              <Tabs.Trigger value="security">
                <Flex align="center" gap="2">
                  <LockClosedIcon />
                  Security
                </Flex>
              </Tabs.Trigger>
              <Tabs.Trigger value="billing">
                <Flex align="center" gap="2">
                  <CreditCardIcon />
                  Billing
                </Flex>
              </Tabs.Trigger>
            </Tabs.List>

            {/* Profile Tab */}
            <Tabs.Content value="profile">
              <Flex direction="column" gap="4" mt="4">
                <Card>
                  <Flex direction="column" gap="4" p="4">
                    <Heading size="5">Profile Information</Heading>
                    <Text size="2" color="gray">
                      Update your account profile information and email address.
                    </Text>
                    
                    {/* Placeholder for profile form */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Full Name</label>
                        <input 
                          type="text" 
                          className="w-full mt-1 px-3 py-2 border rounded-md"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email Address</label>
                        <input 
                          type="email" 
                          className="w-full mt-1 px-3 py-2 border rounded-md"
                          placeholder="john@example.com"
                        />
                      </div>
                      <button className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700">
                        Save Changes
                      </button>
                    </div>
                  </Flex>
                </Card>
              </Flex>
            </Tabs.Content>

            {/* Notifications Tab */}
            <Tabs.Content value="notifications">
              <Flex direction="column" gap="4" mt="4">
                <Card>
                  <Flex direction="column" gap="4" p="4">
                    <Heading size="5">Notification Preferences</Heading>
                    <Text size="2" color="gray">
                      Choose what notifications you want to receive.
                    </Text>

                    <Flex direction="column" gap="3">
                      <Flex justify="between" align="center">
                        <Flex direction="column" gap="1">
                          <Text weight="medium">Order Updates</Text>
                          <Text size="2" color="gray">Receive notifications about new orders</Text>
                        </Flex>
                        <Switch defaultChecked />
                      </Flex>
                      <Flex justify="between" align="center">
                        <Flex direction="column" gap="1">
                          <Text weight="medium">Marketing Emails</Text>
                          <Text size="2" color="gray">Receive emails about new features and updates</Text>
                        </Flex>
                        <Switch />
                      </Flex>
                      <Flex justify="between" align="center">
                        <Flex direction="column" gap="1">
                          <Text weight="medium">Security Alerts</Text>
                          <Text size="2" color="gray">Get notified about security-related events</Text>
                        </Flex>
                        <Switch defaultChecked />
                      </Flex>
                    </Flex>
                  </Flex>
                </Card>
              </Flex>
            </Tabs.Content>

            {/* Security Tab */}
            <Tabs.Content value="security">
              <Flex direction="column" gap="4" mt="4">
                <Card>
                  <Flex direction="column" gap="4" p="4">
                    <Heading size="5">Security Settings</Heading>
                    <Text size="2" color="gray">
                      Manage your password and enable two-factor authentication.
                    </Text>

                    <div className="space-y-4">
                      <div>
                        <Text weight="medium" size="3">Change Password</Text>
                        <Text size="2" color="gray" mb="3">
                          Update your password to keep your account secure.
                        </Text>
                        <button className="px-4 py-2 border rounded-md hover:bg-gray-50">
                          Change Password
                        </button>
                      </div>

                      <div className="pt-4 border-t">
                        <Text weight="medium" size="3">Two-Factor Authentication</Text>
                        <Text size="2" color="gray" mb="3">
                          Add an extra layer of security to your account.
                        </Text>
                        <button className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700">
                          Enable 2FA
                        </button>
                      </div>
                    </div>
                  </Flex>
                </Card>
              </Flex>
            </Tabs.Content>

            {/* Billing Tab */}
            <Tabs.Content value="billing">
              <Flex direction="column" gap="4" mt="4">
                <Card>
                  <Flex direction="column" gap="4" p="4">
                    <Heading size="5">Billing & Subscription</Heading>
                    <Text size="2" color="gray">
                      Manage your subscription and billing information.
                    </Text>

                    <div className="space-y-4">
                      <div>
                        <Text weight="medium" size="3">Current Plan</Text>
                        <div className="mt-2 p-4 border rounded-md">
                          <Text size="4" weight="bold">Professional Plan</Text>
                          <Text size="2" color="gray">$29/month</Text>
                        </div>
                      </div>

                      <div>
                        <Text weight="medium" size="3">Payment Method</Text>
                        <div className="mt-2 p-4 border rounded-md flex items-center gap-3">
                          <CreditCardIcon width="24" height="24" />
                          <div>
                            <Text size="3">•••• •••• •••• 4242</Text>
                            <Text size="2" color="gray">Expires 12/25</Text>
                          </div>
                        </div>
                        <button className="mt-2 px-4 py-2 border rounded-md hover:bg-gray-50">
                          Update Payment Method
                        </button>
                      </div>
                    </div>
                  </Flex>
                </Card>
              </Flex>
            </Tabs.Content>
          </Tabs.Root>
        </Flex>
      </Container>
    </Section>
  );
}
