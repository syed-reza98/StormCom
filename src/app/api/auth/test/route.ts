// Test route to verify NextAuth configuration
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      data: {
        hasSession: !!session,
        session: session ? {
          user: {
            email: session.user?.email,
            role: (session.user as any)?.role,
          },
        } : null,
        env: {
          hasSecret: !!process.env.NEXTAUTH_SECRET,
          hasUrl: !!process.env.NEXTAUTH_URL,
          nodeEnv: process.env.NODE_ENV,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    }, { status: 500 });
  }
}
