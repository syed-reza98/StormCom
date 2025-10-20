'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * Application Providers
 * 
 * Wraps the entire application with necessary context providers.
 * Currently includes:
 * - next-themes ThemeProvider for dark mode support
 * 
 * Future providers to add:
 * - Session Provider (NextAuth)
 * - React Query Provider (if added)
 * - Toast/Notification Provider
 * 
 * Usage in root layout:
 * ```tsx
 * import { Providers } from '@/app/providers';
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html lang="en" suppressHydrationWarning>
 *       <body>
 *         <Providers>{children}</Providers>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 * 
 * @param props.children - Child components to wrap with providers
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
