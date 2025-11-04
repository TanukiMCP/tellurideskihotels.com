import { liteAPIClient } from './client';
import type { LiteAPIHotel, LiteAPIHotelSearchParams } from './types';

export interface HotelSearchResponse {
  data: LiteAPIHotel[];
  total?: number;
}

export async function searchHotels(params: LiteAPIHotelSearchParams): Promise<HotelSearchResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.cityName) searchParams.append('cityName', params.cityName);
  if (params.countryCode) searchParams.append('countryCode', params.countryCode);
  if (params.latitude) searchParams.append('latitude', params.latitude.toString());
  if (params.longitude) searchParams.append('longitude', params.longitude.toString());
  if (params.radius) searchParams.append('radius', params.radius.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.offset) searchParams.append('offset', params.offset.toString());

  const queryString = searchParams.toString();
  const endpoint = `/data/hotels${queryString ? `?${queryString}` : ''}`;

  return liteAPIClient<HotelSearchResponse>(endpoint);
}

export async function getHotelDetails(hotelId: string): Promise<LiteAPIHotel> {
  const endpoint = `/data/hotel?hotelId=${hotelId}`;
  return liteAPIClient<LiteAPIHotel>(endpoint);
}

