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
    
    const transformedData = rawData.map((hotelData: any) => {
      const roomTypes = hotelData.roomTypes || [];
      const rooms: any[] = [];

      roomTypes.forEach((roomType: any) => {
        const rates = roomType.rates || [];
        
        rates.forEach((rate: any) => {
          // Extract prices:
          // - suggestedSellingPrice: Our price WITH margin (what we charge customer)
          // - total: Supplier cost WITHOUT margin (what we pay LiteAPI)
          const customerPrice = rate.retailRate?.suggestedSellingPrice?.[0]?.amount || 0;
          const supplierCost = rate.retailRate?.total?.[0]?.amount || 0;
          
          // Use customer price (with margin) for all customer-facing displays
          const totalPrice = customerPrice;
          
          // Calculate per-night price
          const pricePerNight = nights > 0 ? totalPrice / nights : totalPrice;

          rooms.push({
            room_id: roomType.roomTypeId,
            room_name: rate.name || roomType.name,
            rates: [{
              rate_id: rate.rateId,
              net: {
                amount: pricePerNight, // Per-night price WITH margin
                currency: rate.retailRate?.suggestedSellingPrice?.[0]?.currency || 'USD',
              },
              total: {
                amount: totalPrice, // Total price WITH margin
                currency: rate.retailRate?.suggestedSellingPrice?.[0]?.currency || 'USD',
              },
              supplier_cost: supplierCost, // Store for profit tracking (internal only)
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
  const hotelIds = (hotelSearchResponse.hotelIds || []).slice(0, params.limit || 100);

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
  const checkIn = new Date(params.checkIn);
  const checkOut = new Date(params.checkOut);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

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

