/**
 * Wishlists Page
 * 
 * Customer-facing page for managing product wishlists.
 * Allows customers to save products for later and share lists.
 */

import { Metadata } from 'next';
import { Section, Container, Flex, Heading, Text, Card, Button } from '@radix-ui/themes';
import { HeartIcon, HeartFilledIcon, PlusIcon, Share1Icon } from '@radix-ui/react-icons';

export const metadata: Metadata = {
  title: 'My Wishlists | StormCom',
  description: 'Manage your saved products and wishlists',
};

export default function WishlistsPage() {
  return (
    <Section size="2">
      <Container size="4">
        <Flex direction="column" gap="6">
          {/* Page Header */}
          <Flex align="center" justify="between">
            <Flex align="center" gap="3">
              <HeartFilledIcon width="32" height="32" color="red" />
              <div>
                <Heading size="8">My Wishlists</Heading>
                <Text size="3" color="gray">
                  Save your favorite products for later
                </Text>
              </div>
            </Flex>
            
            <Button size="3">
              <PlusIcon width="16" height="16" />
              Create Wishlist
            </Button>
          </Flex>

          {/* Wishlists Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: '24px' 
          }}>
            {/* Default Wishlist */}
            <Card size="3">
              <Flex direction="column" gap="4">
                <Flex align="center" justify="between">
                  <Flex align="center" gap="2">
                    <HeartIcon width="24" height="24" color="red" />
                    <Heading size="5">My Favorites</Heading>
                  </Flex>
                  <Button size="1" variant="ghost">
                    <Share1Icon width="14" height="14" />
                  </Button>
                </Flex>
                
                <Text size="2" color="gray">
                  12 items
                </Text>
                
                <Button size="2" variant="soft">
                  View Items
                </Button>
              </Flex>
            </Card>

            {/* Gift Ideas Wishlist */}
            <Card size="3">
              <Flex direction="column" gap="4">
                <Flex align="center" justify="between">
                  <Flex align="center" gap="2">
                    <HeartIcon width="24" height="24" color="red" />
                    <Heading size="5">Gift Ideas</Heading>
                  </Flex>
                  <Button size="1" variant="ghost">
                    <Share1Icon width="14" height="14" />
                  </Button>
                </Flex>
                
                <Text size="2" color="gray">
                  5 items
                </Text>
                
                <Button size="2" variant="soft">
                  View Items
                </Button>
              </Flex>
            </Card>

            {/* Empty State for New Wishlist */}
            <Card 
              size="3" 
              style={{ 
                border: '2px dashed var(--gray-6)',
                backgroundColor: 'var(--gray-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px',
                cursor: 'pointer'
              }}
            >
              <Flex direction="column" align="center" gap="3">
                <PlusIcon width="32" height="32" color="gray" />
                <Text size="2" color="gray" align="center">
                  Create a new wishlist
                </Text>
              </Flex>
            </Card>
          </div>

          {/* Empty State (if no wishlists) */}
          <Card size="3" style={{ display: 'none' /* Show when no wishlists */ }}>
            <Flex direction="column" align="center" gap="4" style={{ padding: '48px' }}>
              <HeartIcon width="64" height="64" color="gray" />
              <Heading size="6" align="center">No Wishlists Yet</Heading>
              <Text size="3" color="gray" align="center" style={{ maxWidth: '400px' }}>
                Create your first wishlist to save products you love
              </Text>
              <Button size="3">
                <PlusIcon width="16" height="16" />
                Create Your First Wishlist
              </Button>
            </Flex>
          </Card>
        </Flex>
      </Container>
    </Section>
  );
}
