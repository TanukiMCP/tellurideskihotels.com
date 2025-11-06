import { liteAPIBookingClient } from './booking-client';
import type {
  LiteAPIPrebookRequest,
  LiteAPIPrebookResponse,
  LiteAPIConfirmRequest,
  LiteAPIConfirmResponse,
} from './types';

export async function prebook(request: LiteAPIPrebookRequest): Promise<LiteAPIPrebookResponse> {
  return liteAPIBookingClient<LiteAPIPrebookResponse>('/rates/prebook', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function confirmBooking(request: LiteAPIConfirmRequest): Promise<LiteAPIConfirmResponse> {
  return liteAPIBookingClient<LiteAPIConfirmResponse>('/rates/book', {
    method: 'POST',
    body: JSON.stringify(request),
  });
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

