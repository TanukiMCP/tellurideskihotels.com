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
    console.log('[FeaturedHotels] handleHotelSelect called with hotelId:', hotelId);
    console.log('[FeaturedHotels] checkInDate prop:', checkInDate);
    
    // Use the SAME dates that were used to fetch these featured hotels
    // This ensures availability matches what was shown
    // Default: 7 days from now, 7 day stay
    const checkIn = checkInDate || format(addDays(new Date(), 7), 'yyyy-MM-dd');
    const checkOut = format(addDays(new Date(checkIn), 7), 'yyyy-MM-dd');
    const adults = 2;
    const rooms = 1;
    
    const url = `/places-to-stay/${hotelId}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&rooms=${rooms}`;
    
    console.log('[FeaturedHotels] Navigating to:', url);
    console.log('[FeaturedHotels] Dates:', { checkIn, checkOut, adults, rooms });
    
    if (typeof window !== 'undefined') {
      window.location.href = url;
    } else {
      console.error('[FeaturedHotels] window is not available');
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

