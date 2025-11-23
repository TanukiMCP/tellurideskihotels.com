import React, { useState, useEffect, useCallback } from 'react';
import { HotelGridWithMap } from './HotelGridWithMap';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import PriceRangeFilter from '@/components/shared/PriceRangeFilter';
import { HotelSearchWidget } from './HotelSearchWidget';

type PropertyType = 'all' | 'hotel' | 'condo' | 'resort' | 'lodge' | 'cabin' | 'vacation_rental' | 'apartment' | 'home';
type LocationFilter = 'all' | 'telluride' | 'mountain-village';
type SortOption = 'popularity' | 'price-low' | 'price-high' | 'rating' | 'name';

interface PlacesToStaySearchWidgetProps {
  initialHotels?: LiteAPIHotel[];
  initialMinPrices?: Record<string, number>;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialAdults?: number;
  initialLocation?: string;
}

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'hotel', label: 'Hotels' },
  { value: 'condo', label: 'Condos' },
  { value: 'resort', label: 'Resorts' },
  { value: 'lodge', label: 'Lodges' },
  { value: 'cabin', label: 'Cabins' },
  { value: 'vacation_rental', label: 'Vacation Rentals' },
  { value: 'apartment', label: 'Apartments' },
  { value: 'home', label: 'Homes' },
];

const LOCATION_FILTERS: { value: LocationFilter; label: string }[] = [
  { value: 'all', label: 'All Locations' },
  { value: 'telluride', label: 'Telluride' },
  { value: 'mountain-village', label: 'Mountain Village' },
];

