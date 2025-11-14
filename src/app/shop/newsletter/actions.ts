'use server';

/**
 * Newsletter Subscription Server Actions
 * 
 * Implements newsletter subscription flow with:
 * - Email validation via Zod
 * - Rate limiting (100 req/min per IP)
 * - Consent recording (honors DNT)
 * - Single opt-in activation
 * - Audit trail
 * - Deduplication by (storeId, email)
 * 
 * @module app/shop/newsletter/actions
 */

import { z } from 'zod';
import { headers } from 'next/headers';
import { NewsletterService } from '@/services/newsletter-service';
import { checkSimpleRateLimit, getClientIp } from '@/lib/simple-rate-limit';
import { RateLimitError } from '@/lib/errors';

/**
 * Newsletter subscription schema
 */
const newsletterSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(3, 'Email is too short')
    .max(255, 'Email is too long')
    .toLowerCase()
    .trim(),
  storeId: z.string().min(1, 'Store ID is required'),
  source: z.string().optional().default('newsletter-form'),
});

/**
 * Server Action result type
 */
export interface NewsletterActionResult {
  success: boolean;
  message: string;
  alreadySubscribed?: boolean;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

/**
 * Subscribe to newsletter
 * 
 * Server Action for newsletter subscriptions with full validation,
 * rate limiting, consent recording, and audit logging.
 * 
 * @param formData - Form data containing email and storeId
 * @returns Result object with success status and message
 * 
 * @example
 * ```tsx
 * 'use client';
 * 
 * import { useFormState } from 'react-dom';
 * import { subscribeToNewsletter } from './actions';
 * 
 * export function NewsletterForm() {
 *   const [state, formAction] = useFormState(subscribeToNewsletter, null);
 *   
 *   return (
 *     <form action={formAction}>
 *       <input name="email" type="email" required />
 *       <input name="storeId" type="hidden" value={storeId} />
 *       <button type="submit">Subscribe</button>
 *       {state?.error && <p>{state.error.message}</p>}
 *       {state?.success && <p>{state.message}</p>}
 *     </form>
 *   );
 * }
 * ```
 */
export async function subscribeToNewsletter(
  _prevState: NewsletterActionResult | null,
  formData: FormData
): Promise<NewsletterActionResult> {
  try {
    // 1. Rate limiting check
    const headersList = await headers();
    const request = new Request('http://localhost', {
      headers: headersList,
    });
    
    const rateLimitResult = checkSimpleRateLimit(request);
    
    if (!rateLimitResult.success) {
      throw new RateLimitError(
        'Too many subscription attempts. Please try again later.',
        rateLimitResult.retryAfter
      );
    }

    // 2. Extract and validate form data
    const rawData = {
      email: formData.get('email'),
      storeId: formData.get('storeId'),
      source: formData.get('source') || 'newsletter-form',
    };

    const validation = newsletterSchema.safeParse(rawData);

    if (!validation.success) {
      const fieldErrors: Record<string, string[]> = {};
      validation.error.errors.forEach((err) => {
        const field = err.path[0]?.toString() || 'unknown';
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(err.message);
      });

      return {
        success: false,
        message: 'Please correct the errors in the form',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid form data',
          details: fieldErrors,
        },
      };
    }

    const { email, storeId, source } = validation.data;

    // 3. Get request metadata for consent/audit
    const ipAddress = getClientIp(request);
    const userAgent = headersList.get('user-agent') || undefined;
    const dnt = headersList.get('dnt') === '1'; // Do Not Track header

    // 4. Subscribe via newsletter service
    const result = await NewsletterService.subscribe({
      email,
      storeId,
      source,
      metadata: {
        ipAddress,
        userAgent,
        dnt,
      },
    });

    // 5. Return success result
    if (result.alreadySubscribed) {
      return {
        success: true,
        message: 'You are already subscribed to our newsletter',
        alreadySubscribed: true,
      };
    }

    return {
      success: true,
      message: 'Successfully subscribed! Thank you for joining our newsletter.',
    };
  } catch (error) {
    // Handle known errors
    if (error instanceof RateLimitError) {
      return {
        success: false,
        message: error.message,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: error.message,
        },
      };
    }

    // Handle unexpected errors
    console.error('Newsletter subscription error:', error);

    return {
      success: false,
      message: 'An error occurred while processing your subscription. Please try again.',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to process subscription',
      },
    };
  }
}

/**
 * Unsubscribe from newsletter
 * 
 * Server Action for newsletter unsubscriptions with audit logging.
 * 
 * @param formData - Form data containing email and storeId
 * @returns Result object with success status and message
 */
export async function unsubscribeFromNewsletter(
  _prevState: NewsletterActionResult | null,
  formData: FormData
): Promise<NewsletterActionResult> {
  try {
    // 1. Rate limiting check
    const headersList = await headers();
    const request = new Request('http://localhost', {
      headers: headersList,
    });
    
    const rateLimitResult = checkSimpleRateLimit(request);
    
    if (!rateLimitResult.success) {
      throw new RateLimitError(
        'Too many unsubscribe attempts. Please try again later.',
        rateLimitResult.retryAfter
      );
    }

    // 2. Validate form data
    const email = formData.get('email')?.toString();
    const storeId = formData.get('storeId')?.toString();

    if (!email || !storeId) {
      return {
        success: false,
        message: 'Email and store ID are required',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields',
        },
      };
    }

    // 3. Get request metadata for audit
    const ipAddress = getClientIp(request);
    const userAgent = headersList.get('user-agent') || undefined;

    // 4. Unsubscribe via newsletter service
    await NewsletterService.unsubscribe({
      email,
      storeId,
      metadata: {
        ipAddress,
        userAgent,
      },
    });

    return {
      success: true,
      message: 'You have been unsubscribed from our newsletter',
    };
  } catch (error) {
    console.error('Newsletter unsubscription error:', error);

    return {
      success: false,
      message: 'An error occurred while processing your unsubscription. Please try again.',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to process unsubscription',
      },
    };
  }
}
