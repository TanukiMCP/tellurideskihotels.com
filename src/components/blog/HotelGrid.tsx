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
  const [isLoadingHotels, setIsLoadingHotels] = useState(true);
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  // Calculate default dates on client side only to avoid hydration mismatch
  useEffect(() => {
    const defaultCheckIn = format(addDays(new Date(), 7), 'yyyy-MM-dd');
    const defaultCheckOut = format(addDays(new Date(), 14), 'yyyy-MM-dd');
    setComputedCheckIn(checkIn || defaultCheckIn);
    setComputedCheckOut(checkOut || defaultCheckOut);
  }, [checkIn, checkOut]);

  // Fetch hotels using correct API endpoint
  useEffect(() => {
    let isMounted = true;
    
    async function fetchHotels() {
      setIsLoadingHotels(true);
      
      try {
        const searchParams = new URLSearchParams({
          cityName: 'Telluride',
          countryCode: 'US',
          limit: '500', // Get all hotels, filter client-side
        });
        
        const hotelsResponse = await fetch(`/api/hotels/search?${searchParams.toString()}`);
        
        if (!hotelsResponse.ok) {
          if (isMounted) {
            setIsLoadingHotels(false);
          }
          return;
        }
        
        const hotelsData = await hotelsResponse.json();
        let candidateHotels: LiteAPIHotel[] = hotelsData.data || [];
        
        // Apply client-side filtering based on filter prop
        if (filter === 'luxury') {
          candidateHotels = candidateHotels.filter((h) => (h.star_rating || 0) >= 4);
        } else if (filter === 'budget') {
          candidateHotels = candidateHotels.filter((h) => (h.star_rating || 0) <= 3);
        } else if (filter === 'ski-in-ski-out' || filter === 'family-friendly') {
          candidateHotels = candidateHotels.filter((h) => (h.star_rating || 0) >= 4);
        }
        
        // Sort by rating (highest first) before limiting
        candidateHotels.sort((a, b) => {
          const ratingA = a.review_score || 0;
          const ratingB = b.review_score || 0;
          return ratingB - ratingA;
        });
        
        candidateHotels = candidateHotels.slice(0, limit);
        
        if (isMounted) {
          setHotels(candidateHotels);
          setIsLoadingHotels(false);
        }
      } catch (err) {
        console.error('[HotelGrid] Error fetching hotels:', err);
        if (isMounted) {
          setIsLoadingHotels(false);
        }
      }
    }

    fetchHotels();
    
    return () => {
      isMounted = false;
    };
  }, [filter, limit]);

  // Create stable hotel IDs string for dependency
  const hotelIdsString = useMemo(() => {
    return hotels.map(h => h.hotel_id).sort().join(',');
  }, [hotels]);

  // Fetch min-rates once dates are computed AND hotels are loaded
  useEffect(() => {
    if (!computedCheckIn || !computedCheckOut || hotels.length === 0) {
      return;
    }

    let isMounted = true;
    setIsLoadingRates(true);

    const hotelIds = hotels.map(h => h.hotel_id);
    const ratesParams = new URLSearchParams({
      hotelIds: hotelIds.join(','),
      checkIn: computedCheckIn,
      checkOut: computedCheckOut,
      adults: '2',
    });
    
    fetch(`/api/hotels/min-rates?${ratesParams.toString()}`)
      .then(res => {
        if (!res.ok) {
          return null;
        }
        return res.json();
      })
      .then(ratesData => {
        if (!isMounted) return;
        
        if (ratesData?.data && Array.isArray(ratesData.data)) {
          const prices: Record<string, number> = {};
          
          // min-rates API returns per-night prices already - no division needed
          ratesData.data.forEach((item: { hotelId?: string; price?: number }) => {
            if (item.hotelId && item.price && item.price > 0) {
              prices[item.hotelId] = item.price;
            }
          });
          
          setMinPrices(prices);
        }
        setIsLoadingRates(false);
      })
      .catch(err => {
        console.error('[HotelGrid] Error fetching min rates:', err);
        if (isMounted) {
          setIsLoadingRates(false);
        }
      });
    
    return () => {
      isMounted = false;
    };
  }, [computedCheckIn, computedCheckOut, hotelIdsString]);

  // Calculate nights for display
  const nights = useMemo(() => {
    if (!computedCheckIn || !computedCheckOut) return 1;
    const checkInDate = new Date(computedCheckIn);
    const checkOutDate = new Date(computedCheckOut);
    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  }, [computedCheckIn, computedCheckOut]);

  // Render nothing if no hotels available (graceful degradation)
  if (!isLoadingHotels && hotels.length === 0) {
    return null;
  }

  // Show loading state only briefly - hotels should load quickly
  if (isLoadingHotels) {
    return null; // Don't show loading spinner - just render nothing until data arrives
  }

  return (
    <div className="my-12">
      {title && (
        <h3 className="text-2xl font-bold text-neutral-900 mb-8">{title}</h3>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {hotels.map((hotel) => (
          <HotelCard
            key={hotel.hotel_id}
            hotel={hotel}
            minPrice={minPrices[hotel.hotel_id]}
            currency="USD"
            nights={nights}
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
      
      {hotels.length > 0 && (
        <div className="mt-8 text-center">
          <a
            href={`/places-to-stay${filter ? `?filter=${filter}` : ''}`}
            className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            aria-label="View all properties in Telluride"
          >
            View All Properties
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 5l7 7-7 7" 
              />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}