function PlacesToStaySearchWidgetContent({
  initialHotels = [],
  initialMinPrices = {},
  initialCheckIn,
  initialCheckOut,
  initialAdults = 2,
  initialLocation = 'Telluride',
}: PlacesToStaySearchWidgetProps) {
  const [allHotels, setAllHotels] = useState<LiteAPIHotel[]>(initialHotels);
  const [minPrices, setMinPrices] = useState<Record<string, number>>(initialMinPrices);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<PropertyType[]>(['all']);
  const [locationFilter, setLocationFilter] = useState<LocationFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [minRating, setMinRating] = useState<number>(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  const [checkIn, setCheckIn] = useState(initialCheckIn || '');
  const [checkOut, setCheckOut] = useState(initialCheckOut || '');
  const [adults, setAdults] = useState(initialAdults);
  const [location, setLocation] = useState(initialLocation);

  const parseUrlParams = useCallback(() => {
    if (typeof window === 'undefined') return {};
    const urlParams = new URLSearchParams(window.location.search);
    const propertyTypes = urlParams.get('propertyType');
    const locationParam = urlParams.get('locationFilter');
    const minPrice = urlParams.get('minPrice');
    const maxPrice = urlParams.get('maxPrice');
    const minRatingParam = urlParams.get('minRating');
    const sortParam = urlParams.get('sortBy');
    
    return {
      propertyTypes: propertyTypes ? (propertyTypes.includes(',') ? propertyTypes.split(',') : [propertyTypes]) : ['all'],
      locationFilter: (locationParam || 'all') as LocationFilter,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      minRating: minRatingParam ? parseFloat(minRatingParam) : undefined,
      sortBy: (sortParam || 'popularity') as SortOption,
    };
  }, []);

  useEffect(() => {
    const urlParams = parseUrlParams();
    if (urlParams.propertyTypes && urlParams.propertyTypes.length > 0) {
      setSelectedPropertyTypes(urlParams.propertyTypes as PropertyType[]);
    }
    if (urlParams.locationFilter) {
      setLocationFilter(urlParams.locationFilter);
    }
    if (urlParams.minPrice !== undefined) {
      setPriceRange([urlParams.minPrice, priceRange[1]]);
    }
    if (urlParams.maxPrice !== undefined) {
      setPriceRange([priceRange[0], urlParams.maxPrice]);
    }
    if (urlParams.minRating !== undefined) {
      setMinRating(urlParams.minRating);
    }
    if (urlParams.sortBy) {
      setSortBy(urlParams.sortBy);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const params = new URLSearchParams();
    if (selectedPropertyTypes.length > 0 && !selectedPropertyTypes.includes('all')) {
      params.set('propertyType', selectedPropertyTypes.join(','));
    }
    if (locationFilter !== 'all') {
      params.set('locationFilter', locationFilter);
    }
    if (priceRange[0] > 0) {
      params.set('minPrice', priceRange[0].toString());
    }
    if (priceRange[1] < 2000) {
      params.set('maxPrice', priceRange[1].toString());
    }
    if (minRating > 0) {
      params.set('minRating', minRating.toString());
    }
    if (sortBy !== 'popularity') {
      params.set('sortBy', sortBy);
    }
    
    const newUrl = params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, [selectedPropertyTypes, locationFilter, priceRange, minRating, sortBy]);

  const filteredAndSortedHotels = React.useMemo(() => {
    let filtered = [...allHotels];
    
    // Filter by property type
    if (selectedPropertyTypes.length > 0 && !selectedPropertyTypes.includes('all')) {
      filtered = filtered.filter(hotel => {
        const propertyType = hotel.property_type || 'other';
        return selectedPropertyTypes.includes(propertyType as PropertyType);
      });
    }

    // Filter by location
    if (locationFilter !== 'all') {
      filtered = filtered.filter(hotel => {
        const city = hotel.address?.city?.toLowerCase() || '';
        const address = hotel.address?.line1?.toLowerCase() || '';
        const name = hotel.name?.toLowerCase() || '';
        
        if (locationFilter === 'telluride') {
          return city.includes('telluride') && !city.includes('mountain village') && 
                 !address.includes('mountain village') && !name.includes('mountain village');
        } else if (locationFilter === 'mountain-village') {
          return city.includes('mountain village') || address.includes('mountain village') || 
                 name.includes('mountain village');
        }
        return true;
      });
    }

    // Filter by rating
    if (minRating > 0) {
      filtered = filtered.filter(hotel => {
        const rating = hotel.review_score || 0;
        return rating >= minRating;
      });
    }

    // Filter by price
    filtered = filtered.filter(hotel => {
      const price = minPrices[hotel.hotel_id] || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          const priceA = minPrices[a.hotel_id] || 0;
          const priceB = minPrices[b.hotel_id] || 0;
          return priceA - priceB;
        case 'price-high':
          const priceA2 = minPrices[a.hotel_id] || 0;
          const priceB2 = minPrices[b.hotel_id] || 0;
          return priceB2 - priceA2;
        case 'rating':
          const ratingA = a.review_score || 0;
          const ratingB = b.review_score || 0;
          return ratingB - ratingA;
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        default:
          // Popularity: by review count, then rating
          const reviewsA = a.review_count || 0;
          const reviewsB = b.review_count || 0;
          if (reviewsB !== reviewsA) return reviewsB - reviewsA;
          const ratingA2 = a.review_score || 0;
          const ratingB2 = b.review_score || 0;
          return ratingB2 - ratingA2;
      }
    });

    return filtered;
  }, [allHotels, selectedPropertyTypes, locationFilter, sortBy, priceRange, minRating, minPrices]);

  const availablePropertyTypes = React.useMemo(() => {
    const typeCounts = new Map<PropertyType, number>();
    
    allHotels.forEach(hotel => {
      const propertyType = (hotel.property_type || 'other') as PropertyType;
      typeCounts.set(propertyType, (typeCounts.get(propertyType) || 0) + 1);
    });
    
    return Array.from(typeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [allHotels]);

  const togglePropertyType = (type: PropertyType) => {
    if (type === 'all') {
      setSelectedPropertyTypes(['all']);
    } else {
      setSelectedPropertyTypes(prev => {
        const withoutAll = prev.filter(t => t !== 'all');
        if (withoutAll.includes(type)) {
          const newTypes = withoutAll.filter(t => t !== type);
          return newTypes.length > 0 ? newTypes : ['all'];
        } else {
          return [...withoutAll, type];
        }
      });
    }
  };

  const clearFilters = () => {
    setSelectedPropertyTypes(['all']);
    setLocationFilter('all');
    setMinRating(0);
    setPriceRange([0, 2000]);
  };

  const handleSearch = async (newCheckIn: string, newCheckOut: string, newAdults: number, newLocation: string) => {
    setCheckIn(newCheckIn);
    setCheckOut(newCheckOut);
    setAdults(newAdults);
    setLocation(newLocation);
    setLoading(true);
    setError('');
    
    try {
      const { searchHotelsWithRates } = await import('@/lib/liteapi/rates');
      const result = await searchHotelsWithRates({
        cityName: newLocation,
        countryCode: 'US',
        checkIn: newCheckIn,
        checkOut: newCheckOut,
        adults: newAdults,
      });
      
      setAllHotels(result.hotels || []);
      setMinPrices(result.minPrices || {});
    } catch (err) {
      console.error('[Places to Stay Widget] Search error:', err);
      setError('Failed to search hotels');
    } finally {
      setLoading(false);
    }
  };

  const nights = checkIn && checkOut 
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 1;

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-semibold">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-primary-50 to-sky-50 border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {filteredAndSortedHotels.length} Propert{filteredAndSortedHotels.length !== 1 ? 'ies' : 'y'} Found
            </h2>
            {(selectedPropertyTypes.length > 0 && !selectedPropertyTypes.includes('all')) || 
             locationFilter !== 'all' || minRating > 0 || priceRange[0] > 0 || priceRange[1] < 2000 ? (
              <p className="text-sm text-gray-600 mt-1">
                {((selectedPropertyTypes.length > 0 && !selectedPropertyTypes.includes('all')) ? 1 : 0) + 
                 (locationFilter !== 'all' ? 1 : 0) + 
                 (minRating > 0 ? 1 : 0) + 
                 (priceRange[0] > 0 || priceRange[1] < 2000 ? 1 : 0)} filter{((selectedPropertyTypes.length > 0 && !selectedPropertyTypes.includes('all')) ? 1 : 0) + (locationFilter !== 'all' ? 1 : 0) + (minRating > 0 ? 1 : 0) + (priceRange[0] > 0 || priceRange[1] < 2000 ? 1 : 0) !== 1 ? 's' : ''} active
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="font-medium">Filters</span>
            </button>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Grid View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-2 rounded-md transition-all ${
                  viewMode === 'map'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Map View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Search Widget */}
        <div className="mb-4">
          <HotelSearchWidget
            initialLocation={location}
            initialDates={checkIn && checkOut ? {
              checkIn: new Date(checkIn),
              checkOut: new Date(checkOut),
            } : undefined}
            initialGuests={{ adults, children: 0 }}
            onDatesChange={(checkInDate, checkOutDate) => {
              if (checkInDate && checkOutDate) {
                handleSearch(
                  checkInDate.toISOString().split('T')[0],
                  checkOutDate.toISOString().split('T')[0],
                  adults,
                  location
                );
              }
            }}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row min-h-[600px]">
        <aside className={`
          ${showFilters ? 'block' : 'hidden'} lg:block
          w-full lg:w-80 xl:w-96 
          border-b lg:border-b-0 lg:border-r border-gray-200 
          bg-gray-50 overflow-y-auto
          max-h-[600px] lg:max-h-[800px]
        `}>
          <div className="p-4 sm:p-6 space-y-6">
            {((selectedPropertyTypes.length > 0 && !selectedPropertyTypes.includes('all')) || 
               locationFilter !== 'all' || minRating > 0 || priceRange[0] > 0 || priceRange[1] < 2000) && (
              <div className="pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Active Filters</h3>
                  <button
                    onClick={clearFilters}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedPropertyTypes.filter(t => t !== 'all').map(type => (
                    <button
                      key={type}
                      onClick={() => togglePropertyType(type)}
                      className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      {PROPERTY_TYPES.find(pt => pt.value === type)?.label || type}
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ))}
                  {locationFilter !== 'all' && (
                    <button
                      onClick={() => setLocationFilter('all')}
                      className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      {LOCATION_FILTERS.find(l => l.value === locationFilter)?.label}
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Property Type</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <button
                  onClick={() => togglePropertyType('all')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg border-2 transition-all ${
                    selectedPropertyTypes.includes('all')
                      ? 'bg-primary-50 border-primary-500 text-primary-900 font-semibold'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50'
                  }`}
                >
                  <span className="text-sm">All Types</span>
                </button>
                {availablePropertyTypes.map(({ type, count }) => (
                  <button
                    key={type}
                    onClick={() => togglePropertyType(type)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg border-2 transition-all ${
                      selectedPropertyTypes.includes(type)
                        ? 'bg-primary-50 border-primary-500 text-primary-900 font-semibold'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{PROPERTY_TYPES.find(pt => pt.value === type)?.label || type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        selectedPropertyTypes.includes(type)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {count}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Location</h3>
              <div className="space-y-2">
                {LOCATION_FILTERS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setLocationFilter(value)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg border-2 transition-all ${
                      locationFilter === value
                        ? 'bg-primary-50 border-primary-500 text-primary-900 font-semibold'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50'
                    }`}
                  >
                    <span className="text-sm">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Sort By</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              >
                <option value="popularity">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Minimum Rating</h3>
              <select
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              >
                <option value="0">All Ratings</option>
                <option value="7">3.5+ Stars</option>
                <option value="8">4+ Stars</option>
                <option value="8.5">4.25+ Stars</option>
                <option value="9">4.5+ Stars</option>
                <option value="9.5">4.75+ Stars</option>
              </select>
            </div>

            <PriceRangeFilter
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
              minPrice={0}
              maxPrice={2000}
              label="Price Range (per night)"
            />
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <svg className="animate-spin h-12 w-12 text-primary-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-gray-600 font-medium">Loading properties...</p>
              </div>
            </div>
          )}

          {!loading && (
            <>
              {viewMode === 'map' ? (
                <div className="h-full w-full">
                  <HotelGridWithMap
                    hotels={filteredAndSortedHotels}
                    loading={loading}
                    minPrices={minPrices}
                    currency="USD"
                    nights={nights}
                    checkIn={checkIn || ''}
                    checkOut={checkOut || ''}
                    adults={adults}
                    defaultView="map"
                  />
                </div>
              ) : (
                <div className="h-full w-full">
                  <HotelGridWithMap
                    hotels={filteredAndSortedHotels}
                    loading={loading}
                    minPrices={minPrices}
                    currency="USD"
                    nights={nights}
                    checkIn={checkIn || ''}
                    checkOut={checkOut || ''}
                    adults={adults}
                    defaultView="grid"
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function PlacesToStaySearchWidget(props: PlacesToStaySearchWidgetProps) {
  return (
    <ErrorBoundary>
      <PlacesToStaySearchWidgetContent {...props} />
    </ErrorBoundary>
  );
}

