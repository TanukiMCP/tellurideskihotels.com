import { useState, useEffect, useMemo } from 'react';
import { HotelCard } from '@/components/lodging/HotelCard';
import { Card } from '@/components/ui/Card';
import { Star, MapPin, MessageSquare, Award } from 'lucide-react';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { getHotelMainImage, formatHotelAddress } from '@/lib/liteapi/utils';
import { formatCurrency } from '@/lib/utils';
import { format, addDays } from 'date-fns';

interface HotelGridProps {
  filter?: 'ski-in-ski-out' | 'luxury' | 'budget' | 'downtown' | 'mountain-village' | 'family-friendly';
  hotelIds?: string[]; // Manual curation: specific hotel IDs to display
  limit?: number;
  checkIn?: string;
  checkOut?: string;
  title?: string;
  /** Minimum price per night to display (filters results after fetching rates) */
  minPrice?: number;
  /** Maximum price per night to display (filters results after fetching rates) */
  maxPrice?: number;
}

// Single Hotel Showcase - Full width, rich content
function SingleHotelShowcase({ 
  hotel, 
  minPrice, 
  currency, 
  nights,
  checkIn,
  checkOut 
}: { 
  hotel: LiteAPIHotel; 
  minPrice?: number; 
  currency: string; 
  nights: number;
  checkIn: string;
  checkOut: string;
}) {
  const imageUrl = getHotelMainImage(hotel);
  const address = formatHotelAddress(hotel);
  const rating = hotel.review_score || 0;
  const reviewCount = hotel.review_count || 0;
  const starRating = hotel.star_rating || 0;

  // Strip HTML from description
  const stripHTML = (html: string): string => {
    if (!html) return '';
    let text = html.replace(/<[^>]*>/g, '');
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\|/g, ' • ')
      .replace(/\s+/g, ' ')
      .trim();
    return text;
  };

  const descriptionText = hotel.description?.text ? stripHTML(hotel.description.text) : '';
  const truncatedDescription = descriptionText.length > 300 
    ? descriptionText.substring(0, 300).trim() + '...'
    : descriptionText;

  const getRatingStyle = (score: number) => {
    if (score >= 9) return 'bg-primary-600 text-white';
    if (score >= 8) return 'bg-primary-500 text-white';
    if (score >= 7) return 'bg-primary-400 text-white';
    if (score >= 6) return 'bg-accent-500 text-white';
    return 'bg-neutral-500 text-white';
  };

  const handleClick = () => {
    window.location.href = `/places-to-stay/${hotel.hotel_id}?checkIn=${checkIn}&checkOut=${checkOut}&adults=2&rooms=1`;
  };

  return (
    <Card className="overflow-hidden rounded-xl border border-neutral-200/60 hover:shadow-2xl transition-all duration-300 group cursor-pointer">
      <div className="grid md:grid-cols-2 gap-0">
        {/* Image Section - Left side, full height */}
        <div className="relative h-[400px] md:h-auto overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100 md:rounded-l-xl">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={hotel.name || 'Property'}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
              <p className="text-neutral-400 text-sm font-medium">No image available</p>
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none z-[10]" />
          
          {/* Rating Badge */}
          {rating > 0 && (
            <div className={`absolute top-4 right-4 z-[20] ${getRatingStyle(rating)} px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-sm font-bold text-base`}>
              {rating.toFixed(1)}
            </div>
          )}
        </div>

        {/* Content Section - Right side */}
        <div className="flex flex-col p-8 bg-white md:rounded-r-xl">
          {/* Header */}
          <div className="mb-6">
            <h3 className="text-3xl font-bold text-neutral-900 mb-3 leading-tight group-hover:text-primary-700 transition-colors" title={hotel.name}>
              {hotel.name}
            </h3>
            
            {/* Star Rating & Location */}
            <div className="flex items-center gap-4 mb-4">
              {starRating > 0 && (
                <div className="flex items-center gap-1">
                  {[...Array(starRating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              )}
              {address && (
                <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                  <MapPin className="w-4 h-4 text-neutral-400" />
                  <span className="line-clamp-1">{address}</span>
                </div>
              )}
            </div>

            {/* Reviews */}
            {reviewCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <MessageSquare className="w-4 h-4 text-neutral-400" />
                <span className="font-semibold text-neutral-700">{reviewCount.toLocaleString()}</span>
                <span>{reviewCount === 1 ? 'review' : 'reviews'}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {truncatedDescription && (
            <div className="mb-6 flex-grow">
              <p className="text-neutral-700 leading-relaxed text-base line-clamp-4">
                {truncatedDescription}
              </p>
            </div>
          )}

          {/* Bottom Section - Price & CTA */}
          <div className="mt-auto pt-6 border-t border-neutral-200">
            {minPrice && minPrice > 0 && (
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary-600">
                    {formatCurrency(minPrice, currency)}
                  </span>
                  <span className="text-sm text-neutral-500">/ night</span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Total: {formatCurrency(minPrice * nights, currency)} for {nights} {nights === 1 ? 'night' : 'nights'}
                </p>
              </div>
            )}
            
            <button
              onClick={handleClick}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-base"
              type="button"
            >
              View Details & Rates
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function HotelGrid({ 
  filter,
  hotelIds,
  limit = 3,
  checkIn,
  checkOut,
  title,
  minPrice: minPriceFilter,
  maxPrice: maxPriceFilter
}: HotelGridProps) {
  const [hotels, setHotels] = useState<LiteAPIHotel[]>([]);
  const [minPrices, setMinPrices] = useState<Record<string, number>>({});
  const [fallbackPrices, setFallbackPrices] = useState<Record<string, number>>({});
  const [computedCheckIn, setComputedCheckIn] = useState<string>('');
  const [computedCheckOut, setComputedCheckOut] = useState<string>('');
  const [isLoadingHotels, setIsLoadingHotels] = useState(true);
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  // Calculate smart default dates on client side only to avoid hydration mismatch
  // Use 60-67 days out (better availability, aligns with liteapi best practices for guaranteed rates)
  useEffect(() => {
    const today = new Date();
    const defaultCheckIn = format(addDays(today, 60), 'yyyy-MM-dd');
    const defaultCheckOut = format(addDays(today, 67), 'yyyy-MM-dd');
    setComputedCheckIn(checkIn || defaultCheckIn);
    setComputedCheckOut(checkOut || defaultCheckOut);
  }, [checkIn, checkOut]);

  // Fetch hotels using correct API endpoint
  useEffect(() => {
    let isMounted = true;
    
    async function fetchHotels() {
      setIsLoadingHotels(true);
      
      try {
        // If hotelIds are provided, fetch those specific hotels
        if (hotelIds && hotelIds.length > 0) {
          const hotelPromises = hotelIds.map(async (hotelId) => {
            try {
              const response = await fetch(`/api/hotels/details?hotelId=${hotelId}`);
              if (response.ok) {
                const data = await response.json();
                return data.data || data;
              }
              return null;
            } catch (err) {
              console.error(`[HotelGrid] Error fetching hotel ${hotelId}:`, err);
              return null;
            }
          });
          
          const fetchedHotels = await Promise.all(hotelPromises);
          const validHotels = fetchedHotels.filter((h): h is LiteAPIHotel => h !== null);
          
          // Filter out hotels without images for manually curated lists (critical for visual quality)
          // Only filter when hotelIds are explicitly provided (manual curation)
          const hotelsWithImages = validHotels.filter((hotel) => {
            const hasImages = hotel.images && hotel.images.length > 0 && 
              hotel.images.some((img) => img.url && img.url.trim() !== '');
            if (!hasImages) {
              console.warn(`[HotelGrid] Filtered out hotel ${hotel.hotel_id} (${hotel.name}) - no images available`);
            }
            return hasImages;
          });
          
          // Keep manually curated hotelIds in their original order (intentional curation)
          // Only include hotels that have images
          if (isMounted) {
            setHotels(hotelsWithImages);
            setIsLoadingHotels(false);
          }
          return;
        }
        
        // Otherwise, use filter-based search
        const searchParams = new URLSearchParams({
          cityName: 'Telluride',
          countryCode: 'US',
          limit: '500',
        });
        
        const hotelsResponse = await fetch(`/api/hotels/search?${searchParams.toString()}`);
        
        if (!hotelsResponse.ok) {
          if (isMounted) {
            setIsLoadingHotels(false);
          }
          return;
        }
        
        const hotelsData = await hotelsResponse.json();
        let candidateHotels: LiteAPIHotel[] = hotelsData.data || [];
        
        // Apply client-side filtering
        if (filter === 'luxury') {
          candidateHotels = candidateHotels.filter((h) => (h.star_rating || 0) >= 4);
        } else if (filter === 'budget') {
          candidateHotels = candidateHotels.filter((h) => (h.star_rating || 0) <= 3);
        } else if (filter === 'ski-in-ski-out') {
          // Actually check for ski-in/ski-out in property names
          candidateHotels = candidateHotels.filter((h) => {
            const name = (h.name || '').toLowerCase();
            const address = (h.address?.full || h.address?.line1 || '').toLowerCase();
            const searchText = `${name} ${address}`;
            
            // Check for ski-in/ski-out variations
            return searchText.includes('ski in') || 
                   searchText.includes('ski-in') ||
                   searchText.includes('skiin') ||
                   searchText.includes('slopeside') ||
                   searchText.includes('slope-side') ||
                   searchText.includes('ski out') ||
                   searchText.includes('ski-out') ||
                   searchText.includes('skiout') ||
                   (searchText.includes('mountain village') && (h.star_rating || 0) >= 4);
          });
        } else if (filter === 'family-friendly') {
          candidateHotels = candidateHotels.filter((h) => (h.star_rating || 0) >= 4);
        }
        
        // Sort by combined score: rating × log(review_count + 1)
        // This prevents hotels with 1 review and perfect rating from dominating
        // while rewarding hotels with both high ratings AND high review volume
        candidateHotels.sort((a, b) => {
          const ratingA = a.review_score || 0;
          const ratingB = b.review_score || 0;
          const countA = a.review_count || 0;
          const countB = b.review_count || 0;
          
          // Calculate combined score: rating × log(review_count + 1)
          // log(1) = 0, log(11) ≈ 1, log(101) ≈ 2, log(1001) ≈ 3
          // This gives weight to popular hotels without letting volume dominate
          const scoreA = ratingA * Math.log10(countA + 1);
          const scoreB = ratingB * Math.log10(countB + 1);
          
          // If scores are equal, prefer higher rating, then higher review count
          if (Math.abs(scoreB - scoreA) < 0.01) {
            if (ratingB !== ratingA) {
              return ratingB - ratingA;
            }
            return countB - countA;
          }
          
          return scoreB - scoreA;
        });
        
        candidateHotels = candidateHotels.slice(0, limit);
        
        if (isMounted) {
          setHotels(candidateHotels);
          setIsLoadingHotels(false);
        }
      } catch (err) {
        console.error('[HotelGrid] Error fetching hotels:', err);
        if (isMounted) {
          setIsLoadingHotels(false);
        }
      }
    }

    fetchHotels();
    
    return () => {
      isMounted = false;
    };
  }, [filter, hotelIds, limit]);

  // Create stable hotel IDs string for dependency
  const hotelIdsString = useMemo(() => {
    return hotels.map(h => h.hotel_id).sort().join(',');
  }, [hotels]);

  // Load fallback prices for all hotels from pricing API (runs once when hotels are loaded)
  useEffect(() => {
    if (hotels.length === 0) {
      setFallbackPrices({});
      return;
    }

    let isMounted = true;

    async function loadFallbackPrices() {
      try {
        // Fetch pricing data from API
        const response = await fetch('/api/hotels/pricing');
        if (!response.ok) {
          console.warn('[HotelGrid] Failed to load pricing data');
          return;
        }

        const pricingData = await response.json();
        
        // Build fallback price map using typical average prices
        const fallbackPriceMap: Record<string, number> = {};
        hotels.forEach(hotel => {
          const hotelPricing = pricingData.hotels?.[hotel.hotel_id];
          if (hotelPricing) {
            const avgPrice = Math.round((hotelPricing.typicalMinPrice + hotelPricing.typicalMaxPrice) / 2);
            fallbackPriceMap[hotel.hotel_id] = avgPrice;
          }
        });

        if (isMounted) {
          setFallbackPrices(fallbackPriceMap);
        }
      } catch (error) {
        console.error('[HotelGrid] Error loading fallback prices:', error);
      }
    }

    loadFallbackPrices();

    return () => {
      isMounted = false;
    };
  }, [hotels]);

  // Fetch min-rates once dates are computed AND hotels are loaded
  useEffect(() => {
    if (!computedCheckIn || !computedCheckOut || hotels.length === 0) {
      return;
    }

    // Validate dates
    const checkInDate = new Date(computedCheckIn);
    const checkOutDate = new Date(computedCheckOut);
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
      return;
    }

    let isMounted = true;
    setIsLoadingRates(true);

    const hotelIds = hotels.map(h => h.hotel_id);
    const ratesParams = new URLSearchParams({
      hotelIds: hotelIds.join(','),
      checkIn: computedCheckIn,
      checkOut: computedCheckOut,
      adults: '2',
    });
    
    fetch(`/api/hotels/min-rates?${ratesParams.toString()}`)
      .then(async res => {
        const responseData = await res.json();
        if (!res.ok) return null;
        return responseData;
      })
      .then(ratesData => {
        if (!isMounted) return;
        
        if (ratesData?.error) {
          setMinPrices({});
          setIsLoadingRates(false);
          return;
        }
        
        const prices: Record<string, number> = {};
        
        // Calculate nights for dividing total price
        const checkInDate = new Date(computedCheckIn);
        const checkOutDate = new Date(computedCheckOut);
        const diffTime = checkOutDate.getTime() - checkInDate.getTime();
        const nightsCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        
        if (ratesData?.data && Array.isArray(ratesData.data)) {
          // NOTE: LiteAPI min-rates returns TOTAL price for the stay, divide by nights for per-night rate
          ratesData.data.forEach((item: { hotelId?: string; price?: number }) => {
            if (item.hotelId && item.price && item.price > 0) {
              const perNightPrice = item.price / nightsCount;
              prices[item.hotelId] = Math.round(perNightPrice * 100) / 100; // Round to 2 decimals
            }
          });
        }
        
        // Store live prices (will be merged with fallback in useMemo)
        setMinPrices(prices);
        setIsLoadingRates(false);
      })
      .catch(() => {
        // On error, use fallback prices so hotels always show prices
        if (isMounted) {
          setMinPrices(fallbackPrices);
          setIsLoadingRates(false);
        }
      });
    
    return () => {
      isMounted = false;
    };
  }, [computedCheckIn, computedCheckOut, hotelIdsString]);

  // Calculate nights for display
  const nights = useMemo(() => {
    if (!computedCheckIn || !computedCheckOut) return 1;
    const checkInDate = new Date(computedCheckIn);
    const checkOutDate = new Date(computedCheckOut);
    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  }, [computedCheckIn, computedCheckOut]);

  // Merge live rates with fallback prices - always show prices (prefer live, use fallback)
  const mergedPrices = useMemo(() => {
    const merged: Record<string, number> = {};
    hotels.forEach(hotel => {
      // Prefer live rate, fallback to typical average price
      merged[hotel.hotel_id] = minPrices[hotel.hotel_id] ?? fallbackPrices[hotel.hotel_id] ?? 0;
    });
    return merged;
  }, [hotels, minPrices, fallbackPrices]);

  // Load pricing data for price range filtering
  const [pricingData, setPricingData] = useState<Record<string, { typicalMinPrice: number; typicalMaxPrice: number }>>({});
  
  useEffect(() => {
    if (hotels.length === 0 || (minPriceFilter === undefined && maxPriceFilter === undefined)) {
      return;
    }

    let isMounted = true;

    async function loadPricingForFiltering() {
      try {
        const response = await fetch('/api/hotels/pricing');
        if (!response.ok) return;
        
        const data = await response.json();
        const pricingMap: Record<string, { typicalMinPrice: number; typicalMaxPrice: number }> = {};
        
        hotels.forEach(hotel => {
          const hotelPricing = data.hotels?.[hotel.hotel_id];
          if (hotelPricing) {
            pricingMap[hotel.hotel_id] = {
              typicalMinPrice: hotelPricing.typicalMinPrice,
              typicalMaxPrice: hotelPricing.typicalMaxPrice,
            };
          }
        });

        if (isMounted) {
          setPricingData(pricingMap);
        }
      } catch (error) {
        console.error('[HotelGrid] Error loading pricing for filtering:', error);
      }
    }

    loadPricingForFiltering();

    return () => {
      isMounted = false;
    };
  }, [hotels, minPriceFilter, maxPriceFilter]);

  // Filter hotels by price range if specified
  // Uses the actual displayed price (mergedPrices) for accurate filtering
  const filteredHotels = useMemo(() => {
    // If no price filters specified, return all hotels
    if (minPriceFilter === undefined && maxPriceFilter === undefined) {
      return hotels;
    }
    
    // Filter hotels using the actual price that will be displayed
    return hotels.filter(hotel => {
      const displayedPrice = mergedPrices[hotel.hotel_id];
      
      // If no price data, check against pricingData typical range as fallback
      if (!displayedPrice || displayedPrice === 0) {
        const hotelPricing = pricingData[hotel.hotel_id];
        if (!hotelPricing) return true; // Include if no pricing data
        
        // Use typical min price for filtering when no live rate
        const typicalPrice = hotelPricing.typicalMinPrice;
        if (minPriceFilter !== undefined && typicalPrice < minPriceFilter) return false;
        if (maxPriceFilter !== undefined && typicalPrice > maxPriceFilter) return false;
        return true;
      }

      // Filter based on actual displayed price
      if (minPriceFilter !== undefined && displayedPrice < minPriceFilter) {
        return false;
      }

      if (maxPriceFilter !== undefined && displayedPrice > maxPriceFilter) {
        return false;
      }

      return true;
    });
  }, [hotels, minPriceFilter, maxPriceFilter, mergedPrices, pricingData]);

  // Determine display mode based on number of filtered hotels
  const displayMode = filteredHotels.length === 1 ? 'single' : filteredHotels.length === 2 ? 'double' : 'triple';
  
  // Check if we're waiting for prices to filter
  const isPriceFilterPending = (minPriceFilter !== undefined || maxPriceFilter !== undefined) && isLoadingRates;

  return (
    <div className="my-12 not-prose">
      {title && (
        <h3 className="text-2xl font-bold text-neutral-900 mb-8">{title}</h3>
      )}
      
      {isLoadingHotels || isPriceFilterPending ? (
        <div className="border-2 border-neutral-200 rounded-lg p-8 text-center bg-neutral-50">
          <p className="text-neutral-600">Loading properties{isPriceFilterPending ? ' and checking prices' : ''}...</p>
        </div>
      ) : filteredHotels.length === 0 ? (
        <div className="border-2 border-neutral-200 rounded-lg p-8 text-center bg-neutral-50">
          <p className="text-neutral-600 mb-2">
            {(minPriceFilter !== undefined || maxPriceFilter !== undefined) 
              ? `No properties found in the ${minPriceFilter ? `$${minPriceFilter}` : '$0'}-${maxPriceFilter ? `$${maxPriceFilter}` : '+'}/night range for selected dates`
              : 'No properties found matching your criteria'}
          </p>
          <a
            href={`/places-to-stay${filter ? `?filter=${filter}` : ''}`}
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            Browse All Properties →
          </a>
        </div>
      ) : (
        <>
          {/* Single Hotel Mode - Full width showcase */}
          {displayMode === 'single' && filteredHotels[0] && (
            <SingleHotelShowcase
              hotel={filteredHotels[0]}
              minPrice={mergedPrices[filteredHotels[0].hotel_id] || undefined}
              currency="USD"
              nights={nights}
              checkIn={computedCheckIn}
              checkOut={computedCheckOut}
            />
          )}

          {/* Double Hotel Mode - 2 column split */}
          {displayMode === 'double' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredHotels.map((hotel) => (
                <HotelCard
                  key={hotel.hotel_id}
                  hotel={hotel}
                  minPrice={mergedPrices[hotel.hotel_id] || undefined}
                  currency="USD"
                  nights={nights}
                  checkInDate={computedCheckIn || undefined}
                  checkOutDate={computedCheckOut || undefined}
                  priceLoading={isLoadingRates && !fallbackPrices[hotel.hotel_id]}
                  onSelect={(id) => {
                    const checkInDate = computedCheckIn || format(addDays(new Date(), 60), 'yyyy-MM-dd');
                    const checkOutDate = computedCheckOut || format(addDays(new Date(), 67), 'yyyy-MM-dd');
                    window.location.href = `/places-to-stay/${id}?checkIn=${checkInDate}&checkOut=${checkOutDate}&adults=2&rooms=1`;
                  }}
                />
              ))}
            </div>
          )}

          {/* Triple Hotel Mode - 3 column split */}
          {displayMode === 'triple' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHotels.map((hotel) => (
                  <HotelCard
                  key={hotel.hotel_id}
                    hotel={hotel}
                    minPrice={mergedPrices[hotel.hotel_id] || undefined}
                    currency="USD"
                    nights={nights}
                    checkInDate={computedCheckIn || undefined}
                    checkOutDate={computedCheckOut || undefined}
                    priceLoading={isLoadingRates && !fallbackPrices[hotel.hotel_id]}
                    onSelect={(id) => {
                      const checkInDate = computedCheckIn || format(addDays(new Date(), 60), 'yyyy-MM-dd');
                      const checkOutDate = computedCheckOut || format(addDays(new Date(), 67), 'yyyy-MM-dd');
                      window.location.href = `/places-to-stay/${id}?checkIn=${checkInDate}&checkOut=${checkOutDate}&adults=2&rooms=1`;
                    }}
                  />
              ))}
            </div>
          )}
      
          <div className="mt-8 space-y-3">
            <div className="text-center">
              <a
                href={`/places-to-stay${filter ? `?filter=${filter}` : ''}${computedCheckIn ? `&checkin=${computedCheckIn}` : ''}${computedCheckOut ? `&checkout=${computedCheckOut}` : ''}`}
                className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 !text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label="View all properties in Telluride"
              >
                View All Properties
                <svg 
                  className="w-5 h-5 !text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 5l7 7-7 7" 
                  />
                </svg>
              </a>
            </div>
            {Object.keys(mergedPrices).length > 0 && (
              <p className="text-xs text-neutral-500 text-center">
                Prices shown are sample rates for {computedCheckIn && computedCheckOut 
                  ? `${format(new Date(computedCheckIn), 'MMM d')} - ${format(new Date(computedCheckOut), 'MMM d')}`
                  : 'selected dates'}. Actual rates vary by date and availability. Some prices shown are typical ranges when live rates are unavailable.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
