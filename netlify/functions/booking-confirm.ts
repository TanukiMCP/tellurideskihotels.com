import type { Handler, HandlerEvent, HandlerResponse } from "@netlify/functions";

// Configuration
const LITEAPI_BOOKING_BASE_URL = 'https://book.liteapi.travel/v3.0';
const LITEAPI_PRIVATE_KEY = process.env.LITEAPI_PRIVATE_KEY || '';
const LITEAPI_PUBLIC_KEY = process.env.LITEAPI_PUBLIC_KEY || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

// Validate API key environment match
const isSandboxPrivate = LITEAPI_PRIVATE_KEY.startsWith('sand_');
const isSandboxPublic = LITEAPI_PUBLIC_KEY && !LITEAPI_PUBLIC_KEY.startsWith('prod_');
if (LITEAPI_PUBLIC_KEY && isSandboxPrivate !== isSandboxPublic) {
  console.warn('[Booking Confirm Function] ⚠️ API key environment mismatch detected:', {
    privateKeyEnv: isSandboxPrivate ? 'sandbox' : 'production',
    publicKeyEnv: isSandboxPublic ? 'sandbox' : 'production',
    warning: 'Keys should match the same environment (both sandbox or both production)',
  });
}

// Error class
class LiteAPIBookingError extends Error {
  constructor(
    public status: number,
    public code?: string,
    message?: string
  ) {
    super(message || `LiteAPI Booking error: ${status}`);
    this.name = 'LiteAPIBookingError';
  }
}

// LiteAPI client
async function liteAPIBookingClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${LITEAPI_BOOKING_BASE_URL}${endpoint}`;
  const startTime = Date.now();
  
  console.log('[LiteAPI Booking] Request:', {
    endpoint: endpoint.split('?')[0],
    method: options.method || 'GET',
  });
  
  const headers = new Headers(options.headers);
  headers.set('X-API-Key', LITEAPI_PRIVATE_KEY);
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      
      console.error('[LiteAPI Booking] Error:', {
        endpoint: endpoint.split('?')[0],
        status: response.status,
        duration: `${duration}ms`,
        error: errorData.error?.message,
        fullError: errorData,
      });
      
      throw new LiteAPIBookingError(
        response.status,
        errorData.error?.code,
        errorData.error?.message || response.statusText
      );
    }

    const data = await response.json();
    
    console.log('[LiteAPI Booking] Success:', {
      endpoint: endpoint.split('?')[0],
      duration: `${duration}ms`,
      responsePreview: {
        hasData: !!data?.data,
      }
    });

    return data;
  } catch (error) {
    if (error instanceof LiteAPIBookingError) {
      throw error;
    }
    
    throw new LiteAPIBookingError(
      500,
      'NETWORK_ERROR',
      error instanceof Error ? error.message : 'Network request failed'
    );
  }
}

// Helper to create consistent response headers
const createHeaders = (contentType: string = 'application/json'): { [key: string]: string } => ({
  'Content-Type': contentType,
  'Access-Control-Allow-Origin': '*',
});

const createCorsHeaders = (): { [key: string]: string } => ({
  'Content-Type': 'text/plain',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
});

// Handler
const handler: Handler = async (event: HandlerEvent) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[${requestId}] [Booking Confirm Function] Request received:`, {
    method: event.httpMethod,
    path: event.path,
    hasApiKey: !!LITEAPI_PRIVATE_KEY,
    apiKeyPreview: LITEAPI_PRIVATE_KEY ? LITEAPI_PRIVATE_KEY.substring(0, 10) + '...' : 'NOT SET',
    hasResend: !!RESEND_API_KEY,
  });

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: createCorsHeaders(),
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    console.log(`[${requestId}] [Booking Confirm Function] Invalid method: ${event.httpMethod}`);
    return {
      statusCode: 405,
      headers: createHeaders(),
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    if (!event.body) {
      console.log(`[${requestId}] [Booking Confirm Function] No request body`);
      return {
        statusCode: 400,
        headers: createHeaders(),
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const body = JSON.parse(event.body);
    console.log(`[${requestId}] [Booking Confirm Function] Parsed request:`, {
      hasPrebookId: !!body.prebookId,
      prebookId: body.prebookId ? body.prebookId.substring(0, 20) + '...' : null,
      hasPayment: !!body.payment,
      paymentMethod: body.payment?.method,
      hasTransactionId: !!body.payment?.transactionId,
      environment: isSandboxPrivate ? 'sandbox' : 'production',
    });

    // Validate required fields - align with LiteAPI documentation
    if (!body.prebookId || !body.payment) {
      console.log(`[${requestId}] [Booking Confirm Function] Missing required fields:`, {
        hasPrebookId: !!body.prebookId,
        hasPayment: !!body.payment,
      });
      return {
        statusCode: 400,
        headers: createHeaders(),
        body: JSON.stringify({ error: 'prebookId and payment are required' }),
      };
    }

    if (!body.payment.transactionId) {
      console.log(`[${requestId}] [Booking Confirm Function] Missing payment transactionId`);
      return {
        statusCode: 400,
        headers: createHeaders(),
        body: JSON.stringify({ error: 'payment.transactionId is required' }),
      };
    }

    console.log(`[${requestId}] [Booking Confirm Function] Calling LiteAPI /rates/book...`);
    
    // Call LiteAPI booking confirmation - align with documentation
    const apiResponse = await liteAPIBookingClient<any>('/rates/book', {
      method: 'POST',
      body: JSON.stringify({
        prebookId: body.prebookId,
        payment: {
          method: body.payment.method || 'TRANSACTION_ID',
          transactionId: body.payment.transactionId,
        },
      }),
    });

    const data = apiResponse?.data || apiResponse;
    
    const result = {
      bookingId: data.bookingId,
      confirmationNumber: data.confirmationNumber,
      status: data.status,
      hotelId: data.hotelId,
      checkin: data.checkin,
      checkout: data.checkout,
      total: data.total?.amount || data.total,
      currency: data.total?.currency || data.currency || 'USD',
    };

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] [Booking Confirm Function] Success:`, {
      duration: `${duration}ms`,
      bookingId: result.bookingId,
      confirmationNumber: result.confirmationNumber,
      status: result.status,
      total: result.total,
      currency: result.currency,
    });

    return {
      statusCode: 200,
      headers: createHeaders(),
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] [Booking Confirm Function] Error after ${duration}ms:`, {
      name: error.name,
      message: error.message,
      status: error.status,
      code: error.code,
      stack: error.stack,
    });

    return {
      statusCode: error.status || 500,
      headers: createHeaders(),
      body: JSON.stringify({
        error: error.message || 'Failed to confirm booking',
        code: error.code,
        requestId,
      }),
    };
  }
};

export { handler };
