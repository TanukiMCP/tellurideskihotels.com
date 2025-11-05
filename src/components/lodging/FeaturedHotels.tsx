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
        
        // Fetch all hotels first
        const response = await fetch(`/api/hotels/search?cityName=Telluride&countryCode=US&limit=100`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch hotels');
        }
        
        const data = await response.json();
        const allHotels = data.data || [];
        
        // Filter to only featured hotels, maintaining order
        const featuredHotels = FEATURED_HOTEL_IDS
          .map(id => allHotels.find((h: LiteAPIHotel) => h.hotel_id === id))
          .filter((h): h is LiteAPIHotel => h !== undefined)
          .slice(0, limit);
        
        setHotels(featuredHotels);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load hotels');
        console.error('Error fetching featured hotels:', err);
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
        <div key={hotel.hotel_id} className="animate-fade-in hover-lift">
          <HotelCard
            hotel={hotel}
            currency="USD"
            onSelect={handleHotelSelect}
          />
        </div>
      ))}
    </div>
  );
}

