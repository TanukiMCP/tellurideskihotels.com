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

export interface MinRateSearchParams {
  hotelIds: string[];
  checkIn: string;
  checkOut: string;
  adults: number;
  currency?: string;
  guestNationality?: string;
  timeout?: number;
}

export interface MinRateResult {
  hotelId: string;
  price?: number;
  suggestedSellingPrice?: number;
  currency: string;
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
  const roomsMap = new Map<string, any>(); // Group by roomTypeId to avoid duplicates

  roomTypes.forEach((roomType: any) => {
    const rates = roomType.rates || [];
    
    rates.forEach((rate: any) => {
      try {
        // LiteAPI pricing structure per documentation:
        // https://docs.liteapi.travel/docs/hotel-rates-api-json-data-structure
        // 
        // retailRate.total[0].amount = What customer pays (base + margin + included taxes)
        //   - This ALREADY includes our commission (set via margin parameter)
        //   - Example: $1,283 total (includes our 15% commission = $167)
        //
        // retailRate.suggestedSellingPrice[0].amount = SSP (Suggested Selling Price)
        //   - Public display price from hotel/OTAs (usually higher than retail)
        //   - Example: $1,404 total
        //   - Only required if selling ABOVE retail to show "discount"
        //
        // retailRate.initialPrice[0].amount = Base hotel price (before margin)
        //   - What hotel receives after our commission is deducted
        //
        // PRICING STRATEGY: Use retailRate.total for competitive pricing
        // Our commission is ALREADY included via the margin parameter
        
        const retailData = Array.isArray(rate.retailRate?.total) 
          ? rate.retailRate.total[0] 
          : rate.retailRate?.total;
        const sspData = Array.isArray(rate.retailRate?.suggestedSellingPrice)
          ? rate.retailRate.suggestedSellingPrice[0]
          : rate.retailRate?.suggestedSellingPrice;
        const initialData = Array.isArray(rate.retailRate?.initialPrice)
          ? rate.retailRate.initialPrice[0]
          : rate.retailRate?.initialPrice;
          
        // Use retail rate (what we pay LiteAPI) as our selling price
        // Commission is already included via margin parameter
        const retailTotal = retailData?.amount || 0;
        const sspTotal = sspData?.amount || 0; // Store for potential "compare at" pricing
        const currency = retailData?.currency || 'USD';
        
        // Calculate per-night prices from totals
        const retailPerNight = nights > 0 ? retailTotal / nights : retailTotal;
        const sspPerNight = nights > 0 ? sspTotal / nights : sspTotal;

        // Extract taxes and fees information
        const taxesAndFees = rate.retailRate?.taxesAndFees || [];
        const includedFees = taxesAndFees.filter((fee: any) => fee.included).reduce((sum: number, fee: any) => sum + (fee.amount || 0), 0);
        const excludedFees = taxesAndFees.filter((fee: any) => !fee.included).reduce((sum: number, fee: any) => sum + (fee.amount || 0), 0);

        // Only process if we have a valid retail price
        if (retailTotal > 0) {
          const transformedRate = {
            rate_id: rate.rateId,
            room_id: roomType.roomTypeId,
            room_name: rate.name || roomType.name || 'Standard Room',
            offer_id: roomType.offerId, // Required for prebook
            mapped_room_id: rate.mappedRoomId, // For linking to room photos (mappedRoomId is in rate, not roomType)
            // CUSTOMER PRICING (retailRate.total - what customer pays)
            // This ALREADY includes our commission (set via margin parameter)
            net: {
              amount: retailPerNight, // Retail per night (e.g., $641/night)
              currency,
            },
            total: {
              amount: retailTotal, // Retail total for entire stay (e.g., $1,283 for 2 nights)
              currency,
            },
            // REFERENCE PRICING (for showing savings/discounts if desired)
            // SSP is typically higher - can show "Compare at $X" messaging
            suggested_selling_price: sspTotal > retailTotal ? {
              per_night: sspPerNight,
              total: sspTotal,
              currency,
            } : undefined,
            // Tax and fee breakdown
            taxes_and_fees: {
              included: includedFees,
              excluded: excludedFees, // Pay at property
              details: taxesAndFees,
            },
            board_type: rate.boardName || 'Room Only',
            board_code: rate.boardType,
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
          };

          // Group rates by roomTypeId to avoid duplicate rooms
          const roomKey = roomType.roomTypeId;
          if (roomsMap.has(roomKey)) {
            // Add rate to existing room
            roomsMap.get(roomKey).rates.push(transformedRate);
          } else {
            // Create new room entry
            roomsMap.set(roomKey, {
              room_id: roomType.roomTypeId,
              room_name: rate.name || roomType.name || 'Standard Room',
              mapped_room_id: rate.mappedRoomId, // For linking to room photos from hotel details
              rates: [transformedRate],
            });
          }
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
    rooms: Array.from(roomsMap.values()),
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
    roomMapping: true, // Enable room mapping to get mappedRoomId for linking to room photos
  };

  const endpoint = `/hotels/rates`;

  try {
    console.log('[LiteAPI Rates] Making request to LiteAPI:', {
      endpoint,
      bodyPreview: {
        hotelIds: requestBody.hotelIds,
        checkin: requestBody.checkin,
        checkout: requestBody.checkout,
        occupancies: requestBody.occupancies,
        margin: requestBody.margin,
      }
    });

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
    roomMapping: true, // Enable room mapping to get mappedRoomId for linking to room photos
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

  console.log('[LiteAPI Rates] Starting hotel search:', {
    cityName: params.cityName,
    willSearchMountainVillage: shouldIncludeMountainVillage
  });

  // Search Telluride - no limit, get all results
  const searchParams = new URLSearchParams();
  searchParams.append('cityName', params.cityName);
  searchParams.append('countryCode', params.countryCode);
  // Don't set limit - let API return all results

  const hotelSearchEndpoint = `/data/hotels?${searchParams.toString()}`;
  const tellurideResponse = await liteAPIClient<any>(hotelSearchEndpoint);
  const tellurideHotels = Array.isArray(tellurideResponse.data) ? tellurideResponse.data : [];
  allHotelsData.push(...tellurideHotels);

  console.log('[LiteAPI Rates] Telluride hotels found:', {
    count: tellurideHotels.length,
    sampleNames: tellurideHotels.slice(0, 3).map((h: any) => h.name)
  });

  // Also search Mountain Village if this is a Telluride search
  if (shouldIncludeMountainVillage) {
    try {
      const mvSearchParams = new URLSearchParams();
      mvSearchParams.append('cityName', 'Mountain Village');
      mvSearchParams.append('countryCode', params.countryCode);
      // No limit - get all Mountain Village hotels too

      const mvEndpoint = `/data/hotels?${mvSearchParams.toString()}`;
      console.log('[LiteAPI Rates] Searching Mountain Village hotels...');
      const mvResponse = await liteAPIClient<any>(mvEndpoint);
      const mvHotels = Array.isArray(mvResponse.data) ? mvResponse.data : [];
      
      console.log('[LiteAPI Rates] Mountain Village hotels found:', {
        count: mvHotels.length,
        sampleNames: mvHotels.slice(0, 3).map((h: any) => h.name)
      });
      
      allHotelsData.push(...mvHotels);
    } catch (error) {
      console.error('[LiteAPI Rates] Mountain Village search failed:', error);
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
  console.log('[LiteAPI Rates] Hotels with availability:', {
    count: hotelIdsWithRates.length,
    hotelIds: hotelIdsWithRates,
    samplePrices: Object.entries(minPrices).slice(0, 5).map(([id, price]) => ({
      hotelId: id,
      pricePerNight: price,
    })),
  });

  // Fetch full details only for hotels with availability
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

/**
 * Get minimum rates for hotels - optimized for map markers and listing pages
 * Much faster than full rates endpoint, returns only the cheapest price per hotel
 */
export async function getMinRates(params: MinRateSearchParams): Promise<Record<string, MinRateResult>> {
  console.log('[LiteAPI Min Rates] Fetching minimum rates:', {
    hotelCount: params.hotelIds.length,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    adults: params.adults,
  });

  // Build request body
  const requestBody = {
    hotelIds: params.hotelIds,
    checkin: params.checkIn,
    checkout: params.checkOut,
    occupancies: [{
      adults: params.adults,
      children: [],
    }],
    currency: params.currency || 'USD',
    guestNationality: params.guestNationality || 'US',
    timeout: params.timeout || 6,
    margin: LITEAPI_MARKUP_PERCENT,
  };

  try {
    const response = await liteAPIClient<any>('/hotels/min-rates', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Transform response into a map of hotel_id -> MinRateResult
    const minRates: Record<string, MinRateResult> = {};
    
    if (response.data && Array.isArray(response.data)) {
      response.data.forEach((item: any) => {
        if (item.hotelId) {
          minRates[item.hotelId] = {
            hotelId: item.hotelId,
            price: item.price,
            suggestedSellingPrice: item.suggestedSellingPrice,
            currency: item.currency || params.currency || 'USD',
          };
        }
      });
    }

    console.log('[LiteAPI Min Rates] Fetched min rates for hotels:', {
      totalHotels: Object.keys(minRates).length,
      hotelIds: Object.keys(minRates),
      sampleRates: Object.entries(minRates).slice(0, 3).map(([id, rate]) => ({
        hotelId: id,
        price: rate.price,
        suggestedSellingPrice: rate.suggestedSellingPrice,
        currency: rate.currency,
      })),
    });
    
    return minRates;
  } catch (error) {
    console.error('[LiteAPI Min Rates] Error fetching min rates:', error);
    return {};
  }
}

