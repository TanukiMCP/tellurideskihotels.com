import { l as liteAPIClient } from './client_z1fk82NB.mjs';
import { i as isHotelNearTelluride } from './mapbox-utils_CzCgfd-A.mjs';

async function searchHotels(params) {
  console.log("[LiteAPI Hotels] Starting hotel search:", {
    cityName: params.cityName,
    countryCode: params.countryCode,
    limit: params.limit
  });
  const searchParams = new URLSearchParams();
  if (params.cityName) searchParams.append("cityName", params.cityName);
  if (params.countryCode) searchParams.append("countryCode", params.countryCode);
  if (params.latitude) searchParams.append("latitude", params.latitude.toString());
  if (params.longitude) searchParams.append("longitude", params.longitude.toString());
  if (params.radius) searchParams.append("radius", params.radius.toString());
  if (params.limit) searchParams.append("limit", params.limit.toString());
  if (params.offset) searchParams.append("offset", params.offset.toString());
  const queryString = searchParams.toString();
  const endpoint = `/data/hotels${queryString ? `?${queryString}` : ""}`;
  const response = await liteAPIClient(endpoint);
  const hotelIds = response.hotelIds || [];
  console.log("[LiteAPI Hotels] Search returned hotel IDs:", {
    count: hotelIds.length,
    sampleIds: hotelIds.slice(0, 3)
  });
  const limitedIds = hotelIds.slice(0, params.limit || 500);
  const batchSize = 10;
  const validHotels = [];
  for (let i = 0; i < limitedIds.length; i += batchSize) {
    const batch = limitedIds.slice(i, i + batchSize);
    const batchPromises = batch.map(
      (id) => getHotelDetails(id).catch((err) => {
        console.error(`[LiteAPI Hotels] Error fetching details for ${id}:`, err);
        return null;
      })
    );
    const batchResults = await Promise.all(batchPromises);
    const validBatch = batchResults.filter((h) => h !== null);
    validHotels.push(...validBatch);
  }
  const nearbyHotels = validHotels.filter((hotel) => {
    if (!hotel.location?.latitude || !hotel.location?.longitude) {
      return false;
    }
    const isNearby = isHotelNearTelluride(hotel.location.latitude, hotel.location.longitude);
    if (!isNearby) {
      console.log("[LiteAPI Hotels] Filtering out hotel too far from Telluride:", {
        name: hotel.name,
        city: hotel.address?.city,
        lat: hotel.location.latitude,
        lng: hotel.location.longitude
      });
    }
    return isNearby;
  });
  console.log("[LiteAPI Hotels] Search complete:", {
    hotelsFound: nearbyHotels.length,
    filtered: validHotels.length - nearbyHotels.length,
    sampleHotel: nearbyHotels[0]
  });
  return {
    data: nearbyHotels,
    total: hotelIds.length
  };
}
async function getHotelDetails(hotelId) {
  const endpoint = `/data/hotel?hotelId=${hotelId}`;
  const response = await liteAPIClient(endpoint);
  const hotel = response.data || response;
  return {
    hotel_id: hotel.id || hotelId,
    name: hotel.name,
    star_rating: hotel.starRating,
    review_score: hotel.rating,
    // Guest rating (0-10 scale)
    review_count: hotel.reviewCount,
    address: {
      line1: hotel.address,
      // Full address as single string
      city: hotel.city,
      state: hotel.state,
      postal_code: hotel.postalCode,
      country: hotel.country
    },
    location: hotel.location ? {
      latitude: hotel.location.latitude,
      longitude: hotel.location.longitude
    } : void 0,
    images: (hotel.hotelImages || []).map((img) => ({
      type: img.defaultImage ? "main" : "gallery",
      url: img.url,
      description: img.caption
    })),
    amenities: (hotel.hotelFacilities || []).map((facility) => ({
      name: facility
    })),
    description: hotel.hotelDescription ? {
      text: hotel.hotelDescription
    } : void 0
  };
}

export { getHotelDetails as g, searchHotels as s };
