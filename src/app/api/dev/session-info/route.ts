import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/services/session-service';

/**
 * Development-only endpoint to validate current session via SessionService
 * GET /api/dev/session-info
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Not allowed in production' } }, { status: 403 });
  }

  try {
    const sessionToken = request.cookies.get('session_token')?.value || request.cookies.get('sessionId')?.value;

    if (!sessionToken) {
      return NextResponse.json({ data: null }, { status: 200 });
    }

    const user = await SessionService.getUserFromSession(sessionToken);

    return NextResponse.json({ data: user }, { status: 200 });
  } catch (error) {
    console.error('DEV session-info error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to read session' } }, { status: 500 });
  }
}
