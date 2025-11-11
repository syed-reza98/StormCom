/**
 * Cart Page
 * 
 * Client Component displaying shopping cart items with quantity controls
 * and checkout button.
 */

'use client';

import { useCart } from '@/hooks/use-cart';
import Image from 'next/image';
import Link from 'next/link';
import { Flex, Heading, Text, Container, Section } from '@radix-ui/themes';
import { 
  TrashIcon, 
  BackpackIcon, 
  ArrowRightIcon,
  MinusIcon,
  PlusIcon,
  CheckCircledIcon
} from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function CartPage() {
  const {
    items,
    totalItems,
    totalPrice,
    isLoaded,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  // Loading state
  if (!isLoaded) {
    return (
      <Section size="2">
        <Container size="4">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-48 mb-4" />
              <Skeleton className="h-48 mb-4" />
            </div>
            <div>
              <Skeleton className="h-64" />
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  // Empty cart state
  if (items.length === 0) {
    return (
      <Section size="2">
        <Container size="3">
          <Flex direction="column" gap="6">
            <Heading size="8">Shopping Cart</Heading>
            <Card className="p-12">
              <Flex direction="column" align="center" gap="4">
                <BackpackIcon width="64" height="64" color="gray" />
                <Heading size="6" align="center">Your cart is empty</Heading>
                <Text size="3" color="gray" align="center">
                  Add some products to get started
                </Text>
                <Link href="/shop/products">
                  <Button size="lg">
                    Browse Products
                    <ArrowRightIcon className="ml-2" width="16" height="16" />
                  </Button>
                </Link>
              </Flex>
            </Card>
          </Flex>
        </Container>
      </Section>
    );
  }

  return (
    <Section size="2">
      <Container size="4">
        {/* Header */}
        <Flex align="center" justify="between" mb="6">
          <Heading size="8">
            Shopping Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
          </Heading>
          <Button variant="outline" onClick={clearCart}>
            Clear Cart
          </Button>
        </Flex>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={`${item.productId}-${item.variantId || 'default'}`} className="p-4">
              <div className="flex gap-4">
                {/* Product Image */}
                <Link
                  href={`/shop/products/${item.productSlug}`}
                  className="flex-shrink-0"
                >
                  <div className="relative w-24 h-24 rounded overflow-hidden bg-muted">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                        No Image
                      </div>
                    )}
                  </div>
                </Link>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/shop/products/${item.productSlug}`}
                    className="font-semibold hover:text-primary transition-colors"
                  >
                    {item.productName}
                  </Link>
                  {item.variantName && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Variant: {item.variantName}
                    </p>
                  )}
                  <p className="text-lg font-bold mt-2">
                    ${item.price.toFixed(2)}
                  </p>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateQuantity(
                          item.productId,
                          item.quantity - 1,
                          item.variantId
                        )
                      }
                      disabled={item.quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      <MinusIcon width="16" height="16" />
                    </Button>
                    <span className="w-12 text-center font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateQuantity(
                          item.productId,
                          item.quantity + 1,
                          item.variantId
                        )
                      }
                      disabled={item.quantity >= item.maxQuantity}
                      aria-label="Increase quantity"
                    >
                      <PlusIcon width="16" height="16" />
                    </Button>
                    <span className="text-xs text-muted-foreground ml-2">
                      Max: {item.maxQuantity}
                    </span>
                  </div>
                </div>

                {/* Item Total & Remove */}
                <div className="flex flex-col items-end justify-between">
                  <p className="text-lg font-bold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.productId, item.variantId)}
                    className="text-destructive hover:text-destructive"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <Card className="p-6 sticky top-4">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">Calculated at checkout</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <Button size="lg" className="w-full mb-3">
              Proceed to Checkout
              <ArrowRightIcon className="ml-2" width="16" height="16" />
            </Button>

            <Link href="/shop/products">
              <Button variant="outline" size="lg" className="w-full">
                Continue Shopping
              </Button>
            </Link>

            {/* Trust Badges */}
            <div className="mt-6 pt-6 border-t space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <CheckCircledIcon width="16" height="16" color="green" />
                Secure checkout
              </p>
              <p className="flex items-center gap-2">
                <CheckCircledIcon width="16" height="16" color="green" />
                Free shipping on orders over $50
              </p>
              <p className="flex items-center gap-2">
                <CheckCircledIcon width="16" height="16" color="green" />
                30-day return policy
              </p>
            </div>
          </Card>
        </div>
      </div>
    </Container>
  </Section>
  );
}
