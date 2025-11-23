'use client';

import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Users, Calendar, ArrowRight } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { addDays, format } from 'date-fns';
import type { LiteAPIHotel } from '@/lib/liteapi/types';

export interface CostPerPersonRankingProps {
  hotelIds?: string[];
  groupSize?: number;
  nights?: number;
  checkIn?: string;
  checkOut?: string;
}

interface HotelRanking {
  hotelId: string;
  name: string;
  price: number;
  totalCost: number;
  costPerPerson: number;
  rating: number;
  starRating: number;
  location: string;
}

export function CostPerPersonRanking({
  hotelIds = [],
  groupSize = 2,
  nights = 4,
  checkIn,
  checkOut,
}: CostPerPersonRankingProps) {
  const [guests, setGuests] = useState(groupSize);
  const [nightsCount, setNightsCount] = useState(nights);
  const [loading, setLoading] = useState(false);
  const [rankings, setRankings] = useState<HotelRanking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [guestsError, setGuestsError] = useState<string | null>(null);
  const [nightsError, setNightsError] = useState<string | null>(null);

  const fetchAndRankHotels = async () => {
    // Validation
    let isValid = true;
    if (guests < 1 || guests > 20) {
      setGuestsError('Group size must be between 1 and 20');
      isValid = false;
    } else {
      setGuestsError(null);
    }

    if (nightsCount < 1 || nightsCount > 14) {
      setNightsError('Number of nights must be between 1 and 14');
      isValid = false;
    } else {
      setNightsError(null);
    }

    if (!isValid) return;

    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);
      
      const defaultCheckIn = format(addDays(new Date(), 7), 'yyyy-MM-dd');
      const defaultCheckOut = format(addDays(new Date(), 7 + nightsCount), 'yyyy-MM-dd');
      
      const checkInDate = checkIn || defaultCheckIn;
      const checkOutDate = checkOut || (checkIn ? format(addDays(new Date(checkIn), nightsCount), 'yyyy-MM-dd') : defaultCheckOut);
      
      const searchParams = new URLSearchParams({
        cityName: 'Telluride',
        countryCode: 'US',
        limit: hotelIds.length > 0 ? hotelIds.length.toString() : '10',
      });
      
      const hotelsResponse = await fetch(`/api/liteapi/search?${searchParams.toString()}`);
      
      if (!hotelsResponse.ok) {
        setError('Failed to load hotels. Please try again later.');
        setRankings([]);
        setLoading(false);
        return;
      }
      
      const hotelsData = await hotelsResponse.json();
      let hotels: LiteAPIHotel[] = hotelsData.data || [];
      
      if (hotelIds.length > 0) {
        hotels = hotels.filter(h => hotelIds.includes(h.hotel_id));
      }
      
      if (hotels.length === 0) {
        setRankings([]);
        setLoading(false);
        return;
      }
      
      const hotelIdsToFetch = hotels.map(h => h.hotel_id);
      const ratesParams = new URLSearchParams({
        hotelIds: hotelIdsToFetch.join(','),
        checkIn: checkInDate,
        checkOut: checkOutDate,
        adults: guests.toString(),
      });
      
      const ratesResponse = await fetch(`/api/hotels/min-rates?${ratesParams.toString()}`);
      
      if (!ratesResponse.ok) {
        setError('Failed to load hotel rates. Please try again later.');
        setRankings([]);
        setLoading(false);
        return;
      }
      
      const ratesData = await ratesResponse.json();
      
      const prices: Record<string, number> = {};
      if (ratesData.data && Array.isArray(ratesData.data)) {
        ratesData.data.forEach((item: any) => {
          if (item.hotelId && item.price) {
            prices[item.hotelId] = nightsCount > 0 ? item.price / nightsCount : item.price;
          }
        });
      }
      
      const hotelRankings: HotelRanking[] = hotels
        .filter(h => prices[h.hotel_id])
        .map(hotel => {
          const perNight = prices[hotel.hotel_id];
          const totalCost = perNight * nightsCount;
          const costPerPerson = totalCost / guests;
          
          return {
            hotelId: hotel.hotel_id,
            name: hotel.name || 'Unknown Hotel',
            price: perNight,
            totalCost,
            costPerPerson,
            rating: hotel.review_score || 0,
            starRating: hotel.star_rating || 0,
            location: hotel.address?.city || 'Telluride',
          };
        });
      
      hotelRankings.sort((a, b) => a.costPerPerson - b.costPerPerson);
      setRankings(hotelRankings);
    } catch (err) {
      console.error('Error fetching hotel rankings:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while loading hotels.');
      setRankings([]);
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

  const handleInputChange = (field: 'guests' | 'nights', value: number) => {
    if (field === 'guests') {
      setGuests(value);
      if (value >= 1 && value <= 20) setGuestsError(null);
    } else {
      setNightsCount(value);
      if (value >= 1 && value <= 14) setNightsError(null);
    }
  };

  const visibleRankings = rankings.slice(0, 8);

  return (
    <div className="my-8 flex justify-center">
      <Card className="w-full max-w-[700px] border border-primary-200">
        <CardContent className="p-6">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-neutral-500" />
                    <span>Group Size</span>
                  </div>
                </label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={guests}
                  onChange={(e) => handleInputChange('guests', parseInt(e.target.value) || 1)}
                  className={`w-full ${guestsError ? 'border-red-300' : ''}`}
                />
                {guestsError && (
                  <p className="mt-1 text-xs text-red-600">{guestsError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-neutral-500" />
                    <span>Number of Nights</span>
                  </div>
                </label>
                <Input
                  type="number"
                  min="1"
                  max="14"
                  value={nightsCount}
                  onChange={(e) => handleInputChange('nights', parseInt(e.target.value) || 1)}
                  className={`w-full ${nightsError ? 'border-red-300' : ''}`}
                />
                {nightsError && (
                  <p className="mt-1 text-xs text-red-600">{nightsError}</p>
                )}
              </div>
            </div>

            <button
              onClick={fetchAndRankHotels}
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Calculating...
                </span>
              ) : (
                'Compare Prices'
              )}
            </button>
          </div>

          {/* Results Section */}
          {hasSearched && !loading && (
            <div className="mt-8 space-y-4" style={{ opacity: 0, animation: 'fadeIn 0.3s ease-in-out forwards' }}>
              {rankings.length > 0 ? (
                <>
                  <div className="text-sm text-neutral-600 mb-4">
                    Sorted by lowest cost per person
                  </div>
                  <div className="space-y-4">
                    {visibleRankings.map((hotel, index) => {
                      const checkInDate = checkIn || format(addDays(new Date(), 7), 'yyyy-MM-dd');
                      const checkOutDate = checkOut || format(addDays(new Date(), 7 + nightsCount), 'yyyy-MM-dd');
                      const hotelUrl = `/places-to-stay/${hotel.hotelId}?checkIn=${checkInDate}&checkOut=${checkOutDate}&adults=${guests}`;
                      
                      return (
                        <a
                          key={hotel.hotelId}
                          href={hotelUrl}
                          className="block p-4 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-neutral-50 transition-all duration-200"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-neutral-900 mb-1 truncate">
                                {hotel.name}
                              </h4>
                              <p className="text-sm text-neutral-600">
                                {hotel.location}
                                {hotel.rating > 0 && ` • ${hotel.rating.toFixed(1)}/10`}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-2xl font-bold text-primary-600 mb-0.5">
                                {formatCurrency(hotel.costPerPerson)}
                              </div>
                              <div className="text-xs text-neutral-500">per person</div>
                              <div className="text-xs text-neutral-500 mt-1">
                                {formatCurrency(hotel.totalCost)} total
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-neutral-100">
                            <span className="text-sm text-primary-600 font-medium flex items-center gap-1">
                              View Details
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                  {rankings.length > 8 && (
                    <div className="text-sm text-neutral-500 text-center pt-2">
                      Showing 8 of {rankings.length} properties
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  {error ? (
                    <>
                      <p className="text-neutral-700 font-medium mb-2">{error}</p>
                      <p className="text-sm text-neutral-600">
                        Please try adjusting your dates or group size.
                      </p>
                    </>
                  ) : (
                    <p className="text-neutral-600">
                      No hotels available for the selected dates. Try adjusting your dates or group size.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
