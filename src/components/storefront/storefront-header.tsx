/**
 * Storefront Header Component
 * 
 * Customer-facing header with navigation, search, and cart.
 * Mobile-responsive with Sheet navigation for small screens.
 * 
 * Features:
 * - Logo and brand
 * - Search bar
 * - Main navigation
 * - Cart icon with badge
 * - Mobile Sheet navigation
 * - Keyboard accessible
 * 
 * @module components/storefront/storefront-header
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  HamburgerMenuIcon,
  PersonIcon,
  HomeIcon,
  BackpackIcon,
  ReaderIcon,
  HeartIcon,
} from '@radix-ui/react-icons';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface StorefrontHeaderProps {
  cartItemCount?: number;
}

export function StorefrontHeader({ cartItemCount = 0 }: StorefrontHeaderProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const navigationItems = [
    { href: '/shop', label: 'Shop', icon: HomeIcon },
    { href: '/shop/products', label: 'Products', icon: BackpackIcon },
    { href: '/shop/categories', label: 'Categories', icon: ReaderIcon },
    { href: '/shop/wishlists', label: 'Wishlist', icon: HeartIcon },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <nav aria-label="Main navigation" className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link
              href="/shop"
              className="flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
            >
              <BackpackIcon className="h-6 w-6 text-primary" aria-hidden="true" />
              <span className="hidden font-bold sm:inline-block">
                StormCom
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:gap-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded px-2 py-1"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Search, Cart, Account */}
          <div className="flex items-center gap-2">
            {/* Search Bar - Hidden on mobile */}
            <form onSubmit={handleSearch} className="hidden lg:block">
              <div className="relative">
                <MagnifyingGlassIcon
                  className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-8 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search products"
                />
              </div>
            </form>

            {/* Search Icon - Visible on mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => router.push('/shop/search')}
              aria-label="Search"
            >
              <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
            </Button>

            {/* Cart */}
            <Link href="/shop/cart" className="relative">
              <Button variant="ghost" size="icon" aria-label={`Shopping cart with ${cartItemCount} items`}>
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                {cartItemCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Account Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account menu">
                  <PersonIcon className="h-5 w-5" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/shop/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/shop/orders">Orders</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/shop/wishlists">Wishlist</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/login">Sign In</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <HamburgerMenuIcon className="h-5 w-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" aria-labelledby="mobile-menu-title">
                <SheetHeader>
                  <SheetTitle id="mobile-menu-title">Navigation</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-8" aria-label="Mobile navigation">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 text-lg font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded px-2 py-2"
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  );
}
