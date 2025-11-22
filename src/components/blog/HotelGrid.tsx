import { useState, useEffect, useMemo } from 'react';
import { HotelCard } from '@/components/lodging/HotelCard';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { format, addDays } from 'date-fns';
import { ArrowRight, Sparkles, DollarSign, Mountain, Home, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface HotelGridProps {
  filter?: 'ski-in-ski-out' | 'luxury' | 'budget' | 'downtown' | 'mountain-village' | 'family-friendly';
  limit?: number;
  checkIn?: string;
  checkOut?: string;
  title?: string;
  subtitle?: string;
}

// Filter metadata for better UX
const FILTER_CONFIG = {
  'ski-in-ski-out': {
    label: 'Ski-In/Ski-Out',
    icon: Mountain,
    description: 'Properties with direct slope access',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  'luxury': {
    label: 'Luxury',
    icon: Sparkles,
    description: 'Premium 4-5 star properties',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  'budget': {
    label: 'Budget-Friendly',
    icon: DollarSign,
    description: 'Value-focused accommodations',
    color: 'bg-green-100 text-green-800 border-green-300',
  },
  'downtown': {
    label: 'Downtown',
    icon: Home,
    description: 'Historic Telluride town center',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  'mountain-village': {
    label: 'Mountain Village',
    icon: Mountain,
    description: 'Slopeside resort area',
    color: 'bg-sky-100 text-sky-800 border-sky-300',
  },
  'family-friendly': {
    label: 'Family-Friendly',
    icon: Users,
    description: 'Great for families with kids',
    color: 'bg-pink-100 text-pink-800 border-pink-300',
  },
};

// Skeleton card for loading state
function HotelCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
      <div className="h-64 bg-neutral-200" />
      <div className="p-6 space-y-4">
        <div className="h-6 bg-neutral-200 rounded w-3/4" />
        <div className="h-4 bg-neutral-200 rounded w-1/2" />
        <div className="h-4 bg-neutral-200 rounded w-2/3" />
        <div className="border-t border-neutral-200 pt-4 mt-4">
          <div className="h-8 bg-neutral-200 rounded w-1/3 mb-4" />
          <div className="h-12 bg-neutral-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export function HotelGrid({ 
  filter,
  limit = 3,
  checkIn,
  checkOut,
  title,
  subtitle
}: HotelGridProps) {
  const [hotels, setHotels] = useState<LiteAPIHotel[]>([]);
  const [minPrices, setMinPrices] = useState<Record<string, number>>({});
  const [computedCheckIn, setComputedCheckIn] = useState<string>('');
  const [computedCheckOut, setComputedCheckOut] = useState<string>('');
  const [isLoadingHotels, setIsLoadingHotels] = useState(true);
  const [hasError, setHasError] = useState(false);

  const filterConfig = filter ? FILTER_CONFIG[filter] : null;

  useEffect(() => {
    // Calculate default dates on client side only to avoid hydration mismatch
    const defaultCheckIn = format(addDays(new Date(), 7), 'yyyy-MM-dd');
    const defaultCheckOut = format(addDays(new Date(), 14), 'yyyy-MM-dd');
    setComputedCheckIn(checkIn || defaultCheckIn);
    setComputedCheckOut(checkOut || defaultCheckOut);
  }, [checkIn, checkOut]);

  // Fetch hotels
  useEffect(() => {
    let cancelled = false;
    
    async function fetchHotels() {
      setIsLoadingHotels(true);
      setHasError(false);
      
      try {
        const searchParams = new URLSearchParams({
          cityName: 'Telluride',
          countryCode: 'US',
          limit: (limit * 2).toString(), // Fetch extra to ensure enough after filtering
        });
        
        const hotelsResponse = await fetch(`/api/liteapi/search?${searchParams.toString()}`);
        
        if (!hotelsResponse.ok) {
          throw new Error('Failed to fetch hotels');
        }
        
        const hotelsData = await hotelsResponse.json();
        let candidateHotels: LiteAPIHotel[] = hotelsData.data || [];
        
        // Apply client-side filtering
        if (filter === 'luxury') {
          candidateHotels = candidateHotels.filter((h) => (h.star_rating || 0) >= 4);
        } else if (filter === 'budget') {
          candidateHotels = candidateHotels.filter((h) => (h.star_rating || 0) <= 3);
        } else if (filter === 'ski-in-ski-out' || filter === 'family-friendly') {
          candidateHotels = candidateHotels.filter((h) => (h.star_rating || 0) >= 4);
        } else if (filter === 'downtown') {
          // Prefer properties with "Telluride" in address (not Mountain Village)
          candidateHotels = candidateHotels.filter((h) => 
            h.address?.city?.toLowerCase().includes('telluride') ||
            h.name?.toLowerCase().includes('telluride')
          );
        } else if (filter === 'mountain-village') {
          // Prefer properties with "Mountain Village" in address
          candidateHotels = candidateHotels.filter((h) => 
            h.address?.city?.toLowerCase().includes('mountain village') ||
            h.name?.toLowerCase().includes('mountain village')
          );
        }
        
        candidateHotels = candidateHotels.slice(0, limit);
        
        if (!cancelled) {
          if (candidateHotels.length === 0) {
            setHasError(true);
          }
          setHotels(candidateHotels);
          setIsLoadingHotels(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[HotelGrid] Error fetching hotels:', err);
          setHasError(true);
          setIsLoadingHotels(false);
        }
      }
    }

    fetchHotels();
    
    return () => {
      cancelled = true;
    };
  }, [filter, limit]);

  // Create stable hotel IDs string for dependency
  const hotelIdsString = useMemo(() => {
    return hotels.map(h => h.hotel_id).sort().join(',');
  }, [hotels]);

  // Fetch min-rates separately once dates are computed AND hotels are loaded
  useEffect(() => {
    if (!computedCheckIn || !computedCheckOut || hotels.length === 0) {
      return;
    }

    let cancelled = false;
    
    const hotelIds = hotels.map(h => h.hotel_id);
    const ratesParams = new URLSearchParams({
      hotelIds: hotelIds.join(','),
      checkIn: computedCheckIn,
      checkOut: computedCheckOut,
      adults: '2',
    });
    
    fetch(`/api/hotels/min-rates?${ratesParams.toString()}`)
      .then(res => res.ok ? res.json() : null)
      .then(ratesData => {
        if (cancelled) return;
        
        if (ratesData?.data && Array.isArray(ratesData.data)) {
          const prices: Record<string, number> = {};
          const nights = Math.ceil((new Date(computedCheckOut).getTime() - new Date(computedCheckIn).getTime()) / (1000 * 60 * 60 * 24));
          
          ratesData.data.forEach((item: any) => {
            if (item.hotelId && item.price) {
              prices[item.hotelId] = nights > 0 ? item.price / nights : item.price;
            }
          });
          
          setMinPrices(prices);
        }
      })
      .catch(err => {
        if (!cancelled) {
          console.error('[HotelGrid] Error fetching min rates:', err);
        }
      });
      
    return () => {
      cancelled = true;
    };
  }, [computedCheckIn, computedCheckOut, hotelIdsString]);

  // Loading state
  if (isLoadingHotels) {
    return (
      <div className="my-10 px-4 sm:px-0">
        {title && (
          <div className="mb-8">
            <h3 className="text-3xl font-bold text-neutral-900 mb-2">{title}</h3>
            {subtitle && (
              <p className="text-lg text-neutral-600">{subtitle}</p>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: limit }).map((_, i) => (
            <HotelCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Error or no results state
  if (hasError || hotels.length === 0) {
    return (
      <div className="my-10 px-4 sm:px-0">
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-8 text-center">
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-bold text-neutral-900 mb-2">
              {hasError ? 'Unable to Load Hotels' : 'No Properties Found'}
            </h3>
            <p className="text-neutral-600 mb-6">
              {hasError 
                ? 'We\'re having trouble loading properties right now. Please try again or browse all available options.'
                : `We couldn't find any ${filterConfig?.label.toLowerCase() || ''} properties matching your criteria.`
              }
            </p>
            <a
              href="/places-to-stay"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              Browse All Properties
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Success state with hotels
  const ctaText = filterConfig 
    ? `View All ${filterConfig.label} Properties`
    : 'View All Properties';

  return (
    <div className="my-10 px-4 sm:px-0">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          {title && (
            <h3 className="text-3xl font-bold text-neutral-900">{title}</h3>
          )}
          {filterConfig && (
            <Badge 
              variant="secondary" 
              className={`${filterConfig.color} border px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5`}
            >
              <filterConfig.icon className="w-4 h-4" />
              {filterConfig.label}
            </Badge>
          )}
        </div>
        {subtitle ? (
          <p className="text-lg text-neutral-600 leading-relaxed">{subtitle}</p>
        ) : filterConfig?.description ? (
          <p className="text-lg text-neutral-600 leading-relaxed">{filterConfig.description}</p>
        ) : null}
      </div>

      {/* Hotel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {hotels.map((hotel) => (
          <HotelCard
            key={hotel.hotel_id}
            hotel={hotel}
            minPrice={minPrices[hotel.hotel_id]}
            currency="USD"
            checkInDate={computedCheckIn || undefined}
            checkOutDate={computedCheckOut || undefined}
            onSelect={(id) => {
              const checkInDate = computedCheckIn || format(addDays(new Date(), 7), 'yyyy-MM-dd');
              const checkOutDate = computedCheckOut || format(addDays(new Date(), 14), 'yyyy-MM-dd');
              window.location.href = `/places-to-stay/${id}?checkIn=${checkInDate}&checkOut=${checkOutDate}&adults=2&rooms=1`;
            }}
          />
        ))}
      </div>

      {/* CTA Section */}
      <div className="text-center">
        <a
          href={`/places-to-stay${filter ? `?filter=${filter}` : ''}`}
          className="inline-flex w-full md:w-auto justify-center items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          aria-label={`View all ${filterConfig?.label.toLowerCase() || ''} properties in Telluride`}
        >
          {ctaText}
          <ArrowRight className="w-5 h-5" />
        </a>
        <p className="text-sm text-neutral-500 mt-3">
          Compare prices, read reviews, and book your perfect stay
        </p>
      </div>
    </div>
  );
}

