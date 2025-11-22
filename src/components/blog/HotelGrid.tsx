import { useState, useEffect } from 'react';
import { HotelCard } from '@/components/lodging/HotelCard';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { format, addDays } from 'date-fns';

interface HotelGridProps {
  filter?: 'ski-in-ski-out' | 'luxury' | 'budget' | 'downtown' | 'mountain-village' | 'family-friendly';
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
  const [minPrices, setMinPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHotels() {
      try {
        setLoading(true);
        
        // Default dates: 1 week out from today, 1 week duration (SAME AS HOMEPAGE)
        const defaultCheckIn = format(addDays(new Date(), 7), 'yyyy-MM-dd');
        const defaultCheckOut = format(addDays(new Date(), 14), 'yyyy-MM-dd');
        
        const checkInDate = checkIn || defaultCheckIn;
        const checkOutDate = checkOut || defaultCheckOut;
        
        // STEP 1: Fetch hotels list (SAME AS HOMEPAGE)
        const searchParams = new URLSearchParams({
          cityName: 'Telluride',
          countryCode: 'US',
          limit: Math.max(limit * 2, 6).toString(), // Fetch enough to account for filtering and availability (min 6 for blog posts)
        });
        
        const hotelsResponse = await fetch(`/api/liteapi/search?${searchParams.toString()}`);
        
        if (!hotelsResponse.ok) {
          throw new Error('Failed to load hotels');
        }
        
        const hotelsData = await hotelsResponse.json();
        let candidateHotels: LiteAPIHotel[] = hotelsData.data || [];
        
        // Apply client-side filtering BEFORE fetching rates (more efficient)
        if (filter === 'luxury') {
          candidateHotels = candidateHotels.filter((h) => (h.star_rating || 0) >= 4);
        } else if (filter === 'budget') {
          candidateHotels = candidateHotels.filter((h) => (h.star_rating || 0) <= 3);
        } else if (filter === 'ski-in-ski-out' || filter === 'family-friendly') {
          candidateHotels = candidateHotels.filter((h) => (h.star_rating || 0) >= 4);
        }
        
        // Take top candidates (enough to ensure we get limit after availability check)
        candidateHotels = candidateHotels.slice(0, Math.max(limit * 2, 6));
        
        if (candidateHotels.length === 0) {
          setHotels([]);
          setLoading(false);
          return;
        }
        
        // STEP 2: Fetch min rates for candidate hotels (SAME AS HOMEPAGE)
        const hotelIds = candidateHotels.map(h => h.hotel_id);
        const ratesParams = new URLSearchParams({
          hotelIds: hotelIds.join(','),
          checkIn: checkInDate,
          checkOut: checkOutDate,
          adults: '2',
        });
        
        const ratesResponse = await fetch(`/api/hotels/min-rates?${ratesParams.toString()}`);
        
        if (!ratesResponse.ok) {
          throw new Error('Failed to load rates');
        }
        
        const ratesData = await ratesResponse.json();
        const prices: Record<string, number> = {};
        
        // Calculate nights for per-night pricing
        const nights = Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24));
        
        // Extract prices from rates response
        if (ratesData.data && Array.isArray(ratesData.data)) {
          ratesData.data.forEach((item: any) => {
            if (item.hotelId && item.price) {
              // MinRates returns TOTAL price, divide by nights for per-night
              prices[item.hotelId] = nights > 0 ? item.price / nights : item.price;
            }
          });
        }
        
        // STEP 3: Filter to only hotels with availability (SAME AS HOMEPAGE)
        const hotelsWithAvailability = candidateHotels.filter(hotel => {
          return prices[hotel.hotel_id] !== undefined && prices[hotel.hotel_id] > 0;
        });
        
        setHotels(hotelsWithAvailability.slice(0, limit));
        setMinPrices(prices);
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
            minPrice={minPrices[hotel.hotel_id]}
            currency="USD"
            checkInDate={checkIn || format(addDays(new Date(), 7), 'yyyy-MM-dd')}
            checkOutDate={checkOut || format(addDays(new Date(), 14), 'yyyy-MM-dd')}
            onSelect={(id) => {
              const checkInDate = checkIn || format(addDays(new Date(), 7), 'yyyy-MM-dd');
              const checkOutDate = checkOut || format(addDays(new Date(), 14), 'yyyy-MM-dd');
              window.location.href = `/places-to-stay/${id}?checkIn=${checkInDate}&checkOut=${checkOutDate}&adults=2&rooms=1`;
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

