import type { Handler, HandlerEvent, HandlerResponse } from "@netlify/functions";
import { Resend } from 'resend';

// Configuration
const LITEAPI_BOOKING_BASE_URL = 'https://book.liteapi.travel/v3.0';
const LITEAPI_PRIVATE_KEY = process.env.LITEAPI_PRIVATE_KEY || '';
const LITEAPI_PUBLIC_KEY = process.env.LITEAPI_PUBLIC_KEY || '';

// Validate API key environment match
const isSandboxPrivate = LITEAPI_PRIVATE_KEY.startsWith('sand_');
const isSandboxPublic = LITEAPI_PUBLIC_KEY && !LITEAPI_PUBLIC_KEY.startsWith('prod_');
if (LITEAPI_PUBLIC_KEY && isSandboxPrivate !== isSandboxPublic) {
  console.warn('[Confirm Function] ⚠️ API key environment mismatch detected:', {
    privateKeyEnv: isSandboxPrivate ? 'sandbox' : 'production',
    publicKeyEnv: isSandboxPublic ? 'sandbox' : 'production',
    warning: 'Keys should match the same environment (both sandbox or both production)',
  });
}
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'tellurideskihotels@gmail.com';

// Initialize Resend
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

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
        hasBookingId: !!data?.bookingId || !!data?.data?.bookingId,
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

// Confirm booking function
async function confirmBooking(request: {
  prebookId: string;
  holder: { firstName: string; lastName: string; email: string };
  payment: { method: string; transactionId: string };
}) {
  console.log('[Confirm] Starting booking confirmation with prebookId:', request.prebookId);
  
  // Determine payment method based on environment
  // In sandbox, use ACC_CREDIT_CARD (account credit card) as per LiteAPI tutorial
  // In production, use TRANSACTION_ID with the actual transaction ID
  let paymentMethod: string;
  let paymentTransactionId: string | undefined;
  
  if (isSandboxPrivate) {
    // Sandbox mode: Use account credit card (all sandbox keys come with attached credit card)
    paymentMethod = 'ACC_CREDIT_CARD';
    paymentTransactionId = undefined; // Not needed for ACC_CREDIT_CARD
    console.log('[Confirm] 🧪 Sandbox mode detected - Using ACC_CREDIT_CARD payment method (account credit card)');
    console.log('[Confirm] Ignoring transactionId from client (not needed in sandbox)');
  } else {
    // Production mode: Use TRANSACTION_ID with actual transaction ID
    paymentMethod = request.payment.method || 'TRANSACTION_ID';
    paymentTransactionId = request.payment.transactionId;
    console.log('[Confirm] 🚀 Production mode - Using TRANSACTION_ID payment method');
    console.log('[Confirm] Transaction ID:', paymentTransactionId);
  }
  
  // Build payment object (only include transactionId if it's provided and we're in production)
  const paymentPayload: { method: string; transactionId?: string } = {
    method: paymentMethod,
  };
  
  if (paymentTransactionId) {
    paymentPayload.transactionId = paymentTransactionId;
  }
  
  console.log('[Confirm] Payment payload:', {
    method: paymentPayload.method,
    hasTransactionId: !!paymentPayload.transactionId,
    environment: isSandboxPrivate ? 'sandbox' : 'production',
  });
  
  const response = await liteAPIBookingClient<any>('/rates/book', {
    method: 'POST',
    body: JSON.stringify({
      prebookId: request.prebookId,
      holder: request.holder,
      payment: paymentPayload,
    }),
  });
  
  const data = response.data?.data || response.data || response;
  
  console.log('[Confirm] Extracted data:', {
    bookingId: data.bookingId,
    confirmationNumber: data.confirmationNumber,
    status: data.status,
    total: data.total,
    currency: data.currency,
  });
  
  return {
    bookingId: data.bookingId,
    confirmationNumber: data.confirmationNumber,
    status: data.status,
    hotelId: data.hotelId,
    checkin: data.checkin,
    checkout: data.checkout,
    total: data.total,
    currency: data.currency,
  };
}

