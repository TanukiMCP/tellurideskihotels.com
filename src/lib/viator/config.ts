/**
 * Viator API Configuration
 * For Basic Access Affiliate API
 */

export const VIATOR_CONFIG = {
  baseUrl: import.meta.env.VIATOR_BASE_URL || 'https://api.viator.com/partner',
  apiKey: import.meta.env.VIATOR_API_KEY || '',
  
  // Telluride destination ID (will be determined from API)
  // Using search by location name initially
  destination: {
    city: 'Telluride',
    state: 'Colorado',
    country: 'United States',
  },
  
  // Default search parameters
  defaults: {
    currencyCode: 'USD',
    pageSize: 20,
    sortOrder: 'TOP_SELLERS' as const,
  },
  
  // Activity categories mapped to Viator tags
  categoryTags: {
    winter: ['Winter Sports', 'Skiing', 'Snowboarding', 'Snow'],
    summer: ['Hiking', 'Mountain Biking', 'Nature', 'Outdoor'],
    adventure: ['Adventure', 'Extreme Sports', 'Adrenaline'],
    family: ['Family Friendly', 'Kids', 'Children'],
    tours: ['Tours', 'Sightseeing', 'Cultural'],
    experiences: ['Food & Wine', 'Nightlife', 'Entertainment'],
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

