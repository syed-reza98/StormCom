/**
 * Sales Reports Page
 * 
 * Detailed sales analytics and reporting with filters and export capabilities.
 */

import { Metadata } from 'next';
import { Section, Container, Flex, Heading, Text, Card, Button } from '@radix-ui/themes';
import { BarChartIcon, CalendarIcon, DownloadIcon } from '@radix-ui/react-icons';

export const metadata: Metadata = {
  title: 'Sales Reports | StormCom Analytics',
  description: 'View detailed sales reports and analytics',
};

export default function SalesReportsPage() {
  return (
    <Section size="2">
      <Container size="4">
        <Flex direction="column" gap="6">
          <Flex align="center" justify="between">
            <Flex align="center" gap="3">
              <BarChartIcon width="32" height="32" color="teal" />
              <div>
                <Heading size="8">Sales Reports</Heading>
                <Text size="3" color="gray">Detailed sales analytics and insights</Text>
              </div>
            </Flex>
            <Button size="3">
              <DownloadIcon width="16" height="16" />
              Export Report
            </Button>
          </Flex>

          <Card size="3">
            <Flex direction="column" gap="4">
              <Flex align="center" gap="3">
                <CalendarIcon width="20" height="20" color="gray" />
                <Heading size="5">Date Range</Heading>
              </Flex>
              <Text size="2" color="gray">
                Sales data, trends, and detailed breakdowns would be displayed here
              </Text>
            </Flex>
          </Card>
        </Flex>
      </Container>
    </Section>
  );
}
