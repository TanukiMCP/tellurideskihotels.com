import { useEffect, useState } from 'react';
import { HotelCard } from './HotelCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { FEATURED_HOTEL_IDS } from '@/lib/constants';
import { format, addDays } from 'date-fns';

interface FeaturedHotelsProps {
  limit?: number;
}

export function FeaturedHotels({ limit = 6 }: FeaturedHotelsProps) {
  const [hotels, setHotels] = useState<LiteAPIHotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeaturedHotels() {
      try {
        setLoading(true);
        
        // Fetch specific featured hotels by ID using the search endpoint
        // which already has all the hotels loaded
        const { searchHotels } = await import('@/lib/liteapi/hotels');
        const hotelData = await searchHotels({
          cityName: 'Telluride',
          countryCode: 'US',
          limit: 100,
        });
        
        const allHotels = hotelData.data || [];
        
        // Filter to only featured hotel IDs
        const featuredHotels = FEATURED_HOTEL_IDS.slice(0, limit)
          .map(id => allHotels.find(h => h.hotel_id === id))
          .filter((h): h is LiteAPIHotel => h !== null && h !== undefined);
        
        console.log('[FeaturedHotels] Loaded featured hotels:', featuredHotels.length);
        console.log('[FeaturedHotels] Sample:', featuredHotels[0]);
        
        setHotels(featuredHotels);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load hotels');
        console.error('[FeaturedHotels] Error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedHotels();
  }, [limit]);

  const handleHotelSelect = (hotelId: string) => {
    if (typeof window !== 'undefined') {
      // Generate default dates (7 days from now for check-in, 14 days for check-out)
      const checkIn = format(addDays(new Date(), 7), 'yyyy-MM-dd');
      const checkOut = format(addDays(new Date(), 14), 'yyyy-MM-dd');
      const adults = 2;
      
      window.location.href = `/lodging/${hotelId}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (hotels.length === 0) {
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

