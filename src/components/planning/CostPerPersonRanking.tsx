'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ArticleBookingWidget } from '@/components/blog/ArticleBookingWidget';
import { TrendingUp, Users, Calendar } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { LiteAPIHotel } from '@/lib/liteapi/types';

export interface CostPerPersonRankingProps {
  hotelIds?: string[];
  groupSize?: number;
  nights?: number;
  checkIn?: string;
  checkOut?: string;
  filter?: 'luxury' | 'budget' | 'ski-in-ski-out';
}

interface HotelRanking {
  hotelId: string;
  name: string;
  costPerNight: number;
  totalCost: number;
  costPerPerson: number;
  rating?: number;
  amenities: string[];
  imageUrl?: string;
}

export function CostPerPersonRanking({
  hotelIds,
  groupSize = 4,
  nights = 5,
  checkIn,
  checkOut,
  filter,
}: CostPerPersonRankingProps) {
  const [guests, setGuests] = useState(groupSize);
  const [nightsCount, setNightsCount] = useState(nights);
  const [rankings, setRankings] = useState<HotelRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAndCalculateRankings();
  }, [guests, nightsCount, hotelIds, checkIn, checkOut, filter]);

  const fetchAndCalculateRankings = async () => {
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
        limit: '10',
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
      if (hotelIds && hotelIds.length > 0) {
        hotels = hotels.filter(h => hotelIds.includes(h.hotel_id));
      }
      
      // Calculate rankings with real pricing data
      const hotelRankings: HotelRanking[] = hotels.map((hotel) => {
        // Use actual min_rate if available, otherwise estimate based on star rating
        const costPerNight = hotel.min_rate || (hotel.star_rating || 3) * 150;
        const totalCost = costPerNight * nightsCount;
        const costPerPerson = totalCost / guests;
        
        // Get main image
        const imageUrl = hotel.images?.[0]?.url || hotel.images?.[0]?.thumbnail || '';

        return {
          hotelId: hotel.hotel_id,
          name: hotel.name || 'Hotel',
          costPerNight,
          totalCost,
          costPerPerson,
          rating: hotel.review_score,
          amenities: hotel.amenities?.slice(0, 3).map(a => a.name || a) || ['Ski access', 'Mountain views'],
          imageUrl,
        };
      });

      hotelRankings.sort((a, b) => a.costPerPerson - b.costPerPerson);
      setRankings(hotelRankings.slice(0, 5));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hotel rankings');
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
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              <Users className="w-4 h-4 inline mr-2" />
              Number of Guests
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
              Number of Nights
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

        {rankings.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="border-t border-neutral-200 pt-4">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Rankings for {guests} Guests, {nightsCount} Nights
              </h3>
              <div className="space-y-3">
                {rankings.map((hotel, index) => (
                  <div
                    key={hotel.hotelId}
                    className={`overflow-hidden border-2 rounded-lg ${
                      index === 0
                        ? 'border-primary-400 bg-primary-50'
                        : 'border-neutral-200 bg-white'
                    }`}
                  >
                    <div className="flex gap-4">
                      {hotel.imageUrl && (
                        <div className="w-32 h-32 flex-shrink-0">
                          <img
                            src={hotel.imageUrl}
                            alt={hotel.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-primary-600 text-lg">#{index + 1}</span>
                              <span className="font-semibold text-neutral-900">{hotel.name}</span>
                              {index === 0 && (
                                <span className="text-xs bg-primary-600 text-white px-2 py-1 rounded">
                                  Best Value
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-neutral-600">
                              {hotel.amenities.slice(0, 2).join(' • ')}
                            </div>
                            {hotel.rating && (
                              <div className="text-sm text-neutral-600 mt-1">
                                ⭐ {hotel.rating.toFixed(1)} rating
                              </div>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-lg font-bold text-primary-600">
                              {formatCurrency(hotel.costPerPerson)}
                            </div>
                            <div className="text-xs text-neutral-500">per person</div>
                            <div className="text-xs text-neutral-500 mt-1">
                              {formatCurrency(hotel.totalCost)} total
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-neutral-200">
                          <a
                            href={`/places-to-stay/${hotel.hotelId}`}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                          >
                            View Rooms & Rates →
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {rankings[0] && (
              <div className="border-t border-neutral-200 pt-4">
                <ArticleBookingWidget
                  hotelId={rankings[0].hotelId}
                  hotelName={rankings[0].name}
                  variant="default"
                  title={`Book ${rankings[0].name}`}
                  description={`Best value at ${formatCurrency(rankings[0].costPerPerson)} per person`}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

