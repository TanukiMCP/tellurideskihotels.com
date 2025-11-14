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
  });
  
  // For Telluride searches, also search Mountain Village (connected by gondola)
  const shouldIncludeMountainVillage = params.cityName?.toLowerCase() === 'telluride';
  
  let allHotelsData: any[] = [];
  
  // Search Telluride - no limit, get all results
  const searchParams = new URLSearchParams();
  if (params.cityName) searchParams.append('cityName', params.cityName);
  if (params.countryCode) searchParams.append('countryCode', params.countryCode);
  if (params.latitude) searchParams.append('latitude', params.latitude.toString());
  if (params.longitude) searchParams.append('longitude', params.longitude.toString());
  if (params.radius) searchParams.append('radius', params.radius.toString());
  // Don't set limit or offset - let API return all results

  const queryString = searchParams.toString();
  const endpoint = `/data/hotels${queryString ? `?${queryString}` : ''}`;

  const tellurideResponse = await liteAPIClient<any>(endpoint);
  const tellurideHotels = Array.isArray(tellurideResponse.data) ? tellurideResponse.data : [];
  allHotelsData.push(...tellurideHotels);
  
  console.log('[LiteAPI Hotels] Telluride search returned:', {
    count: tellurideHotels.length,
    sampleIds: tellurideHotels.slice(0, 3).map((h: any) => h.id),
  });
  
  // Also search Mountain Village if this is a Telluride search
  if (shouldIncludeMountainVillage && params.countryCode) {
    try {
      const mvSearchParams = new URLSearchParams();
      mvSearchParams.append('cityName', 'Mountain Village');
      mvSearchParams.append('countryCode', params.countryCode);
      // No limit - get all Mountain Village hotels too
      
      const mvEndpoint = `/data/hotels?${mvSearchParams.toString()}`;
      const mvResponse = await liteAPIClient<any>(mvEndpoint);
      const mvHotels = Array.isArray(mvResponse.data) ? mvResponse.data : [];
      
      console.log('[LiteAPI Hotels] Mountain Village search returned:', {
        count: mvHotels.length,
        sampleIds: mvHotels.slice(0, 3).map((h: any) => h.id),
      });
      
      allHotelsData.push(...mvHotels);
    } catch (error) {
      console.warn('[LiteAPI Hotels] Mountain Village search failed:', error);
      // Continue with just Telluride results
    }
  }
  
  console.log('[LiteAPI Hotels] Combined search returned hotels:', {
    count: allHotelsData.length,
    telluride: tellurideHotels.length,
    mountainVillage: allHotelsData.length - tellurideHotels.length,
  });
  
  // Remove duplicates (same hotel ID might appear in both searches)
  const uniqueHotelsMap = new Map();
  allHotelsData.forEach(hotel => {
    if (hotel.id && !uniqueHotelsMap.has(hotel.id)) {
      uniqueHotelsMap.set(hotel.id, hotel);
    }
  });
  const hotelsData = Array.from(uniqueHotelsMap.values());
  
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
    total: nearbyHotels.length,
  };
}

export async function getHotelDetails(hotelId: string): Promise<LiteAPIHotel> {
  const endpoint = `/data/hotel?hotelId=${hotelId}`;
  const response = await liteAPIClient<any>(endpoint);
  
  // LiteAPI returns data nested in response.data
  const hotel = response.data || response;
  
  console.log('[LiteAPI Hotels] Hotel details received:', {
    hotelId: hotel.id,
    name: hotel.name,
    imagesCount: hotel.hotelImages?.length || 0,
    roomsCount: hotel.rooms?.length || 0,
    sampleImage: hotel.hotelImages?.[0] ? {
      url: hotel.hotelImages[0].url,
      urlHd: hotel.hotelImages[0].urlHd,
      defaultImage: hotel.hotelImages[0].defaultImage,
    } : null,
  });
  
  // Transform hotelImages correctly per docs: url, urlHd, caption, order, defaultImage
  // Prefer urlHd (HD quality) over url (standard quality)
  const hotelImages = (hotel.hotelImages || [])
    .map((img: any) => {
      // Use HD URL if available, otherwise fallback to standard URL
      const imageUrl = img.urlHd || img.url || '';
      return {
        type: img.defaultImage ? 'main' : 'gallery',
        url: imageUrl,
        description: img.caption || '',
        order: img.order || 0,
        defaultImage: img.defaultImage || false,
      };
    })
    .filter((img: any) => img.url && img.url.trim() !== '')
    // Sort by: defaultImage first, then by order
    .sort((a: any, b: any) => {
      if (a.defaultImage && !b.defaultImage) return -1;
      if (!a.defaultImage && b.defaultImage) return 1;
      return a.order - b.order;
    });
  
  console.log('[LiteAPI Hotels] Processed hotel images:', {
    count: hotelImages.length,
    firstUrl: hotelImages[0]?.url,
    allUrls: hotelImages.slice(0, 3).map((img: any) => img.url),
    hasDefaultImage: hotelImages.some((img: any) => img.defaultImage),
    urlSources: hotel.hotelImages?.slice(0, 3).map((img: any) => ({
      hasUrl: !!img.url,
      hasUrlHd: !!img.urlHd,
      url: img.url,
      urlHd: img.urlHd,
    })),
  });
  
  // Transform rooms with correct photo URLs
  // CRITICAL: LiteAPI returns room.roomName not room.name (per docs)
  // Per docs: use photo.url field, fallback to failoverPhoto
  const rooms = (hotel.rooms || []).map((room: any) => {
    const roomPhotos = (room.photos || [])
      .map((photo: any) => photo.url || photo.failoverPhoto) // Use url field per docs, fallback to failoverPhoto
      .filter((url: string) => url && url.trim() !== '');
    
    return {
      id: room.id,
      name: room.roomName || 'Room', // roomName from API, not name
      description: room.description || '',
      photos: roomPhotos,
    };
  });
  
  console.log('[LiteAPI Hotels] Processed rooms:', {
    count: rooms.length,
    sampleRoom: rooms[0] ? {
      id: rooms[0].id,
      name: rooms[0].name,
      photosCount: rooms[0].photos.length,
      firstPhoto: rooms[0].photos[0],
    } : null,
    totalPhotosAcrossAllRooms: rooms.reduce((sum: number, room: any) => sum + room.photos.length, 0),
  });
  
  // Transform API response to match our types - per LiteAPI docs
  return {
    hotel_id: hotel.id || hotelId,
    name: hotel.name,
    star_rating: hotel.starRating, // Hotel classification (1-5 stars based on amenities)
    review_score: hotel.rating,  // Guest rating (0-10 scale from reviews)
    review_count: hotel.reviewCount,
    address: {
      line1: hotel.address,  // Full address as single string
      city: hotel.city,
      state: hotel.state,
      postal_code: hotel.zip,
      country: hotel.country,
    },
    location: hotel.location ? {
      latitude: hotel.location.latitude,
      longitude: hotel.location.longitude,
    } : undefined,
    images: hotelImages,
    amenities: (hotel.hotelFacilities || []).map((facility: string) => ({
      name: facility,
    })),
    description: hotel.hotelDescription ? {
      text: hotel.hotelDescription,
    } : undefined,
    rooms: rooms,
    // Additional fields per docs
    hotelImportantInformation: hotel.hotelImportantInformation,
    checkinCheckoutTimes: hotel.checkinCheckoutTimes ? {
      checkin: hotel.checkinCheckoutTimes.checkin,
      checkout: hotel.checkinCheckoutTimes.checkout,
      checkinStart: hotel.checkinCheckoutTimes.checkinStart,
    } : undefined,
  };
}

