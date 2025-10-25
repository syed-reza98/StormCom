// src/app/api/auth/[...nextauth]/route.ts
// NextAuth.js v5 Configuration for StormCom Multi-tenant Platform
// Provides JWT-based authentication with credentials provider

import NextAuth, { NextAuthConfig, User as NextAuthUser } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';

/**
 * Extended user type with StormCom-specific fields
 */
interface StormComUser extends NextAuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  storeId: string | null;
  mfaEnabled: boolean;
  mfaVerified?: boolean;
}

/**
 * Extended session type
 */
interface StormComSession {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    storeId: string | null;
    mfaEnabled: boolean;
  };
  expires: string;
}


/**
 * NextAuth.js v5 Configuration
 */
export const authOptions: NextAuthConfig = {
  // Session Strategy - JWT (stateless, serverless-friendly)
  session: {
    strategy: 'jwt',
    maxAge: 12 * 60 * 60, // 12 hours
    updateAge: 24 * 60 * 60, // Refresh token every 24 hours
  },

  // Authentication Providers
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        mfaCode: { label: 'MFA Code', type: 'text' },
      },
      async authorize(credentials): Promise<StormComUser | null> {
        // Validate credentials exist
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing email or password');
        }

        // Find user by email
        const user = await db.user.findUnique({
          where: { 
            email: String(credentials.email),
            deletedAt: null, // Exclude soft-deleted users
          },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            storeId: true,
            mfaEnabled: true,
            totpSecret: true,
            failedLoginAttempts: true,
            lockedUntil: true,
            lastLoginAt: true,
            emailVerified: true,
          },
        });

        // User not found
        if (!user) {
          throw new Error('Invalid email or password');
        }

        // Check if account is locked
        if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
          throw new Error('Account is temporarily locked. Please try again later.');
        }

        // Check if email is verified (optional - can require verification)
        // Uncomment to enforce email verification:
        // if (!user.emailVerified) {
        //   throw new Error('Please verify your email address before logging in.');
        // }

        // Verify password
        const isPasswordValid = await compare(String(credentials.password), user.password);
        
        if (!isPasswordValid) {
          // Increment failed login attempts
          await db.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: { increment: 1 },
              lockedUntil:
                user.failedLoginAttempts >= 4 // Lock after 5 failed attempts
                  ? new Date(Date.now() + 15 * 60 * 1000) // 15 minutes lockout
                  : null,
            },
          });

          throw new Error('Invalid email or password');
        }

        // MFA verification (if enabled)
        let mfaVerified = false;
        if (user.mfaEnabled) {
          if (!credentials.mfaCode) {
            // Return user but mark MFA as not verified
            // Frontend will show MFA challenge page
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              storeId: user.storeId,
              mfaEnabled: true,
              mfaVerified: false,
            };
          }

          // TODO: Verify MFA code (will be implemented in T034: MFA utilities)
          // For now, assume MFA is verified if code is provided
          mfaVerified = true;
        }

        // Update user login tracking
        await db.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            lastLoginIP: 'unknown', // TODO: Get from request headers in middleware
            failedLoginAttempts: 0,
            lockedUntil: null,
          },
        });

        // Return authenticated user
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          storeId: user.storeId,
          mfaEnabled: user.mfaEnabled,
          mfaVerified: user.mfaEnabled ? mfaVerified : undefined,
        };
      },
    }),
  ],

  // Callbacks - Customize JWT and session behavior
  callbacks: {
    /**
     * JWT Callback - Add custom fields to JWT token
     */
    async jwt({ token, user, trigger, session }) {
      // Initial sign in - add user data to token
      if (user) {
        const stormUser = user as StormComUser;
        token.id = stormUser.id;
        token.email = stormUser.email;
        token.name = stormUser.name;
        token.role = stormUser.role;
        token.storeId = stormUser.storeId;
        token.mfaEnabled = stormUser.mfaEnabled;
        token.mfaVerified = stormUser.mfaVerified;
      }

      // Session update (e.g., after MFA verification)
      if (trigger === 'update' && session) {
        token.mfaVerified = session.mfaVerified ?? token.mfaVerified;
      }

      return token;
    },

    /**
     * Session Callback - Expose JWT fields to client session
     */
    async session({ session, token }) {
      return {
        ...session,
        user: {
          id: String(token.id),
          email: String(token.email),
          name: token.name as string | null,
          role: token.role as UserRole,
          storeId: token.storeId as string | null,
          mfaEnabled: Boolean(token.mfaEnabled),
        },
      } as StormComSession;
    },

    /**
     * Redirect Callback - Customize redirect behavior after sign in
     */
    async redirect({ url, baseUrl }) {
      // Allow relative URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      
      // Allow URLs from the same origin
      if (new URL(url).origin === baseUrl) return url;
      
      // Default redirect to dashboard
      return `${baseUrl}/dashboard`;
    },
  },

  // Pages - Custom authentication pages
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/login', // Error page (redirect to login with error param)
    newUser: '/dashboard', // Redirect new users to dashboard
  },

  // Events - Logging and analytics
  events: {
    async signIn({ user }) {
      // TODO: Log sign in event to audit log (T035: Audit utilities)
      console.log(`[Auth] User signed in: ${user.email}`);
    },
    async signOut() {
      // TODO: Log sign out event to audit log
      console.log('[Auth] User signed out');
    },
    async createUser({ user }) {
      // TODO: Log user creation event
      console.log(`[Auth] New user created: ${user.email}`);
    },
  },

  // Debug mode (only in development)
  debug: process.env.NODE_ENV === 'development',
};

/**
 * Export NextAuth handler for App Router
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
