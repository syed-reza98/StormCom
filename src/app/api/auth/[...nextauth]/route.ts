/**
 * NextAuth.js API Route Handler
 * 
 * Handles all authentication requests:
 * - Sign in (credentials, OAuth)
 * - Sign out
 * - Session management
 * - Callbacks
 * 
 * @see https://next-auth.js.org/configuration/initialization#route-handlers-app
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * NextAuth route handler for App Router
 * 
 * Exports both GET and POST handlers as required by Next.js 13+ App Router.
 * All authentication routes are handled through this single endpoint:
 * 
 * - GET /api/auth/signin - Sign in page
 * - POST /api/auth/signin/credentials - Credentials login
 * - GET /api/auth/signout - Sign out page
 * - POST /api/auth/signout - Sign out action
 * - GET /api/auth/session - Get current session
 * - GET /api/auth/csrf - Get CSRF token
 * - GET /api/auth/providers - Get configured providers
 * - POST /api/auth/callback/:provider - OAuth callbacks
 * 
 * @example
 * // Client-side usage
 * import { signIn, signOut } from 'next-auth/react';
 * 
 * // Sign in
 * await signIn('credentials', { email, password });
 * 
 * // Sign out
 * await signOut();
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
