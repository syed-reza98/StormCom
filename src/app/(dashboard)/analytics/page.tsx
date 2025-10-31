/**
 * Analytics Dashboard Page
 * 
 * Comprehensive analytics overview with key metrics, charts, and insights.
 * Provides store owners with data-driven insights into their business performance.
 */

import { Metadata } from 'next';
import { Section, Container, Flex, Heading, Text, Card, Badge } from '@radix-ui/themes';
import { 
  BarChartIcon, 
  ActivityLogIcon, 
  PersonIcon, 
  FileTextIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@radix-ui/react-icons';

export const metadata: Metadata = {
  title: 'Analytics Dashboard | StormCom',
  description: 'View store analytics and performance metrics',
};

export default function AnalyticsDashboardPage() {
  return (
    <Section size="2">
      <Container size="4">
        <Flex direction="column" gap="6">
          {/* Page Header */}
          <Flex align="center" gap="3">
            <BarChartIcon width="32" height="32" color="teal" />
            <div>
              <Heading size="8">Analytics Dashboard</Heading>
              <Text size="3" color="gray">
                Track your store's performance and key metrics
              </Text>
            </div>
          </Flex>

          {/* Key Metrics Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '16px' 
          }}>
            {/* Total Sales */}
            <Card size="3">
              <Flex direction="column" gap="3">
                <Flex align="center" justify="between">
                  <Text size="2" color="gray">Total Sales</Text>
                  <ActivityLogIcon width="20" height="20" color="teal" />
                </Flex>
                <Heading size="7">$24,567</Heading>
                <Flex align="center" gap="2">
                  <Badge color="green" size="1">
                    <ArrowUpIcon width="12" height="12" />
                    12.5%
                  </Badge>
                  <Text size="1" color="gray">vs last month</Text>
                </Flex>
              </Flex>
            </Card>

            {/* Total Orders */}
            <Card size="3">
              <Flex direction="column" gap="3">
                <Flex align="center" justify="between">
                  <Text size="2" color="gray">Total Orders</Text>
                  <FileTextIcon width="20" height="20" color="blue" />
                </Flex>
                <Heading size="7">1,234</Heading>
                <Flex align="center" gap="2">
                  <Badge color="green" size="1">
                    <ArrowUpIcon width="12" height="12" />
                    8.2%
                  </Badge>
                  <Text size="1" color="gray">vs last month</Text>
                </Flex>
              </Flex>
            </Card>

            {/* Total Customers */}
            <Card size="3">
              <Flex direction="column" gap="3">
                <Flex align="center" justify="between">
                  <Text size="2" color="gray">Total Customers</Text>
                  <PersonIcon width="20" height="20" color="amber" />
                </Flex>
                <Heading size="7">856</Heading>
                <Flex align="center" gap="2">
                  <Badge color="green" size="1">
                    <ArrowUpIcon width="12" height="12" />
                    15.3%
                  </Badge>
                  <Text size="1" color="gray">vs last month</Text>
                </Flex>
              </Flex>
            </Card>

            {/* Average Order Value */}
            <Card size="3">
              <Flex direction="column" gap="3">
                <Flex align="center" justify="between">
                  <Text size="2" color="gray">Avg. Order Value</Text>
                  <BarChartIcon width="20" height="20" color="green" />
                </Flex>
                <Heading size="7">$65.42</Heading>
                <Flex align="center" gap="2">
                  <Badge color="red" size="1">
                    <ArrowDownIcon width="12" height="12" />
                    2.1%
                  </Badge>
                  <Text size="1" color="gray">vs last month</Text>
                </Flex>
              </Flex>
            </Card>
          </div>

          {/* Charts Section */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
            gap: '24px' 
          }}>
            {/* Sales Chart */}
            <Card size="3">
              <Flex direction="column" gap="4">
                <Heading size="5">Sales Overview</Heading>
                <Text size="2" color="gray">Last 30 days</Text>
                <div style={{ 
                  height: '300px', 
                  backgroundColor: 'var(--gray-2)', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Text size="2" color="gray">Chart placeholder</Text>
                </div>
              </Flex>
            </Card>

            {/* Top Products */}
            <Card size="3">
              <Flex direction="column" gap="4">
                <Heading size="5">Top Products</Heading>
                <Text size="2" color="gray">Best sellers this month</Text>
                <Flex direction="column" gap="3">
                  {['Product A', 'Product B', 'Product C', 'Product D', 'Product E'].map((product, index) => (
                    <Flex key={index} align="center" justify="between">
                      <Text size="2">{product}</Text>
                      <Badge color="blue" size="1">{120 - index * 15} sales</Badge>
                    </Flex>
                  ))}
                </Flex>
              </Flex>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card size="3">
            <Flex direction="column" gap="4">
              <Heading size="5">Recent Activity</Heading>
              <Text size="2" color="gray">Latest store activity and updates</Text>
              <Flex direction="column" gap="2">
                <Text size="2">Recent orders, customer registrations, and product updates would appear here</Text>
              </Flex>
            </Flex>
          </Card>
        </Flex>
      </Container>
    </Section>
  );
}
