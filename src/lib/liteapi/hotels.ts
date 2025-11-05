import { liteAPIClient } from './client';
import type { LiteAPIHotel, LiteAPIHotelSearchParams } from './types';

export interface HotelSearchResponse {
  data: LiteAPIHotel[];
  total?: number;
}

export async function searchHotels(params: LiteAPIHotelSearchParams): Promise<HotelSearchResponse> {
  console.log('[LiteAPI Hotels] Starting hotel search:', {
    cityName: params.cityName,
    countryCode: params.countryCode,
    limit: params.limit,
  });
  
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

  const response = await liteAPIClient<any>(endpoint);
  
  // Transform API response to match our types (API returns 'id', we use 'hotel_id')
  const transformedData = response.data?.map((hotel: any) => ({
    ...hotel,
    hotel_id: hotel.id || hotel.hotel_id,
  })) || [];
  
  console.log('[LiteAPI Hotels] Search complete:', {
    hotelsFound: transformedData.length,
    sampleHotelId: transformedData[0]?.hotel_id,
    sampleImageUrl: transformedData[0]?.images?.[0]?.url,
  });
  
  return {
    ...response,
    data: transformedData,
  };
}

export async function getHotelDetails(hotelId: string): Promise<LiteAPIHotel> {
  const endpoint = `/data/hotel?hotelId=${hotelId}`;
  const response = await liteAPIClient<any>(endpoint);
  
  // Transform API response (API returns 'id', we use 'hotel_id')
  return {
    ...response,
    hotel_id: response.id || response.hotel_id,
  };
}

