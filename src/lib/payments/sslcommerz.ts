/**
 * SSLCommerz Payment Gateway Client
 * Handles payment processing for Bangladesh market
 */

import crypto from 'crypto';

interface SSLCommerzConfig {
  storeId: string;
  storePassword: string;
  isSandbox: boolean;
}

interface PaymentInitData {
  totalAmount: number;
  currency: string;
  transactionId: string;
  productName: string;
  productCategory: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerCountry: string;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  ipnUrl?: string;
  shippingMethod?: string;
  numOfItems?: number;
  productProfile?: string;
}

interface SSLCommerzResponse {
  status: string;
  failedreason?: string;
  sessionkey?: string;
  gw?: any;
  redirectGatewayURL?: string;
  directPaymentURLBank?: string;
  directPaymentURLCard?: string;
  directPaymentURL?: string;
  redirectGatewayURLFailed?: string;
  GatewayPageURL?: string;
}

/**
 * Get SSLCommerz configuration for a store
 */
function getConfig(storeId?: string): SSLCommerzConfig {
  return {
    storeId: process.env.SSLCOMMERZ_STORE_ID || '',
    storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD || '',
    isSandbox: process.env.SSLCOMMERZ_IS_SANDBOX === 'true',
  };
}

/**
 * Get API base URL
 */
function getApiUrl(isSandbox: boolean): string {
  return isSandbox
    ? 'https://sandbox.sslcommerz.com'
    : 'https://securepay.sslcommerz.com';
}

/**
 * Initialize payment session
 */
export async function initPayment(data: PaymentInitData): Promise<SSLCommerzResponse> {
  const config = getConfig();
  const apiUrl = getApiUrl(config.isSandbox);

  const payload = {
    store_id: config.storeId,
    store_passwd: config.storePassword,
    total_amount: data.totalAmount.toFixed(2),
    currency: data.currency,
    tran_id: data.transactionId,
    product_name: data.productName,
    product_category: data.productCategory,
    product_profile: data.productProfile || 'general',
    cus_name: data.customerName,
    cus_email: data.customerEmail,
    cus_add1: data.customerAddress,
    cus_city: data.customerCity,
    cus_country: data.customerCountry,
    cus_phone: data.customerPhone,
    success_url: data.successUrl,
    fail_url: data.failUrl,
    cancel_url: data.cancelUrl,
    ipn_url: data.ipnUrl,
    shipping_method: data.shippingMethod || 'NO',
    num_of_item: data.numOfItems || 1,
  };

  try {
    const response = await fetch(`${apiUrl}/gwprocess/v4/api.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(payload as any).toString(),
    });

    const result: SSLCommerzResponse = await response.json();

    if (result.status !== 'SUCCESS') {
      throw new Error(result.failedreason || 'Payment initialization failed');
    }

    return result;
  } catch (error) {
    console.error('SSLCommerz payment initialization failed:', error);
    throw new Error('Failed to initialize payment');
  }
}

/**
 * Validate payment transaction
 */
export async function validateTransaction(
  transactionId: string,
  amount: number,
  currency: string
): Promise<{
  isValid: boolean;
  status: string;
  data?: any;
}> {
  const config = getConfig();
  const apiUrl = getApiUrl(config.isSandbox);

  const payload = {
    val_id: transactionId,
    store_id: config.storeId,
    store_passwd: config.storePassword,
    format: 'json',
  };

  try {
    const response = await fetch(
      `${apiUrl}/validator/api/validationserverAPI.php?${new URLSearchParams(payload).toString()}`,
      {
        method: 'GET',
      }
    );

    const result = await response.json();

    // Verify transaction details
    const isValid =
      result.status === 'VALID' ||
      result.status === 'VALIDATED';

    const amountMatch = parseFloat(result.amount) === amount;
    const currencyMatch = result.currency_type === currency;

    return {
      isValid: isValid && amountMatch && currencyMatch,
      status: result.status,
      data: result,
    };
  } catch (error) {
    console.error('SSLCommerz transaction validation failed:', error);
    return {
      isValid: false,
      status: 'ERROR',
    };
  }
}

/**
 * Initiate refund
 */
export async function initiateRefund(data: {
  bankTransactionId: string;
  refundAmount: number;
  refundRemarks?: string;
}): Promise<{
  status: string;
  message: string;
  data?: any;
}> {
  const config = getConfig();
  const apiUrl = getApiUrl(config.isSandbox);

  const payload = {
    store_id: config.storeId,
    store_passwd: config.storePassword,
    bank_tran_id: data.bankTransactionId,
    refund_amount: data.refundAmount.toFixed(2),
    refund_remarks: data.refundRemarks || 'Customer requested refund',
    refe_id: crypto.randomBytes(16).toString('hex'),
  };

  try {
    const response = await fetch(`${apiUrl}/validator/api/merchantTransIDvalidationAPI.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(payload).toString(),
    });

    const result = await response.json();

    return {
      status: result.status || 'FAILED',
      message: result.errorReason || 'Refund processed',
      data: result,
    };
  } catch (error) {
    console.error('SSLCommerz refund initiation failed:', error);
    return {
      status: 'ERROR',
      message: 'Failed to initiate refund',
    };
  }
}

/**
 * Query transaction status
 */
export async function queryTransactionStatus(transactionId: string): Promise<any> {
  const config = getConfig();
  const apiUrl = getApiUrl(config.isSandbox);

  const payload = {
    store_id: config.storeId,
    store_passwd: config.storePassword,
    tran_id: transactionId,
  };

  try {
    const response = await fetch(
      `${apiUrl}/validator/api/merchantTransIDvalidationAPI.php?${new URLSearchParams(payload).toString()}`,
      {
        method: 'GET',
      }
    );

    return await response.json();
  } catch (error) {
    console.error('SSLCommerz transaction status query failed:', error);
    throw new Error('Failed to query transaction status');
  }
}

/**
 * Verify IPN (Instant Payment Notification) data
 */
export function verifyIPNHash(data: any, storePassword?: string): boolean {
  const password = storePassword || getConfig().storePassword;

  // Extract hash from data
  const receivedHash = data.verify_sign;
  delete data.verify_sign;
  delete data.verify_key;

  // Generate hash from data
  const sortedKeys = Object.keys(data).sort();
  const hashString = sortedKeys.map((key) => `${key}=${data[key]}`).join('&');
  const generatedHash = crypto
    .createHash('md5')
    .update(hashString + '&store_passwd=' + password)
    .digest('hex')
    .toUpperCase();

  return receivedHash === generatedHash;
}

export default {
  initPayment,
  validateTransaction,
  initiateRefund,
  queryTransactionStatus,
  verifyIPNHash,
};
