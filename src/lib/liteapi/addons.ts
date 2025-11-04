import { liteAPIClient } from './client';
import type { LiteAPIAddon } from './types';

export interface AddonsResponse {
  data: LiteAPIAddon[];
}

export async function getHotelAddons(hotelId: string): Promise<AddonsResponse> {
  const endpoint = `/data/hotel/${hotelId}/addons`;
  return liteAPIClient<AddonsResponse>(endpoint);
}

