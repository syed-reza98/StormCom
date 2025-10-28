import React from 'react';
import Link from 'next/link';
import { NavLink } from '@/components/ui/nav-link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Boxes, Package, Layers, Tags, Building2, UploadCloud, Settings, Menu } from 'lucide-react';

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
          <Link href="/" className="text-xl font-semibold tracking-tight">StormCom</Link>
          <p className="mt-1 text-xs text-muted-foreground">Multi-tenant commerce</p>
        </div>
        <nav className="px-2 pb-6 pt-3 space-y-1">
          <NavLink href="/products">
            <Package className="h-4 w-4" />
            Products
          </NavLink>
          <NavLink href="/categories">
            <Layers className="h-4 w-4" />
            Categories
          </NavLink>
          <NavLink href="/brands">
            <Tags className="h-4 w-4" />
            Brands
          </NavLink>
          <NavLink href="/stores">
            <Building2 className="h-4 w-4" />
            Stores
          </NavLink>
          <NavLink href="/attributes">
            <Boxes className="h-4 w-4" />
            Attributes
          </NavLink>
          <NavLink href="/bulk-import">
            <UploadCloud className="h-4 w-4" />
            Bulk Import
          </NavLink>
          <NavLink href="/settings">
            <Settings className="h-4 w-4" />
            Settings
          </NavLink>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex min-h-dvh flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                className={cn('lg:hidden', buttonVariants({ variant: 'outline', size: 'icon' }))}
                aria-label="Open navigation"
              >
                <Menu className="h-4 w-4" />
              </button>
              <Link href="/" className="font-semibold">StormCom</Link>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {/* Placeholder: Store switcher */}
              <span className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>Default Store</span>
              {/* User avatar */}
              <span className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'rounded-full')}>SC</span>
            </div>
          </div>
          {/* Mobile quick nav */}
          <div className="lg:hidden border-t">
            <div className="container flex gap-2 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <NavLink className="whitespace-nowrap" href="/products">Products</NavLink>
              <NavLink className="whitespace-nowrap" href="/categories">Categories</NavLink>
              <NavLink className="whitespace-nowrap" href="/brands">Brands</NavLink>
              <NavLink className="whitespace-nowrap" href="/stores">Stores</NavLink>
              <NavLink className="whitespace-nowrap" href="/attributes">Attributes</NavLink>
              <NavLink className="whitespace-nowrap" href="/bulk-import">Bulk Import</NavLink>
              <NavLink className="whitespace-nowrap" href="/settings">Settings</NavLink>
            </div>
          </div>
        </header>

        <main id="main-content" className="container flex-1 py-6">{children}</main>
      </div>
    </div>
  );
}
