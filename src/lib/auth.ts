import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import AzureADProvider from 'next-auth/providers/azure-ad';

/**
 * NextAuth.js v5 Configuration
 *
 * Provides authentication with:
 * - Email/password (bcrypt)
 * - TOTP MFA (optional)
 * - OAuth (Google, Azure AD)
 * - JWT sessions (HTTP-only cookies)
 *
 * @see https://next-auth.js.org/configuration/options
 * 
 * NOTE: This is a placeholder configuration for Phase 1.
 * Full implementation with Prisma integration will be completed in Phase 2.
 */

export const authConfig: NextAuthConfig = {
  providers: [
    // Email/Password Provider
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        totpCode: { label: 'MFA Code (if enabled)', type: 'text' },
      },
      async authorize(credentials): Promise<any> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        // TODO: Implement user authentication with Prisma in Phase 2
        // For now, return null to indicate authentication is not yet implemented
        console.warn('Authentication not yet implemented - Phase 2 required');
        return null;
      },
    }),

    // Google OAuth Provider
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    // Azure AD Provider (SSO)
    ...(process.env.AZURE_AD_CLIENT_ID &&
    process.env.AZURE_AD_CLIENT_SECRET &&
    process.env.AZURE_AD_TENANT_ID
      ? [
          AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID!,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
            issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
          }),
        ]
      : []),
  ],

  // JWT Strategy (stateless)
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Callbacks
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        // TODO: Load user stores and roles in Phase 2
      }
      return token;
    },

    async session({ session, token }) {
      // Add custom fields to session
      if (session.user) {
        session.user.id = token.id as string;
        // TODO: Add stores and roles in Phase 2
      }
      return session;
    },
  },

  // Pages
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },

  // Secret for JWT signing
  secret: process.env.NEXTAUTH_SECRET,
};
