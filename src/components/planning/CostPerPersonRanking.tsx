'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ArticleBookingWidget } from '@/components/blog/ArticleBookingWidget';
import { TrendingUp, Users, Calendar, Star } from 'lucide-react';
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
  groupSize = 4,
  nights = 4,
  checkIn,
  checkOut,
}: CostPerPersonRankingProps) {
  const [guests, setGuests] = useState(groupSize);
  const [nightsCount, setNightsCount] = useState(nights);
  const [loading, setLoading] = useState(true);
  const [rankings, setRankings] = useState<HotelRanking[]>([]);

  useEffect(() => {
    fetchAndRankHotels();
  }, [guests, nightsCount, hotelIds, checkIn, checkOut]);

  const fetchAndRankHotels = async () => {
    try {
      setLoading(true);
      
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
        setRankings([]);
        return;
      }
      
      const hotelsData = await hotelsResponse.json();
      let hotels: LiteAPIHotel[] = hotelsData.data || [];
      
      if (hotelIds.length > 0) {
        hotels = hotels.filter(h => hotelIds.includes(h.hotel_id));
      }
      
      if (hotels.length === 0) {
        setRankings([]);
        return;
      }
      
      const hotelIdsToFetch = hotels.map(h => h.hotel_id);
      const ratesParams = new URLSearchParams({
        hotelIds: hotelIdsToFetch.join(','),
        checkIn: checkInDate,
        checkOut: checkOutDate,
        adults: '2',
      });
      
      const ratesResponse = await fetch(`/api/hotels/min-rates?${ratesParams.toString()}`);
      
      if (!ratesResponse.ok) {
        setRankings([]);
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

  return (
    <Card className="my-8 border-2 border-primary-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Cost Per Person Ranking</CardTitle>
            <p className="text-neutral-600 mt-1">
              Compare hotels ranked by cost per person
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
              min="1"
              max="20"
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
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

        {rankings.length > 0 ? (
          <div className="border-t border-neutral-200 pt-4">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Hotels Ranked by Value ({guests} guests, {nightsCount} nights)
            </h3>
            <div className="space-y-3">
              {rankings.map((hotel, index) => (
                <div
                  key={hotel.hotelId}
                  className={`p-4 border-2 rounded-lg ${
                    index === 0
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-neutral-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-neutral-900">{hotel.name}</span>
                        {hotel.starRating > 0 && (
                          <div className="flex items-center gap-1">
                            {Array.from({ length: hotel.starRating }).map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-primary-600 text-primary-600" />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-neutral-600">
                        {hotel.location} {hotel.rating > 0 && `• ${hotel.rating.toFixed(1)}/10`}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-primary-600">
                        {formatCurrency(hotel.costPerPerson)}
                      </div>
                      <div className="text-xs text-neutral-500">per person</div>
                      <div className="text-xs text-neutral-500 mt-1">
                        {formatCurrency(hotel.price)}/night
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-neutral-600">
                    Total: {formatCurrency(hotel.totalCost)} for {nightsCount} nights
                  </div>
                  {index === 0 && (
                    <div className="mt-2 text-sm text-primary-600 font-medium flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      Best Value
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="border-t border-neutral-200 pt-4">
            <p className="text-neutral-600 text-center py-8">
              No hotels available for the selected dates. Try adjusting your dates or group size.
            </p>
          </div>
        )}

        <div className="border-t border-neutral-200 pt-6">
          <ArticleBookingWidget
            variant="default"
            title="Book Your Hotel"
            description={`Compare and book hotels for ${guests} guests`}
            guests={guests}
            nights={nightsCount}
            checkIn={checkIn || format(addDays(new Date(), 7), 'yyyy-MM-dd')}
            checkOut={checkOut || format(addDays(new Date(), 7 + nightsCount), 'yyyy-MM-dd')}
          />
        </div>
      </CardContent>
    </Card>
  );
}
