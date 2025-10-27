// src/lib/auth.ts
// Authentication configuration placeholder
// TODO: Implement proper NextAuth.js configuration

import { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  // Placeholder configuration
  // This will be implemented in Phase 3 Authentication
  providers: [],
  callbacks: {
    async session({ session }) {
      // Add storeId to session when implemented
      return {
        ...session,
        user: {
          ...session.user,
          storeId: 'placeholder-store-id',
        },
      };
    },
  },
};

// Type extension for session
declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      storeId?: string;
    };
  }
}