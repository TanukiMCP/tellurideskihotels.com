/**
 * Viator API Type Definitions
 * Based on Viator Partner API Basic Access documentation
 */

export interface ViatorImage {
  url: string;
  caption?: string;
  isCover?: boolean;
  variants?: {
    url: string;
    width: number;
    height: number;
  }[];
}

export interface ViatorPrice {
  price: number;
  currency: string;
  priceFormatted: string;
}

export interface ViatorReviews {
  totalReviews: number;
  combinedAverageRating: number;
}

export interface ViatorTag {
  tag: string;
  tagId: number;
}

export interface ViatorDestination {
  destinationId: number;
  destinationName: string;
  defaultCurrencyCode: string;
  lookupId: string;
  parentId?: number;
  timeZone: string;
  iataCode?: string;
}

export interface ViatorProduct {
  productCode: string;
  productTitle: string;
  productUrl: string;
  productUrlName: string;
  duration?: string;
  description?: string;
  shortDescription?: string;
  supplierName?: string;
  images: ViatorImage[];
  price: ViatorPrice;
  reviews?: ViatorReviews;
  tags?: ViatorTag[];
  flags?: string[];
  cancellationPolicy?: string;
  productOptions?: {
    productOptionCode: string;
    description: string;
    title: string;
  }[];
  destinationId?: number;
}

export interface ViatorSearchParams {
  destId?: number;
  searchTerm?: string;
  topX?: string;
  startDate?: string;
  endDate?: string;
  tags?: string;
  sortOrder?: 'PRICE_FROM_LOW' | 'PRICE_FROM_HIGH' | 'TOP_SELLERS' | 'REVIEW_AVG_RATING_D';
  currencyCode?: string;
  page?: number;
  pageSize?: number;
}

export interface ViatorSearchResponse {
  products: ViatorProduct[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ViatorProductDetailsResponse {
  product: ViatorProduct;
}

export interface ViatorDestinationsResponse {
  destinations: ViatorDestination[];
}

export interface ViatorErrorResponse {
  error: {
    message: string;
    code?: string;
  };
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
  sortBy?: ViatorSearchParams['sortOrder'];
}

