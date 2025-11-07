import { l as liteAPIClient } from './client_z1fk82NB.mjs';
import { b as LITEAPI_MARKUP_PERCENT } from './config_CSQRX8el.mjs';
import { g as getHotelDetails } from './hotels_Bo4Pfpjr.mjs';

async function searchRates(params) {
  const hotelIdsArray = Array.isArray(params.hotelIds) ? params.hotelIds : params.hotelIds.split(",").filter((id) => id.trim() !== "");
  const checkIn = new Date(params.checkIn);
  const checkOut = new Date(params.checkOut);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1e3 * 60 * 60 * 24));
  console.log("[LiteAPI Rates] Starting rate search:", {
    hotelIds: hotelIdsArray.length + " hotels",
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    nights,
    adults: params.adults
  });
  const roomCount = params.rooms || 1;
  const occupancies = [];
  for (let i = 0; i < roomCount; i++) {
    occupancies.push({
      adults: params.adults,
      children: []
      // Array of ages, NOT count
    });
  }
  const requestBody = {
    hotelIds: hotelIdsArray,
    checkin: params.checkIn,
    // lowercase 'checkin'
    checkout: params.checkOut,
    // lowercase 'checkout'
    occupancies,
    currency: "USD",
    guestNationality: "US",
    margin: params.margin || LITEAPI_MARKUP_PERCENT
  };
  const endpoint = `/hotels/rates`;
  try {
    const response = await liteAPIClient(endpoint, {
      method: "POST",
      body: JSON.stringify(requestBody)
    });
    const rawData = Array.isArray(response.data) ? response.data : [];
    console.log("[LiteAPI Rates] Raw response:", {
      hotelsCount: rawData.length,
      sampleHotel: rawData[0],
      sampleRoomType: rawData[0]?.roomTypes?.[0],
      sampleRate: rawData[0]?.roomTypes?.[0]?.rates?.[0]
    });
    const transformedData = rawData.map((hotelData) => {
      const roomTypes = hotelData.roomTypes || [];
      const rooms = [];
      roomTypes.forEach((roomType) => {
        const rates = roomType.rates || [];
        rates.forEach((rate) => {
          try {
            const suggestedData = Array.isArray(rate.retailRate?.suggestedSellingPrice) ? rate.retailRate.suggestedSellingPrice[0] : rate.retailRate?.suggestedSellingPrice;
            const totalData = Array.isArray(rate.retailRate?.total) ? rate.retailRate.total[0] : rate.retailRate?.total;
            const totalPrice = suggestedData?.amount || totalData?.amount || 0;
            const currency = suggestedData?.currency || totalData?.currency || "USD";
            const pricePerNight = nights > 0 ? totalPrice / nights : totalPrice;
            if (totalPrice > 0) {
              rooms.push({
                room_id: roomType.roomTypeId,
                room_name: rate.name || roomType.name || "Standard Room",
                rates: [{
                  rate_id: rate.rateId,
                  room_id: roomType.roomTypeId,
                  room_name: rate.name || roomType.name || "Standard Room",
                  net: {
                    amount: pricePerNight,
                    // Per-night price WITH margin
                    currency
                  },
                  total: {
                    amount: totalPrice,
                    // Total price WITH margin
                    currency
                  },
                  board_type: rate.boardName || "Room Only",
                  cancellation_policy: rate.cancellationPolicies,
                  cancellation_policies: (() => {
                    const cp = rate.cancellationPolicies;
                    if (!cp) return [];
                    if (Array.isArray(cp)) {
                      return cp.map((policy) => ({
                        type: policy.refundType || "NON_REFUNDABLE",
                        description: policy.text
                      }));
                    }
                    if (cp.cancelPolicyInfos && Array.isArray(cp.cancelPolicyInfos)) {
                      return cp.cancelPolicyInfos.map((policy) => ({
                        type: policy.refundType || cp.refundableTag || "NON_REFUNDABLE",
                        description: policy.text || policy.description || ""
                      }));
                    }
                    if (cp.refundableTag) {
                      const isRefundable = cp.refundableTag === "REF" || cp.refundableTag === "FREF";
                      return [{
                        type: isRefundable ? "FREE_CANCELLATION" : "NON_REFUNDABLE",
                        description: cp.hotelRemarks?.[0] || ""
                      }];
                    }
                    return [];
                  })(),
                  bed_types: roomType.bedTypes || [],
                  max_occupancy: roomType.maxOccupancy,
                  amenities: roomType.amenities || []
                }]
              });
            }
          } catch (error) {
            console.error("[LiteAPI Rates] Error processing rate:", {
              error: error instanceof Error ? error.message : "Unknown error",
              hotelId: hotelData.hotelId,
              roomTypeId: roomType.roomTypeId,
              rateId: rate.rateId
            });
          }
        });
      });
      return {
        hotel_id: hotelData.hotelId,
        rooms
      };
    });
    console.log("[LiteAPI Rates] Response received:", {
      hotelsWithRates: transformedData.length,
      totalRooms: transformedData.reduce((sum, h) => sum + (h.rooms?.length || 0), 0),
      sampleHotel: transformedData[0],
      sampleRoom: transformedData[0]?.rooms?.[0],
      sampleRate: transformedData[0]?.rooms?.[0]?.rates?.[0]
    });
    return { data: transformedData };
  } catch (error) {
    console.error("[LiteAPI Rates] Error fetching rates:", {
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint,
      params: {
        hotelIds: hotelIdsArray.slice(0, 3).join(",") + "...",
        checkIn: params.checkIn,
        checkOut: params.checkOut
      }
    });
    return { data: [] };
  }
}
async function searchHotelsWithRates(params) {
  console.log("[LiteAPI Rates] Searching hotels with availability:", {
    cityName: params.cityName,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    adults: params.adults
  });
  const searchParams = new URLSearchParams();
  searchParams.append("cityName", params.cityName);
  searchParams.append("countryCode", params.countryCode);
  if (params.limit) searchParams.append("limit", params.limit.toString());
  const hotelSearchEndpoint = `/data/hotels?${searchParams.toString()}`;
  const hotelSearchResponse = await liteAPIClient(hotelSearchEndpoint);
  const hotelIds = (hotelSearchResponse.hotelIds || []).slice(0, params.limit || 500);
  console.log("[LiteAPI Rates] Found hotel IDs:", hotelIds.length);
  if (hotelIds.length === 0) {
    return { hotels: [], minPrices: {} };
  }
  const ratesResponse = await searchRates({
    hotelIds: hotelIds.join(","),
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    adults: params.adults,
    rooms: 1
    // Default to 1 room
  });
  const minPrices = {};
  if (ratesResponse.data && ratesResponse.data.length > 0) {
    ratesResponse.data.forEach((hotel) => {
      const hotelMinPrice = hotel.rooms?.flatMap(
        (r) => r.rates?.map((rate) => rate.net?.amount || Infinity)
      ).filter((p) => p !== Infinity);
      if (hotelMinPrice && hotelMinPrice.length > 0) {
        minPrices[hotel.hotel_id] = Math.min(...hotelMinPrice);
      }
    });
  }
  const hotelIdsWithRates = Object.keys(minPrices);
  console.log("[LiteAPI Rates] Hotels with availability:", hotelIdsWithRates.length);
  const hotelDetailsPromises = hotelIdsWithRates.map(
    (id) => getHotelDetails(id).catch((err) => {
      console.error(`[LiteAPI Rates] Error fetching details for ${id}:`, err);
      return null;
    })
  );
  const hotelDetails = (await Promise.all(hotelDetailsPromises)).filter((h) => h !== null);
  console.log("[LiteAPI Rates] Search complete:", {
    hotelsWithAvailability: hotelDetails.length,
    hotelsWithPrices: Object.keys(minPrices).length
  });
  return {
    hotels: hotelDetails,
    minPrices
  };
}

export { searchHotelsWithRates, searchRates };
