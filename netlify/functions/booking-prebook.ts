import type { Handler, HandlerEvent, HandlerResponse } from "@netlify/functions";

// Configuration
const LITEAPI_BOOKING_BASE_URL = 'https://book.liteapi.travel/v3.0';
const LITEAPI_PRIVATE_KEY = process.env.LITEAPI_PRIVATE_KEY || '';

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
        hasPrebookId: !!data?.prebookId || !!data?.data?.prebookId,
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

// Prebook function
async function prebook(request: { offerId: string; usePaymentSdk?: boolean }) {
  console.log('[Prebook] Starting prebook with offerId:', request.offerId.substring(0, 30) + '...');
  
  const response = await liteAPIBookingClient<any>('/rates/prebook', {
    method: 'POST',
    body: JSON.stringify({
      offerId: request.offerId,
      usePaymentSdk: request.usePaymentSdk ?? true,
    }),
  });
  
  const data = response.data?.data || response.data || response;
  
  console.log('[Prebook] Extracted data:', {
    prebookId: data.prebookId,
    hotelId: data.hotelId,
    total: data.total,
    currency: data.currency,
    expiresAt: data.expiresAt,
  });
  
  return {
    prebookId: data.prebookId,
    hotelId: data.hotelId,
    rateId: data.rateId,
    checkin: data.checkin,
    checkout: data.checkout,
    total: data.total,
    currency: data.currency,
    expiresAt: data.expiresAt,
    secretKey: data.secretKey,
    transactionId: data.transactionId,
  };
}

// Handler
const handler: Handler = async (event: HandlerEvent) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[${requestId}] [Prebook Function] Request received:`, {
    method: event.httpMethod,
    path: event.path,
    hasApiKey: !!LITEAPI_PRIVATE_KEY,
    apiKeyPreview: LITEAPI_PRIVATE_KEY ? LITEAPI_PRIVATE_KEY.substring(0, 10) + '...' : 'NOT SET',
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
    console.log(`[${requestId}] [Prebook Function] Invalid method: ${event.httpMethod}`);
    return {
      statusCode: 405,
      headers: createHeaders(),
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    if (!event.body) {
      console.log(`[${requestId}] [Prebook Function] No request body`);
      return {
        statusCode: 400,
        headers: createHeaders(),
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const body = JSON.parse(event.body);
    console.log(`[${requestId}] [Prebook Function] Parsed request body:`, {
      hasOfferId: !!body.offerId,
      offerIdLength: body.offerId?.length,
      offerIdPreview: body.offerId ? body.offerId.substring(0, 30) + '...' : null,
      usePaymentSdk: body.usePaymentSdk,
    });

    if (!body.offerId) {
      console.log(`[${requestId}] [Prebook Function] Missing offerId`);
      return {
        statusCode: 400,
        headers: createHeaders(),
        body: JSON.stringify({ error: 'offerId is required' }),
      };
    }

    console.log(`[${requestId}] [Prebook Function] Calling prebook()...`);
    const result = await prebook({
      offerId: body.offerId,
      usePaymentSdk: true,
    });

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] [Prebook Function] Success:`, {
      duration: `${duration}ms`,
      prebookId: result.prebookId,
      hotelId: result.hotelId,
      total: result.total,
      currency: result.currency,
      expiresAt: result.expiresAt,
      hasSecretKey: !!result.secretKey,
      hasTransactionId: !!result.transactionId,
    });

    return {
      statusCode: 200,
      headers: createHeaders(),
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] [Prebook Function] Error after ${duration}ms:`, {
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
        error: error.message || 'Failed to prebook',
        code: error.code,
        requestId,
      }),
    };
  }
};

export { handler };
