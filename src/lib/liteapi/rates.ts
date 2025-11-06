import { liteAPIClient } from './client';
import { LITEAPI_MARKUP_PERCENT } from './config';
import type { LiteAPIRate, LiteAPIRateSearchParams, LiteAPIHotel } from './types';
import { getHotelDetails } from './hotels';

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
    
    console.log('[LiteAPI Rates] Raw response:', {
      hotelsCount: rawData.length,
      sampleHotel: rawData[0],
      sampleRoomType: rawData[0]?.roomTypes?.[0],
      sampleRate: rawData[0]?.roomTypes?.[0]?.rates?.[0],
    });
    
    const transformedData = rawData.map((hotelData: any) => {
      const roomTypes = hotelData.roomTypes || [];
      const rooms: any[] = [];

      roomTypes.forEach((roomType: any) => {
        const rates = roomType.rates || [];
        
        rates.forEach((rate: any) => {
          try {
          // LiteAPI pricing structure (VERIFIED):
          // When margin=15 is sent:
          // - retailRate.total[0].amount = Hotel's base cost (what LiteAPI pays hotel)
          // - We need to ADD our margin on top to get customer price
          // OR use suggestedSellingPrice if present (which already includes markup)
          
          // Handle both array and object format for retailRate
          const totalData = Array.isArray(rate.retailRate?.total) 
            ? rate.retailRate.total[0] 
            : rate.retailRate?.total;
          const suggestedData = Array.isArray(rate.retailRate?.suggestedSellingPrice)
            ? rate.retailRate.suggestedSellingPrice[0]
            : rate.retailRate?.suggestedSellingPrice;
            
          const basePrice = totalData?.amount || 0;
          const suggestedPrice = suggestedData?.amount || 0;
          const currency = totalData?.currency || 'USD';
          
          // Use whichever is HIGHER (protects against loss)
          // If LiteAPI gives us suggestedSellingPrice, use it (includes their calculation)
          // Otherwise, apply our margin to basePrice
          let customerPrice = suggestedPrice;
          if (!customerPrice || customerPrice < basePrice) {
            // Apply our margin (15%) to base price
            customerPrice = basePrice * 1.15;
          }
          
          // Add Stripe fees on top (2.9% + $0.30)
          const stripeFee = (customerPrice * 0.029) + 0.30;
          const totalPrice = customerPrice + stripeFee;
          
          // Calculate per-night price
          const pricePerNight = nights > 0 ? totalPrice / nights : totalPrice;

          console.log('[LiteAPI Rates] Rate pricing:', {
            hotelId: hotelData.hotelId,
            roomTypeId: roomType.roomTypeId,
            rateId: rate.rateId,
            basePrice,
            suggestedPrice,
            customerPrice,
            totalPrice,
            valid: totalPrice > 0 && basePrice > 0,
          });

          // Only add rates with valid pricing
          if (totalPrice > 0 && basePrice > 0) {
            rooms.push({
              room_id: roomType.roomTypeId,
              room_name: rate.name || roomType.name || 'Standard Room',
              rates: [{
                rate_id: rate.rateId,
                room_id: roomType.roomTypeId,
                room_name: rate.name || roomType.name || 'Standard Room',
                net: {
                  amount: pricePerNight, // Per-night price WITH margin
                  currency,
                },
                total: {
                  amount: totalPrice, // Total price WITH margin
                  currency,
                },
                board_type: rate.boardName || 'Room Only',
                cancellation_policy: rate.cancellationPolicies,
                cancellation_policies: (() => {
                  // Handle cancellationPolicies - it can be an object or array
                  const cp = rate.cancellationPolicies;
                  if (!cp) return [];
                  
                  // If it's an array, map it directly
                  if (Array.isArray(cp)) {
                    return cp.map((policy: any) => ({
                      type: policy.refundType || 'NON_REFUNDABLE',
                      description: policy.text,
                    }));
                  }
                  
                  // If it's an object, extract from cancelPolicyInfos
                  if (cp.cancelPolicyInfos && Array.isArray(cp.cancelPolicyInfos)) {
                    return cp.cancelPolicyInfos.map((policy: any) => ({
                      type: policy.refundType || cp.refundableTag || 'NON_REFUNDABLE',
                      description: policy.text || policy.description || '',
                    }));
                  }
                  
                  // Fallback: create a policy from refundableTag
                  if (cp.refundableTag) {
                    const isRefundable = cp.refundableTag === 'REF' || cp.refundableTag === 'FREF';
                    return [{
                      type: isRefundable ? 'FREE_CANCELLATION' : 'NON_REFUNDABLE',
                      description: cp.hotelRemarks?.[0] || '',
                    }];
                  }
                  
                  return [];
                })(),
                bed_types: roomType.bedTypes || [],
                max_occupancy: roomType.maxOccupancy,
                amenities: roomType.amenities || [],
              }],
            });
          }
          } catch (error) {
            console.error('[LiteAPI Rates] Error processing rate:', {
              error: error instanceof Error ? error.message : 'Unknown error',
              hotelId: hotelData.hotelId,
              roomTypeId: roomType.roomTypeId,
              rateId: rate.rateId,
            });
          }
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
      sampleHotel: transformedData[0],
      sampleRoom: transformedData[0]?.rooms?.[0],
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

/**
 * Search for hotels with available rates for specific dates
 * This is the proper way to get hotels that are actually bookable
 */
export async function searchHotelsWithRates(params: {
  cityName: string;
  countryCode: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  limit?: number;
}): Promise<{
  hotels: LiteAPIHotel[];
  minPrices: Record<string, number>;
}> {
  console.log('[LiteAPI Rates] Searching hotels with availability:', {
    cityName: params.cityName,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    adults: params.adults,
  });

  // First, get hotel IDs for the city
  const searchParams = new URLSearchParams();
  searchParams.append('cityName', params.cityName);
  searchParams.append('countryCode', params.countryCode);
  if (params.limit) searchParams.append('limit', params.limit.toString());

  const hotelSearchEndpoint = `/data/hotels?${searchParams.toString()}`;
  const hotelSearchResponse = await liteAPIClient<any>(hotelSearchEndpoint);
  const hotelIds = (hotelSearchResponse.hotelIds || []).slice(0, params.limit || 500);

  console.log('[LiteAPI Rates] Found hotel IDs:', hotelIds.length);

  if (hotelIds.length === 0) {
    return { hotels: [], minPrices: {} };
  }

  // Search for rates for all hotels
  const ratesResponse = await searchRates({
    hotelIds: hotelIds.join(','),
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    adults: params.adults,
  });

  // Calculate min prices and get hotel IDs with availability
  const minPrices: Record<string, number> = {};

  if (ratesResponse.data && ratesResponse.data.length > 0) {
    ratesResponse.data.forEach((hotel: any) => {
      const hotelMinPrice = hotel.rooms?.flatMap((r: any) =>
        r.rates?.map((rate: any) => rate.net?.amount || Infinity)
      ).filter((p: number) => p !== Infinity);

      if (hotelMinPrice && hotelMinPrice.length > 0) {
        minPrices[hotel.hotel_id] = Math.min(...hotelMinPrice);
      }
    });
  }

  const hotelIdsWithRates = Object.keys(minPrices);
  console.log('[LiteAPI Rates] Hotels with availability:', hotelIdsWithRates.length);

  // Fetch full details for hotels with availability
  const hotelDetailsPromises = hotelIdsWithRates.map(id =>
    getHotelDetails(id).catch(err => {
      console.error(`[LiteAPI Rates] Error fetching details for ${id}:`, err);
      return null;
    })
  );

  const hotelDetails = (await Promise.all(hotelDetailsPromises))
    .filter((h): h is LiteAPIHotel => h !== null);

  console.log('[LiteAPI Rates] Search complete:', {
    hotelsWithAvailability: hotelDetails.length,
    hotelsWithPrices: Object.keys(minPrices).length,
  });

  return {
    hotels: hotelDetails,
    minPrices,
  };
}

