'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Building2, Star, Users, Calendar, MapPin, Check, ChevronDown, ChevronUp, Award, TrendingUp, Wallet } from 'lucide-react';
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
  title = 'Compare Top Properties',
}: HotelComparisonProps) {
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
          score: combinedScore,
          imageUrl,
        };
      });
      
      // Sort by combined score
      hotelComparisons.sort((a, b) => {
        if (Math.abs(b.score - a.score) > 0.01) return b.score - a.score;
        if (b.rating !== a.rating) return b.rating - a.rating;
        return a.costPerPerson - b.costPerPerson;
      });
      
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
  
  // Calculate badges for each hotel
  const getBadges = () => {
    if (hotels.length === 0) return {};
    
    const highestRated = hotels.reduce((a, b) => a.rating > b.rating ? a : b);
    const lowestPrice = hotels.reduce((a, b) => a.costPerPerson < b.costPerPerson ? a : b);
    const bestValue = hotels.reduce((a, b) => {
      const aValue = a.rating / (a.costPerPerson / 100);
      const bValue = b.rating / (b.costPerPerson / 100);
      return aValue > bValue ? a : b;
    });
    
    return {
      [highestRated.hotelId]: { type: 'rating', label: 'Top Rated', icon: Award, color: 'amber' },
      [lowestPrice.hotelId]: lowestPrice.hotelId !== highestRated.hotelId 
        ? { type: 'price', label: 'Best Price', icon: Wallet, color: 'emerald' } 
        : null,
      [bestValue.hotelId]: bestValue.hotelId !== highestRated.hotelId && bestValue.hotelId !== lowestPrice.hotelId
        ? { type: 'value', label: 'Best Value', icon: TrendingUp, color: 'blue' }
        : null,
    };
  };

  const badges = getBadges();

  if (loading) {
    return (
      <Card className="my-12 not-prose border-0 shadow-xl bg-gradient-to-br from-slate-50 to-slate-100">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-slate-600">Comparing properties...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || hotels.length === 0) {
    return (
      <Card className="my-12 not-prose border-0 shadow-xl bg-gradient-to-br from-slate-50 to-slate-100">
        <CardContent className="py-12">
          <div className="text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">{error || 'No properties found matching your criteria.'}</p>
            <a
              href="/places-to-stay"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Browse All Properties
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="my-12 not-prose border-0 shadow-xl bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white pb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">{title}</CardTitle>
              <p className="text-slate-300 mt-1 text-sm">
                {nightsCount} nights • {guests} {guests === 1 ? 'guest' : 'guests'} • {format(new Date(checkIn), 'MMM d')} - {format(new Date(checkOut), 'MMM d')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1 text-sm text-slate-300 hover:text-white transition-colors"
          >
            {showSettings ? 'Hide' : 'Edit'} dates
            {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        
        {/* Expandable Settings */}
        {showSettings && (
          <div className="mt-6 pt-6 border-t border-slate-700 grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                <Users className="w-3.5 h-3.5 inline mr-1" />
                Guests
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value) || 2)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                Check-In
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                Check-Out
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-6">
        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {hotels.map((hotel, index) => {
            const badge = badges[hotel.hotelId];
            
            return (
              <div
                key={hotel.hotelId}
                className="group relative bg-white rounded-2xl border-2 border-slate-200 overflow-hidden hover:border-slate-400 hover:shadow-xl transition-all duration-300"
              >
                {/* Badge */}
                {badge && (
                  <div className={`absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shadow-lg ${
                    badge.color === 'amber' ? 'bg-amber-500 text-white' :
                    badge.color === 'emerald' ? 'bg-emerald-500 text-white' :
                    'bg-blue-500 text-white'
                  }`}>
                    <badge.icon className="w-3 h-3" />
                    {badge.label}
                  </div>
                )}

                {/* Rank Badge */}
                <div className="absolute top-3 right-3 z-10 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                  #{index + 1}
                </div>

                {/* Image */}
                <div className="relative h-44 bg-slate-100">
                  {hotel.imageUrl ? (
                    <img
                      src={hotel.imageUrl}
                      alt={hotel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                  
                  {/* Rating overlay */}
                  {hotel.rating > 0 && (
                    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur px-2.5 py-1 rounded-lg shadow-lg">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-slate-900">{hotel.rating.toFixed(1)}</span>
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {hotel.reviewCount > 0 && (
                          <span className="text-xs text-slate-500">({hotel.reviewCount})</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Name & Stars */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-slate-700 transition-colors">
                      {hotel.name}
                    </h3>
                    <div className="flex items-center gap-0.5 mt-1">
                      {[...Array(hotel.starRating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>

                  {/* Location */}
                  {hotel.location && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="line-clamp-1">{hotel.location}</span>
                    </div>
                  )}

                  {/* Amenities */}
                  {hotel.amenities.length > 0 && (
                    <div className="space-y-1">
                      {hotel.amenities.slice(0, 3).map((amenity, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-slate-700">
                          <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                          <span className="line-clamp-1">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="pt-3 border-t border-slate-200">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-xs text-slate-500">Per Person</span>
                      <span className="text-2xl font-bold text-slate-900">
                        {formatCurrency(hotel.costPerPerson)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-xs text-slate-500">
                      <span>{nightsCount} nights total</span>
                      <span className="font-semibold">{formatCurrency(hotel.totalCost)}</span>
                    </div>
                    <div className="text-xs text-slate-400 text-right mt-0.5">
                      {formatCurrency(hotel.price)}/night
                    </div>
                  </div>

                  {/* CTA */}
                  <a
                    href={`/places-to-stay/${hotel.hotelId}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${guests}&rooms=1`}
                    className="block w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-4 rounded-xl text-center transition-colors text-sm"
                  >
                    View Details & Book
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Compare All CTA */}
        <div className="mt-6 text-center">
          <a
            href={`/places-to-stay?checkin=${checkIn}&checkout=${checkOut}&guests=${guests}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            See all properties in Telluride
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
