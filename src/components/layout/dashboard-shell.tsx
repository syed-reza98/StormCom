import React from 'react';
import Link from 'next/link';
import { Flex, Text } from '@radix-ui/themes';
import { CubeIcon, StackIcon, MixIcon, FileTextIcon, HomeIcon, ArchiveIcon, UploadIcon, HamburgerMenuIcon, GearIcon } from '@radix-ui/react-icons';
import { NavLink } from '@/components/ui/nav-link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type DashboardShellProps = {
  children: React.ReactNode;
};

export default function DashboardShell({ children }: DashboardShellProps): React.JSX.Element {
  return (
    <div className="min-h-dvh grid grid-cols-1 lg:grid-cols-[260px_1fr]">
      {/* Skip link for accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground">Skip to content</a>
      {/* Sidebar */}
      <aside className="hidden lg:block border-r bg-card/60">
        <div className="p-6 border-b">
          <Flex direction="column" gap="1">
            <Link href="/" className="text-xl font-semibold tracking-tight">StormCom</Link>
            <Text size="1" color="gray">Multi-tenant commerce</Text>
          </Flex>
        </div>
        <nav className="px-2 pb-6 pt-3 space-y-1">
          <NavLink href="/(dashboard)/products">
            <CubeIcon className="h-4 w-4" />
            Products
          </NavLink>
          <NavLink href="/(dashboard)/categories">
            <StackIcon className="h-4 w-4" />
            Categories
          </NavLink>
          <NavLink href="/(dashboard)/attributes">
            <MixIcon className="h-4 w-4" />
            Attributes
          </NavLink>
          <NavLink href="/(dashboard)/brands">
            <FileTextIcon className="h-4 w-4" />
            Brands
          </NavLink>
          <NavLink href="/(dashboard)/stores">
            <HomeIcon className="h-4 w-4" />
            Stores
          </NavLink>
          <NavLink href="/(dashboard)/inventory">
            <ArchiveIcon className="h-4 w-4" />
            Inventory
          </NavLink>
          <NavLink href="/(dashboard)/orders">
            <ArchiveIcon className="h-4 w-4" />
            Orders
          </NavLink>
          <NavLink href="/(dashboard)/bulk-import">
            <UploadIcon className="h-4 w-4" />
            Bulk Import
          </NavLink>
          <NavLink href="/(dashboard)/settings">
            <GearIcon className="h-4 w-4" />
            Settings
          </NavLink>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex min-h-dvh flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between gap-3">
            <Flex align="center" gap="3">
              <button
                className={cn('lg:hidden', buttonVariants({ variant: 'outline', size: 'icon' }))}
                aria-label="Open navigation"
              >
                <HamburgerMenuIcon className="h-4 w-4" />
              </button>
              <Link href="/" className="font-semibold">StormCom</Link>
            </Flex>
            <Flex align="center" gap="2" className="ml-auto">
              {/* Placeholder: Store switcher */}
              <span className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>Default Store</span>
              {/* User avatar */}
              <span className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'rounded-full')}>SC</span>
            </Flex>
          </div>
          {/* Mobile quick nav */}
          <div className="lg:hidden border-t">
            <div className="container flex gap-2 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <NavLink className="whitespace-nowrap" href="/(dashboard)/products">Products</NavLink>
              <NavLink className="whitespace-nowrap" href="/(dashboard)/categories">Categories</NavLink>
              <NavLink className="whitespace-nowrap" href="/(dashboard)/attributes">Attributes</NavLink>
              <NavLink className="whitespace-nowrap" href="/(dashboard)/brands">Brands</NavLink>
              <NavLink className="whitespace-nowrap" href="/(dashboard)/stores">Stores</NavLink>
              <NavLink className="whitespace-nowrap" href="/(dashboard)/inventory">Inventory</NavLink>
              <NavLink className="whitespace-nowrap" href="/(dashboard)/orders">Orders</NavLink>
              <NavLink className="whitespace-nowrap" href="/(dashboard)/bulk-import">Bulk Import</NavLink>
              <NavLink className="whitespace-nowrap" href="/(dashboard)/settings">Settings</NavLink>
            </div>
          </div>
        </header>

        <main id="main-content" className="container flex-1 py-6">{children}</main>
      </div>
    </div>
  );
}
