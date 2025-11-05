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
  
  // Transform API response to match our types
  // LiteAPI returns different field names than what we expected
  const transformedData = response.data?.map((hotel: any) => ({
    hotel_id: hotel.id || hotel.hotel_id,
    name: hotel.name,
    star_rating: hotel.starRating,
    review_score: hotel.reviewScore,
    review_count: hotel.reviewCount,
    address: hotel.address ? {
      line1: hotel.address.line1 || hotel.address.streetAddress,
      city: hotel.address.city || hotel.address.cityName,
      state: hotel.address.state || hotel.address.stateProvinceCode,
      postal_code: hotel.address.postalCode,
      country: hotel.address.countryName,
    } : undefined,
    location: hotel.location ? {
      latitude: hotel.location.latitude,
      longitude: hotel.location.longitude,
    } : undefined,
    // Images are not included in search response, need to fetch details
    images: hotel.images || hotel.hotelImages || [],
    description: hotel.hotelDescription ? {
      text: hotel.hotelDescription,
    } : undefined,
  })) || [];
  
  console.log('[LiteAPI Hotels] Search complete:', {
    hotelsFound: transformedData.length,
    sampleHotel: transformedData[0],
    sampleKeys: Object.keys(response.data?.[0] || {}),
  });
  
  return {
    ...response,
    data: transformedData,
  };
}

export async function getHotelDetails(hotelId: string): Promise<LiteAPIHotel> {
  const endpoint = `/data/hotel?hotelId=${hotelId}`;
  const response = await liteAPIClient<any>(endpoint);
  
  // Transform API response to match our types
  return {
    hotel_id: response.id || response.hotel_id || hotelId,
    name: response.name,
    star_rating: response.starRating,
    review_score: response.reviewScore,
    review_count: response.reviewCount,
    address: response.address ? {
      line1: response.address.line1 || response.address.streetAddress,
      city: response.address.city || response.address.cityName,
      state: response.address.state || response.address.stateProvinceCode,
      postal_code: response.address.postalCode,
      country: response.address.countryName,
    } : undefined,
    location: response.location ? {
      latitude: response.location.latitude,
      longitude: response.location.longitude,
    } : undefined,
    images: response.images || response.hotelImages || [],
    amenities: response.amenities || response.facilities || [],
    description: response.hotelDescription ? {
      text: response.hotelDescription,
    } : response.description,
  };
}

