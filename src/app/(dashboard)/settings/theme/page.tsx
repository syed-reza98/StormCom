/**
 * Theme Editor Page
 * 
 * Dashboard page for customizing store theme including colors, typography, and layout.
 * Provides live preview of theme changes before saving.
 * 
 * Route: /settings/theme
 * 
 * @module app/(dashboard)/settings/theme/page
 */

import { Metadata } from 'next';
import { getCurrentUser } from '@/lib/get-current-user';

export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { ThemeEditor } from '@/components/theme/theme-editor';
import { getStoreTheme } from '@/services/theme-service';
import { prisma } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Theme Customization | StormCom',
  description: 'Customize your store theme with colors, fonts, and layout settings',
};

/**
 * Theme Settings Page
 */
export default async function ThemeSettingsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.id) {
    redirect('/login');
  }

  // Get user's store
  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  const store = user?.store;

  if (!store) {
    redirect('/onboarding');
  }

  // Get current theme
  const theme = await getStoreTheme(store.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Theme Customization</h1>
        <p className="mt-2 text-muted-foreground">
          Customize your store&apos;s appearance with colors, fonts, and layout settings.
          Changes will be reflected on your storefront at{' '}
          <span className="font-mono text-sm">{store.slug}.stormcom.io</span>
        </p>
      </div>

      <ThemeEditor storeId={store.id} initialTheme={theme} />
    </div>
  );
}
