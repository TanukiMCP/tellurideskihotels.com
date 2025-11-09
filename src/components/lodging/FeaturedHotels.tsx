import { HotelCard } from './HotelCard';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { format, addDays } from 'date-fns';

interface FeaturedHotelsProps {
  limit?: number;
  initialHotels: LiteAPIHotel[];
  minPrices?: Record<string, number>;
  currency?: string;
  checkInDate?: string;
}

export function FeaturedHotels({ 
  initialHotels, 
  minPrices = {},
  currency = 'USD',
  checkInDate
}: FeaturedHotelsProps) {
  const hotels = initialHotels;

  const handleHotelSelect = (hotelId: string) => {
    if (typeof window !== 'undefined') {
      // Use the SAME dates that were used to fetch these featured hotels
      // This ensures availability matches what was shown
      const checkIn = checkInDate || format(addDays(new Date(), 7), 'yyyy-MM-dd');
      const checkOut = format(addDays(new Date(checkIn), 7), 'yyyy-MM-dd');
      const adults = 2;
      const rooms = 1;
      
      window.location.href = `/places-to-stay/${hotelId}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&rooms=${rooms}`;
  }
  };

  if (!hotels || hotels.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {hotels.map((hotel) => (
          <HotelCard
          key={hotel.hotel_id}
            hotel={hotel}
            minPrice={minPrices[hotel.hotel_id]}
            currency={currency}
            checkInDate={checkInDate}
            onSelect={handleHotelSelect}
          />
      ))}
    </div>
  );
}

