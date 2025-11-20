import { Resend } from 'resend';

const LITEAPI_BOOKING_BASE_URL = 'https://book.liteapi.travel/v3.0';
const LITEAPI_PRIVATE_KEY = process.env.LITEAPI_PRIVATE_KEY || '';
const LITEAPI_PUBLIC_KEY = process.env.LITEAPI_PUBLIC_KEY || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM_EMAIL =
  process.env.FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'bookings@tellurideskihotels.com';
const SITE_URL = process.env.PUBLIC_SITE_URL || 'https://tellurideskihotels.com';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export class LiteAPIBookingError extends Error {
  constructor(
    public status: number,
    public code?: string,
    message?: string
  ) {
    super(message || `LiteAPI Booking error: ${status}`);
    this.name = 'LiteAPIBookingError';
  }
}

const isSandboxPrivate = LITEAPI_PRIVATE_KEY.startsWith('sand_');
const isSandboxPublic = LITEAPI_PUBLIC_KEY && !LITEAPI_PUBLIC_KEY.startsWith('prod_');
if (LITEAPI_PUBLIC_KEY && isSandboxPrivate !== isSandboxPublic) {
  console.warn('[Booking Confirm Service] ⚠️ API key environment mismatch detected:', {
    privateKeyEnv: isSandboxPrivate ? 'sandbox' : 'production',
    publicKeyEnv: isSandboxPublic ? 'sandbox' : 'production',
  });
}

async function liteAPIBookingClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${LITEAPI_BOOKING_BASE_URL}${endpoint}`;
  const startTime = Date.now();

  const headers = new Headers(options.headers);
  headers.set('X-API-Key', LITEAPI_PRIVATE_KEY);
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');

  try {
    const response = await fetch(url, { ...options, headers });
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
      },
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

async function confirmWithLiteAPI(request: {
  prebookId: string;
  holder: { firstName: string; lastName: string; email: string };
  payment: { method: string; transactionId?: string };
}) {
  console.log('[Confirm] Starting booking confirmation with prebookId:', request.prebookId);

  let paymentMethod: string;
  let paymentTransactionId: string | undefined;

  if (isSandboxPrivate) {
    paymentMethod = 'ACC_CREDIT_CARD';
    paymentTransactionId = undefined;
    console.log('[Confirm] 🧪 Sandbox mode detected - Using ACC_CREDIT_CARD payment method');
  } else {
    paymentMethod = request.payment.method || 'TRANSACTION_ID';
    paymentTransactionId = request.payment.transactionId;
    console.log('[Confirm] 🚀 Production mode - Using TRANSACTION_ID payment method');
  }

  const payload: { method: string; transactionId?: string } = { method: paymentMethod };
  if (paymentTransactionId) {
    payload.transactionId = paymentTransactionId;
  }

  console.log('[Confirm] Payment payload:', {
    method: payload.method,
    hasTransactionId: !!payload.transactionId,
    environment: isSandboxPrivate ? 'sandbox' : 'production',
  });

  const response = await liteAPIBookingClient<any>('/rates/book', {
    method: 'POST',
    body: JSON.stringify({
      prebookId: request.prebookId,
      holder: request.holder,
      payment: payload,
    }),
  });

  const data = response.data?.data || response.data || response;

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

async function sendBookingConfirmationEmail(params: {
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
  accountUrl?: string | null;
  lookupUrl: string;
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
          
          <div style="margin: 30px 0; text-align: center;">
            ${
              params.accountUrl
                ? `<a href="${params.accountUrl}" style="display: inline-block; margin: 0 6px 12px; padding: 12px 28px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 9999px; font-weight: 600;">View in My Account</a>`
                : ''
            }
            <a href="${params.lookupUrl}" style="display: inline-block; margin: 0 6px; padding: 12px 28px; border: 2px solid #2563eb; color: #2563eb; text-decoration: none; border-radius: 9999px; font-weight: 600;">
              Find My Booking
            </a>
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

export interface BookingConfirmPayload {
  prebookId: string;
  holder: { firstName: string; lastName: string; email: string };
  payment: { method: string; transactionId?: string };
  hotelName?: string;
  roomName?: string;
  adults?: number;
  children?: number;
}

export interface BookingConfirmOptions {
  dashboardUrl?: string | null;
  lookupUrl?: string | null;
}

export async function processBookingConfirmation(
  body: BookingConfirmPayload,
  options: BookingConfirmOptions = {}
) {
  const result = await confirmWithLiteAPI({
    prebookId: body.prebookId,
    holder: body.holder,
    payment: body.payment,
  });

  if (body.holder.email && body.hotelName && body.roomName) {
    const fallbackLookup = new URL('/find-booking', SITE_URL);
    fallbackLookup.searchParams.set('bookingId', result.bookingId);
    fallbackLookup.searchParams.set('email', body.holder.email);

    sendBookingConfirmationEmail({
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
      accountUrl: options.dashboardUrl ?? null,
      lookupUrl: options.lookupUrl || fallbackLookup.toString(),
    }).catch((err) => console.error('[Booking Confirm] Email failed:', err));
  }

  return result;
}

