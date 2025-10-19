/**
 * Authentication Helpers
 * 
 * Server-side helpers for Next.js Server Components and API routes.
 * Uses NextAuth.js v5 session management.
 */

import { cookies } from 'next/headers';
import { decode } from 'next-auth/jwt';

export interface Session {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  };
  expires: string;
}

/**
 * Get current session from cookies (for Server Components)
 * Returns null if not authenticated
 */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('next-auth.session-token') || 
                        cookieStore.get('__Secure-next-auth.session-token');

    if (!sessionToken) {
      return null;
    }

    // Decode JWT token
    const decoded = await decode({
      token: sessionToken.value,
      secret: process.env.NEXTAUTH_SECRET!,
        salt: 'authjs.session-token',
    });

    if (!decoded) {
      return null;
    }

    // Return session in expected format
    return {
      user: {
        id: decoded.id as string,
        email: decoded.email as string,
        name: decoded.name as string | null,
        image: decoded.image as string | null,
      },
      expires: new Date(decoded.exp! * 1000).toISOString(),
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Require authentication (for Server Components)
 * Throws redirect if not authenticated
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    throw new Error('UNAUTHENTICATED');
  }

  return session;
}

/**
 * Get user ID from session (convenience helper)
 */
export async function getUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id || null;
}
