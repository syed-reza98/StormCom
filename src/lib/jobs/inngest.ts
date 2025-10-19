/**
 * Background Jobs Client using Inngest
 * Handles asynchronous tasks and scheduled jobs
 */

import { Inngest, EventSchemas } from 'inngest';

/**
 * Define event schemas for type safety
 */
type Events = {
  'order/created': {
    data: {
      orderId: string;
      storeId: string;
      customerId: string;
      total: number;
    };
  };
  'order/shipped': {
    data: {
      orderId: string;
      trackingNumber: string;
    };
  };
  'payment/succeeded': {
    data: {
      paymentId: string;
      orderId: string;
      amount: number;
    };
  };
  'payment/failed': {
    data: {
      paymentId: string;
      orderId: string;
      error: string;
    };
  };
  'email/send': {
    data: {
      to: string;
      subject: string;
      template: string;
      data: Record<string, any>;
    };
  };
  'inventory/low': {
    data: {
      productId: string;
      variantId: string;
      quantity: number;
      threshold: number;
    };
  };
  'subscription/expiring': {
    data: {
      storeId: string;
      subscriptionId: string;
      expiresAt: string;
    };
  };
  'report/generate': {
    data: {
      storeId: string;
      reportType: string;
      startDate: string;
      endDate: string;
    };
  };
};

/**
 * Initialize Inngest client
 */
export const inngest = new Inngest({
  id: 'stormcom',
  name: 'StormCom',
  eventKey: process.env.INNGEST_EVENT_KEY,
  schemas: new EventSchemas().fromRecord<Events>(),
});

/**
 * Send an event to Inngest
 */
export async function sendEvent<K extends keyof Events>(
  name: K,
  data: Events[K]['data']
): Promise<void> {
  try {
    await inngest.send({
      name,
      data,
    } as any);
  } catch (error) {
    console.error(`Failed to send event ${name}:`, error);
    throw error;
  }
}

/**
 * Send order created event
 */
export async function sendOrderCreatedEvent(data: Events['order/created']['data']): Promise<void> {
  await sendEvent('order/created', data);
}

/**
 * Send order shipped event
 */
export async function sendOrderShippedEvent(data: Events['order/shipped']['data']): Promise<void> {
  await sendEvent('order/shipped', data);
}

/**
 * Send payment succeeded event
 */
export async function sendPaymentSucceededEvent(
  data: Events['payment/succeeded']['data']
): Promise<void> {
  await sendEvent('payment/succeeded', data);
}

/**
 * Send payment failed event
 */
export async function sendPaymentFailedEvent(
  data: Events['payment/failed']['data']
): Promise<void> {
  await sendEvent('payment/failed', data);
}

/**
 * Send email event
 */
export async function sendEmailEvent(data: Events['email/send']['data']): Promise<void> {
  await sendEvent('email/send', data);
}

/**
 * Send low inventory alert
 */
export async function sendLowInventoryAlert(
  data: Events['inventory/low']['data']
): Promise<void> {
  await sendEvent('inventory/low', data);
}

/**
 * Send subscription expiring alert
 */
export async function sendSubscriptionExpiringAlert(
  data: Events['subscription/expiring']['data']
): Promise<void> {
  await sendEvent('subscription/expiring', data);
}

/**
 * Send report generation request
 */
export async function sendReportGenerationRequest(
  data: Events['report/generate']['data']
): Promise<void> {
  await sendEvent('report/generate', data);
}

/**
 * Batch send multiple events
 */
export async function sendBatchEvents(
  events: Array<{ name: keyof Events; data: any }>
): Promise<void> {
  try {
    await inngest.send(events as any);
  } catch (error) {
    console.error('Failed to send batch events:', error);
    throw error;
  }
}

export default inngest;
