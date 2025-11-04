import { liteAPIClient } from './client';
import type {
  LiteAPIPrebookRequest,
  LiteAPIPrebookResponse,
  LiteAPIConfirmRequest,
  LiteAPIConfirmResponse,
} from './types';

export async function prebook(request: LiteAPIPrebookRequest): Promise<LiteAPIPrebookResponse> {
  return liteAPIClient<LiteAPIPrebookResponse>('/booking/prebook', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function confirmBooking(request: LiteAPIConfirmRequest): Promise<LiteAPIConfirmResponse> {
  return liteAPIClient<LiteAPIConfirmResponse>('/booking/confirm', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function cancelBooking(bookingId: string): Promise<{ success: boolean }> {
  return liteAPIClient<{ success: boolean }>(`/booking/${bookingId}/cancel`, {
    method: 'POST',
  });
}

