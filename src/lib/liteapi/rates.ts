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
  // Convert hotelIds to array format as per LiteAPI docs
  const hotelIdsArray = Array.isArray(params.hotelIds) 
    ? params.hotelIds 
    : params.hotelIds.split(',').filter(id => id.trim() !== '');
  
  console.log('[LiteAPI Rates] Starting rate search:', {
    hotelIds: hotelIdsArray.length + ' hotels',
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    adults: params.adults,
    children: params.children,
  });
  
  // LiteAPI rates endpoint is POST with JSON body
  const requestBody = {
    hotelIds: hotelIdsArray,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    adults: params.adults,
    ...(params.children && { children: params.children }),
    margin: params.margin || LITEAPI_MARKUP_PERCENT,
  };

  const endpoint = `/hotels/rates`;
  
  try {
    const response = await liteAPIClient<RateSearchResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
    
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
        hotelIds: hotelIdsArray.slice(0, 3).join(',') + '...',
        checkIn: params.checkIn,
        checkOut: params.checkOut,
      }
    });
    
    // Return empty response instead of throwing
    return { data: [] };
  }
}

