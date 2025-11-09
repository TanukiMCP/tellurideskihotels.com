/**
 * Viator API Configuration
 * For Basic Access Affiliate API
 * https://docs.viator.com/partner-api/technical/
 */

export const VIATOR_CONFIG = {
  baseUrl: import.meta.env.VIATOR_BASE_URL || 'https://api.viator.com/partner',
  apiKey: import.meta.env.VIATOR_API_KEY || '',
  
  // Telluride destination ID from /destinations API
  // destinationId: 26378, name: "Telluride", type: "CITY", parentDestinationId: 273 (Colorado)
  telluride: {
    destinationId: '26378',
    name: 'Telluride',
    state: 'Colorado',
    country: 'United States',
  },
  
  // Default search parameters
  defaults: {
    currency: 'USD',
    pageSize: 20,
    sort: 'DEFAULT' as const,
  },
  
  // Valid sort options per API spec
  sortOptions: {
    DEFAULT: 'DEFAULT',
    PRICE_LOW: 'PRICE',
    PRICE_HIGH: 'PRICE',
    RATING: 'TRAVELER_RATING',
    DURATION: 'ITINERARY_DURATION',
    NEWEST: 'DATE_ADDED',
  } as const,
  
  // Activity category search terms
  categorySearchTerms: {
    winter: 'skiing snowboarding winter sports',
    summer: 'hiking biking outdoor summer',
    adventure: 'adventure climbing rafting',
    family: 'family friendly kids',
    tours: 'tours sightseeing guided',
    experiences: 'food wine cultural',
  },
} as const;

// Validate configuration
export function validateViatorConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!VIATOR_CONFIG.apiKey) {
    errors.push('VIATOR_API_KEY environment variable is not set');
  }
  
  if (!VIATOR_CONFIG.baseUrl) {
    errors.push('VIATOR_BASE_URL environment variable is not set');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

