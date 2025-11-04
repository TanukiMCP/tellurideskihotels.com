import type { LiteAPIHotel } from './types';

export function getHotelImage(hotel: LiteAPIHotel, index: number = 0): string | null {
  if (!hotel.images || hotel.images.length === 0) {
    return null;
  }
  return hotel.images[index]?.url || null;
}

export function getHotelMainImage(hotel: LiteAPIHotel): string | null {
  const mainImage = hotel.images?.find(img => img.type === 'main' || img.type === 'featured');
  return mainImage?.url || getHotelImage(hotel, 0);
}

export function formatHotelAddress(hotel: LiteAPIHotel): string {
  const addr = hotel.address;
  if (!addr) return '';
  
  const parts: string[] = [];
  if (addr.line1) parts.push(addr.line1);
  if (addr.city) parts.push(addr.city);
  if (addr.state) parts.push(addr.state);
  if (addr.postal_code) parts.push(addr.postal_code);
  
  return parts.join(', ');
}

export function getHotelRatingColor(rating?: number): string {
  if (!rating) return 'text-gray-500';
  if (rating >= 9) return 'text-green-600';
  if (rating >= 8) return 'text-turquoise-600';
  if (rating >= 7) return 'text-blue-600';
  if (rating >= 6) return 'text-yellow-600';
  return 'text-red-600';
}

