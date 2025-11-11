// src/lib/auth.ts
// NextAuth.js v4.24.13 Authentication Configuration
// Re-exports authOptions from the NextAuth route handler
// Type augmentation is in types/next-auth.d.ts per NextAuth.js best practices

export { authOptions } from '@/app/api/auth/[...nextauth]/route';