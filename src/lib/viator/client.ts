/**
 * Viator API Client
 * Basic Access Affiliate API implementation
 * Documentation: https://docs.viator.com/partner-api/technical/
 */

import { VIATOR_CONFIG } from './config';
import type {
  ViatorSearchParams,
  ViatorSearchResponse,
  ViatorProductDetailsResponse,
  ViatorDestinationsResponse,
  ViatorErrorResponse,
  ViatorProduct,
  ViatorDestination,
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
 */
async function viatorRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${VIATOR_CONFIG.baseUrl}${endpoint}`;
  
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'exp-api-key': VIATOR_CONFIG.apiKey,
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
        errorMessage = errorData.error?.message || errorMessage;
        errorCode = errorData.error?.code;
      } catch {
        // If error response is not JSON, use status text
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
 * Search for products/activities
 * GET /products/search
 */
export async function searchProducts(
  params: ViatorSearchParams = {}
): Promise<ViatorSearchResponse> {
  const queryParams = new URLSearchParams();
  
  // Add search parameters
  if (params.destId) queryParams.append('destId', params.destId.toString());
  if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
  if (params.topX) queryParams.append('topX', params.topX);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.tags) queryParams.append('tags', params.tags);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
  
  // Default parameters
  queryParams.append('currencyCode', params.currencyCode || VIATOR_CONFIG.defaults.currencyCode);
  queryParams.append('page', (params.page || 1).toString());
  queryParams.append('pageSize', (params.pageSize || VIATOR_CONFIG.defaults.pageSize).toString());

  const endpoint = `/products/search?${queryParams.toString()}`;
  
  try {
    const response = await viatorRequest<{ data: ViatorProduct[]; totalCount: number }>(endpoint);
    
    return {
      products: response.data || [],
      totalCount: response.totalCount || 0,
      page: params.page || 1,
      pageSize: params.pageSize || VIATOR_CONFIG.defaults.pageSize,
    };
  } catch (error) {
    console.error('[Viator] Product search failed:', error);
    // Return empty results on error to prevent page breakage
    return {
      products: [],
      totalCount: 0,
      page: params.page || 1,
      pageSize: params.pageSize || VIATOR_CONFIG.defaults.pageSize,
    };
  }
}

/**
 * Get product details
 * GET /products/{productCode}
 */
export async function getProductDetails(
  productCode: string,
  currencyCode: string = 'USD'
): Promise<ViatorProduct | null> {
  const endpoint = `/products/${productCode}?currencyCode=${currencyCode}`;
  
  try {
    const response = await viatorRequest<{ data: ViatorProduct }>(endpoint);
    return response.data || null;
  } catch (error) {
    console.error(`[Viator] Failed to get product details for ${productCode}:`, error);
    return null;
  }
}

/**
 * Get all destinations
 * GET /v1/taxonomy/destinations
 */
export async function getDestinations(): Promise<ViatorDestination[]> {
  const endpoint = '/v1/taxonomy/destinations';
  
  try {
    const response = await viatorRequest<{ data: ViatorDestination[] }>(endpoint);
    return response.data || [];
  } catch (error) {
    console.error('[Viator] Failed to get destinations:', error);
    return [];
  }
}

/**
 * Find Telluride destination ID
 */
export async function getTellurideDestinationId(): Promise<number | null> {
  try {
    const destinations = await getDestinations();
    
    // Search for Telluride in destinations
    const telluride = destinations.find(d => 
      d.destinationName.toLowerCase().includes('telluride')
    );
    
    if (telluride) {
      console.log('[Viator] Found Telluride destination:', telluride);
      return telluride.destinationId;
    }
    
    // If not found, search for Colorado destinations
    const colorado = destinations.find(d => 
      d.destinationName.toLowerCase().includes('colorado')
    );
    
    if (colorado) {
      console.log('[Viator] Using Colorado destination as fallback:', colorado);
      return colorado.destinationId;
    }
    
    return null;
  } catch (error) {
    console.error('[Viator] Failed to find Telluride destination:', error);
    return null;
  }
}

/**
 * Search for Telluride activities
 */
export async function searchTellurideActivities(
  params: Omit<ViatorSearchParams, 'destId'> = {}
): Promise<ViatorSearchResponse> {
  // First try with destination search
  const searchTerm = params.searchTerm || 'Telluride Colorado';
  
  return searchProducts({
    ...params,
    searchTerm,
    sortOrder: params.sortOrder || 'TOP_SELLERS',
  });
}

/**
 * Get featured activities for homepage
 */
export async function getFeaturedActivities(limit: number = 6): Promise<ViatorProduct[]> {
  const response = await searchTellurideActivities({
    pageSize: limit,
    sortOrder: 'TOP_SELLERS',
  });
  
  return response.products.slice(0, limit);
}

/**
 * Build Viator booking URL with affiliate tracking
 */
export function buildViatorBookingUrl(product: ViatorProduct): string {
  // Use productUrl from API response which includes affiliate tracking
  if (product.productUrl) {
    return product.productUrl;
  }
  
  // Fallback: construct URL
  const baseUrl = 'https://www.viator.com';
  const urlName = product.productUrlName || product.productCode;
  return `${baseUrl}/tours/${urlName}/${product.productCode}`;
}

