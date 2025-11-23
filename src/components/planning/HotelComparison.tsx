'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ArticleBookingWidget } from '@/components/blog/ArticleBookingWidget';
import { Building2, Star, Users, Calendar, TrendingUp, List, Table } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { LiteAPIHotel } from '@/lib/liteapi/types';

export interface HotelComparisonProps {
  /** Specific hotel IDs to compare */
  hotelIds?: string[];
  /** Filter type */
  filter?: 'luxury' | 'budget' | 'ski-in-ski-out';
  /** Default view: 'table' | 'ranking' */
  defaultView?: 'table' | 'ranking';
  /** Group size for per-person calculations */
  groupSize?: number;
  /** Number of nights */
  nights?: number;
  /** Check-in date */
  checkIn?: string;
  /** Check-out date */
  checkOut?: string;
}

interface HotelData {
  hotelId: string;
  name: string;
  price: number;
  totalCost: number;
  costPerPerson: number;
  location: string;
  amenities: string[];
  rating: number;
  starRating: number;
  score: number;
  imageUrl?: string;
}

export function HotelComparison({
  hotelIds,
  filter,
  defaultView = 'ranking',
  groupSize = 4,
  nights = 5,
  checkIn,
  checkOut,
}: HotelComparisonProps) {
  const [activeView, setActiveView] = useState<'table' | 'ranking'>(defaultView);
  const [guests, setGuests] = useState(groupSize);
  const [nightsCount, setNightsCount] = useState(nights);
  const [sortBy, setSortBy] = useState<string>('score');
  const [hotels, setHotels] = useState<HotelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAndCalculateHotels();
  }, [guests, nightsCount, hotelIds, checkIn, checkOut, filter]);

  const fetchAndCalculateHotels = async () => {
    try {
      setLoading(true);
      
      const defaultCheckIn = new Date();
      defaultCheckIn.setDate(defaultCheckIn.getDate() + 7);
      const defaultCheckOut = new Date(defaultCheckIn);
      defaultCheckOut.setDate(defaultCheckOut.getDate() + 7);
      
      const checkInDate = checkIn || defaultCheckIn.toISOString().split('T')[0];
      const checkOutDate = checkOut || defaultCheckOut.toISOString().split('T')[0];
      
      const params = new URLSearchParams({
        cityName: 'Telluride',
        countryCode: 'US',
        limit: hotelIds && hotelIds.length > 0 ? hotelIds.length.toString() : '10',
        checkin: checkInDate,
        checkout: checkOutDate,
      });
      
      const response = await fetch(`/api/liteapi/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to load hotels');
      }
      
      const data = await response.json();
      let hotelsData: LiteAPIHotel[] = data.data || [];
      
      // Apply filters
      if (filter === 'luxury') {
        hotelsData = hotelsData.filter(h => (h.star_rating || 0) >= 4);
      } else if (filter === 'budget') {
        hotelsData = hotelsData.filter(h => (h.star_rating || 0) <= 3);
      }
      
      // If specific hotel IDs provided, filter to those
      if (hotelIds && hotelIds.length > 0) {
        hotelsData = hotelsData.filter(h => hotelIds.includes(h.hotel_id));
      }
      
      if (hotelsData.length === 0) {
        setHotels([]);
        setLoading(false);
        return;
      }
      
      // Fetch min rates
      const hotelIdsList = hotelsData.map(h => h.hotel_id);
      const ratesParams = new URLSearchParams({
        hotelIds: hotelIdsList.join(','),
        checkIn: checkInDate,
        checkOut: checkOutDate,
        adults: '2',
      });
      
      const ratesResponse = await fetch(`/api/hotels/min-rates?${ratesParams.toString()}`);
      const nightsCalc = Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24));
      
      // Build price map
      const prices: Record<string, number> = {};
      if (ratesResponse.ok) {
        const ratesData = await ratesResponse.json();
        if (ratesData.data && Array.isArray(ratesData.data)) {
          ratesData.data.forEach((item: any) => {
            if (item.hotelId && item.price) {
              prices[item.hotelId] = nightsCalc > 0 ? item.price / nightsCalc : item.price;
            }
          });
        }
      }
      
      // Calculate hotel data
      const hotelComparisons: HotelData[] = hotelsData.map((hotel) => {
        const costPerNight = prices[hotel.hotel_id] || (hotel.star_rating || 3) * 150;
        const totalCost = costPerNight * nightsCount;
        const costPerPerson = totalCost / guests;
        
        const location = hotel.address?.city || 'Telluride';
        const amenities = hotel.amenities?.slice(0, 4).map(a => a.name || a) || ['Mountain views'];
        const rating = hotel.review_score || 4.0;
        const starRating = hotel.star_rating || 3;
        const imageUrl = hotel.images?.[0]?.url || hotel.images?.[0]?.thumbnail || '';
        
        // Calculate score
        const priceScore = 100 - (costPerNight / 10);
        const ratingScore = rating * 20;
        const amenityScore = amenities.length * 10;
        const locationScore = location.includes('Mountain Village') ? 90 : 70;
        const spaceScore = 75;
        const score = (priceScore + ratingScore + amenityScore + locationScore + spaceScore) / 5;
        
        return {
          hotelId: hotel.hotel_id,
          name: hotel.name || 'Hotel',
          price: costPerNight,
          totalCost,
          costPerPerson,
          location,
          amenities,
          rating,
          starRating,
          score,
          imageUrl,
        };
      });
      
      hotelComparisons.sort((a, b) => {
        if (sortBy === 'price') return a.price - b.price;
        if (sortBy === 'score') return b.score - a.score;
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'costPerPerson') return a.costPerPerson - b.costPerPerson;
        return 0;
      });
      
      setHotels(hotelComparisons.slice(0, 10));
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

  const getBestFor = (criteria: 'price' | 'rating' | 'score') => {
    if (hotels.length === 0) return null;
    if (criteria === 'price') {
      return hotels.reduce((best, current) => current.price < best.price ? current : best);
    }
    if (criteria === 'rating') {
      return hotels.reduce((best, current) => current.rating > best.rating ? current : best);
    }
    return hotels[0];
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
            <CardTitle className="text-2xl">Hotel Comparison</CardTitle>
            <p className="text-neutral-600 mt-1">
              Compare hotels side-by-side with real-time pricing
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* View Toggle */}
        <div className="flex gap-2 border-b border-neutral-200">
          <button
            onClick={() => setActiveView('ranking')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeView === 'ranking'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <List className="w-4 h-4 inline mr-2" />
            Ranked List
          </button>
          <button
            onClick={() => setActiveView('table')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeView === 'table'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Table className="w-4 h-4 inline mr-2" />
            Table View
          </button>
        </div>

        {/* Inputs */}
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

        {hotels.length > 0 && (
          <div className="mt-6 space-y-4">
            {/* Ranking View */}
            {activeView === 'ranking' && (
              <div className="border-t border-neutral-200 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Rankings for {guests} Guests, {nightsCount} Nights
                  </h3>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      fetchAndCalculateHotels();
                    }}
                    className="px-3 py-2 border-2 border-neutral-300 rounded-lg text-sm"
                  >
                    <option value="costPerPerson">Sort by Cost/Person</option>
                    <option value="score">Sort by Score</option>
                    <option value="price">Sort by Price</option>
                    <option value="rating">Sort by Rating</option>
                  </select>
                </div>
                <div className="space-y-3">
                  {hotels.map((hotel, index) => (
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
                              <div className="flex items-center gap-3 mt-1">
                                <div className="flex items-center gap-1 text-sm">
                                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                  <span>{hotel.rating.toFixed(1)}</span>
                                </div>
                                <div className="text-sm text-neutral-600">
                                  {hotel.starRating}-star
                                </div>
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Table View */}
            {activeView === 'table' && (
              <div className="border-t border-neutral-200 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900">Comparison Table</h3>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      fetchAndCalculateHotels();
                    }}
                    className="px-3 py-2 border-2 border-neutral-300 rounded-lg text-sm"
                  >
                    <option value="score">Sort by Score</option>
                    <option value="price">Sort by Price</option>
                    <option value="rating">Sort by Rating</option>
                    <option value="costPerPerson">Sort by Cost/Person</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-neutral-200">
                        <th className="text-left p-3 font-semibold text-neutral-900">Hotel</th>
                        <th className="text-left p-3 font-semibold text-neutral-900">Price/Night</th>
                        <th className="text-left p-3 font-semibold text-neutral-900">Per Person</th>
                        <th className="text-left p-3 font-semibold text-neutral-900">Location</th>
                        <th className="text-left p-3 font-semibold text-neutral-900">Rating</th>
                        <th className="text-left p-3 font-semibold text-neutral-900">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hotels.map((hotel) => (
                        <tr 
                          key={hotel.hotelId} 
                          onClick={() => window.location.href = `/places-to-stay/${hotel.hotelId}`}
                          className="border-b border-neutral-100 cursor-pointer hover:bg-primary-50 transition-colors"
                        >
                          <td className="p-3">
                            <div className="font-semibold text-neutral-900">{hotel.name}</div>
                            <div className="text-sm text-neutral-600">{hotel.starRating}-star</div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-primary-600">
                              {formatCurrency(hotel.price)}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-primary-600">
                              {formatCurrency(hotel.costPerPerson)}
                            </div>
                            <div className="text-xs text-neutral-500">
                              {formatCurrency(hotel.totalCost)} total
                            </div>
                          </td>
                          <td className="p-3 text-sm text-neutral-700">{hotel.location}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-semibold">{hotel.rating.toFixed(1)}</span>
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
            )}

            {/* Best Options Summary */}
            <div className="border-t border-neutral-200 pt-4">
              <div className="grid gap-3 md:grid-cols-2">
                {getBestFor('price') && (
                  <div className="p-4 border-2 border-primary-200 bg-primary-50 rounded-lg">
                    <div className="font-semibold text-neutral-900 mb-1">Best for Budget</div>
                    <div className="text-lg font-bold text-primary-600">
                      {getBestFor('price')?.name}
                    </div>
                    <div className="text-sm text-neutral-600 mt-1">
                      {formatCurrency(getBestFor('price')?.costPerPerson || 0)} per person
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
                      {getBestFor('rating')?.rating.toFixed(1)}/5.0 rating
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CTA */}
            {hotels[0] && (
              <div className="border-t border-neutral-200 pt-4">
                <ArticleBookingWidget
                  hotelId={hotels[0].hotelId}
                  hotelName={hotels[0].name}
                  variant="default"
                  title={`Book ${hotels[0].name}`}
                  description={`Best value at ${formatCurrency(hotels[0].costPerPerson)} per person`}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

