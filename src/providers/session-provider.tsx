// src/providers/session-provider.tsx
// Client-side SessionProvider wrapper for NextAuth.js v4.24.13
// Must be used in the root layout to enable useSession hook

'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import type { ReactNode } from 'react';

interface SessionProviderProps {
  children: ReactNode;
  session?: Session | null;
}

/**
 * SessionProvider wrapper component
 * 
 * This must be added to the root layout to enable useSession hook throughout the app.
 * 
 * @example
 * ```typescript
 * // app/layout.tsx
 * import { SessionProvider } from '@/providers/session-provider';
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <SessionProvider>
 *           {children}
 *         </SessionProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider session={session} refetchInterval={5 * 60}>
      {children}
    </NextAuthSessionProvider>
  );
}
