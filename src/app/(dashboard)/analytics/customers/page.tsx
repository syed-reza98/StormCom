/**
 * Customer Analytics Page
 * 
 * Customer behavior analytics and insights.
 */

import { Metadata } from 'next';
import { Section, Container, Flex, Heading, Text, Card } from '@radix-ui/themes';
import { PersonIcon, ActivityLogIcon } from '@radix-ui/react-icons';

export const metadata: Metadata = {
  title: 'Customer Analytics | StormCom',
  description: 'View customer behavior and analytics',
};

export default function CustomerAnalyticsPage() {
  return (
    <Section size="2">
      <Container size="4">
        <Flex direction="column" gap="6">
          <Flex align="center" gap="3">
            <PersonIcon width="32" height="32" color="teal" />
            <div>
              <Heading size="8">Customer Analytics</Heading>
              <Text size="3" color="gray">Understand your customer behavior</Text>
            </div>
          </Flex>

          <Card size="3">
            <Flex direction="column" gap="4">
              <Flex align="center" gap="3">
                <ActivityLogIcon width="20" height="20" color="gray" />
                <Heading size="5">Customer Insights</Heading>
              </Flex>
              <Text size="2" color="gray">
                Customer demographics, behavior patterns, and lifetime value analytics
              </Text>
            </Flex>
          </Card>
        </Flex>
      </Container>
    </Section>
  );
}
