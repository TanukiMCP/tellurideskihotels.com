'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Building2, Star, Users, Calendar, MapPin, Wifi, Coffee, Check, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { addDays, format } from 'date-fns';

export interface HotelComparisonProps {
  /** Specific hotel IDs to compare (max 3) */
  hotelIds?: string[];
  /** Filter type */
  filter?: 'luxury' | 'budget' | 'ski-in-ski-out';
  /** Group size for per-person calculations (default: 2) */
  groupSize?: number;
  /** Title for the comparison widget */
  title?: string;
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
  reviewCount: number;
  score: number;
  imageUrl?: string;
}

export function HotelComparison({
  hotelIds,
  filter,
  groupSize = 2,
  title = 'Compare Top Hotels',
}: HotelComparisonProps) {
  // Default dates: 7 days from today, 7-night stay
  const defaultCheckInDate = format(addDays(new Date(), 7), 'yyyy-MM-dd');
  const defaultCheckOutDate = format(addDays(new Date(), 14), 'yyyy-MM-dd');
  
  const [guests, setGuests] = useState(groupSize);
  const [checkIn, setCheckIn] = useState(defaultCheckInDate);
  const [checkOut, setCheckOut] = useState(defaultCheckOutDate);
  const [hotels, setHotels] = useState<HotelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchAndCalculateHotels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guests, checkIn, checkOut, hotelIds, filter]);

  const fetchAndCalculateHotels = async () => {
    try {
      setLoading(true);
      
      const nightsCalc = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
      
      const params = new URLSearchParams({
        cityName: 'Telluride',
        countryCode: 'US',
        limit: hotelIds && hotelIds.length > 0 ? hotelIds.length.toString() : '20',
        checkin: checkIn,
        checkout: checkOut,
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
      } else if (filter === 'ski-in-ski-out') {
        hotelsData = hotelsData.filter(h => {
          const name = (h.name || '').toLowerCase();
          const address = (h.address?.full || '').toLowerCase();
          return name.includes('mountain village') || 
                 address.includes('mountain village') ||
                 name.includes('slopeside') ||
                 address.includes('slopeside');
        });
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
        checkIn: checkIn,
        checkOut: checkOut,
        adults: guests.toString(),
      });
      
      const ratesResponse = await fetch(`/api/hotels/min-rates?${ratesParams.toString()}`);
      
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
        const totalCost = costPerNight * nightsCalc;
        const costPerPerson = totalCost / guests;
        
        const location = hotel.address?.city || 'Telluride';
        const amenities = hotel.amenities?.slice(0, 5).map(a => a.name || a) || [];
        const rating = hotel.review_score || 0;
        const starRating = hotel.star_rating || 3;
        const reviewCount = hotel.review_count || 0;
        const imageUrl = hotel.images?.[0]?.url || hotel.images?.[0]?.thumbnail || '';
        
        // Calculate combined score: rating × log(review_count + 1)
        // This prevents hotels with 1 review and perfect rating from dominating
        const combinedScore = rating * Math.log10(reviewCount + 1);
        
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
          reviewCount,
          score: combinedScore, // Combined rating + volume score
          imageUrl,
        };
      });
      
      // Sort by combined score (rating × volume), then by rating, then by cost per person
      hotelComparisons.sort((a, b) => {
        // Primary: combined score (rating × log(review_count + 1))
        if (Math.abs(b.score - a.score) > 0.01) {
          return b.score - a.score;
        }
        // Secondary: if scores are very close, prefer higher rating
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        // Tertiary: if ratings are equal, prefer lower cost
        return a.costPerPerson - b.costPerPerson;
      });
      
      // Take top 3 for comparison
      setHotels(hotelComparisons.slice(0, 3));
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

  const nightsCount = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
  
  const getBestValue = () => {
    if (hotels.length === 0) return null;
    // Best value = highest rating for the price
    return hotels.reduce((best, current) => {
      const bestValueScore = best.rating / best.costPerPerson;
      const currentValueScore = current.rating / current.costPerPerson;
      return currentValueScore > bestValueScore ? current : best;
    });
  };

  const bestValue = getBestValue();

  if (loading) {
    return (
      <Card className="my-12 not-prose">
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
      <Card className="my-12 not-prose">
        <CardContent className="py-8">
          <p className="text-neutral-600 text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (hotels.length === 0) {
    return (
      <Card className="my-12 not-prose">
        <CardContent className="py-8">
          <p className="text-neutral-600 text-center">No hotels found matching your criteria.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="my-12 not-prose border-2 border-primary-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary-50 to-primary-100 border-b border-primary-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center shadow-md">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-neutral-900">{title}</CardTitle>
              <p className="text-neutral-600 mt-1 text-sm">
                Top 3 hotels ranked by guest reviews
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium underline"
          >
            {showSettings ? 'Hide' : 'Adjust'} Search Settings
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Disclaimer */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Pricing Information</p>
            <p>
              Rates shown are based on a {nightsCount}-night stay from {format(new Date(checkIn), 'MMM d')} to {format(new Date(checkOut), 'MMM d, yyyy')} for {guests} {guests === 1 ? 'guest' : 'guests'}. 
              For the most accurate pricing and availability, please click "Check Availability" on your preferred hotel.
            </p>
          </div>
        </div>

        {/* Adjustable Settings */}
        {showSettings && (
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg space-y-4">
            <h4 className="font-semibold text-neutral-900 text-sm">Adjust Search Parameters</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                  <Users className="w-3.5 h-3.5 inline mr-1" />
                  Number of Guests
                </label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value) || 2)}
                  className="w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                  <Calendar className="w-3.5 h-3.5 inline mr-1" />
                  Check-In Date
                </label>
                <Input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                  <Calendar className="w-3.5 h-3.5 inline mr-1" />
                  Check-Out Date
                </label>
                <Input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn}
                  className="w-full text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Amazon-Style Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {hotels.map((hotel, index) => {
            const isBestValue = bestValue?.hotelId === hotel.hotelId;
            
            return (
              <div
                key={hotel.hotelId}
                className={`relative border-2 rounded-lg overflow-hidden bg-white hover:shadow-lg transition-shadow ${
                  isBestValue ? 'border-primary-500 ring-2 ring-primary-200' : 'border-neutral-200'
                }`}
              >
                {/* Best Value Badge */}
                {isBestValue && (
                  <div className="absolute top-0 left-0 right-0 bg-primary-600 text-white text-xs font-bold text-center py-1.5 z-10">
                    ⭐ BEST VALUE
                  </div>
                )}
                
                {/* Ranking Badge */}
                <div className={`absolute ${isBestValue ? 'top-8' : 'top-2'} right-2 bg-neutral-900 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm z-10`}>
                  #{index + 1}
                </div>

                {/* Hotel Image */}
                <div className={`relative w-full ${isBestValue ? 'h-48 mt-8' : 'h-48'} bg-neutral-100`}>
                  {hotel.imageUrl ? (
                    <img
                      src={hotel.imageUrl}
                      alt={hotel.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-neutral-300" />
                    </div>
                  )}
                  
                  {/* Guest Rating Badge */}
                  {hotel.rating > 0 && (
                    <div className="absolute bottom-2 left-2 bg-primary-600 text-white px-2.5 py-1 rounded-md shadow-md font-semibold text-sm">
                      {hotel.rating.toFixed(1)} ★
                    </div>
                  )}
                </div>

                {/* Hotel Details */}
                <div className="p-4 space-y-3">
                  {/* Hotel Name */}
                  <h3 className="font-bold text-neutral-900 text-base leading-tight line-clamp-2 min-h-[2.5rem]">
                    {hotel.name}
                  </h3>

                  {/* Star Rating */}
                  <div className="flex items-center gap-1">
                    {[...Array(hotel.starRating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-xs text-neutral-600 ml-1">({hotel.starRating}-star)</span>
                  </div>

                  {/* Location */}
                  {hotel.location && (
                    <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="line-clamp-1">{hotel.location}</span>
                    </div>
                  )}

                  {/* Amenities */}
                  {hotel.amenities.length > 0 && (
                    <div className="space-y-1">
                      {hotel.amenities.slice(0, 3).map((amenity, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-neutral-700">
                          <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                          <span className="line-clamp-1">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="pt-3 border-t border-neutral-200 space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-neutral-600">Per Person:</span>
                      <span className="text-xl font-bold text-primary-600">
                        {formatCurrency(hotel.costPerPerson)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-neutral-600">Total ({nightsCount} {nightsCount === 1 ? 'night' : 'nights'}):</span>
                      <span className="text-sm font-semibold text-neutral-700">
                        {formatCurrency(hotel.totalCost)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-neutral-600">Per Night:</span>
                      <span className="text-xs text-neutral-600">
                        {formatCurrency(hotel.price)}
                      </span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <a
                    href={`/places-to-stay/${hotel.hotelId}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${guests}&rooms=1`}
                    className="block w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors text-sm"
                  >
                    Check Availability
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

