import { NextResponse } from 'next/server';

// Minimal session route to satisfy type imports used by Next.js dev types.
// Production code should replace this with the real session implementation
// (e.g., using NextAuth or custom session lookup).
export async function GET() {
  try {
    // Return an empty session payload by default. Consumers may inspect
    // the response shape and replace with actual session data.
    return NextResponse.json({ data: null }, { status: 200 });
  } catch (error) {
    console.error('GET /api/auth/session error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to read session' } },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
