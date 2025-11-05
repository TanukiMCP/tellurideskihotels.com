import { useEffect, useState } from 'react';
import { HotelCard } from './HotelCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { LiteAPIHotel } from '@/lib/liteapi/types';

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
        const response = await fetch(`/api/hotels/search?cityName=Telluride&countryCode=US&limit=${limit}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch hotels');
        }
        
        const data = await response.json();
        setHotels(data.data || []);
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
      window.location.href = `/lodging/${hotelId}`;
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

