import { NextRequest, NextResponse } from 'next/server';

/**
 * Development-only endpoint to echo cookies/headers for debugging.
 * GET /api/dev/echo-cookies
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Not allowed in production' } }, { status: 403 });
  }

  try {
    const sessionToken = request.cookies.get('session_token')?.value || null;
    const sessionId = request.cookies.get('sessionId')?.value || null;
    const cookieHeader = request.headers.get('cookie') || null;

    return NextResponse.json({ data: { sessionToken, sessionId, cookieHeader } }, { status: 200 });
  } catch (error) {
    console.error('DEV echo-cookies error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to read cookies' } }, { status: 500 });
  }
}
