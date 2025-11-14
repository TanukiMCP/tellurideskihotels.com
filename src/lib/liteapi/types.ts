export interface LiteAPIHotel {
  hotel_id: string;
  name: string;
  star_rating?: number;
  review_score?: number;
  review_count?: number;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  location?: {
    latitude?: number;
    longitude?: number;
  };
  images?: Array<{
    type?: string;
    url?: string;
    description?: string;
    order?: number;
    defaultImage?: boolean;
  }>;
  amenities?: Array<{
    code?: string;
    name?: string;
  }>;
  description?: {
    text?: string;
  };
  rooms?: Array<{
    id: number;
    name: string;
    description?: string;
    photos: string[];
  }>;
  // Additional fields from API that we should include
  hotelImportantInformation?: string;
  checkinCheckoutTimes?: {
    checkin?: string;
    checkout?: string;
    checkinStart?: string;
  };
}

export interface LiteAPIRoom {
  room_id: string;
  name: string;
  description?: string;
  max_occupancy?: number;
  bed_types?: Array<{
    type?: string;
    count?: number;
  }>;
  amenities?: Array<{
    code?: string;
    name?: string;
  }>;
  images?: Array<{
    url?: string;
  }>;
}

export interface LiteAPIRate {
  rate_id: string;
  room_id: string;
  room_name: string;
  room_description?: string;
  offer_id?: string;
  mapped_room_id?: number; // Links to room.id in hotel details
  checkin?: string;
  checkout?: string;
  adults?: number;
  children?: number;
  // CUSTOMER PRICING (retailRate.total from LiteAPI)
  // What customer pays - commission already included via margin parameter
  total?: {
    amount?: number; // Retail total for entire stay (e.g., $1,283 for 2 nights)
    currency?: string;
  };
  net?: {
    amount?: number; // Retail price per night (e.g., $641/night)
    currency?: string;
  };
  // REFERENCE PRICING (optional - for showing savings)
  // SSP is typically higher than retail - can show "Compare at $X"
  suggested_selling_price?: {
    per_night: number; // SSP per night (e.g., $702/night)
    total: number;      // SSP total (e.g., $1,404 for 2 nights)
    currency: string;
  };
  // Tax and fee breakdown
  taxes_and_fees?: {
    included: number; // Already in price
    excluded: number; // Pay at property
    details: Array<{
      included: boolean;
      description: string;
      amount: number;
      currency: string;
    }>;
  };
  board_type?: string; // "Room Only", "Breakfast Included", etc.
  board_code?: string; // "RO", "BB", "BI", etc.
  cancellation_policy?: any;
  cancellation_policies?: Array<{
    type?: string;
    description?: string;
    penalty?: {
      amount?: number;
      currency?: string;
    };
  }>;
  amenities?: Array<{
    code?: string;
    name?: string;
  }>;
  bed_types?: Array<{
    type?: string;
    count?: number;
  }>;
  max_occupancy?: number;
  supplier_cost?: number;
}

export interface LiteAPIAddon {
  addon_id: string;
  name: string;
  description?: string;
  price?: {
    amount?: number;
    currency?: string;
    type?: 'per_stay' | 'per_night' | 'per_person' | 'per_person_per_night';
  };
  category?: string;
  required?: boolean;
}

export interface LiteAPIPrebookRequest {
  offerId: string;
  usePaymentSdk?: boolean;
}

export interface LiteAPIPrebookResponse {
  prebookId: string;
  hotelId: string;
  rateId: string;
  checkin: string;
  checkout: string;
  total: number;
  currency: string;
  expiresAt: string;
  secretKey?: string;
  transactionId?: string;
}

export interface LiteAPIConfirmRequest {
  prebookId: string;
  holder: {
    firstName: string;
    lastName: string;
    email: string;
  };
  payment: {
    method: 'TRANSACTION_ID' | 'ACC_CREDIT_CARD' | 'WALLET' | 'CREDIT';
    transactionId?: string;
  };
}

export interface LiteAPIConfirmResponse {
  bookingId: string;
  confirmationNumber: string;
  status: string;
  hotelId: string;
  checkin: string;
  checkout: string;
  total: number;
  currency: string;
}

export interface LiteAPIHotelSearchParams {
  cityName?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  limit?: number;
  offset?: number;
}

export interface LiteAPIRateSearchParams {
  hotelIds: string | string[];
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  rooms?: number;
  margin?: number;
}

export interface LiteAPIError {
  error?: {
    code?: string;
    message?: string;
  };
}

