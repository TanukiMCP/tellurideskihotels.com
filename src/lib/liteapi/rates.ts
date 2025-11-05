import { liteAPIClient } from './client';
import { LITEAPI_MARKUP_PERCENT } from './config';
import type { LiteAPIRate, LiteAPIRateSearchParams } from './types';
import { applyMarkup } from '../utils';

export interface RateSearchResponse {
  data: Array<{
    hotel_id: string;
    rooms: Array<{
      room_id: string;
      room_name: string;
      room_description?: string;
      rates: LiteAPIRate[];
    }>;
  }>;
}

export async function searchRates(params: LiteAPIRateSearchParams): Promise<RateSearchResponse> {
  const searchParams = new URLSearchParams();
  
  const hotelIds = Array.isArray(params.hotelIds) 
    ? params.hotelIds.join(',') 
    : params.hotelIds;
  
  console.log('[LiteAPI Rates] Starting rate search:', {
    hotelIds: hotelIds.split(',').length + ' hotels',
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    adults: params.adults,
    children: params.children,
  });
  
  searchParams.append('hotelIds', hotelIds);
  searchParams.append('checkIn', params.checkIn);
  searchParams.append('checkOut', params.checkOut);
  searchParams.append('adults', params.adults.toString());
  if (params.children) searchParams.append('children', params.children.toString());
  searchParams.append('margin', (params.margin || LITEAPI_MARKUP_PERCENT).toString());

  const endpoint = `/hotels/rates?${searchParams.toString()}`;
  
  try {
    const response = await liteAPIClient<RateSearchResponse>(endpoint);
    
    console.log('[LiteAPI Rates] Response received:', {
      hotelsWithRates: response.data?.length || 0,
      totalRooms: response.data?.reduce((sum, h) => sum + (h.rooms?.length || 0), 0) || 0,
    });

    // Apply markup to all rates if margin wasn't applied server-side
    if (response.data) {
      response.data.forEach((hotel) => {
        hotel.rooms?.forEach((room) => {
          room.rates?.forEach((rate) => {
            if (rate.net?.amount && rate.total?.amount) {
              const markedUpPrice = applyMarkup(rate.net.amount, LITEAPI_MARKUP_PERCENT);
              rate.total.amount = Math.round(markedUpPrice * 100) / 100;
            }
          });
        });
      });
    }

    return response;
  } catch (error) {
    console.error('[LiteAPI Rates] Error fetching rates:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint,
      params: {
        hotelIds: hotelIds.split(',').slice(0, 3).join(',') + '...',
        checkIn: params.checkIn,
        checkOut: params.checkOut,
      }
    });
    
    // Return empty response instead of throwing
    return { data: [] };
  }
}

