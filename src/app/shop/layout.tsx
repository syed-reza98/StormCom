/**
 * Storefront Layout
 * 
 * Layout for the storefront (shop) pages with dynamic theme loading.
 * Applies store-specific theme CSS custom properties.
 * 
 * Route: /shop/*
 * 
 * @module app/shop/layout
 */

import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { getStoreTheme } from '@/services/theme-service';
import { getThemeCSSString } from '@/lib/theme-utils';

interface StorefrontLayoutProps {
  children: React.ReactNode;
}

/**
 * Get store from request headers or subdomain
 */
async function getStore() {
  const headersList = headers();
  const host = headersList.get('host') || '';

  // Extract subdomain (e.g., "demo-store" from "demo-store.stormcom.io")
  const subdomain = host.split('.')[0];

  // Find store by slug (subdomain)
  const store = await prisma.store.findFirst({
    where: {
      slug: subdomain,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return store;
}

/**
 * Storefront Layout with Dynamic Theme
 */
export default async function StorefrontLayout({ children }: StorefrontLayoutProps) {
  const store = await getStore();

  // Load theme if store exists
  let themeCSS = '';
  if (store) {
    const theme = await getStoreTheme(store.id);
    themeCSS = getThemeCSSString(theme);
  }

  return (
    <>
      {/* Inject theme CSS as inline styles */}
      {themeCSS && (
        <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
      )}

      {/* Storefront content */}
      <div className="min-h-screen" style={{ backgroundColor: 'var(--background-color, #FFFFFF)', color: 'var(--text-color, #1F2937)' }}>
        {children}
      </div>
    </>
  );
}
