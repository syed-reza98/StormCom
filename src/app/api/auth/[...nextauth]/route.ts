import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth';

/**
 * NextAuth.js v5 API route handler
 * Handles all authentication requests: /api/auth/*
 * 
 * Routes handled:
 * - GET  /api/auth/signin - Sign in page
 * - POST /api/auth/signin - Sign in with credentials
 * - GET  /api/auth/signout - Sign out page
 * - POST /api/auth/signout - Sign out action
 * - GET  /api/auth/session - Get current session
 * - GET  /api/auth/csrf - Get CSRF token
 * - GET  /api/auth/providers - Get configured providers
 */

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
