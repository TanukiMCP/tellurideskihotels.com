import { useState, useEffect } from 'react';
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

  useEffect(() => {
    async function fetchHotels() {
      try {
        // STEP 1: Fetch hotels list
        const searchParams = new URLSearchParams({
          cityName: 'Telluride',
          countryCode: 'US',
          limit: limit.toString(),
        });
        
        const hotelsResponse = await fetch(`/api/liteapi/search?${searchParams.toString()}`);
        
        if (!hotelsResponse.ok) {
          return; // Silently fail, render nothing
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
          return; // No hotels, render nothing
        }
        
        setHotels(candidateHotels);
        
        // STEP 2: Fetch min rates for "from" pricing (optional - don't block render if it fails)
        if (computedCheckIn && computedCheckOut) {
          const hotelIds = candidateHotels.map(h => h.hotel_id);
          const ratesParams = new URLSearchParams({
            hotelIds: hotelIds.join(','),
            checkIn: computedCheckIn,
            checkOut: computedCheckOut,
            adults: '2',
          });
          
          fetch(`/api/hotels/min-rates?${ratesParams.toString()}`)
            .then(res => res.ok ? res.json() : null)
            .then(ratesData => {
              if (ratesData?.data && Array.isArray(ratesData.data)) {
                const prices: Record<string, number> = {};
                const nights = Math.ceil((new Date(computedCheckOut).getTime() - new Date(computedCheckIn).getTime()) / (1000 * 60 * 60 * 24));
                
                ratesData.data.forEach((item: any) => {
                  if (item.hotelId && item.price) {
                    prices[item.hotelId] = nights > 0 ? item.price / nights : item.price;
                  }
                });
                
                setMinPrices(prices);
              }
            })
            .catch(err => {
              // Silently fail - prices just won't show
              console.error('[HotelGrid] Error fetching min rates:', err);
            });
        }
      } catch (err) {
        // Silently fail, render nothing
        console.error('[HotelGrid] Error fetching hotels:', err);
      }
    }

    fetchHotels();
  }, [filter, limit, computedCheckIn, computedCheckOut]);

  // Render nothing if no hotels available
  if (hotels.length === 0) {
    return null;
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
            checkInDate={computedCheckIn}
            checkOutDate={computedCheckOut}
            onSelect={(id) => {
              window.location.href = `/places-to-stay/${id}?checkIn=${computedCheckIn}&checkOut=${computedCheckOut}&adults=2&rooms=1`;
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

