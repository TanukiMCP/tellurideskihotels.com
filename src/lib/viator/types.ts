/**
 * Viator API Type Definitions
 * Based on Viator Partner API Basic Access documentation
 * https://docs.viator.com/partner-api/technical/
 */

export interface ViatorImageVariant {
  height: number;
  width: number;
  url: string;
}

export interface ViatorImage {
  imageSource: string;
  caption: string;
  isCover: boolean;
  variants: ViatorImageVariant[];
}

export interface ViatorReviewSource {
  provider: string;
  totalCount: number;
  averageRating: number;
}

export interface ViatorReviews {
  sources: ViatorReviewSource[];
  totalReviews: number;
  combinedAverageRating: number;
}

export interface ViatorDuration {
  fixedDurationInMinutes?: number;
  variableDurationFromMinutes?: number;
  variableDurationToMinutes?: number;
}

export interface ViatorPricingSummary {
  fromPrice: number;
  fromPriceBeforeDiscount?: number;
}

export interface ViatorPricing {
  summary: ViatorPricingSummary;
  currency: string;
}

export interface ViatorDestinationRef {
  ref: string;
  primary: boolean;
}

export interface ViatorTranslationInfo {
  containsMachineTranslatedText: boolean;
  translationSource: string;
}

/**
 * Product summary returned from /products/search
 */
export interface ViatorProductSummary {
  productCode: string;
  title: string;
  description: string;
  images: ViatorImage[];
  reviews: ViatorReviews;
  duration?: ViatorDuration | null;
  confirmationType: string;
  itineraryType: string;
  pricing: ViatorPricing;
  productUrl: string;
  destinations: ViatorDestinationRef[];
  tags: number[];
  flags: string[];
  translationInfo: ViatorTranslationInfo;
}

/**
 * Full product details from /products/{product-code}
 */
export interface ViatorProduct extends ViatorProductSummary {
  status?: string;
  language?: string;
  createdAt?: string;
  lastUpdatedAt?: string;
  shortDescription?: string;
  supplierName?: string;
  supplier?: {
    name: string;
    reference: string;
  };
  cancellationPolicy?: {
    type: string;
    description: string;
    cancelIfBadWeather?: boolean;
    cancelIfInsufficientTravelers?: boolean;
  };
  productOptions?: {
    productOptionCode: string;
    description: string;
    title: string;
  }[];
}

/**
 * Destination from /destinations
 */
export interface ViatorDestination {
  destinationId: number;
  name: string;
  type: string;
  parentDestinationId?: number;
  lookupId: string;
  destinationUrl?: string;
  defaultCurrencyCode: string;
  timeZone: string;
  iataCodes?: string[];
  countryCallingCode?: string;
  languages?: string[];
  center?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Tag from /products/tags
 */
export interface ViatorTag {
  tagId: number;
  parentTagIds?: number[];
  allNamesByLocale: {
    en: string;
    [locale: string]: string;
  };
}

/**
 * Search request body for POST /products/search
 */
export interface ViatorSearchRequestBody {
  currency: string;
  filtering: {
    destination: string;
    text?: string;
    tags?: number[];
    flags?: string[];
    lowestPrice?: number;
    highestPrice?: number;
    startDate?: string;
    endDate?: string;
    confirmationType?: string;
    rating?: {
      min?: number;
      max?: number;
    };
    durationInMinutes?: {
      from?: number;
      to?: number;
    };
    includeAutomaticTranslations?: boolean;
    attractionId?: number;
  };
  sorting?: {
    sort: 'DEFAULT' | 'PRICE' | 'TRAVELER_RATING' | 'ITINERARY_DURATION' | 'DATE_ADDED';
    order?: 'ASCENDING' | 'DESCENDING';
  };
  pagination: {
    start: number;
    count: number;
  };
}

/**
 * Search response from POST /products/search
 */
export interface ViatorSearchResponse {
  products: ViatorProductSummary[];
  totalCount: number;
}

/**
 * Destinations response from GET /destinations
 */
export interface ViatorDestinationsResponse {
  destinations: ViatorDestination[];
  totalCount: number;
}

/**
 * Tags response from GET /products/tags
 */
export interface ViatorTagsResponse {
  tags: ViatorTag[];
}

export interface ViatorErrorResponse {
  code: string;
  message: string;
  timestamp?: string;
  trackingId?: string;
}

// Telluride-specific activity categories
export type ActivityCategory = 
  | 'all'
  | 'winter'
  | 'summer'
  | 'adventure'
  | 'family'
  | 'tours'
  | 'experiences';

export interface ActivityFilter {
  category: ActivityCategory;
  minPrice?: number;
  maxPrice?: number;
  duration?: string;
  sortBy?: ViatorSearchRequestBody['sorting'];
}

