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
      
      let hotelsData: LiteAPIHotel[] = [];
      
      // If specific hotel IDs provided, fetch them directly for more reliable results
      if (hotelIds && hotelIds.length > 0) {
        console.log('[HotelComparison] Fetching hotels by ID:', hotelIds);
        
        const hotelPromises = hotelIds.map(async (id) => {
          try {
            // Use the /api/hotels/details endpoint which has caching
            const response = await fetch(`/api/hotels/details?hotelId=${id}`);
            if (response.ok) {
              const data = await response.json();
              const hotel = data.data || data;
              console.log(`[HotelComparison] Hotel ${id} response:`, {
                name: hotel?.name,
                hotel_id: hotel?.hotel_id,
                star_rating: hotel?.star_rating,
                hasImages: !!hotel?.images?.length,
              });
              return hotel;
            }
            console.warn(`[HotelComparison] Hotel ${id} fetch failed:`, response.status);
            return null;
          } catch (err) {
            console.error(`[HotelComparison] Hotel ${id} error:`, err);
            return null;
          }
        });
        
        const results = await Promise.all(hotelPromises);
        hotelsData = results.filter((h): h is LiteAPIHotel => h !== null && h.name);
        console.log('[HotelComparison] Valid hotels loaded:', hotelsData.length);
        
        // If no valid hotels found, provide specific error feedback
        if (hotelsData.length === 0 && hotelIds.length > 0) {
          console.error('[HotelComparison] No hotels loaded despite valid IDs. API may be failing.');
          setError('Unable to load hotel details. Please try refreshing the page.');
          setLoading(false);
          return;
        }
      } else {
        // Fall back to city search for filter-based queries
        const params = new URLSearchParams({
          cityName: 'Telluride',
          countryCode: 'US',
          limit: '20',
          checkin: checkIn,
          checkout: checkOut,
        });
        
        const response = await fetch(`/api/liteapi/search?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to load hotels');
        }
        
        const data = await response.json();
        hotelsData = data.data || [];
        
        // Apply filters only for city searches
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
        ? { type: 'value', label: 'Best Value', icon: TrendingUp, color: 'secondary' }
        : null,
    };
  };

  const badges = getBadges();

  if (loading) {
    return (
      <Card className="my-12 not-prose border-0 shadow-xl bg-gradient-to-br from-primary-50 to-primary-100/50">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-neutral-600">Comparing properties...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || hotels.length === 0) {
    return (
      <Card className="my-12 not-prose border-0 shadow-xl bg-gradient-to-br from-primary-50 to-primary-100/50">
        <CardContent className="py-12">
          <div className="text-center">
            <Building2 className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600 mb-4">{error || 'No properties found matching your criteria.'}</p>
            <a
              href="/places-to-stay"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Browse All Properties
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="my-12 not-prose border-0 shadow-xl bg-gradient-to-br from-primary-50 to-primary-100/50 overflow-hidden">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-primary-700 to-primary-800 text-white pb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">{title}</CardTitle>
              <p className="text-primary-100 mt-1 text-sm">
                {nightsCount} nights • {guests} {guests === 1 ? 'guest' : 'guests'} • {format(new Date(checkIn), 'MMM d')} - {format(new Date(checkOut), 'MMM d')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1 text-sm text-primary-200 hover:text-white transition-colors"
          >
            {showSettings ? 'Hide' : 'Edit'} dates
            {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        
        {/* Expandable Settings */}
        {showSettings && (
          <div className="mt-6 pt-6 border-t border-primary-600 grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-xs text-primary-200 mb-1.5">
                <Users className="w-3.5 h-3.5 inline mr-1" />
                Guests
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value) || 2)}
                className="w-full px-3 py-2 bg-primary-800 border border-primary-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
            <div>
              <label className="block text-xs text-primary-200 mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                Check-In
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-3 py-2 bg-primary-800 border border-primary-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
            <div>
              <label className="block text-xs text-primary-200 mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                Check-Out
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn}
                className="w-full px-3 py-2 bg-primary-800 border border-primary-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
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
                className="group relative bg-white rounded-2xl border-2 border-neutral-200 overflow-hidden hover:border-primary-400 hover:shadow-xl transition-all duration-300"
              >
                {/* Badge */}
                {badge && (
                  <div className={`absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shadow-lg ${
                    badge.color === 'amber' ? 'bg-accent-500 text-white' :
                    badge.color === 'emerald' ? 'bg-primary-500 text-white' :
                    'bg-secondary-500 text-white'
                  }`}>
                    <badge.icon className="w-3 h-3" />
                    {badge.label}
                  </div>
                )}

                {/* Rank Badge */}
                <div className="absolute top-3 right-3 z-10 w-8 h-8 bg-primary-700 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                  #{index + 1}
                </div>

                {/* Image */}
                <div className="relative h-44 bg-neutral-100">
                  {hotel.imageUrl ? (
                    <img
                      src={hotel.imageUrl}
                      alt={hotel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-neutral-300" />
                    </div>
                  )}
                  
                  {/* Rating overlay */}
                  {hotel.rating > 0 && (
                    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur px-2.5 py-1 rounded-lg shadow-lg">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-neutral-900">{hotel.rating.toFixed(1)}</span>
                        <Star className="w-3.5 h-3.5 fill-accent-400 text-accent-400" />
                        {hotel.reviewCount > 0 && (
                          <span className="text-xs text-neutral-500">({hotel.reviewCount})</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Name & Stars */}
                  <div>
                    <h3 className="font-bold text-neutral-900 text-base leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-primary-700 transition-colors">
                      {hotel.name}
                    </h3>
                    <div className="flex items-center gap-0.5 mt-1">
                      {[...Array(hotel.starRating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-accent-400 text-accent-400" />
                      ))}
                    </div>
                  </div>

                  {/* Location */}
                  {hotel.location && (
                    <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="line-clamp-1">{hotel.location}</span>
                    </div>
                  )}

                  {/* Amenities */}
                  {hotel.amenities.length > 0 && (
                    <div className="space-y-1">
                      {hotel.amenities.slice(0, 3).map((amenity, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-neutral-700">
                          <Check className="w-3 h-3 text-primary-600 flex-shrink-0" />
                          <span className="line-clamp-1">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="pt-3 border-t border-neutral-200">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-xs text-neutral-500">Per Person</span>
                      <span className="text-2xl font-bold text-neutral-900">
                        {formatCurrency(hotel.costPerPerson)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-xs text-neutral-500">
                      <span>{nightsCount} nights total</span>
                      <span className="font-semibold">{formatCurrency(hotel.totalCost)}</span>
                    </div>
                    <div className="text-xs text-neutral-400 text-right mt-0.5">
                      {formatCurrency(hotel.price)}/night
                    </div>
                  </div>

                  {/* CTA */}
                  <a
                    href={`/places-to-stay/${hotel.hotelId}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${guests}&rooms=1`}
                    className="block w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-xl text-center transition-colors text-sm"
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
            className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-primary-700 transition-colors"
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
