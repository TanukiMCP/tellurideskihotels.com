'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ArticleBookingWidget } from '@/components/blog/ArticleBookingWidget';
import { Building2, Star, Users, Calendar } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { LiteAPIHotel } from '@/lib/liteapi/types';

export interface LodgingComparisonMatrixProps {
  compareIds?: string[];
  criteria?: string[];
  groupSize?: number;
  nights?: number;
  checkIn?: string;
  checkOut?: string;
  filter?: 'luxury' | 'budget' | 'ski-in-ski-out';
}

interface HotelComparison {
  hotelId: string;
  name: string;
  price: number;
  location: string;
  amenities: string[];
  rating: number;
  space: string;
  score: number;
  imageUrl?: string;
}

const DEFAULT_CRITERIA = ['price', 'location', 'amenities', 'reviews', 'space'];

export function LodgingComparisonMatrix({
  compareIds,
  criteria = DEFAULT_CRITERIA,
  groupSize = 6,
  nights = 4,
  checkIn,
  checkOut,
  filter,
}: LodgingComparisonMatrixProps) {
  const [guests, setGuests] = useState(groupSize);
  const [nightsCount, setNightsCount] = useState(nights);
  const [sortBy, setSortBy] = useState<string>('score');
  const [comparisons, setComparisons] = useState<HotelComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAndCalculateComparisons();
  }, [guests, nightsCount, compareIds, checkIn, checkOut, filter]);

  const fetchAndCalculateComparisons = async () => {
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
        limit: compareIds && compareIds.length > 0 ? compareIds.length.toString() : '5',
        checkin: checkInDate,
        checkout: checkOutDate,
      });
      
      const response = await fetch(`/api/liteapi/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to load hotels');
      }
      
      const data = await response.json();
      let hotels: LiteAPIHotel[] = data.data || [];
      
      // Apply filters
      if (filter === 'luxury') {
        hotels = hotels.filter(h => (h.star_rating || 0) >= 4);
      } else if (filter === 'budget') {
        hotels = hotels.filter(h => (h.star_rating || 0) <= 3);
      }
      
      // If specific hotel IDs provided, filter to those
      if (compareIds && compareIds.length > 0) {
        hotels = hotels.filter(h => compareIds.includes(h.hotel_id));
      }
      
      // Calculate comparisons with real data
      const hotelComparisons: HotelComparison[] = hotels.map((hotel) => {
        const price = hotel.min_rate || (hotel.star_rating || 3) * 150;
        const totalCost = price * nightsCount;
      const costPerPerson = totalCost / guests;

        const location = hotel.address?.city || 'Telluride';
        const amenities = hotel.amenities?.slice(0, 4).map(a => a.name || a) || ['Mountain views'];
        const rating = hotel.review_score || 4.0;
        const imageUrl = hotel.images?.[0]?.url || hotel.images?.[0]?.thumbnail || '';
        
        // Calculate score
        const priceScore = 100 - (price / 10);
        const ratingScore = rating * 20;
        const amenityScore = amenities.length * 10;
        const locationScore = location.includes('Mountain Village') ? 90 : 70;
        const spaceScore = 75; // Default since we don't have room count

      const score = (priceScore + ratingScore + amenityScore + locationScore + spaceScore) / 5;

      return {
          hotelId: hotel.hotel_id,
          name: hotel.name || 'Hotel',
          price,
          location,
          amenities,
          rating,
          space: `${hotel.star_rating || 3}-star`,
        score,
          imageUrl,
      };
      });

      hotelComparisons.sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

      setComparisons(hotelComparisons.slice(0, 5));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hotel comparisons');
    } finally {
      setLoading(false);
    }
  };

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
        current.rating > best.rating ? current : best
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

  if (error) {
    return (
      <Card className="my-8 border-2 border-primary-200">
        <CardContent className="py-8">
          <p className="text-neutral-600 text-center">{error}</p>
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
              Compare hotels side-by-side with real-time pricing
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

        {comparisons.length > 0 && (
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
                    {comparisons.map((hotel) => (
                      <tr 
                        key={hotel.hotelId} 
                        onClick={() => window.location.href = `/places-to-stay/${hotel.hotelId}`}
                        className="border-b border-neutral-100 cursor-pointer hover:bg-primary-50 transition-colors"
                      >
                        <td className="p-3">
                          <div className="font-semibold text-neutral-900 group-hover:text-primary-700">{hotel.name}</div>
                          <div className="text-sm text-neutral-600">{hotel.space}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-primary-600">
                            {formatCurrency(hotel.price)}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {formatCurrency((hotel.price * nightsCount) / guests)}/person
                          </div>
                        </td>
                        <td className="p-3 text-sm text-neutral-700">{hotel.location}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-semibold">{hotel.rating}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-primary-600">
                            {hotel.score.toFixed(0)}/100
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
                      {getBestFor('price')?.name}
                    </div>
                    <div className="text-sm text-neutral-600 mt-1">
                      {formatCurrency((getBestFor('price')?.price || 0) * nightsCount / guests)} per person
                    </div>
                  </div>
                )}
                {getBestFor('rating') && (
                  <div className="p-4 border-2 border-primary-200 bg-primary-50 rounded-lg">
                    <div className="font-semibold text-neutral-900 mb-1">Highest Rated</div>
                    <div className="text-lg font-bold text-primary-600">
                      {getBestFor('rating')?.name}
                    </div>
                    <div className="text-sm text-neutral-600 mt-1">
                      {getBestFor('rating')?.rating}/5.0 rating
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-4">
              <div className="p-4 bg-neutral-50 border-2 border-neutral-200 rounded-lg">
                <p className="text-sm text-neutral-600 text-center">
                  💡 <strong>Tip:</strong> Click any hotel row above to view full details and book
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

