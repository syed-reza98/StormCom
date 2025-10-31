/**
 * Marketing Campaigns Page
 * 
 * Manage marketing campaigns including email, SMS, and promotional campaigns.
 */

import { Metadata } from 'next';
import { Section, Container, Flex, Heading, Text, Card, Button, Badge } from '@radix-ui/themes';
import { RocketIcon, PlusIcon, EnvelopeClosedIcon } from '@radix-ui/react-icons';

export const metadata: Metadata = {
  title: 'Marketing Campaigns | StormCom',
  description: 'Manage your marketing campaigns',
};

export default function CampaignsPage() {
  return (
    <Section size="2">
      <Container size="4">
        <Flex direction="column" gap="6">
          <Flex align="center" justify="between">
            <Flex align="center" gap="3">
              <RocketIcon width="32" height="32" color="teal" />
              <div>
                <Heading size="8">Marketing Campaigns</Heading>
                <Text size="3" color="gray">Create and manage your marketing campaigns</Text>
              </div>
            </Flex>
            <Button size="3">
              <PlusIcon width="16" height="16" />
              New Campaign
            </Button>
          </Flex>

          {/* Campaign Cards */}
          <Flex direction="column" gap="4">
            <Card size="3">
              <Flex direction="column" gap="3">
                <Flex align="center" justify="between">
                  <Flex align="center" gap="2">
                    <EnvelopeClosedIcon width="20" height="20" color="blue" />
                    <Heading size="5">Summer Sale 2024</Heading>
                  </Flex>
                  <Badge color="green">Active</Badge>
                </Flex>
                <Text size="2" color="gray">Email campaign • 1,234 recipients</Text>
              </Flex>
            </Card>
          </Flex>
        </Flex>
      </Container>
    </Section>
  );
}
