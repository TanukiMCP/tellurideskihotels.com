import { HotelCard } from './HotelCard';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { format, addDays } from 'date-fns';

interface FeaturedHotelsProps {
  limit?: number;
  initialHotels: LiteAPIHotel[];
}

export function FeaturedHotels({ initialHotels }: FeaturedHotelsProps) {
  const hotels = initialHotels;

  const handleHotelSelect = (hotelId: string) => {
    if (typeof window !== 'undefined') {
      // Generate default dates (7 days from now for check-in, 14 days for check-out)
      const checkIn = format(addDays(new Date(), 7), 'yyyy-MM-dd');
      const checkOut = format(addDays(new Date(), 14), 'yyyy-MM-dd');
      const adults = 2;
      
      window.location.href = `/lodging/${hotelId}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}`;
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
            currency="USD"
            onSelect={handleHotelSelect}
          />
      ))}
    </div>
  );
}

