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
  // Convert hotelIds to array format
  const hotelIdsArray = Array.isArray(params.hotelIds)
    ? params.hotelIds
    : params.hotelIds.split(',').filter(id => id.trim() !== '');

  // Calculate number of nights
  const checkIn = new Date(params.checkIn);
  const checkOut = new Date(params.checkOut);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  console.log('[LiteAPI Rates] Starting rate search:', {
    hotelIds: hotelIdsArray.length + ' hotels',
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    nights,
    adults: params.adults,
  });

  // Build occupancies array (children is array of ages, not count)
  const occupancies = [{
    adults: params.adults,
    children: [], // Array of ages
  }];

  // LiteAPI rates endpoint is POST with JSON body
  const requestBody = {
    hotelIds: hotelIdsArray,
    checkin: params.checkIn,  // lowercase 'checkin'
    checkout: params.checkOut,  // lowercase 'checkout'
    occupancies,
    currency: 'USD',
    guestNationality: 'US',
    margin: params.margin || LITEAPI_MARKUP_PERCENT,
  };

  const endpoint = `/hotels/rates`;

  try {
    const response = await liteAPIClient<any>(endpoint, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Transform response structure: data[] → roomTypes[] → rates[]
    const rawData = Array.isArray(response.data) ? response.data : [];
    
    const transformedData = rawData.map((hotelData: any) => {
      const roomTypes = hotelData.roomTypes || [];
      const rooms: any[] = [];

      roomTypes.forEach((roomType: any) => {
        const rates = roomType.rates || [];
        
        rates.forEach((rate: any) => {
          // Extract TOTAL price (for entire stay, not per night)
          const totalPrice = 
            rate.retailRate?.suggestedSellingPrice?.[0]?.amount ||
            rate.retailRate?.total?.[0]?.amount ||
            0;
          
          // Calculate per-night price
          const pricePerNight = nights > 0 ? totalPrice / nights : totalPrice;

          rooms.push({
            room_id: roomType.roomTypeId,
            room_name: rate.name || roomType.name,
            rates: [{
              rate_id: rate.rateId,
              net: {
                amount: pricePerNight,
                currency: rate.retailRate?.suggestedSellingPrice?.[0]?.currency || 'USD',
              },
              total: {
                amount: totalPrice,
                currency: rate.retailRate?.suggestedSellingPrice?.[0]?.currency || 'USD',
              },
              board_type: rate.boardName || 'Room Only',
              cancellation_policy: rate.cancellationPolicies,
            }],
          });
        });
      });

      return {
        hotel_id: hotelData.hotelId,
        rooms,
      };
    });

    console.log('[LiteAPI Rates] Response received:', {
      hotelsWithRates: transformedData.length,
      totalRooms: transformedData.reduce((sum: number, h: any) => sum + (h.rooms?.length || 0), 0),
      sampleRate: transformedData[0]?.rooms?.[0]?.rates?.[0],
    });

    return { data: transformedData };
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

    return { data: [] };
  }
}

