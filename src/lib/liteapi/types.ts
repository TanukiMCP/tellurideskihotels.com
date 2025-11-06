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
  }>;
  amenities?: Array<{
    code?: string;
    name?: string;
  }>;
  description?: {
    text?: string;
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
  checkin?: string;
  checkout?: string;
  adults?: number;
  children?: number;
  total?: {
    amount?: number;
    currency?: string;
  };
  net?: {
    amount?: number;
    currency?: string;
  };
  board_type?: string;
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
  hotel_id: string;
  rate_id: string;
  checkin: string;
  checkout: string;
  adults: number;
  children?: number;
  guest_info?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  addons?: Array<{
    addon_id: string;
    quantity?: number;
  }>;
}

export interface LiteAPIPrebookResponse {
  prebook_id: string;
  hotel_id: string;
  rate_id: string;
  checkin: string;
  checkout: string;
  total?: {
    amount?: number;
    currency?: string;
  };
  expires_at?: string;
}

export interface LiteAPIConfirmRequest {
  prebook_id: string;
  payment?: {
    method: string;
    transaction_id?: string;
  };
}

export interface LiteAPIConfirmResponse {
  booking_id: string;
  confirmation_number?: string;
  status?: string;
  hotel_id?: string;
  checkin?: string;
  checkout?: string;
  total?: {
    amount?: number;
    currency?: string;
  };
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
  margin?: number;
}

export interface LiteAPIError {
  error?: {
    code?: string;
    message?: string;
  };
}

