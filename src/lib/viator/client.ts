/**
 * Viator API Client
 * Basic Access Affiliate API implementation
 * Documentation: https://docs.viator.com/partner-api/technical/
 */

import { VIATOR_CONFIG } from './config';
import type {
  ViatorSearchRequestBody,
  ViatorSearchResponse,
  ViatorDestinationsResponse,
  ViatorTagsResponse,
  ViatorErrorResponse,
  ViatorProduct,
  ViatorProductSummary,
  ViatorDestination,
  ViatorTag,
  ViatorDuration,
} from './types';

class ViatorAPIError extends Error {
  constructor(
    public status: number,
    public code?: string,
    message?: string
  ) {
    super(message || `Viator API error: ${status}`);
    this.name = 'ViatorAPIError';
  }
}

/**
 * Make authenticated request to Viator API
 * All requests require exp-api-key header per docs
 */
async function viatorRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${VIATOR_CONFIG.baseUrl}${endpoint}`;
  
  const headers = {
    'exp-api-key': VIATOR_CONFIG.apiKey,
    'Accept': 'application/json;version=2.0',
    'Accept-Language': 'en-US',
    'Content-Type': 'application/json;version=2.0',
    ...options.headers,
  };

  try {
    console.log(`[Viator API] ${options.method || 'GET'} ${endpoint}`);
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      let errorCode: string | undefined;
      
      try {
        const errorData: ViatorErrorResponse = await response.json();
        errorMessage = errorData.message || errorMessage;
        errorCode = errorData.code;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      
      throw new ViatorAPIError(response.status, errorCode, errorMessage);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof ViatorAPIError) {
      throw error;
    }
    console.error('[Viator API] Request failed:', error);
    throw new Error('Failed to communicate with Viator API');
  }
}

/**
 * Format duration object to display string
 */
export function formatDuration(duration?: ViatorDuration | null): string {
  if (!duration) {
    return 'Duration varies';
  }

  const {
    fixedDurationInMinutes,
    variableDurationFromMinutes,
    variableDurationToMinutes,
  } = duration;

  if (typeof fixedDurationInMinutes === 'number' && fixedDurationInMinutes > 0) {
    const hours = Math.floor(fixedDurationInMinutes / 60);
    const mins = fixedDurationInMinutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${mins} min`;
  }
  
  if (
    typeof variableDurationFromMinutes === 'number' &&
    typeof variableDurationToMinutes === 'number'
  ) {
    const fromHours = Math.floor(variableDurationFromMinutes / 60);
    const toHours = Math.floor(variableDurationToMinutes / 60);
    if (fromHours === toHours) {
      return `${fromHours} hour${fromHours > 1 ? 's' : ''}`;
    }
    return `${fromHours}-${toHours} hours`;
  }

  if (typeof variableDurationFromMinutes === 'number' && variableDurationFromMinutes > 0) {
    if (variableDurationFromMinutes >= 60) {
      const hours = Math.floor(variableDurationFromMinutes / 60);
      const mins = variableDurationFromMinutes % 60;
      if (mins > 0) {
        return `From ${hours}h ${mins}m`;
      }
      return `From ${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `From ${variableDurationFromMinutes} min`;
  }

  if (typeof variableDurationToMinutes === 'number' && variableDurationToMinutes > 0) {
    if (variableDurationToMinutes >= 60) {
      const hours = Math.floor(variableDurationToMinutes / 60);
      const mins = variableDurationToMinutes % 60;
      if (mins > 0) {
        return `Up to ${hours}h ${mins}m`;
      }
      return `Up to ${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `Up to ${variableDurationToMinutes} min`;
  }
  
  return 'Duration varies';
}

/**
 * Format price from pricing object
 */
export function formatPrice(pricing?: { summary: { fromPrice: number }; currency: string } | null): string {
  if (!pricing?.summary?.fromPrice) {
    return 'Price unavailable';
  }
  
  const { fromPrice } = pricing.summary;
  const { currency } = pricing;
  
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: fromPrice % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(fromPrice);
  
  return formatted;
}

/**
 * Search for products/activities
 * POST /products/search (per Basic Access documentation)
 */
export async function searchProducts(
  requestBody: Partial<ViatorSearchRequestBody>
): Promise<ViatorSearchResponse> {
  const endpoint = '/products/search';
  
  // Build request body per API spec
  const body: ViatorSearchRequestBody = {
    currency: requestBody.currency || VIATOR_CONFIG.defaults.currency,
    filtering: {
      destination: VIATOR_CONFIG.telluride.destinationId,
      ...requestBody.filtering,
    },
    pagination: requestBody.pagination || {
      start: 0,
      count: VIATOR_CONFIG.defaults.pageSize,
    },
  };
  
  // Add sorting if provided
  if (requestBody.sorting) {
    body.sorting = requestBody.sorting;
  }
  
  try {
    const response = await viatorRequest<ViatorSearchResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    return {
      products: response.products || [],
      totalCount: response.totalCount || 0,
    };
  } catch (error) {
    console.error('[Viator] Product search failed:', error);
    return {
      products: [],
      totalCount: 0,
    };
  }
}

/**
 * Get product details
 * GET /products/{product-code}
 * Returns product object directly (not wrapped in data)
 */
export async function getProductDetails(
  productCode: string,
  currencyCode: string = 'USD'
): Promise<ViatorProduct | null> {
  const endpoint = `/products/${productCode}?currencyCode=${currencyCode}`;
  
  try {
    const product = await viatorRequest<ViatorProduct>(endpoint);
    return product;
  } catch (error) {
    console.error(`[Viator] Failed to get product details for ${productCode}:`, error);
    return null;
  }
}

/**
 * Get all destinations
 * GET /destinations
 * Returns { destinations[], totalCount }
 */
export async function getDestinations(): Promise<ViatorDestination[]> {
  const endpoint = '/destinations';
  
  try {
    const response = await viatorRequest<ViatorDestinationsResponse>(endpoint);
    return response.destinations || [];
  } catch (error) {
    console.error('[Viator] Failed to get destinations:', error);
    return [];
  }
}

/**
 * Find Telluride destination ID
 * Returns cached ID from config, validates against API if needed
 */
export async function getTellurideDestinationId(): Promise<string | null> {
  try {
    // Use cached destination ID from config (26378)
    return VIATOR_CONFIG.telluride.destinationId;
  } catch (error) {
    console.error('[Viator] Failed to get Telluride destination:', error);
    return null;
  }
}

/**
 * Get all product tags with localized names
 * GET /products/tags
 */
export async function getProductTags(): Promise<ViatorTag[]> {
  const endpoint = '/products/tags';
  
  try {
    const response = await viatorRequest<ViatorTagsResponse>(endpoint);
    return response.tags || [];
  } catch (error) {
    console.error('[Viator] Failed to get product tags:', error);
    return [];
  }
}

/**
 * Search for Telluride activities
 */
export async function searchTellurideActivities(
  options: {
    text?: string;
    tags?: number[];
    flags?: string[];
    sorting?: ViatorSearchRequestBody['sorting'];
    pagination?: ViatorSearchRequestBody['pagination'];
    priceRange?: { min?: number; max?: number };
    dateRange?: { start?: string; end?: string };
  } = {}
): Promise<ViatorSearchResponse> {
  const requestBody: Partial<ViatorSearchRequestBody> = {
    filtering: {
      destination: VIATOR_CONFIG.telluride.destinationId,
      text: options.text,
      tags: options.tags,
      flags: options.flags,
      lowestPrice: options.priceRange?.min,
      highestPrice: options.priceRange?.max,
      startDate: options.dateRange?.start,
      endDate: options.dateRange?.end,
    },
    sorting: options.sorting,
    pagination: options.pagination,
  };
  
  return searchProducts(requestBody);
}

/**
 * Get featured activities for homepage
 */
export async function getFeaturedActivities(limit: number = 6): Promise<ViatorProductSummary[]> {
  const response = await searchTellurideActivities({
    pagination: {
      start: 0,
      count: limit,
    },
    sorting: {
      sort: 'DEFAULT',
    },
  });
  
  return response.products.slice(0, limit);
}

/**
 * Build Viator booking URL with affiliate tracking
 */
export function buildViatorBookingUrl(product: ViatorProductSummary | ViatorProduct): string {
  // Use productUrl from API response which includes affiliate tracking
    return product.productUrl;
}

