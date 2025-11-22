'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ArticleBookingWidget } from '@/components/blog/ArticleBookingWidget';
import { HotelCard } from '@/components/lodging/HotelCard';
import { TrendingUp, Users, Calendar, Star } from 'lucide-react';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export interface CostPerPersonRankingProps {
  hotelIds: string[];
  groupSize?: number;
  nights?: number;
  checkIn?: string;
  checkOut?: string;
}

interface HotelRanking {
  hotel: LiteAPIHotel;
  costPerNight: number;
  totalCost: number;
  costPerPerson: number;
  minPrice?: number;
}

export function CostPerPersonRanking({
  hotelIds,
  groupSize = 4,
  nights = 5,
  checkIn,
  checkOut,
}: CostPerPersonRankingProps) {
  const [guests, setGuests] = useState(groupSize);
  const [nightsCount, setNightsCount] = useState(nights);
  const [rankings, setRankings] = useState<HotelRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHotelsAndPrices() {
      try {
        setLoading(true);
        setError(null);

        // Fetch hotel details for all IDs
        const hotelPromises = hotelIds.map(async (id) => {
          try {
            const response = await fetch(`/api/liteapi/hotel?hotelId=${id}`);
            if (response.ok) {
              return await response.json();
            }
            return null;
          } catch (err) {
            console.warn(`Failed to fetch hotel ${id}:`, err);
            return null;
          }
        });

        const hotels = (await Promise.all(hotelPromises)).filter(Boolean) as LiteAPIHotel[];

        // Fetch pricing if dates provided
        const prices: Record<string, number> = {};
        if (checkIn && checkOut && hotels.length > 0) {
          try {
            const checkInDate = new Date(checkIn);
            const checkOutDate = new Date(checkOut);
            const calculatedNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

            const pricePromises = hotels.map(async (hotel) => {
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
                    const ratePrices = data.rates
                      .map((rate: any) => {
                        const total = rate.total?.amount || rate.net?.amount;
                        return total && calculatedNights > 0 ? total / calculatedNights : null;
                      })
                      .filter((p: number | null): p is number => p !== null && p > 0);
                    
                    if (ratePrices.length > 0) {
                      return { hotelId: hotel.hotel_id, price: Math.min(...ratePrices) };
                    }
                  }
                }
              } catch (err) {
                console.warn(`Failed to fetch pricing for ${hotel.hotel_id}:`, err);
              }
              return null;
            });

            const priceResults = await Promise.all(pricePromises);
            priceResults.forEach((result) => {
              if (result) {
                prices[result.hotelId] = result.price;
              }
            });
          } catch (priceError) {
            console.warn('Failed to fetch pricing:', priceError);
          }
        }

        // Calculate rankings
        const hotelRankings: HotelRanking[] = hotels.map((hotel) => {
          const costPerNight = prices[hotel.hotel_id] || 400; // Fallback if no pricing
          const totalCost = costPerNight * nightsCount;
          const costPerPerson = totalCost / guests;

          return {
            hotel,
            costPerNight,
            totalCost,
            costPerPerson,
            minPrice: prices[hotel.hotel_id],
          };
        });

        hotelRankings.sort((a, b) => a.costPerPerson - b.costPerPerson);
        setRankings(hotelRankings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load hotel data');
      } finally {
        setLoading(false);
      }
    }

    if (hotelIds.length > 0) {
      fetchHotelsAndPrices();
    }
  }, [hotelIds, checkIn, checkOut, nightsCount, guests]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 my-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || rankings.length === 0) {
    return (
      <Card className="my-8 border-2 border-primary-200">
        <CardContent className="p-6">
          <p className="text-neutral-600 text-center">
            {error || 'Unable to load hotel comparisons.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="my-8 border-2 border-primary-200 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Hotels Ranked by Cost Per Person</CardTitle>
            <p className="text-neutral-600 mt-1">
              Compare hotels by total cost per person, not per room
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600" />
            <label className="text-sm font-medium text-neutral-700">Group Size</label>
            <Input
              type="number"
              min="1"
              value={guests}
              onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20"
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            <label className="text-sm font-medium text-neutral-700">Nights</label>
            <Input
              type="number"
              min="1"
              value={nightsCount}
              onChange={(e) => setNightsCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20"
            />
          </div>
        </div>

        <div className="space-y-4">
          {rankings.map((ranking, index) => (
            <div
              key={ranking.hotel.hotel_id}
              className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold text-primary-600">#{index + 1}</span>
                    <h4 className="text-lg font-bold text-neutral-900">{ranking.hotel.name}</h4>
                    {ranking.hotel.star_rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-accent-500 text-accent-500" />
                        <span className="text-sm text-neutral-600">{ranking.hotel.star_rating}</span>
                      </div>
                    )}
                  </div>
                  {ranking.hotel.review_score && (
                    <p className="text-sm text-neutral-600">
                      Rating: {ranking.hotel.review_score.toFixed(1)}/10
                      {ranking.hotel.review_count && ` (${ranking.hotel.review_count.toLocaleString()} reviews)`}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-600">
                    {formatCurrency(ranking.costPerPerson)}
                  </div>
                  <div className="text-sm text-neutral-600">per person</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-neutral-200">
                <div>
                  <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Per Night</div>
                  <div className="text-lg font-semibold text-neutral-900">
                    {formatCurrency(ranking.costPerNight)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Total Stay</div>
                  <div className="text-lg font-semibold text-neutral-900">
                    {formatCurrency(ranking.totalCost)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Per Person</div>
                  <div className="text-lg font-semibold text-primary-600">
                    {formatCurrency(ranking.costPerPerson)}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <HotelCard
                  hotel={ranking.hotel}
                  minPrice={ranking.minPrice}
                  checkInDate={checkIn}
                  checkOutDate={checkOut}
                  onSelect={(id) => {
                    window.location.href = `/places-to-stay/${id}${checkIn && checkOut ? `?checkIn=${checkIn}&checkOut=${checkOut}` : ''}`;
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <ArticleBookingWidget
            title="Book Your Group Stay"
            description="Compare rates and availability for your group"
            variant="default"
          />
        </div>
      </CardContent>
    </Card>
  );
}
