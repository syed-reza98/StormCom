/**
 * Coupons Management Page
 * 
 * Create and manage discount coupons and promotional codes.
 */

import { Metadata } from 'next';
import { Section, Container, Flex, Heading, Text, Card, Button, Badge } from '@radix-ui/themes';
import { MixIcon, PlusIcon, CalendarIcon } from '@radix-ui/react-icons';

export const metadata: Metadata = {
  title: 'Coupons | StormCom Marketing',
  description: 'Manage discount coupons and promo codes',
};

export default function CouponsPage() {
  return (
    <Section size="2">
      <Container size="4">
        <Flex direction="column" gap="6">
          <Flex align="center" justify="between">
            <Flex align="center" gap="3">
              <MixIcon width="32" height="32" color="teal" />
              <div>
                <Heading size="8">Coupons</Heading>
                <Text size="3" color="gray">Manage discount codes and promotions</Text>
              </div>
            </Flex>
            <Button size="3">
              <PlusIcon width="16" height="16" />
              Create Coupon
            </Button>
          </Flex>

          {/* Coupon Cards */}
          <Flex direction="column" gap="4">
            <Card size="3">
              <Flex direction="column" gap="3">
                <Flex align="center" justify="between">
                  <Heading size="5">SUMMER20</Heading>
                  <Badge color="green">Active</Badge>
                </Flex>
                <Text size="2" color="gray">20% off • Used 45 times</Text>
                <Flex align="center" gap="2">
                  <CalendarIcon width="14" height="14" style={{ color: 'var(--gray-11)' }} />
                  <Text size="2" color="gray">Expires: Dec 31, 2024</Text>
                </Flex>
              </Flex>
            </Card>
          </Flex>
        </Flex>
      </Container>
    </Section>
  );
}
