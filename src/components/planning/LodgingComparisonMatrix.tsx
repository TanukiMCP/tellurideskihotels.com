'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ArticleBookingWidget } from '@/components/blog/ArticleBookingWidget';
import { Building2, Star, MapPin, Users, Calendar } from 'lucide-react';

export interface LodgingComparisonMatrixProps {
  compareIds: string[];
  criteria?: string[];
  groupSize?: number;
  nights?: number;
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
}

const HOTEL_DATA: Record<string, Omit<HotelComparison, 'score'>> = {
  'hotel-1': {
    hotelId: 'hotel-1',
    name: 'The Madeline Hotel',
    price: 450,
    location: 'Mountain Village',
    amenities: ['Ski-in/ski-out', 'Spa', 'Pool', 'Restaurant'],
    rating: 4.8,
    space: '89 rooms',
  },
  'hotel-2': {
    hotelId: 'hotel-2',
    name: 'Peaks Resort & Spa',
    price: 350,
    location: 'Mountain Village',
    amenities: ['Ski-in/ski-out', 'Spa', 'Pool', 'Fitness'],
    rating: 4.6,
    space: '175 rooms',
  },
  'hotel-3': {
    hotelId: 'hotel-3',
    name: 'Capella Telluride',
    price: 600,
    location: 'Mountain Village',
    amenities: ['Ski-in/ski-out', 'Spa', 'Fine Dining', 'Concierge'],
    rating: 4.9,
    space: '100 rooms',
  },
};

const DEFAULT_CRITERIA = ['price', 'location', 'amenities', 'reviews', 'space'];

export function LodgingComparisonMatrix({
  compareIds,
  criteria = DEFAULT_CRITERIA,
  groupSize = 6,
  nights = 4,
}: LodgingComparisonMatrixProps) {
  const [guests, setGuests] = useState(groupSize);
  const [nightsCount, setNightsCount] = useState(nights);
  const [sortBy, setSortBy] = useState<string>('score');
  const [comparisons, setComparisons] = useState<HotelComparison[]>([]);

  useEffect(() => {
    calculateComparisons();
  }, [guests, nightsCount, compareIds]);

  const calculateComparisons = () => {
    const hotels: HotelComparison[] = compareIds.map((id) => {
      const data = HOTEL_DATA[id];
      if (!data) return null;

      const totalCost = data.price * nightsCount;
      const costPerPerson = totalCost / guests;

      const priceScore = 100 - (data.price / 10);
      const ratingScore = data.rating * 20;
      const amenityScore = data.amenities.length * 10;
      const locationScore = data.location === 'Mountain Village' ? 90 : 70;
      const spaceScore = parseInt(data.space) > 100 ? 80 : 60;

      const score = (priceScore + ratingScore + amenityScore + locationScore + spaceScore) / 5;

      return {
        ...data,
        score,
      };
    }).filter((h): h is HotelComparison => h !== null);

    hotels.sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

    setComparisons(hotels);
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
                      <tr key={hotel.hotelId} className="border-b border-neutral-100">
                        <td className="p-3">
                          <div className="font-semibold text-neutral-900">{hotel.name}</div>
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

            {comparisons[0] && (
              <div className="border-t border-neutral-200 pt-4">
                <ArticleBookingWidget
                  hotelId={comparisons[0].hotelId}
                  hotelName={comparisons[0].name}
                  variant="default"
                  title={`Book ${comparisons[0].name}`}
                  description="Compare rates and availability"
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

