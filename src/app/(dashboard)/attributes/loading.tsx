// src/app/(dashboard)/attributes/loading.tsx
// Loading skeleton for Attributes page - instant loading state

import { Flex, Heading, Container, Section } from '@radix-ui/themes';
import { MixIcon, PlusIcon, CheckCircledIcon, ColorWheelIcon, ArchiveIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function AttributesLoading() {
  return (
    <Section size="2">
      <Container size="4">
        <Flex direction="column" gap="6">
          {/* Header */}
          <Flex justify="between" align="start">
            <Flex direction="column" gap="2">
              <Flex align="center" gap="3">
                <MixIcon width="32" height="32" color="teal" />
                <Heading size="8">Product Attributes</Heading>
              </Flex>
              <Skeleton className="h-5 w-96" />
            </Flex>
            <Button disabled>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Attribute
            </Button>
          </Flex>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[MixIcon, CheckCircledIcon, ColorWheelIcon, ArchiveIcon].map((Icon, idx) => (
              <div key={idx} className="bg-card rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <Icon width="20" height="20" color="gray" />
                  </div>
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-12" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Table Skeleton */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-6 w-32" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                </div>

                {/* Table Rows Skeleton */}
                <div className="space-y-3 mt-6">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 py-3 border-b">
                      <Skeleton className="w-4 h-4 rounded" />
                      <Skeleton className="w-8 h-8 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                      <Skeleton className="w-16 h-6 rounded-full" />
                      <Skeleton className="w-20 h-4" />
                      <Skeleton className="w-24 h-8 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Skeleton */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                <div className="bg-card rounded-lg border p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-lg" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-20 mb-1" />
                          <Skeleton className="h-3 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card rounded-lg border p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full rounded" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Flex>
      </Container>
    </Section>
  );
}
