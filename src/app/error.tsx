'use client';

/**
 * Error Page
 * 
 * Global error boundary for the application
 */

import { Section, Container, Flex, Heading, Text, Button } from '@radix-ui/themes';
import { ExclamationTriangleIcon, ReloadIcon, HomeIcon } from '@radix-ui/react-icons';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Section size="3">
      <Container size="2">
        <Flex direction="column" align="center" gap="6" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
          {/* Error Icon */}
          <Flex
            align="center"
            justify="center"
            style={{
              width: '128px',
              height: '128px',
              borderRadius: '50%',
              backgroundColor: 'var(--amber-3)',
              border: '4px solid var(--amber-6)',
            }}
          >
            <ExclamationTriangleIcon width="64" height="64" color="amber" />
          </Flex>

          {/* Error Message */}
          <Flex direction="column" align="center" gap="3">
            <Heading size="7" align="center" style={{ color: 'var(--gray-12)' }}>
              Something went wrong!
            </Heading>
            <Text size="4" align="center" color="gray" style={{ maxWidth: '500px' }}>
              {error.message || 'An unexpected error occurred. Please try again.'}
            </Text>
            {error.digest && (
              <Text size="2" color="gray" align="center" style={{ fontFamily: 'monospace' }}>
                Error ID: {error.digest}
              </Text>
            )}
          </Flex>

          {/* Actions */}
          <Flex gap="4" align="center">
            <Button size="3" variant="solid" onClick={reset}>
              <ReloadIcon width="16" height="16" />
              Try Again
            </Button>
            <Link href="/">
              <Button size="3" variant="outline">
                <HomeIcon width="16" height="16" />
                Go to Homepage
              </Button>
            </Link>
          </Flex>

          {/* Help Text */}
          <Text size="2" color="gray" align="center">
            If this error persists, please{' '}
            <a href="/contact" style={{ color: 'var(--teal-11)', textDecoration: 'underline' }}>
              contact support
            </a>
          </Text>
        </Flex>
      </Container>
    </Section>
  );
}
