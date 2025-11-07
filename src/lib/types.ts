export interface SearchParams {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  rooms?: number;
}

export interface SelectedRoom {
  rateId: string;
  roomId: string;
  roomName: string;
  offerId?: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  price: number;
  currency: string;
}

export interface SelectedAddon {
  addonId: string;
  name: string;
  quantity: number;
  price: number;
  currency: string;
  priceType: 'per_stay' | 'per_night' | 'per_person' | 'per_person_per_night';
}

export interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialRequests?: string;
}

export interface BookingData {
  hotelId: string;
  room: SelectedRoom;
  addons?: SelectedAddon[];
  guestInfo: GuestInfo;
  prebookId?: string;
  paymentIntentId?: string;
}

