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
  const [guests, setGuests] = useState(groupSize);
  // Initialize dates as empty to avoid hydration mismatch (new Date() differs server vs client)
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [hotels, setHotels] = useState<HotelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Set default dates client-side only to avoid hydration mismatch
  useEffect(() => {
    const defaultCheckInDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');
    const defaultCheckOutDate = format(addDays(new Date(), 37), 'yyyy-MM-dd');
    setCheckIn(defaultCheckInDate);
    setCheckOut(defaultCheckOutDate);
    setIsInitialized(true);
  }, []);

  // Fetch data only after dates are initialized
  useEffect(() => {
    if (!isInitialized || !checkIn || !checkOut) return;
    fetchAndCalculateHotels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, guests, checkIn, checkOut, hotelIds, filter]);

  const fetchAndCalculateHotels = async () => {
    try {
      setLoading(true);
      
      // Validate dates
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        throw new Error('Invalid dates provided');
      }
      
      if (checkInDate < today) {
        throw new Error('Check-in date must be today or later');
      }
      
      if (checkOutDate <= checkInDate) {
        throw new Error('Check-out date must be after check-in date');
      }
      
      const nightsCalc = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (nightsCalc < 1) {
        throw new Error('Stay must be at least 1 night');
      }
      
      console.log('[HotelComparison] Validated dates:', {
        checkIn,
        checkOut,
        nights: nightsCalc,
        guests,
      });
      
      let hotelsData: LiteAPIHotel[] = [];
      
      // If specific hotel IDs provided, fetch them directly for more reliable results
      if (hotelIds && hotelIds.length > 0) {
        const hotelPromises = hotelIds.map(async (id) => {
          try {
            const response = await fetch(`/api/liteapi/hotel?hotelId=${id}`);
            if (response.ok) {
              const data = await response.json();
              return data.data || data;
            }
            return null;
          } catch {
            return null;
          }
        });
        
        const results = await Promise.all(hotelPromises);
        hotelsData = results.filter((h): h is LiteAPIHotel => h !== null);
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
        setError('No hotels found matching your criteria. Try adjusting your search filters or dates.');
        setHotels([]);
        setLoading(false);
        return;
      }
      
      // Fetch min rates - CRITICAL: This API returns PER-NIGHT prices already
      const hotelIdsList = hotelsData.map(h => h.hotel_id);
      const ratesParams = new URLSearchParams({
        hotelIds: hotelIdsList.join(','),
        checkIn: checkIn,
        checkOut: checkOut,
        adults: guests.toString(),
      });
      
      console.log('[HotelComparison] Fetching rates:', {
        hotelIds: hotelIdsList,
        checkIn,
        checkOut,
        adults: guests,
        nights: nightsCalc,
      });
      
      // Build price map - API returns per-night prices
      const prices: Record<string, number> = {};
      
      try {
        const ratesResponse = await fetch(`/api/hotels/min-rates?${ratesParams.toString()}`);
        const responseData = await ratesResponse.json();
        
        if (ratesResponse.ok) {
          console.log('[HotelComparison] Rates response:', responseData);
          
          // Check if response has error field (even with 200 status)
          if (responseData.error) {
            console.error('[HotelComparison] Response contains error:', responseData.error, responseData);
            // Continue anyway - show hotels without prices
          } else if (responseData.data && Array.isArray(responseData.data)) {
            responseData.data.forEach((item: any) => {
              if (item.hotelId && item.price && item.price > 0) {
                // API returns per-night price already (from LiteAPI min-rates endpoint)
                prices[item.hotelId] = item.price;
                console.log(`[HotelComparison] Price for ${item.hotelId}: $${item.price}/night`);
              }
            });
          }
        } else {
          console.error('[HotelComparison] Rates API error:', {
            status: ratesResponse.status,
            statusText: ratesResponse.statusText,
            error: responseData.error,
            received: responseData.received,
            url: `/api/hotels/min-rates?${ratesParams.toString()}`,
          });
          // Continue anyway - show hotels without prices
        }
      } catch (err) {
        console.error('[HotelComparison] Error fetching rates:', err);
        // Continue anyway - show hotels without prices
      }
      
      console.log('[HotelComparison] Price map:', prices, `(${Object.keys(prices).length} hotels with prices out of ${hotelsData.length} total)`);
      
      // Calculate hotel data - Show ALL hotels, prices optional
      const hotelComparisons: HotelData[] = hotelsData.map((hotel) => {
        const costPerNight = prices[hotel.hotel_id] && prices[hotel.hotel_id] > 0 ? prices[hotel.hotel_id] : 0;
        const totalCost = costPerNight > 0 ? costPerNight * nightsCalc : 0;
        const costPerPerson = costPerNight > 0 ? totalCost / guests : 0;
        
        const location = hotel.address?.city || hotel.address?.line1?.split(',')[0] || 'Telluride';
        const amenities = hotel.amenities?.slice(0, 5).map(a => a.name || a) || [];
        const rating = hotel.review_score || 0;
        const starRating = hotel.star_rating || 0;
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
      
      // Sort by: hotels with prices first, then by combined score
      hotelComparisons.sort((a, b) => {
        // Hotels with prices come first
        if ((a.price > 0) !== (b.price > 0)) {
          return a.price > 0 ? -1 : 1;
        }
        // Then by combined score
        if (Math.abs(b.score - a.score) > 0.01) return b.score - a.score;
        if (b.rating !== a.rating) return b.rating - a.rating;
        // If both have prices, sort by cost per person
        if (a.price > 0 && b.price > 0) {
          return a.costPerPerson - b.costPerPerson;
        }
        return 0;
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

                  {/* Pricing - Only show if price available */}
                  {hotel.price > 0 ? (
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
                  ) : (
                    <div className="pt-3 border-t border-neutral-200">
                      <p className="text-xs text-neutral-500 text-center py-2">
                        Rates vary by date. Click to view current availability.
                      </p>
                    </div>
                  )}

                  {/* CTA */}
                  <a
                    href={`/places-to-stay/${hotel.hotelId}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${guests}&rooms=1`}
                    className="block w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-xl text-center transition-colors text-sm"
                  >
                    View Details & Rates
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
