import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SessionService } from '@/services/session-service';

/**
 * Development-only helper to create a session for a seeded user.
 * POST /api/dev/create-session
 * Body: { email: string }
 * Returns: { data: { sessionId } }
 * Sets an HttpOnly cookie `session_token` for use by server-side session checks.
 */
export async function POST(request: NextRequest) {
  // Prevent use in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Not allowed in production' } }, { status: 403 });
  }

  try {
    const body = await request.json();
    const email = (body?.email || '').toString().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Email is required' } }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, { status: 404 });
    }

    // Create session via SessionService
    const sessionId = await SessionService.createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      storeId: user.storeId || null,
      mfaVerified: false,
    });

    const response = NextResponse.json({ data: { sessionId } }, { status: 200 });

    // Set HttpOnly cookie for server-side checks
    response.cookies.set('session_token', sessionId, {
      httpOnly: true,
      // cast NODE_ENV to string to avoid strict env type unions in TS config
      secure: (process.env.NODE_ENV as string) === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12, // 12 hours
    });

    return response;
  } catch (error) {
    console.error('DEV create-session error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create session' } }, { status: 500 });
  }
}
