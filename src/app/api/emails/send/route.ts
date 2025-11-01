// src/app/api/emails/send/route.ts
// T179: API endpoint for sending emails with authentication, rate limiting, audit logging
// Requires Store Admin+ permissions, enforces tiered rate limits by subscription plan

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/services/email-service';
import { logAuditEvent } from '@/lib/audit';

/**
 * Email send request validation schema
 */
const SendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1).max(200),
  html: z.string().min(1),
  text: z.string().optional(),
  from: z.string().email().optional(),
  replyTo: z.string().email().optional(),
  tags: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
      })
    )
    .optional(),
});

type SendEmailRequest = z.infer<typeof SendEmailSchema>;

/**
 * Rate limit configuration by subscription plan (FR-077, spec requirements)
 */
const RATE_LIMITS = {
  FREE: { requestsPerMinute: 60, emailsPerHour: 100 },
  BASIC: { requestsPerMinute: 120, emailsPerHour: 500 },
  PRO: { requestsPerMinute: 300, emailsPerHour: 1000 },
  ENTERPRISE: { requestsPerMinute: 1000, emailsPerHour: 5000 },
} as const;

/**
 * Rate limit storage (in-memory for development, Redis/KV for production)
 */
const rateLimitStore = new Map<
  string,
  { count: number; resetAt: number; emailCount: number; emailResetAt: number }
>();

/**
 * Check rate limit for store
 */
async function checkRateLimit(
  storeId: string,
  plan: keyof typeof RATE_LIMITS
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const limits = RATE_LIMITS[plan];
  const now = Date.now();
  const minuteWindow = 60 * 1000;
  const hourWindow = 60 * 60 * 1000;

  // Get or create rate limit entry
  let entry = rateLimitStore.get(storeId);
  if (!entry || now > entry.resetAt) {
    entry = {
      count: 0,
      resetAt: now + minuteWindow,
      emailCount: 0,
      emailResetAt: now + hourWindow,
    };
    rateLimitStore.set(storeId, entry);
  }

  // Reset counters if windows expired
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + minuteWindow;
  }
  if (now > entry.emailResetAt) {
    entry.emailCount = 0;
    entry.emailResetAt = now + hourWindow;
  }

  // Check limits
  const requestAllowed = entry.count < limits.requestsPerMinute;
  const emailAllowed = entry.emailCount < limits.emailsPerHour;

  if (requestAllowed && emailAllowed) {
    entry.count++;
    entry.emailCount++;
    return {
      allowed: true,
      remaining: limits.requestsPerMinute - entry.count,
      resetAt: entry.resetAt,
    };
  }

  return {
    allowed: false,
    remaining: 0,
    resetAt: requestAllowed ? entry.emailResetAt : entry.resetAt,
  };
}

/**
 * POST /api/emails/send
 * Send an email via Resend API
 * Requires authentication (Store Admin+)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. Check permissions (Store Admin, Super Admin only)
    if (!['STORE_ADMIN', 'SUPER_ADMIN'].includes(session.role)) {
      await logAuditEvent({
        userId: session.userId,
        action: 'EMAIL_SEND_FORBIDDEN',
        entityType: 'Email',
        entityId: 'send',
        details: { role: session.role },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      });

      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Only Store Admins can send emails',
          },
        },
        { status: 403 }
      );
    }

    // 3. Validate request body
    const body = await request.json();
    const validationResult = SendEmailSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid email data',
            details: validationResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const emailData: SendEmailRequest = validationResult.data;

    // 4. Get store subscription plan for rate limiting
    const storeId = session.storeId;
    if (!storeId) {
      return NextResponse.json(
        {
          error: {
            code: 'BAD_REQUEST',
            message: 'Store ID is required',
          },
        },
        { status: 400 }
      );
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { subscriptionPlan: true },
    });

    if (!store) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Store not found',
          },
        },
        { status: 404 }
      );
    }

    const plan = store.subscriptionPlan as keyof typeof RATE_LIMITS;

    // 5. Check rate limit
    const rateLimitResult = await checkRateLimit(storeId, plan);
    if (!rateLimitResult.allowed) {
      await logAuditEvent({
        userId: session.userId,
        action: 'EMAIL_RATE_LIMIT_EXCEEDED',
        entityType: 'Email',
        entityId: storeId,
        details: { plan, resetAt: rateLimitResult.resetAt },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      });

      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Rate limit exceeded. Resets at ${new Date(rateLimitResult.resetAt).toISOString()}`,
            details: { plan, resetAt: rateLimitResult.resetAt },
          },
        },
        { status: 429 }
      );
    }

    // 6. Send email via EmailService
    const result = await sendEmail({
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
      from: emailData.from,
      replyTo: emailData.replyTo,
      tags: emailData.tags,
    });

    // 7. Log audit event
    await logAuditEvent({
      userId: session.userId,
      action: result.success ? 'EMAIL_SENT' : 'EMAIL_SEND_FAILED',
      entityType: 'Email',
      entityId: result.messageId || 'unknown',
      details: {
        to: emailData.to,
        subject: emailData.subject,
        success: result.success,
        error: result.error,
        remaining: rateLimitResult.remaining,
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    // 8. Return result
    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            code: 'EMAIL_SEND_FAILED',
            message: result.error || 'Failed to send email',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data: {
          success: true,
          messageId: result.messageId,
          remaining: rateLimitResult.remaining,
        },
        message: 'Email sent successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email send API error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
