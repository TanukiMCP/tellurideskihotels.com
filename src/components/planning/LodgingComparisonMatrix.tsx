'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ArticleBookingWidget } from '@/components/blog/ArticleBookingWidget';
import { HotelCard } from '@/components/lodging/HotelCard';
import { Building2, Star, Users, Calendar } from 'lucide-react';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { formatHotelAddress } from '@/lib/liteapi/utils';

export interface LodgingComparisonMatrixProps {
  compareIds: string[];
  criteria?: string[];
  groupSize?: number;
  nights?: number;
  checkIn?: string;
  checkOut?: string;
}

interface HotelComparison {
  hotel: LiteAPIHotel;
  price: number;
  costPerPerson: number;
  totalCost: number;
  score: number;
  minPrice?: number;
}

const DEFAULT_CRITERIA = ['price', 'location', 'amenities', 'reviews', 'space'];

export function LodgingComparisonMatrix({
  compareIds,
  criteria = DEFAULT_CRITERIA,
  groupSize = 6,
  nights = 4,
  checkIn,
  checkOut,
}: LodgingComparisonMatrixProps) {
  const [guests, setGuests] = useState(groupSize);
  const [nightsCount, setNightsCount] = useState(nights);
  const [sortBy, setSortBy] = useState<string>('score');
  const [comparisons, setComparisons] = useState<HotelComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHotelsAndCalculate() {
      try {
        setLoading(true);
        setError(null);

        // Fetch hotel details for all IDs
        const hotelPromises = compareIds.map(async (id) => {
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

        if (hotels.length === 0) {
          throw new Error('No hotels found');
        }

        // Fetch pricing if dates provided
        const prices: Record<string, number> = {};
        if (checkIn && checkOut && hotels.length > 0) {
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
        }

        // Calculate comparisons
        const hotelComparisons: HotelComparison[] = hotels.map((hotel) => {
          const price = prices[hotel.hotel_id] || (hotel.star_rating ? hotel.star_rating * 100 : 400);
          const totalCost = price * nightsCount;
          const costPerPerson = totalCost / guests;

          // Calculate score
          const priceScore = Math.max(0, 100 - (price / 10));
          const ratingScore = (hotel.review_score || 0) * 10;
          const amenityScore = Math.min(100, (hotel.amenities?.length || 0) * 10);
          const locationScore = hotel.location?.latitude ? 80 : 60;
          const spaceScore = hotel.room_count ? Math.min(100, hotel.room_count / 2) : 70;

          const score = (priceScore + ratingScore + amenityScore + locationScore + spaceScore) / 5;

          return {
            hotel,
            price,
            costPerPerson,
            totalCost,
            score,
            minPrice: prices[hotel.hotel_id],
          };
        });

        hotelComparisons.sort((a, b) => {
          if (sortBy === 'price') return a.price - b.price;
          if (sortBy === 'score') return b.score - a.score;
          if (sortBy === 'rating') return (b.hotel.review_score || 0) - (a.hotel.review_score || 0);
          return 0;
        });

        setComparisons(hotelComparisons);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load comparison data');
      } finally {
        setLoading(false);
      }
    }

    if (compareIds.length > 0) {
      fetchHotelsAndCalculate();
    }
  }, [compareIds, guests, nightsCount, checkIn, checkOut, sortBy]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getBestFor = (criteria: string) => {
    if (comparisons.length === 0) return null;
    if (criteria === 'price') {
      return comparisons.reduce((best, current) =>
        current.price < best.price ? current : best
      );
    }
    if (criteria === 'rating') {
      return comparisons.reduce((best, current) =>
        (current.hotel.review_score || 0) > (best.hotel.review_score || 0) ? current : best
      );
    }
    return comparisons[0];
  };

  if (loading) {
    return (
      <Card className="my-8 border-2 border-primary-200">
        <CardContent className="py-12">
          <div className="flex justify-center items-center">
            <LoadingSpinner size="lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || comparisons.length === 0) {
    return (
      <Card className="my-8 border-2 border-primary-200">
        <CardContent className="p-6">
          <p className="text-neutral-600 text-center">
            {error || 'No hotels available for comparison.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="my-8 border-2 border-primary-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Hotel Comparison Matrix</CardTitle>
            <p className="text-neutral-600 mt-1">
              Compare hotels side-by-side across multiple criteria
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              <Users className="w-4 h-4 inline mr-2" />
              Group Size
            </label>
            <Input
              type="number"
              min="2"
              max="20"
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value) || 2)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Nights
            </label>
            <Input
              type="number"
              min="1"
              max="14"
              value={nightsCount}
              onChange={(e) => setNightsCount(parseInt(e.target.value) || 1)}
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="border-t border-neutral-200 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">Comparison</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border-2 border-neutral-300 rounded-lg text-sm"
              >
                <option value="score">Sort by Score</option>
                <option value="price">Sort by Price</option>
                <option value="rating">Sort by Rating</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-neutral-200">
                    <th className="text-left p-3 font-semibold text-neutral-900">Hotel</th>
                    <th className="text-left p-3 font-semibold text-neutral-900">Price/Night</th>
                    <th className="text-left p-3 font-semibold text-neutral-900">Location</th>
                    <th className="text-left p-3 font-semibold text-neutral-900">Rating</th>
                    <th className="text-left p-3 font-semibold text-neutral-900">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((comparison) => (
                    <tr key={comparison.hotel.hotel_id} className="border-b border-neutral-100">
                      <td className="p-3">
                        <div className="font-semibold text-neutral-900">{comparison.hotel.name}</div>
                        {comparison.hotel.room_count && (
                          <div className="text-sm text-neutral-600">{comparison.hotel.room_count} rooms</div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-primary-600">
                          {formatCurrency(comparison.price)}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {formatCurrency(comparison.costPerPerson)}/person
                        </div>
                      </td>
                      <td className="p-3 text-sm text-neutral-700">
                        {formatHotelAddress(comparison.hotel)}
                      </td>
                      <td className="p-3">
                        {comparison.hotel.review_score ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-semibold">{comparison.hotel.review_score.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-400">N/A</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-primary-600">
                          {comparison.score.toFixed(0)}/100
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t border-neutral-200 pt-4">
            <div className="grid gap-3 md:grid-cols-2">
              {getBestFor('price') && (
                <div className="p-4 border-2 border-primary-200 bg-primary-50 rounded-lg">
                  <div className="font-semibold text-neutral-900 mb-1">Best for Budget</div>
                  <div className="text-lg font-bold text-primary-600">
                    {getBestFor('price')?.hotel.name}
                  </div>
                  <div className="text-sm text-neutral-600 mt-1">
                    {formatCurrency((getBestFor('price')?.costPerPerson || 0))} per person
                  </div>
                </div>
              )}
              {getBestFor('rating') && (
                <div className="p-4 border-2 border-primary-200 bg-primary-50 rounded-lg">
                  <div className="font-semibold text-neutral-900 mb-1">Highest Rated</div>
                  <div className="text-lg font-bold text-primary-600">
                    {getBestFor('rating')?.hotel.name}
                  </div>
                  <div className="text-sm text-neutral-600 mt-1">
                    {(getBestFor('rating')?.hotel.review_score || 0).toFixed(1)}/10 rating
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-neutral-200 pt-4">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Hotel Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {comparisons.map((comparison) => (
                <HotelCard
                  key={comparison.hotel.hotel_id}
                  hotel={comparison.hotel}
                  minPrice={comparison.minPrice}
                  checkInDate={checkIn}
                  checkOutDate={checkOut}
                  onSelect={(id) => {
                    window.location.href = `/places-to-stay/${id}${checkIn && checkOut ? `?checkIn=${checkIn}&checkOut=${checkOut}` : ''}`;
                  }}
                />
              ))}
            </div>
          </div>

          {comparisons[0] && (
            <div className="border-t border-neutral-200 pt-4">
              <ArticleBookingWidget
                hotelId={comparisons[0].hotel.hotel_id}
                hotelName={comparisons[0].hotel.name}
                variant="default"
                title={`Book ${comparisons[0].hotel.name}`}
                description="Compare rates and availability"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

