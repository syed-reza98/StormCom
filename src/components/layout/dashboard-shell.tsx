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
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 z-50 rounded-lg bg-primary px-4 py-3 text-primary-foreground font-medium shadow-lg focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to content
      </a>
      
      {/* Sidebar */}
      <aside className="hidden lg:block border-r bg-card/50 backdrop-blur-sm">
        <div className="sticky top-0">
          <div className="p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <Flex direction="column" gap="1">
              <Link href="/" className="text-xl font-bold tracking-tight hover:text-primary transition-colors">
                StormCom
              </Link>
              <Text size="2" color="gray" className="font-medium">
                Multi-tenant E-commerce
              </Text>
            </Flex>
          </div>
          <nav className="px-3 pb-6 pt-4 space-y-1" aria-label="Main navigation">
            <NavLink href="/products">
              <CubeIcon className="h-4 w-4" aria-hidden="true" />
              Products
            </NavLink>
            <NavLink href="/categories">
              <StackIcon className="h-4 w-4" aria-hidden="true" />
              Categories
            </NavLink>
            <NavLink href="/attributes">
              <MixIcon className="h-4 w-4" aria-hidden="true" />
              Attributes
            </NavLink>
            <NavLink href="/brands">
              <FileTextIcon className="h-4 w-4" aria-hidden="true" />
              Brands
            </NavLink>
            <NavLink href="/stores">
              <HomeIcon className="h-4 w-4" aria-hidden="true" />
              Stores
            </NavLink>
            <NavLink href="/inventory">
              <ArchiveIcon className="h-4 w-4" aria-hidden="true" />
              Inventory
            </NavLink>
            <NavLink href="/orders">
              <ArchiveIcon className="h-4 w-4" aria-hidden="true" />
              Orders
            </NavLink>
            <NavLink href="/bulk-import">
              <UploadIcon className="h-4 w-4" aria-hidden="true" />
              Bulk Import
            </NavLink>
            <NavLink href="/settings">
              <GearIcon className="h-4 w-4" aria-hidden="true" />
              Settings
            </NavLink>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-h-dvh flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between gap-4 px-4">
            <Flex align="center" gap="3">
              <button
                className={cn('lg:hidden', buttonVariants({ variant: 'ghost', size: 'icon' }))}
                aria-label="Open navigation menu"
              >
                <HamburgerMenuIcon className="h-5 w-5" aria-hidden="true" />
              </button>
              <Link href="/" className="font-bold text-lg hover:text-primary transition-colors">
                StormCom
              </Link>
            </Flex>
            <Flex align="center" gap="3" className="ml-auto">
              {/* Store switcher placeholder */}
              <span className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                Default Store
              </span>
              {/* User avatar placeholder */}
              <button 
                className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'rounded-full')}
                aria-label="User account menu"
              >
                <span className="font-semibold text-sm">SC</span>
              </button>
            </Flex>
          </div>
          
          {/* Mobile quick nav */}
          <div className="lg:hidden border-t bg-background/95">
            <nav 
              className="container flex gap-2 overflow-x-auto py-3 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Mobile navigation"
            >
              <NavLink className="whitespace-nowrap text-sm" href="/products">Products</NavLink>
              <NavLink className="whitespace-nowrap text-sm" href="/categories">Categories</NavLink>
              <NavLink className="whitespace-nowrap text-sm" href="/attributes">Attributes</NavLink>
              <NavLink className="whitespace-nowrap text-sm" href="/brands">Brands</NavLink>
              <NavLink className="whitespace-nowrap text-sm" href="/stores">Stores</NavLink>
              <NavLink className="whitespace-nowrap text-sm" href="/inventory">Inventory</NavLink>
              <NavLink className="whitespace-nowrap text-sm" href="/orders">Orders</NavLink>
              <NavLink className="whitespace-nowrap text-sm" href="/bulk-import">Bulk Import</NavLink>
              <NavLink className="whitespace-nowrap text-sm" href="/settings">Settings</NavLink>
            </nav>
          </div>
        </header>

        <main id="main-content" className="container flex-1 py-8 px-4" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}
