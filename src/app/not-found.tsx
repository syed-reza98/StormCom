/**
 * 404 Not Found Page
 * 
 * Global not-found page for the application
 */

import Link from 'next/link';
import { Section, Container, Flex, Heading, Text, Button } from '@radix-ui/themes';
import { CrossCircledIcon, HomeIcon, ArrowLeftIcon } from '@radix-ui/react-icons';

export default function NotFound() {
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
              backgroundColor: 'var(--red-3)',
              border: '4px solid var(--red-6)',
            }}
          >
            <CrossCircledIcon width="64" height="64" color="red" />
          </Flex>

          {/* Error Message */}
          <Flex direction="column" align="center" gap="3">
            <Heading size="9" align="center" style={{ color: 'var(--gray-12)' }}>
              404
            </Heading>
            <Heading size="6" align="center" style={{ color: 'var(--gray-11)' }}>
              Page Not Found
            </Heading>
            <Text size="4" align="center" color="gray" style={{ maxWidth: '500px' }}>
              Sorry, we couldn&apos;t find the page you&apos;re looking for. The page may have been moved, deleted, or never existed.
            </Text>
          </Flex>

          {/* Actions */}
          <Flex gap="4" align="center">
            <Link href="/">
              <Button size="3" variant="solid">
                <HomeIcon width="16" height="16" />
                Go to Homepage
              </Button>
            </Link>
            <Link href="/">
              <Button size="3" variant="outline">
                <ArrowLeftIcon width="16" height="16" />
                Go Back
              </Button>
            </Link>
          </Flex>

          {/* Help Text */}
          <Text size="2" color="gray" align="center">
            If you believe this is an error, please{' '}
            <a href="/contact" style={{ color: 'var(--teal-11)', textDecoration: 'underline' }}>
              contact support
            </a>
          </Text>
        </Flex>
      </Container>
    </Section>
  );
}
