import React from 'react';
import Link from 'next/link';
import { Flex, Heading, Text, Card, Container, Section, Grid } from '@radix-ui/themes';
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

const features = [
  {
    icon: ComponentInstanceIcon,
    title: 'Multi-tenant Architecture',
    description: 'Complete tenant isolation with automatic storeId filtering via Prisma middleware',
    color: 'var(--teal-9)',
  },
  {
    icon: RocketIcon,
    title: 'E-commerce Ready',
    description: 'Complete product catalog, checkout system, and order management',
    color: 'var(--purple-9)',
  },
  {
    icon: LightningBoltIcon,
    title: 'Next.js 16',
    description: 'Built with App Router, React Server Components, and Cache Components',
    color: 'var(--amber-9)',
  },
  {
    icon: AccessibilityIcon,
    title: 'Accessibility First',
    description: 'WCAG 2.2 AA compliant with Radix UI primitives and comprehensive testing',
    color: 'var(--grass-9)',
  },
  {
    icon: DashboardIcon,
    title: 'Radix UI Design System',
    description: 'Unified design foundation with Themes, Primitives, Icons, and Colors',
    color: 'var(--teal-9)',
  },
  {
    icon: MixerHorizontalIcon,
    title: 'Customizable Theming',
    description: 'Per-tenant branding with dynamic color schemes and dark mode support',
    color: 'var(--purple-9)',
  },
];

export default function HomePage(): React.JSX.Element {
  return (
    <main className="min-h-screen">
      <Section size="3" className="py-16 md:py-24">
        <Container size="4">
          <Flex direction="column" gap="9" align="center">
            {/* Hero Section */}
            <Flex direction="column" gap="5" align="center" className="text-center max-w-4xl">
              <Heading size="9" weight="bold" className="text-balance">
                Welcome to StormCom
              </Heading>
              <Text size="5" color="gray" className="text-balance max-w-2xl">
                Multi-tenant E-commerce SaaS Platform built with Next.js 16, TypeScript, and Radix UI
              </Text>
              
              <Flex gap="4" mt="4" wrap="wrap" justify="center">
                <Link href="/products" className={cn(buttonVariants({ size: 'lg' }))}>
                  <DashboardIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                  Go to Dashboard
                </Link>
                <Button variant="outline" size="lg">
                  Read Documentation
                </Button>
              </Flex>
            </Flex>

            {/* Feature Cards Grid */}
            <div className="w-full max-w-6xl">
              <Grid 
                columns={{ initial: '1', sm: '2', lg: '3' }} 
                gap="6" 
                width="auto"
              >
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                      <Flex direction="column" gap="4">
                        <Flex align="center" gap="3">
                          <div 
                            className="p-2 rounded-lg" 
                            style={{ backgroundColor: `${feature.color}15` }}
                          >
                            <Icon 
                              width="24" 
                              height="24" 
                              style={{ color: feature.color }}
                              aria-hidden="true"
                            />
                          </div>
                          <Heading size="5" weight="medium" className="flex-1">
                            {feature.title}
                          </Heading>
                        </Flex>
                        <Text size="3" color="gray" className="leading-relaxed">
                          {feature.description}
                        </Text>
                      </Flex>
                    </Card>
                  );
                })}
              </Grid>
            </div>

            {/* Status Banner */}
            <Card className="w-full max-w-3xl bg-[var(--teal-2)] border-[var(--teal-6)]">
              <Flex direction="column" gap="3" p="6">
                <Flex align="center" gap="3">
                  <RocketIcon width="20" height="20" style={{ color: 'var(--teal-9)' }} aria-hidden="true" />
                  <Text size="3" weight="bold" style={{ color: 'var(--teal-11)' }}>
                    Status: Radix UI Migration Complete
                  </Text>
                </Flex>
                <Text size="2" color="gray" className="leading-relaxed">
                  ✅ Radix Themes configured • ✅ Color tokens migrated • ✅ Core primitives created • ✅ Design system established
                </Text>
              </Flex>
            </Card>
          </Flex>
        </Container>
      </Section>
    </main>
  );
}
