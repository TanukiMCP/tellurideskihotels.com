import { liteAPIBookingClient } from './booking-client';
import type {
  LiteAPIPrebookRequest,
  LiteAPIPrebookResponse,
  LiteAPIConfirmRequest,
  LiteAPIConfirmResponse,
} from './types';

export async function prebook(request: LiteAPIPrebookRequest): Promise<LiteAPIPrebookResponse> {
  // LiteAPI expects camelCase offerId, convert from offer_id if needed
  const requestBody: any = { ...request };
  if (requestBody.offer_id && !requestBody.offerId) {
    requestBody.offerId = requestBody.offer_id;
    delete requestBody.offer_id;
  }
  
  const response = await liteAPIBookingClient<any>('/rates/prebook', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
  
  // LiteAPI returns data in response.data with camelCase, normalize to snake_case
  const data = response.data || response;
  return {
    prebook_id: data.prebookId || data.prebook_id,
    hotel_id: data.hotelId || data.hotel_id,
    rate_id: data.rateId || data.rate_id,
    checkin: data.checkin,
    checkout: data.checkout,
    total: data.total,
    expires_at: data.expiresAt || data.expires_at,
  };
}

export async function confirmBooking(request: LiteAPIConfirmRequest): Promise<LiteAPIConfirmResponse> {
  // LiteAPI expects camelCase, convert from snake_case if needed
  const requestBody: any = {};
  
  // Handle prebook_id/prebookId
  requestBody.prebookId = request.prebookId || request.prebook_id;
  
  // Handle payment object
  if (request.payment) {
    requestBody.payment = {
      method: request.payment.method,
      transactionId: request.payment.transactionId || request.payment.transaction_id,
    };
  }
  
  const response = await liteAPIBookingClient<any>('/rates/book', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
  
  // LiteAPI returns data in response.data with camelCase, normalize to snake_case
  const data = response.data || response;
  return {
    booking_id: data.bookingId || data.booking_id,
    confirmation_number: data.confirmationNumber || data.confirmation_number,
    status: data.status,
    hotel_id: data.hotelId || data.hotel_id,
    checkin: data.checkin,
    checkout: data.checkout,
    total: data.total,
  };
}

export async function getBooking(bookingId: string): Promise<any> {
  return liteAPIBookingClient<any>(`/bookings/${bookingId}`, {
    method: 'GET',
  });
}

export async function listBookings(): Promise<any> {
  return liteAPIBookingClient<any>('/bookings', {
    method: 'GET',
  });
}

export async function cancelBooking(bookingId: string): Promise<any> {
  return liteAPIBookingClient<any>(`/bookings/${bookingId}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'cancelled' }),
  });
}

export async function amendGuestName(bookingId: string, firstName: string, lastName: string): Promise<any> {
  return liteAPIBookingClient<any>(`/bookings/${bookingId}/amend`, {
    method: 'PUT',
    body: JSON.stringify({ 
      guestInfo: {
        firstName,
        lastName,
      }
    }),
  });
}

