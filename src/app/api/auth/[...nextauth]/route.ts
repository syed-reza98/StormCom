// src/app/api/auth/[...nextauth]/route.ts
// NextAuth.js v4.24.13 Configuration for Next.js v16.0.1
// Implements T022 - JWT strategy with credentials provider

import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import { comparePassword } from '@/lib/password';
import { createAuditLog, AuditAction, AuditResource } from '@/lib/audit';

// Validate required environment variables
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required');
}

if (!process.env.NEXTAUTH_URL) {
  console.warn('NEXTAUTH_URL environment variable is not set. Using default: http://localhost:3000');
}

/**
 * NextAuth configuration
 * Compatible with Next.js v16.0.1
 */
export const authOptions: NextAuthOptions = {
  // Secret for JWT encryption and CSRF protection
  secret: process.env.NEXTAUTH_SECRET,

  // Use JWT strategy for session management (FR-036, FR-040)
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days (FR-040)
  },

  // JWT configuration
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Authentication providers
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('INVALID_CREDENTIALS');
        }

        // Find user
        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          select: {
            id: true,
            email: true,
            password: true,
            name: true,
            role: true,
            storeId: true,
            emailVerified: true,
            mfaEnabled: true,
            totpSecret: true,
            lockedUntil: true,
            failedLoginAttempts: true,
            deletedAt: true,
          },
        });

        if (!user) {
          throw new Error('INVALID_CREDENTIALS');
        }

        // Check if account is locked (FR-046)
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          const minutesRemaining = Math.ceil(
            (user.lockedUntil.getTime() - Date.now()) / (60 * 1000)
          );
          throw new Error(`ACCOUNT_LOCKED:${minutesRemaining}`);
        }

        // Check if account is soft deleted
        if (user.deletedAt) {
          throw new Error('ACCOUNT_DELETED');
        }

        // Verify password
        const isValidPassword = await comparePassword(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          // Increment failed attempts (FR-046)
          const failedAttempts = user.failedLoginAttempts + 1;
          const updateData: any = {
            failedLoginAttempts: failedAttempts,
          };

          // Lock account if max attempts reached (5 attempts)
          if (failedAttempts >= 5) {
            updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
          }

          await db.user.update({
            where: { id: user.id },
            data: updateData,
          });

          // Audit log
          await createAuditLog({
            userId: user.id,
            action: AuditAction.LOGIN_FAILED,
            resource: AuditResource.USER,
            resourceId: user.id,
            metadata: { reason: 'invalid_password', attempts: failedAttempts },
            ipAddress: req.headers?.['x-forwarded-for'] as string,
          });

          throw new Error('INVALID_CREDENTIALS');
        }

        // Check email verification (FR-148)
        if (!user.emailVerified) {
          throw new Error('EMAIL_NOT_VERIFIED');
        }

        // Check MFA requirement
        if (user.mfaEnabled && user.totpSecret) {
          // Store MFA pending state in session
          // Client will handle MFA challenge redirect
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            storeId: user.storeId,
            requiresMFA: true,
          };
        }

        // Reset failed attempts on successful login
        await db.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lastLoginAt: new Date(),
            lastLoginIP: req.headers?.['x-forwarded-for'] as string,
          },
        });

        // Audit log successful login
        await createAuditLog({
          userId: user.id,
          action: AuditAction.LOGIN,
          resource: AuditResource.USER,
          resourceId: user.id,
          ipAddress: req.headers?.['x-forwarded-for'] as string,
          userAgent: req.headers?.['user-agent'] as string,
        });

        // Return user data for JWT
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          storeId: user.storeId,
          requiresMFA: false,
        };
      },
    }),
  ],

  // Callbacks for session and JWT customization
  callbacks: {
    // JWT callback: Add custom fields to JWT token
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = (user as any).role;
        token.storeId = (user as any).storeId;
        token.requiresMFA = (user as any).requiresMFA || false;
      }

      // Update session (for session updates)
      if (trigger === 'update' && session) {
        return { ...token, ...session };
      }

      return token;
    },

    // Session callback: Add custom fields to session object
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
        session.user.storeId = token.storeId as string | null;
        (session as any).requiresMFA = token.requiresMFA || false;
      }

      return session;
    },

    // Redirect callback: Handle post-login redirects
    async redirect({ url, baseUrl }) {
      // Allow relative callback URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // Allow callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    },
  },

  // Custom pages
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login', // Error code passed in query string as ?error=
    verifyRequest: '/auth/verify-email',
    newUser: '/dashboard', // New users will be directed here on sign in
  },

  // Events for logging and analytics
  events: {
    async signIn() {
      // Audit log handled in authorize callback
    },
    async signOut({ token }) {
      if (token?.id) {
        await createAuditLog({
          userId: token.id as string,
          action: AuditAction.LOGOUT,
          resource: AuditResource.USER,
          resourceId: token.id as string,
        });
      }
    },
  },

  // Enable debug in development
  debug: process.env.NODE_ENV === 'development',
};

// Export NextAuth handler
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
