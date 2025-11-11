import React from 'react';
import Link from 'next/link';
import { Flex, Heading, Text, Card, Container, Section } from '@radix-ui/themes';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  RocketIcon, 
  DashboardIcon, 
  LightningBoltIcon, 
  ComponentInstanceIcon,
  AccessibilityIcon,
  MixerHorizontalIcon 
} from '@radix-ui/react-icons';

export default function HomePage(): React.JSX.Element {
  return (
    <main>
      <Section size="3">
        <Container size="3">
          <Flex direction="column" gap="6" align="center">
            {/* Hero Section */}
            <Flex direction="column" gap="4" align="center" className="text-center max-w-3xl">
              <Heading size="9" weight="bold" className="text-balance">
                Welcome to StormCom
              </Heading>
              <Text size="5" color="gray" className="text-balance">
                Multi-tenant E-commerce SaaS Platform built with Next.js 16 and Radix UI
              </Text>
              
              <Flex gap="3" mt="4">
                <Link href="/products" className={cn(buttonVariants())}>
                  <DashboardIcon className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Link>
                <Button variant="outline">
                  Read Documentation
                </Button>
              </Flex>
            </Flex>

            {/* Feature Cards Grid */}
            <Flex direction="column" gap="4" className="w-full max-w-5xl" mt="8">
              <Flex gap="4" wrap="wrap" justify="center">
                <Card style={{ flex: '1 1 300px', maxWidth: '350px' }}>
                  <Flex direction="column" gap="3" p="4">
                    <Flex align="center" gap="2">
                      <ComponentInstanceIcon width="24" height="24" color="teal" />
                      <Heading size="5" weight="medium">Multi-tenant Architecture</Heading>
                    </Flex>
                    <Text size="3" color="gray">
                      Complete tenant isolation with automatic storeId filtering via Prisma middleware
                    </Text>
                  </Flex>
                </Card>

                <Card style={{ flex: '1 1 300px', maxWidth: '350px' }}>
                  <Flex direction="column" gap="3" p="4">
                    <Flex align="center" gap="2">
                      <RocketIcon width="24" height="24" color="purple" />
                      <Heading size="5" weight="medium">E-commerce Ready</Heading>
                    </Flex>
                    <Text size="3" color="gray">
                      Complete product catalog, checkout system, and order management
                    </Text>
                  </Flex>
                </Card>

                <Card style={{ flex: '1 1 300px', maxWidth: '350px' }}>
                  <Flex direction="column" gap="3" p="4">
                    <Flex align="center" gap="2">
                      <LightningBoltIcon width="24" height="24" color="amber" />
                      <Heading size="5" weight="medium">Next.js 16</Heading>
                    </Flex>
                    <Text size="3" color="gray">
                      Built with App Router, React Server Components, and Cache Components
                    </Text>
                  </Flex>
                </Card>

                <Card style={{ flex: '1 1 300px', maxWidth: '350px' }}>
                  <Flex direction="column" gap="3" p="4">
                    <Flex align="center" gap="2">
                      <AccessibilityIcon width="24" height="24" color="grass" />
                      <Heading size="5" weight="medium">Accessibility First</Heading>
                    </Flex>
                    <Text size="3" color="gray">
                      WCAG 2.2 AA compliant with Radix UI primitives and comprehensive testing
                    </Text>
                  </Flex>
                </Card>

                <Card style={{ flex: '1 1 300px', maxWidth: '350px' }}>
                  <Flex direction="column" gap="3" p="4">
                    <Flex align="center" gap="2">
                      <DashboardIcon width="24" height="24" color="teal" />
                      <Heading size="5" weight="medium">Radix UI Design System</Heading>
                    </Flex>
                    <Text size="3" color="gray">
                      Unified design foundation with Themes, Primitives, Icons, and Colors
                    </Text>
                  </Flex>
                </Card>

                <Card style={{ flex: '1 1 300px', maxWidth: '350px' }}>
                  <Flex direction="column" gap="3" p="4">
                    <Flex align="center" gap="2">
                      <MixerHorizontalIcon width="24" height="24" color="purple" />
                      <Heading size="5" weight="medium">Customizable Theming</Heading>
                    </Flex>
                    <Text size="3" color="gray">
                      Per-tenant branding with dynamic color schemes and dark mode support
                    </Text>
                  </Flex>
                </Card>
              </Flex>
            </Flex>

            {/* Status Banner */}
            <Card className="w-full max-w-3xl" mt="6">
              <Flex direction="column" gap="2" p="4">
                <Flex align="center" gap="2">
                  <RocketIcon width="16" height="16" color="teal" />
                  <Text size="2" weight="medium">Status: Radix UI Migration in Progress</Text>
                </Flex>
                <Text size="2" color="gray">
                  ✅ Radix Themes configured · ✅ Color tokens migrated · ✅ Core primitives created · 🚧 Component migration ongoing
                </Text>
              </Flex>
            </Card>
          </Flex>
        </Container>
      </Section>
    </main>
  );
}
