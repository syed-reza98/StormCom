// src/lib/auth.ts
// NextAuth.js v4.24.13 Authentication Configuration
// Re-exports authOptions from the NextAuth route handler

export { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Type extensions for NextAuth
declare module 'next-auth' {
  /**
   * Extended Session interface with custom user fields
   */
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email: string;
      image?: string | null;
      role: string;
      storeId: string | null;
    };
    requiresMFA?: boolean;
  }

  /**
   * Extended User interface from authorize callback
   */
  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    storeId: string | null;
    requiresMFA?: boolean;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extended JWT interface with custom claims
   */
  interface JWT {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    storeId: string | null;
    requiresMFA?: boolean;
  }
}