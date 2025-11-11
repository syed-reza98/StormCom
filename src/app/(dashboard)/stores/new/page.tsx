import { Metadata } from 'next';
import { Suspense } from 'react';
import { Section, Container, Flex, Heading, Text, Card } from '@radix-ui/themes';
import { PlusCircledIcon } from '@radix-ui/react-icons';
import { CreateStoreForm } from '@/components/stores';

export const metadata: Metadata = {
  title: 'Create New Store | StormCom Dashboard',
  description: 'Create a new store in your multi-tenant e-commerce platform',
};

/**
 * Create Store Page Component
 * 
 * Renders the form for creating a new store with validation and proper error handling.
 * Includes name, subdomain, and owner selection fields.
 */
export default function CreateStorePage() {
  return (
    <Section size="2">
      <Container size="3">
        <Flex direction="column" gap="6">
          {/* Page Header */}
          <Flex direction="column" align="center" gap="2">
            <Flex align="center" gap="3">
              <PlusCircledIcon width="32" height="32" color="teal" />
              <Heading size="8">Create New Store</Heading>
            </Flex>
            <Text size="4" color="gray" align="center">
              Set up a new store for your e-commerce platform
            </Text>
          </Flex>

          {/* Create Store Form */}
          <Card size="3">
            <Suspense
              fallback={
                <Flex direction="column" gap="6">
                  <div style={{ height: '80px', backgroundColor: 'var(--gray-3)', borderRadius: '8px' }} />
                  <div style={{ height: '80px', backgroundColor: 'var(--gray-3)', borderRadius: '8px' }} />
                  <div style={{ height: '80px', backgroundColor: 'var(--gray-3)', borderRadius: '8px' }} />
                  <div style={{ height: '40px', backgroundColor: 'var(--gray-3)', borderRadius: '8px', width: '128px' }} />
                </Flex>
              }
            >
              <CreateStoreForm />
            </Suspense>
          </Card>
        </Flex>
      </Container>
    </Section>
  );
}