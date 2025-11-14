import { liteAPIBookingClient } from './booking-client';
import type {
  LiteAPIPrebookRequest,
  LiteAPIPrebookResponse,
  LiteAPIConfirmRequest,
  LiteAPIConfirmResponse,
} from './types';

export async function prebook(request: LiteAPIPrebookRequest): Promise<LiteAPIPrebookResponse> {
  const response = await liteAPIBookingClient<any>('/rates/prebook', {
    method: 'POST',
    body: JSON.stringify({
      offerId: request.offerId,
      usePaymentSdk: request.usePaymentSdk ?? true,
    }),
  });
  
  const data = response.data?.data || response.data || response;
  
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

export async function confirmBooking(request: LiteAPIConfirmRequest): Promise<LiteAPIConfirmResponse> {
  const response = await liteAPIBookingClient<any>('/rates/book', {
    method: 'POST',
    body: JSON.stringify({
      prebookId: request.prebookId,
      holder: request.holder,
      payment: {
        method: request.payment.method,
        transactionId: request.payment.transactionId,
      },
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

