import { liteAPIClient, liteAPIStreamClient, type StreamCallback } from './client';
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

/**
 * Transform raw rate data from LiteAPI into our standard format
 */
function transformRateData(hotelData: any, nights: number): Array<{
  hotel_id: string;
  rooms: Array<{
    room_id: string;
    room_name: string;
    room_description?: string;
    rates: LiteAPIRate[];
  }>;
}> {
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
        
        // CORRECT: Use suggestedSellingPrice FIRST (already includes margin)
        // Handle both array and object format
        const suggestedData = Array.isArray(rate.retailRate?.suggestedSellingPrice)
          ? rate.retailRate.suggestedSellingPrice[0]
          : rate.retailRate?.suggestedSellingPrice;
        const totalData = Array.isArray(rate.retailRate?.total) 
          ? rate.retailRate.total[0] 
          : rate.retailRate?.total;
          
        // Priority: suggestedSellingPrice > total
        const totalPrice = suggestedData?.amount || totalData?.amount || 0;
        const currency = suggestedData?.currency || totalData?.currency || 'USD';
        
        // Calculate per-night price
        const pricePerNight = nights > 0 ? totalPrice / nights : totalPrice;

        // Only filter if price is 0 (don't check basePrice - that was the bug!)
        if (totalPrice > 0) {
          rooms.push({
            room_id: roomType.roomTypeId,
            room_name: rate.name || roomType.name || 'Standard Room',
            rates: [{
              rate_id: rate.rateId,
              room_id: roomType.roomTypeId,
              room_name: rate.name || roomType.name || 'Standard Room',
              offer_id: roomType.offerId, // Required for prebook
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

  return [{
    hotel_id: hotelData.hotelId,
    rooms,
  }];
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

  // Build occupancies array - CRITICAL: one object per room!
  const roomCount = params.rooms || 1;
  const occupancies = [];
  for (let i = 0; i < roomCount; i++) {
    occupancies.push({
    adults: params.adults,
      children: [], // Array of ages, NOT count
    });
  }

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
    
    // Use shared transform function
    const transformedData = rawData.flatMap((hotelData: any) => transformRateData(hotelData, nights));

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
 * Stream hotel rates from LiteAPI
 * Processes rates as they arrive, reducing memory usage and improving response times
 */
export async function searchRatesStream(
  params: LiteAPIRateSearchParams,
  onRates: (rates: Array<{ hotel_id: string; rooms: Array<{ room_id: string; room_name: string; rates: LiteAPIRate[] }> }>) => void | Promise<void>
): Promise<void> {
  // Convert hotelIds to array format
  const hotelIdsArray = Array.isArray(params.hotelIds)
    ? params.hotelIds
    : params.hotelIds.split(',').filter(id => id.trim() !== '');

  // Calculate number of nights
  const checkIn = new Date(params.checkIn);
  const checkOut = new Date(params.checkOut);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  console.log('[LiteAPI Rates Stream] Starting streaming rate search:', {
    hotelIds: hotelIdsArray.length + ' hotels',
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    nights,
    adults: params.adults,
  });

  // Build occupancies array - CRITICAL: one object per room!
  const roomCount = params.rooms || 1;
  const occupancies = [];
  for (let i = 0; i < roomCount; i++) {
    occupancies.push({
      adults: params.adults,
      children: [], // Array of ages, NOT count
    });
  }

  // LiteAPI rates endpoint is POST with JSON body + stream: true
  const requestBody = {
    hotelIds: hotelIdsArray,
    checkin: params.checkIn,  // lowercase 'checkin'
    checkout: params.checkOut,  // lowercase 'checkout'
    occupancies,
    currency: 'USD',
    guestNationality: 'US',
    margin: params.margin || LITEAPI_MARKUP_PERCENT,
    stream: true, // Enable streaming
  };

  const endpoint = `/hotels/rates`;

  try {
    await liteAPIStreamClient(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      },
      async (chunk) => {
        if (chunk.type === 'rates') {
          // Process each rate chunk as it arrives
          const ratesChunk = chunk.data as any[];
          
          for (const hotelData of ratesChunk) {
            const transformedData = transformRateData(hotelData, nights);
            if (transformedData.length > 0 && transformedData[0].rooms.length > 0) {
              await onRates(transformedData);
            }
          }
        }
        // Ignore hotels chunk and done - we only care about rates
      }
    );

    console.log('[LiteAPI Rates Stream] Stream complete');
  } catch (error) {
    console.error('[LiteAPI Rates Stream] Error streaming rates:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint,
      params: {
        hotelIds: hotelIdsArray.slice(0, 3).join(',') + '...',
        checkIn: params.checkIn,
        checkOut: params.checkOut,
      }
    });
    throw error;
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

  // For Telluride, also search Mountain Village (connected by gondola)
  const shouldIncludeMountainVillage = params.cityName.toLowerCase() === 'telluride';
  let allHotelsData: any[] = [];

  // Search Telluride - no limit, get all results
  const searchParams = new URLSearchParams();
  searchParams.append('cityName', params.cityName);
  searchParams.append('countryCode', params.countryCode);
  // Don't set limit - let API return all results

  const hotelSearchEndpoint = `/data/hotels?${searchParams.toString()}`;
  const tellurideResponse = await liteAPIClient<any>(hotelSearchEndpoint);
  const tellurideHotels = Array.isArray(tellurideResponse.data) ? tellurideResponse.data : [];
  allHotelsData.push(...tellurideHotels);

  console.log('[LiteAPI Rates] Telluride hotels found:', tellurideHotels.length);

  // Also search Mountain Village if this is a Telluride search
  if (shouldIncludeMountainVillage) {
    try {
      const mvSearchParams = new URLSearchParams();
      mvSearchParams.append('cityName', 'Mountain Village');
      mvSearchParams.append('countryCode', params.countryCode);
      // No limit - get all Mountain Village hotels too

      const mvEndpoint = `/data/hotels?${mvSearchParams.toString()}`;
      const mvResponse = await liteAPIClient<any>(mvEndpoint);
      const mvHotels = Array.isArray(mvResponse.data) ? mvResponse.data : [];
      
      console.log('[LiteAPI Rates] Mountain Village hotels found:', mvHotels.length);
      allHotelsData.push(...mvHotels);
    } catch (error) {
      console.warn('[LiteAPI Rates] Mountain Village search failed:', error);
      // Continue with just Telluride results
    }
  }

  // Remove duplicates
  const uniqueHotelsMap = new Map();
  allHotelsData.forEach(hotel => {
    if (hotel.id && !uniqueHotelsMap.has(hotel.id)) {
      uniqueHotelsMap.set(hotel.id, hotel);
    }
  });
  const hotelsData = Array.from(uniqueHotelsMap.values());
  const hotelIds = hotelsData.map((h: any) => h.id); // No more arbitrary limit!

  console.log('[LiteAPI Rates] Combined search - Total unique hotel IDs:', {
    total: hotelIds.length,
    telluride: tellurideHotels.length,
    mountainVillage: allHotelsData.length - tellurideHotels.length,
  });

  if (hotelIds.length === 0) {
    return { hotels: [], minPrices: {} };
  }

  // Use streaming for bulk searches (10+ hotels) to reduce load times
  const useStreaming = hotelIds.length >= 10;
  const minPrices: Record<string, number> = {};

  if (useStreaming) {
    console.log('[LiteAPI Rates] Using streaming for bulk search:', hotelIds.length, 'hotels');
    
    // Collect rates as they stream in
    await searchRatesStream(
      {
        hotelIds: hotelIds.join(','),
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        adults: params.adults,
        rooms: 1,
      },
      async (ratesChunk) => {
        // Process each chunk as it arrives
        ratesChunk.forEach((hotel: any) => {
          const hotelMinPrice = hotel.rooms?.flatMap((r: any) =>
            r.rates?.map((rate: any) => rate.net?.amount || Infinity)
          ).filter((p: number) => p !== Infinity);

          if (hotelMinPrice && hotelMinPrice.length > 0) {
            const currentMin = minPrices[hotel.hotel_id];
            const newMin = Math.min(...hotelMinPrice);
            minPrices[hotel.hotel_id] = currentMin ? Math.min(currentMin, newMin) : newMin;
          }
        });
      }
    );
  } else {
    // Use regular API for small searches (faster for single/few hotels)
    console.log('[LiteAPI Rates] Using regular API for small search:', hotelIds.length, 'hotels');
    
    const ratesResponse = await searchRates({
      hotelIds: hotelIds.join(','),
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      adults: params.adults,
      rooms: 1, // Default to 1 room
    });

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

