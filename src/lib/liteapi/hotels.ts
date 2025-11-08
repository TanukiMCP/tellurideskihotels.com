import { liteAPIClient } from './client';
import type { LiteAPIHotel, LiteAPIHotelSearchParams } from './types';
import { isHotelNearTelluride } from '@/lib/mapbox-utils';

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
  
  // ACTUAL API RESPONSE: Returns full hotel objects in data[] array
  const hotelsData = Array.isArray(response.data) ? response.data : [];
  
  console.log('[LiteAPI Hotels] Search returned hotels:', {
    count: hotelsData.length,
    sampleIds: hotelsData.slice(0, 3).map((h: any) => h.id),
  });
  
  // Transform API response to our format
  const validHotels: LiteAPIHotel[] = hotelsData.map((hotel: any) => ({
    hotel_id: hotel.id,
    name: hotel.name,
    star_rating: hotel.stars,
    review_score: hotel.rating,
    review_count: hotel.reviewCount,
    address: {
      line1: hotel.address,
      city: hotel.city,
      state: hotel.state,
      postal_code: hotel.zip,
      country: hotel.country,
    },
    location: {
      latitude: hotel.latitude,
      longitude: hotel.longitude,
    },
    images: hotel.main_photo ? [{
      type: 'main' as const,
      url: hotel.main_photo,
      description: '',
    }] : [],
    amenities: [], // Not included in search results, need full details for amenities
    description: hotel.hotelDescription ? {
      text: hotel.hotelDescription,
    } : undefined,
  }));
  
  // Filter out hotels that are too far from Telluride (e.g., Sawpit)
  const nearbyHotels = validHotels.filter(hotel => {
    if (!hotel.location?.latitude || !hotel.location?.longitude) {
      return false; // Exclude hotels without coordinates
    }
    const isNearby = isHotelNearTelluride(hotel.location.latitude, hotel.location.longitude);
    if (!isNearby) {
      console.log('[LiteAPI Hotels] Filtering out hotel too far from Telluride:', {
        name: hotel.name,
        city: hotel.address?.city,
        lat: hotel.location.latitude,
        lng: hotel.location.longitude,
      });
    }
    return isNearby;
  });
  
  console.log('[LiteAPI Hotels] Search complete:', {
    hotelsFound: nearbyHotels.length,
    filtered: validHotels.length - nearbyHotels.length,
    sampleHotel: nearbyHotels[0],
  });
  
  return {
    data: nearbyHotels,
    total: hotelIds.length,
  };
}

export async function getHotelDetails(hotelId: string): Promise<LiteAPIHotel> {
  const endpoint = `/data/hotel?hotelId=${hotelId}`;
  const response = await liteAPIClient<any>(endpoint);
  
  // LiteAPI returns data nested in response.data
  const hotel = response.data || response;
  
  // Transform API response to match our types
  // Field names: id, starRating, rating, hotelImages, hotelFacilities
  return {
    hotel_id: hotel.id || hotelId,
    name: hotel.name,
    star_rating: hotel.starRating,
    review_score: hotel.rating,  // Guest rating (0-10 scale)
    review_count: hotel.reviewCount,
    address: {
      line1: hotel.address,  // Full address as single string
      city: hotel.city,
      state: hotel.state,
      postal_code: hotel.postalCode,
      country: hotel.country,
    },
    location: hotel.location ? {
      latitude: hotel.location.latitude,
      longitude: hotel.location.longitude,
    } : undefined,
    images: (hotel.hotelImages || []).map((img: any) => ({
      type: img.defaultImage ? 'main' : 'gallery',
      url: img.url,
      description: img.caption,
    })),
    amenities: (hotel.hotelFacilities || []).map((facility: string) => ({
      name: facility,
    })),
    description: hotel.hotelDescription ? {
      text: hotel.hotelDescription,
    } : undefined,
  };
}