// Send booking confirmation email
async function sendBookingConfirmation(params: {
  bookingId: string;
  confirmationNumber: string;
  guestName: string;
  guestEmail: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  roomName: string;
  adults: number;
  children: number;
  totalPrice: number;
  currency: string;
}) {
  if (!resend) {
    console.log('[Email] Resend not configured, skipping email');
    return;
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Booking Confirmed!</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9fafb;">
          <p>Dear ${params.guestName},</p>
          
          <p>Your booking has been confirmed! Here are your reservation details:</p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #2563eb; margin-top: 0;">Reservation Details</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0; font-weight: bold;">Confirmation Number:</td>
                <td style="padding: 10px 0;">${params.confirmationNumber}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0; font-weight: bold;">Booking ID:</td>
                <td style="padding: 10px 0;">${params.bookingId}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0; font-weight: bold;">Hotel:</td>
                <td style="padding: 10px 0;">${params.hotelName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0; font-weight: bold;">Room:</td>
                <td style="padding: 10px 0;">${params.roomName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0; font-weight: bold;">Check-in:</td>
                <td style="padding: 10px 0;">${params.checkIn}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0; font-weight: bold;">Check-out:</td>
                <td style="padding: 10px 0;">${params.checkOut}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0; font-weight: bold;">Guests:</td>
                <td style="padding: 10px 0;">${params.adults} Adults${params.children > 0 ? `, ${params.children} Children` : ''}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold;">Total Price:</td>
                <td style="padding: 10px 0; font-size: 18px; color: #2563eb; font-weight: bold;">
                  ${params.currency} ${params.totalPrice.toFixed(2)}
                </td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Important:</strong> Please save this confirmation number. You'll need it for check-in.</p>
          </div>
          
          <p>We look forward to welcoming you to Telluride!</p>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>Telluride Ski Hotels Team</strong>
          </p>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
          <p style="margin: 0;">© 2025 Telluride Ski Hotels. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">
            <a href="https://tellurideskihotels.com" style="color: #2563eb; text-decoration: none;">Visit our website</a>
          </p>
        </div>
      </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: params.guestEmail,
      subject: `Booking Confirmation - ${params.hotelName} - ${params.confirmationNumber}`,
      html: emailHtml,
    });
    console.log('[Email] Confirmation sent to:', params.guestEmail);
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    throw error;
  }
}

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
      prebookId: body.prebookId,
      hasHolder: !!body.holder,
      holderEmail: body.holder?.email,
      holderName: body.holder ? `${body.holder.firstName} ${body.holder.lastName}` : null,
      hasPayment: !!body.payment,
      paymentMethod: body.payment?.method,
      hasTransactionId: !!body.payment?.transactionId,
      hotelName: body.hotelName,
      roomName: body.roomName,
      environment: isSandboxPrivate ? 'sandbox' : 'production',
      willUsePaymentMethod: isSandboxPrivate ? 'ACC_CREDIT_CARD' : (body.payment?.method || 'TRANSACTION_ID'),
    });

    if (!body.prebookId || !body.holder || !body.payment) {
      console.log(`[${requestId}] [Booking Confirm Function] Missing required fields:`, {
        hasPrebookId: !!body.prebookId,
        hasHolder: !!body.holder,
        hasPayment: !!body.payment,
      });
      return {
        statusCode: 400,
        headers: createHeaders(),
        body: JSON.stringify({ error: 'prebookId, holder, and payment are required' }),
      };
    }

    console.log(`[${requestId}] [Booking Confirm Function] Calling confirmBooking()...`);
    const result = await confirmBooking({
      prebookId: body.prebookId,
      holder: body.holder,
      payment: body.payment,
    });

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] [Booking Confirm Function] Success:`, {
      duration: `${duration}ms`,
      bookingId: result.bookingId,
      confirmationNumber: result.confirmationNumber,
      status: result.status,
      total: result.total,
      currency: result.currency,
    });

    // Send confirmation email asynchronously
    if (body.holder.email && body.hotelName && body.roomName) {
      console.log(`[${requestId}] [Booking Confirm Function] Sending confirmation email to ${body.holder.email}...`);
      sendBookingConfirmation({
        bookingId: result.bookingId,
        confirmationNumber: result.confirmationNumber,
        guestName: `${body.holder.firstName} ${body.holder.lastName}`,
        guestEmail: body.holder.email,
        hotelName: body.hotelName,
        checkIn: result.checkin,
        checkOut: result.checkout,
        roomName: body.roomName,
        adults: body.adults || 2,
        children: body.children || 0,
        totalPrice: result.total,
        currency: result.currency,
      }).then(() => {
        console.log(`[${requestId}] [Booking Confirm Function] Email sent successfully`);
      }).catch(err => {
        console.error(`[${requestId}] [Booking Confirm Function] Email failed:`, err);
      });
    }

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
