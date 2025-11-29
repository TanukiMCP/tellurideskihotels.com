/**
 * Hotel Pricing Data System (Client-Side Compatible)
 * 
 * Provides fallback/typical price ranges for hotels when live rates are unavailable.
 * This ensures prices are ALWAYS displayed in the UI, improving user experience.
 * 
 * Works on both server-side (Node.js) and client-side (browser) environments.
 */

export interface HotelPricingData {
  hotelId: string;
  name: string;
  typicalMinPrice: number;
  typicalMaxPrice: number;
  priceRange: 'under-200' | '200-400' | '400-700' | '700-plus';
  notes?: string;
}

export interface PriceRangeCategory {
  min: number;
  max: number | null;
  description: string;
}

export interface HotelPricingFile {
  hotels: Record<string, Omit<HotelPricingData, 'hotelId'>>;
  priceRangeCategories: Record<string, PriceRangeCategory>;
}

let pricingCache: HotelPricingFile | null = null;
let pricingLoadPromise: Promise<HotelPricingFile> | null = null;

/**
 * Load pricing data from API endpoint (client-side) or JSON file (server-side)
 */
async function loadPricingData(): Promise<HotelPricingFile> {
  if (pricingCache) {
    return pricingCache;
  }

  // If already loading, wait for that promise
  if (pricingLoadPromise) {
    return pricingLoadPromise;
  }

  pricingLoadPromise = (async () => {
    try {
      // Try API endpoint first (works on client-side)
      if (typeof window !== 'undefined' || typeof fetch !== 'undefined') {
        const response = await fetch('/api/hotels/pricing');
        if (response.ok) {
          const data = await response.json();
          pricingCache = data;
          return pricingCache!;
        }
      }

      // Fallback to file system (server-side only)
      if (typeof require !== 'undefined') {
        const { readFileSync } = require('fs');
        const { join } = require('path');
        const pricingPath = join(process.cwd(), 'src', 'data', 'hotel-price-ranges.json');
        const pricingContent = readFileSync(pricingPath, 'utf-8');
        pricingCache = JSON.parse(pricingContent);
        return pricingCache!;
      }

      // No way to load - return empty
      return { hotels: {}, priceRangeCategories: {} };
    } catch (error) {
      console.error('[Hotel Pricing] Error loading pricing data:', error);
      return { hotels: {}, priceRangeCategories: {} };
    } finally {
      pricingLoadPromise = null;
    }
  })();

  return pricingLoadPromise;
}

/**
 * Get pricing data for a specific hotel ID
 */
export async function getHotelPricing(hotelId: string): Promise<HotelPricingData | null> {
  const data = await loadPricingData();
  const hotelData = data.hotels[hotelId];
  
  if (!hotelData) {
    return null;
  }

  return {
    hotelId,
    ...hotelData,
  };
}

/**
 * Get typical minimum price for a hotel (fallback when live rates unavailable)
 */
export async function getTypicalMinPrice(hotelId: string): Promise<number | null> {
  const pricing = await getHotelPricing(hotelId);
  return pricing?.typicalMinPrice ?? null;
}

/**
 * Get typical maximum price for a hotel
 */
export async function getTypicalMaxPrice(hotelId: string): Promise<number | null> {
  const pricing = await getHotelPricing(hotelId);
  return pricing?.typicalMaxPrice ?? null;
}

/**
 * Get typical average price (midpoint) for a hotel
 */
export async function getTypicalAveragePrice(hotelId: string): Promise<number | null> {
  const pricing = await getHotelPricing(hotelId);
  if (!pricing) return null;
  
  return Math.round((pricing.typicalMinPrice + pricing.typicalMaxPrice) / 2);
}

/**
 * Check if a hotel falls within a price range category
 */
export async function hotelInPriceRange(
  hotelId: string,
  minPrice?: number,
  maxPrice?: number
): Promise<boolean> {
  const pricing = await getHotelPricing(hotelId);
  if (!pricing) return false;

  // If no price filters specified, always include
  if (minPrice === undefined && maxPrice === undefined) {
    return true;
  }

  const hotelMin = pricing.typicalMinPrice;
  const hotelMax = pricing.typicalMaxPrice;

  // Check if hotel's typical range overlaps with filter range
  if (minPrice !== undefined && hotelMax < minPrice) {
    return false; // Hotel's max is below filter min
  }

  if (maxPrice !== undefined && hotelMin > maxPrice) {
    return false; // Hotel's min is above filter max
  }

  return true; // Overlaps with filter range
}

/**
 * Get all hotels in a specific price range category
 */
export async function getHotelsInPriceRange(
  priceRange: 'under-200' | '200-400' | '400-700' | '700-plus'
): Promise<HotelPricingData[]> {
  const data = await loadPricingData();
  const hotels: HotelPricingData[] = [];

  for (const [hotelId, hotelData] of Object.entries(data.hotels)) {
    if (hotelData.priceRange === priceRange) {
      hotels.push({
        hotelId,
        ...hotelData,
      });
    }
  }

  return hotels;
}

/**
 * Get all pricing data for multiple hotel IDs
 */
export async function getMultipleHotelPricing(hotelIds: string[]): Promise<Map<string, HotelPricingData>> {
  const pricingMap = new Map<string, HotelPricingData>();
  const data = await loadPricingData();

  for (const hotelId of hotelIds) {
    const hotelData = data.hotels[hotelId];
    if (hotelData) {
      pricingMap.set(hotelId, {
        hotelId,
        ...hotelData,
      });
    }
  }

  return pricingMap;
}

/**
 * Synchronous version for use in server-side code (Node.js only)
 * Returns cached data or null if not loaded yet
 */
export function getHotelPricingSync(hotelId: string): HotelPricingData | null {
  if (!pricingCache) return null;
  const hotelData = pricingCache.hotels[hotelId];
  if (!hotelData) return null;
  return { hotelId, ...hotelData };
}

/**
 * Synchronous version - get typical average price from cache
 */
export function getTypicalAveragePriceSync(hotelId: string): number | null {
  const pricing = getHotelPricingSync(hotelId);
  if (!pricing) return null;
  return Math.round((pricing.typicalMinPrice + pricing.typicalMaxPrice) / 2);
}

/**
 * Synchronous version - check price range from cache
 */
export function hotelInPriceRangeSync(
  hotelId: string,
  minPrice?: number,
  maxPrice?: number
): boolean {
  const pricing = getHotelPricingSync(hotelId);
  if (!pricing) return false;

  if (minPrice === undefined && maxPrice === undefined) {
    return true;
  }

  const hotelMin = pricing.typicalMinPrice;
  const hotelMax = pricing.typicalMaxPrice;

  if (minPrice !== undefined && hotelMax < minPrice) {
    return false;
  }

  if (maxPrice !== undefined && hotelMin > maxPrice) {
    return false;
  }

  return true;
}

