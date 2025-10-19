/**
 * NextAuth.js Type Extensions
 * 
 * Extends NextAuth default types to include custom fields in JWT and Session.
 * 
 * @see https://next-auth.js.org/getting-started/typescript
 */

import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Extends the built-in session.user type
   */
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      stores: Array<{
        storeId: string;
        storeName: string;
        storeSlug: string;
        roleId: string;
        roleName: string;
        permissions: any;
      }>;
      activeStoreId?: string;
    };
  }

  /**
   * Extends the built-in user type (returned from authorize callback)
   */
  interface User {
    id: string;
    email: string;
    name: string;
    image?: string;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extends the built-in JWT type
   */
  interface JWT {
    id: string;
    email: string;
    stores?: Array<{
      storeId: string;
      storeName: string;
      storeSlug: string;
      roleId: string;
      roleName: string;
      permissions: any;
    }>;
    activeStoreId?: string;
  }
}
