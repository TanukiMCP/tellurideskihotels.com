'use client';

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
  const [minPrices, setMinPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHotels() {
      try {
        setLoading(true);
        setError(null);
        
        // Build query params
        const params = new URLSearchParams({
          cityName: 'Telluride',
          countryCode: 'US',
          limit: '200', // Get more to filter properly
        });

        const response = await fetch(`/api/liteapi/search?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to load hotels');
        }
        
        const data = await response.json();
        let filteredHotels = data.data || [];
        
        // Apply client-side filtering
        if (filter === 'luxury') {
          filteredHotels = filteredHotels.filter((h: LiteAPIHotel) => 
            (h.star_rating || 0) >= 4 || (h.review_score || 0) >= 8
          );
        } else if (filter === 'budget') {
          filteredHotels = filteredHotels.filter((h: LiteAPIHotel) => 
            (h.star_rating || 0) <= 3 && (h.review_score || 0) < 8
          );
        } else if (filter === 'ski-in-ski-out') {
          // Filter by location - Mountain Village area
          filteredHotels = filteredHotels.filter((h: LiteAPIHotel) => {
            const lat = h.location?.latitude || 0;
            const lng = h.location?.longitude || 0;
            // Mountain Village is roughly at 37.938, -107.848
            const distance = Math.sqrt(
              Math.pow(lat - 37.938, 2) + Math.pow(lng - (-107.848), 2)
            );
            return distance < 0.01; // Within ~1km
          });
        } else if (filter === 'downtown') {
          // Downtown Telluride is roughly at 37.937, -107.812
          filteredHotels = filteredHotels.filter((h: LiteAPIHotel) => {
            const lat = h.location?.latitude || 0;
            const lng = h.location?.longitude || 0;
            const distance = Math.sqrt(
              Math.pow(lat - 37.937, 2) + Math.pow(lng - (-107.812), 2)
            );
            return distance < 0.01;
          });
        }
        
        // Sort by review score (best first)
        filteredHotels.sort((a: LiteAPIHotel, b: LiteAPIHotel) => 
          (b.review_score || 0) - (a.review_score || 0)
        );
        
        const limitedHotels = filteredHotels.slice(0, limit);
        setHotels(limitedHotels);

        // Fetch pricing for hotels if dates provided
        if (checkIn && checkOut && limitedHotels.length > 0) {
          try {
            // Calculate nights for per-night pricing
            const checkInDate = new Date(checkIn);
            const checkOutDate = new Date(checkOut);
            const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
            
            // Fetch rates for each hotel (API supports single hotelId per request)
            const pricePromises = limitedHotels.map(async (hotel) => {
              try {
                const params = new URLSearchParams({
                  hotelId: hotel.hotel_id,
                  checkIn,
                  checkOut,
                  adults: '2',
                  children: '0',
                });
                
                const response = await fetch(`/api/hotels/rates?${params.toString()}`);
                if (response.ok) {
                  const data = await response.json();
                  if (data.rates && data.rates.length > 0) {
                    const prices = data.rates
                      .map((rate: any) => {
                        const total = rate.total?.amount || rate.net?.amount;
                        return total && nights > 0 ? total / nights : null;
                      })
                      .filter((p: number | null): p is number => p !== null && p > 0);
                    
                    if (prices.length > 0) {
                      return { hotelId: hotel.hotel_id, price: Math.min(...prices) };
                    }
                  }
                }
              } catch (err) {
                console.warn(`Failed to fetch pricing for ${hotel.hotel_id}:`, err);
              }
              return null;
            });
            
            const priceResults = await Promise.all(pricePromises);
            const prices: Record<string, number> = {};
            
            priceResults.forEach((result) => {
              if (result) {
                prices[result.hotelId] = result.price;
              }
            });
            
            setMinPrices(prices);
          } catch (priceError) {
            console.warn('Failed to fetch pricing:', priceError);
          }
        }
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
      <div className="flex justify-center items-center py-12 my-8">
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
        <h3 className="text-2xl font-bold text-neutral-900 mb-6 font-serif">{title}</h3>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hotels.map((hotel) => (
          <HotelCard
            key={hotel.hotel_id}
            hotel={hotel}
            minPrice={minPrices[hotel.hotel_id]}
            checkInDate={checkIn}
            checkOutDate={checkOut}
            onSelect={(id) => {
              window.location.href = `/places-to-stay/${id}${checkIn && checkOut ? `?checkIn=${checkIn}&checkOut=${checkOut}` : ''}`;
            }}
          />
        ))}
      </div>
      <div className="mt-6 text-center">
        <a
          href={`/places-to-stay${filter ? `?filter=${filter}` : ''}${checkIn && checkOut ? `${filter ? '&' : '?'}checkIn=${checkIn}&checkOut=${checkOut}` : ''}`}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
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
