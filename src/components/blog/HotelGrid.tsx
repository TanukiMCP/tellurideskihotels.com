import { useState, useEffect, useMemo } from 'react';
import { HotelCard } from '@/components/lodging/HotelCard';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
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
  const [computedCheckIn, setComputedCheckIn] = useState<string>('');
  const [computedCheckOut, setComputedCheckOut] = useState<string>('');

  useEffect(() => {
    // Calculate default dates on client side only to avoid hydration mismatch
    const defaultCheckIn = format(addDays(new Date(), 7), 'yyyy-MM-dd');
    const defaultCheckOut = format(addDays(new Date(), 14), 'yyyy-MM-dd');
    setComputedCheckIn(checkIn || defaultCheckIn);
    setComputedCheckOut(checkOut || defaultCheckOut);
  }, [checkIn, checkOut]);

  // Fetch hotels - don't wait for dates
  useEffect(() => {
    async function fetchHotels() {
      try {
        const searchParams = new URLSearchParams({
          cityName: 'Telluride',
          countryCode: 'US',
          limit: limit.toString(),
        });
        
        const hotelsResponse = await fetch(`/api/liteapi/search?${searchParams.toString()}`);
        
        if (!hotelsResponse.ok) {
          return;
        }
        
        const hotelsData = await hotelsResponse.json();
        let candidateHotels: LiteAPIHotel[] = hotelsData.data || [];
        
        // Apply client-side filtering
        if (filter === 'luxury') {
          candidateHotels = candidateHotels.filter((h) => (h.star_rating || 0) >= 4);
        } else if (filter === 'budget') {
          candidateHotels = candidateHotels.filter((h) => (h.star_rating || 0) <= 3);
        } else if (filter === 'ski-in-ski-out' || filter === 'family-friendly') {
          candidateHotels = candidateHotels.filter((h) => (h.star_rating || 0) >= 4);
        }
        
        candidateHotels = candidateHotels.slice(0, limit);
        
        if (candidateHotels.length === 0) {
          return;
        }
        
        setHotels(candidateHotels);
      } catch (err) {
        console.error('[HotelGrid] Error fetching hotels:', err);
      }
    }

    fetchHotels();
  }, [filter, limit]);

  // Create stable hotel IDs string for dependency
  const hotelIdsString = useMemo(() => {
    return hotels.map(h => h.hotel_id).sort().join(',');
  }, [hotels]);

  // Fetch min-rates separately once dates are computed AND hotels are loaded
  useEffect(() => {
    if (!computedCheckIn || !computedCheckOut || hotels.length === 0) {
      return; // Wait for both dates and hotels
    }

    const hotelIds = hotels.map(h => h.hotel_id);
    const ratesParams = new URLSearchParams({
      hotelIds: hotelIds.join(','),
      checkIn: computedCheckIn,
      checkOut: computedCheckOut,
      adults: '2',
    });
    
    console.log('[HotelGrid] Fetching min-rates:', {
      hotelIds: hotelIds.length,
      checkIn: computedCheckIn,
      checkOut: computedCheckOut,
      url: `/api/hotels/min-rates?${ratesParams.toString()}`,
    });
    
    fetch(`/api/hotels/min-rates?${ratesParams.toString()}`)
      .then(res => {
        console.log('[HotelGrid] Min-rates response status:', res.status);
        return res.ok ? res.json() : null;
      })
      .then(ratesData => {
        console.log('[HotelGrid] Min-rates data received:', ratesData);
        if (ratesData?.data && Array.isArray(ratesData.data)) {
          const prices: Record<string, number> = {};
          const nights = Math.ceil((new Date(computedCheckOut).getTime() - new Date(computedCheckIn).getTime()) / (1000 * 60 * 60 * 24));
          
          ratesData.data.forEach((item: any) => {
            if (item.hotelId && item.price) {
              prices[item.hotelId] = nights > 0 ? item.price / nights : item.price;
            }
          });
          
          console.log('[HotelGrid] Processed prices:', prices);
          setMinPrices(prices);
        } else {
          console.warn('[HotelGrid] Unexpected rates data structure:', ratesData);
        }
      })
      .catch(err => {
        console.error('[HotelGrid] Error fetching min rates:', err);
      });
  }, [computedCheckIn, computedCheckOut, hotelIdsString]);

  // Render nothing if no hotels available
  if (hotels.length === 0) {
    return null;
  }

  return (
    <div className="my-8">
      {title && (
        <h3 className="text-2xl font-bold text-neutral-900 mb-6">{title}</h3>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {hotels.map((hotel) => (
          <HotelCard
            key={hotel.hotel_id}
            hotel={hotel}
            minPrice={minPrices[hotel.hotel_id]}
            currency="USD"
            checkInDate={computedCheckIn || undefined}
            checkOutDate={computedCheckOut || undefined}
            onSelect={(id) => {
              const checkInDate = computedCheckIn || format(addDays(new Date(), 7), 'yyyy-MM-dd');
              const checkOutDate = computedCheckOut || format(addDays(new Date(), 14), 'yyyy-MM-dd');
              window.location.href = `/places-to-stay/${id}?checkIn=${checkInDate}&checkOut=${checkOutDate}&adults=2&rooms=1`;
            }}
          />
        ))}
      </div>
      <div className="mt-6 text-center">
        <a
          href={`/places-to-stay${filter ? `?filter=${filter}` : ''}`}
          className="inline-flex w-full md:w-auto justify-center items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
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

