/**
 * Payment Webhook Signature Verification
 * Validates webhook payloads from payment gateways
 */

import crypto from 'crypto';
import { constructWebhookEvent as verifyStripeWebhook } from './stripe';
import { verifyIPNHash as verifySSLCommerzIPN } from './sslcommerz';

export type PaymentGateway = 'stripe' | 'sslcommerz';

/**
 * Verify webhook signature based on gateway
 */
export async function verifyWebhookSignature(
  gateway: PaymentGateway,
  payload: string | Buffer,
  signature: string,
  secret: string
): Promise<{ isValid: boolean; event?: any; error?: string }> {
  try {
    switch (gateway) {
      case 'stripe':
        return verifyStripeSignature(payload, signature, secret);

      case 'sslcommerz':
        return verifySSLCommerzSignature(payload, secret);

      default:
        return {
          isValid: false,
          error: 'Unsupported payment gateway',
        };
    }
  } catch (error: any) {
    return {
      isValid: false,
      error: error.message || 'Webhook verification failed',
    };
  }
}

/**
 * Verify Stripe webhook signature
 */
function verifyStripeSignature(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): { isValid: boolean; event?: any; error?: string } {
  try {
    const event = verifyStripeWebhook(payload, signature, webhookSecret);
    return {
      isValid: true,
      event,
    };
  } catch (error: any) {
    return {
      isValid: false,
      error: error.message,
    };
  }
}

/**
 * Verify SSLCommerz IPN signature
 */
function verifySSLCommerzSignature(
  payload: string | Buffer,
  storePassword: string
): { isValid: boolean; event?: any; error?: string } {
  try {
    const data = typeof payload === 'string' ? JSON.parse(payload) : JSON.parse(payload.toString());
    const isValid = verifySSLCommerzIPN(data, storePassword);

    if (!isValid) {
      return {
        isValid: false,
        error: 'Invalid IPN signature',
      };
    }

    return {
      isValid: true,
      event: data,
    };
  } catch (error: any) {
    return {
      isValid: false,
      error: error.message,
    };
  }
}

/**
 * Verify HMAC signature (generic)
 */
export function verifyHMACSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha512' = 'sha256'
): boolean {
  const hmac = crypto.createHmac(algorithm, secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Extract signature from header
 */
export function extractSignatureFromHeader(
  header: string,
  prefix: string = 'sha256='
): string | null {
  if (!header) return null;

  if (header.startsWith(prefix)) {
    return header.substring(prefix.length);
  }

  // Handle Stripe-style signatures (t=timestamp,v1=signature)
  const parts = header.split(',');
  for (const part of parts) {
    if (part.startsWith('v1=')) {
      return part.substring(3);
    }
  }

  return header; // Return as-is if no prefix found
}

/**
 * Validate webhook timestamp to prevent replay attacks
 */
export function isWebhookTimestampValid(
  timestamp: number,
  maxAgeSeconds: number = 300 // 5 minutes default
): boolean {
  const now = Math.floor(Date.now() / 1000);
  const age = now - timestamp;

  return age >= 0 && age <= maxAgeSeconds;
}

/**
 * Parse Stripe signature header
 */
export function parseStripeSignatureHeader(header: string): {
  timestamp: number;
  signatures: string[];
} | null {
  try {
    const parts = header.split(',');
    let timestamp = 0;
    const signatures: string[] = [];

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 't') {
        timestamp = parseInt(value, 10);
      } else if (key === 'v1') {
        signatures.push(value);
      }
    }

    if (timestamp && signatures.length > 0) {
      return { timestamp, signatures };
    }

    return null;
  } catch (error) {
    return null;
  }
}
