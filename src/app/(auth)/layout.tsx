/**
 * Authentication Layout
 * 
 * Centered layout for authentication pages (login, register, forgot password, etc).
 * Provides consistent branding and navigation back to storefront.
 * 
 * Route: /(auth)/*
 * 
 * Features:
 * - Centered card design
 * - Back to storefront link
 * - Brand logo
 * - Responsive design
 * - Semantic HTML
 * 
 * @module app/(auth)/layout
 */

import Link from 'next/link';
import { ArrowLeftIcon } from '@radix-ui/react-icons';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Authentication Layout Component
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with back link */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/shop"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            <span>Back to Store</span>
          </Link>

          <Link
            href="/shop"
            className="text-lg font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
          >
            StormCom
          </Link>

          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main content area */}
      <main id="main-content" className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer with legal links */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            © {new Date().getFullYear()} StormCom. All rights reserved.
          </p>
          <div className="flex gap-4 justify-center text-sm text-muted-foreground">
            <Link
              href="/shop/legal/privacy"
              className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
            >
              Privacy
            </Link>
            <Link
              href="/shop/legal/terms"
              className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
            >
              Terms
            </Link>
            <Link
              href="/shop/help/contact"
              className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
            >
              Help
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
