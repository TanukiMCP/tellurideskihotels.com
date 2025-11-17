'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ArticleBookingWidget } from '@/components/blog/ArticleBookingWidget';
import { TrendingUp, Users, Calendar, Building2 } from 'lucide-react';

export interface CostPerPersonRankingProps {
  hotelIds: string[];
  groupSize?: number;
  nights?: number;
  checkIn?: string;
  checkOut?: string;
}

interface HotelRanking {
  hotelId: string;
  name: string;
  costPerNight: number;
  totalCost: number;
  costPerPerson: number;
  rating?: number;
  amenities: string[];
}

const ESTIMATED_COSTS: Record<string, number> = {
  'hotel-1': 450,
  'hotel-2': 350,
  'hotel-3': 600,
  'hotel-4': 400,
  'hotel-5': 550,
};

const HOTEL_NAMES: Record<string, string> = {
  'hotel-1': 'The Madeline Hotel',
  'hotel-2': 'Peaks Resort & Spa',
  'hotel-3': 'Capella Telluride',
  'hotel-4': 'Hotel Telluride',
  'hotel-5': 'Lumiere Telluride',
};

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

  useEffect(() => {
    calculateRankings();
  }, [guests, nightsCount, hotelIds]);

  const calculateRankings = () => {
    const hotels: HotelRanking[] = hotelIds.map((id) => {
      const costPerNight = ESTIMATED_COSTS[id] || 400;
      const totalCost = costPerNight * nightsCount;
      const costPerPerson = totalCost / guests;

      return {
        hotelId: id,
        name: HOTEL_NAMES[id] || `Hotel ${id}`,
        costPerNight,
        totalCost,
        costPerPerson,
        rating: 4.5,
        amenities: ['Ski-in/ski-out', 'Pool', 'Spa'],
      };
    });

    hotels.sort((a, b) => a.costPerPerson - b.costPerPerson);
    setRankings(hotels);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
                    className={`p-4 border-2 rounded-lg ${
                      index === 0
                        ? 'border-primary-400 bg-primary-50'
                        : 'border-neutral-200 bg-white'
                    }`}
                  >
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

