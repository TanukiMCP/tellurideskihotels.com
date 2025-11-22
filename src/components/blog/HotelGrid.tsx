import { useState, useEffect } from 'react';
import { HotelCard } from '@/components/lodging/HotelCard';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface HotelGridProps {
  filter?: 'ski-in-ski-out' | 'luxury' | 'budget' | 'downtown' | 'mountain-village';
  limit?: number;
  checkIn?: string;
  checkOut?: string;
  title?: string;
}

export function HotelGrid({ 
  filter,
  limit = 3,
  checkIn,
  checkOut,
  title
}: HotelGridProps) {
  const [hotels, setHotels] = useState<LiteAPIHotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHotels() {
      try {
        setLoading(true);
        
        // Default dates: 1 week out from today, 1 week duration
        const defaultCheckIn = new Date();
        defaultCheckIn.setDate(defaultCheckIn.getDate() + 7);
        const defaultCheckOut = new Date(defaultCheckIn);
        defaultCheckOut.setDate(defaultCheckOut.getDate() + 7);
        
        const checkInDate = checkIn || defaultCheckIn.toISOString().split('T')[0];
        const checkOutDate = checkOut || defaultCheckOut.toISOString().split('T')[0];
        
        // Build query params
        const params = new URLSearchParams({
          cityName: 'Telluride',
          countryCode: 'US',
          limit: limit.toString(),
          checkin: checkInDate,
          checkout: checkOutDate,
        });
        
        const response = await fetch(`/api/liteapi/search?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to load hotels');
        }
        
        const data = await response.json();
        
        // Apply client-side filtering if needed
        let filteredHotels = data.data || [];
        
        if (filter === 'luxury') {
          filteredHotels = filteredHotels.filter((h: LiteAPIHotel) => 
            (h.star_rating || 0) >= 4
          );
        } else if (filter === 'budget') {
          filteredHotels = filteredHotels.filter((h: LiteAPIHotel) => 
            (h.star_rating || 0) <= 3
          );
        }
        
        setHotels(filteredHotels.slice(0, limit));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load hotels');
      } finally {
        setLoading(false);
      }
    }

    fetchHotels();
  }, [filter, limit, checkIn, checkOut]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || hotels.length === 0) {
    return (
      <div className="my-8 p-6 bg-neutral-50 border border-neutral-200 rounded-lg">
        <p className="text-neutral-600 text-center">
          {error || 'No hotels available at this time.'}
        </p>
      </div>
    );
  }

  return (
    <div className="my-8">
      {title && (
        <h3 className="text-2xl font-bold text-neutral-900 mb-6">{title}</h3>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hotels.map((hotel) => (
          <HotelCard
            key={hotel.hotel_id}
            hotel={hotel}
            checkInDate={checkIn}
            checkOutDate={checkOut}
            onSelect={(id) => {
              window.location.href = `/places-to-stay/${id}`;
            }}
          />
        ))}
      </div>
      <div className="mt-6 text-center">
        <a
          href={`/places-to-stay${filter ? `?filter=${filter}` : ''}`}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          View All Properties
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
}

