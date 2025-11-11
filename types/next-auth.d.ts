// types/next-auth.d.ts
// NextAuth.js Type Augmentation (Per Official Documentation)
// Location: types/next-auth.d.ts (NOT root)
// Reference: https://next-auth.js.org/getting-started/typescript

import NextAuth, { DefaultSession } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Returned by `getServerSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** User's unique ID from database */
      id: string;
      /** User's role (CUSTOMER, STAFF, STORE_ADMIN, SUPER_ADMIN) */
      role: string;
      /** User's associated store ID (null for SUPER_ADMIN) */
      storeId: string | null;
      /** Whether MFA has been verified in this session */
      mfaVerified?: boolean;
      /** Whether MFA is required for this user */
      requiresMFA?: boolean;
    } & DefaultSession['user']; // Extends default properties (email, name, image)
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    storeId: string | null;
    mfaEnabled?: boolean;
    mfaVerified?: boolean;
    requiresMFA?: boolean;
  }
}

declare module 'next-auth/jwt' {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends DefaultJWT {
    /** User's unique ID */
    id: string;
    /** User's role */
    role: string;
    /** User's associated store ID */
    storeId: string | null;
    /** Whether MFA is enabled */
    mfaEnabled?: boolean;
    /** Whether MFA has been verified */
    mfaVerified?: boolean;
    /** Whether MFA is required */
    requiresMFA?: boolean;
  }
}
