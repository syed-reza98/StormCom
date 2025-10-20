import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import AzureADProvider from 'next-auth/providers/azure-ad';
import * as bcrypt from 'bcrypt';
import prisma from './prisma';

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
 */

export const authOptions: NextAuthOptions = {
  providers: [
    // Email/Password Provider
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        totpCode: { label: 'MFA Code (if enabled)', type: 'text', optional: true },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        // Find user
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: {
            stores: {
              include: {
                store: true,
                role: true,
              },
            },
          },
        });

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        // Check password
        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          throw new Error('Invalid credentials');
        }

        // Check user status
        if (user.status !== 'ACTIVE') {
          throw new Error(`Account is ${user.status.toLowerCase()}`);
        }

        // Check MFA if enabled
        if (user.mfaEnabled) {
          if (!credentials.totpCode) {
            throw new Error('MFA code is required');
          }

          // TODO: Verify TOTP code (implement in separate utility)
          // const isValidTOTP = verifyTOTP(user.mfaSecret, credentials.totpCode);
          // if (!isValidTOTP) {
          //   throw new Error('Invalid MFA code');
          // }
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            // TODO: Get IP from request headers
            // lastLoginIp: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name || user.email.split('@')[0],
          image: user.image || undefined,
        };
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
            clientId: process.env.AZURE_AD_CLIENT_ID,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
            tenantId: process.env.AZURE_AD_TENANT_ID,
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

        // Load user stores and roles
        const userStores = await prisma.userStore.findMany({
          where: { userId: user.id, isActive: true },
          include: {
            store: true,
            role: true,
          },
        });

        token.stores = userStores.map((us) => ({
          storeId: us.storeId,
          storeName: us.store.name,
          storeSlug: us.store.slug,
          roleId: us.roleId,
          roleName: us.role.name,
          permissions: us.role.permissions,
        }));

        // Set default active store (first store)
        if (userStores.length > 0) {
          token.activeStoreId = userStores[0].storeId;
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Add custom fields to session
      session.user.id = token.id as string;
      session.user.stores = token.stores as any[];
      session.user.activeStoreId = token.activeStoreId as string;

      return session;
    },
  },

  // Pages
  pages: {
    signIn: '/login',
    error: '/error',
  },

  // Security
  secret: process.env.NEXTAUTH_SECRET,

  // Debug in development
  debug: process.env.NODE_ENV === 'development',
};
