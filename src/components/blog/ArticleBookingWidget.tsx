import { Card, CardContent } from '@/components/ui/Card';
import { Calendar, MapPin, Search, TrendingUp, CheckCircle2 } from 'lucide-react';
import { format, addDays } from 'date-fns';

export interface ArticleBookingWidgetProps {
  /** Widget title - defaults to generic if not provided */
  title?: string;
  /** Optional description text */
  description?: string;
  /** Hotel ID for specific hotel widgets */
  hotelId?: string;
  /** Hotel name for specific hotel widgets */
  hotelName?: string;
  /** Location filter (downtown, mountain-village) */
  location?: string;
  /** Property type filter (ski-in-ski-out, luxury, budget, family-friendly) */
  filter?: string;
  /** Display variant */
  variant?: 'default' | 'compact' | 'featured';
  /** Check-in date (YYYY-MM-DD) to pass to search */
  checkIn?: string;
  /** Check-out date (YYYY-MM-DD) to pass to search */
  checkOut?: string;
  /** Number of guests to pass to search */
  guests?: number;
  /** Number of nights to pass to search */
  nights?: number;
  /** Maximum price per night to filter by */
  maxPrice?: number;
}

export function ArticleBookingWidget({
  title,
  description,
  hotelId,
  hotelName,
  location,
  filter,
  variant = 'default',
  checkIn,
  checkOut,
  guests,
  nights,
  maxPrice,
}: ArticleBookingWidgetProps) {
  // Build the link based on props - NOW WITH CONTEXT!
  const buildLink = () => {
    if (hotelId) {
      return `/places-to-stay/${hotelId}`;
    }
    
    // Default dates: 7 days out for check-in, 14 days out for check-out (7-night trip)
    const defaultCheckIn = format(addDays(new Date(), 7), 'yyyy-MM-dd');
    const defaultCheckOut = format(addDays(new Date(), 14), 'yyyy-MM-dd');
    
    const params = new URLSearchParams();
    
    // Location and filter
    if (location) params.set('location', location);
    if (filter) params.set('filter', filter);
    
    // Search context from parent components - use defaults if not provided
    params.set('checkin', checkIn || defaultCheckIn);
    params.set('checkout', checkOut || defaultCheckOut);
    if (guests) params.set('guests', guests.toString());
    if (nights) params.set('nights', nights.toString());
    if (maxPrice) params.set('maxPrice', maxPrice.toString());
    
    const queryString = params.toString();
    return queryString ? `/places-to-stay?${queryString}` : '/places-to-stay';
  };

  // Generate appropriate title based on context
  const getTitle = () => {
    if (title) return title;
    if (hotelName) return `Book ${hotelName}`;
    if (filter) {
      const filterLabels: Record<string, string> = {
        'ski-in-ski-out': 'Ski-In/Ski-Out Lodging',
        'luxury': 'Luxury Accommodations',
        'budget': 'Budget-Friendly Options',
        'family-friendly': 'Family-Friendly Lodging',
      };
      return `Browse ${filterLabels[filter] || 'Places to Stay'}`;
    }
    if (location) {
      const locationLabels: Record<string, string> = {
        'mountain-village': 'Mountain Village Lodging',
        'downtown': 'Downtown Telluride Lodging',
      };
      return `Browse ${locationLabels[location] || 'Places to Stay'}`;
    }
    return 'Find Your Perfect Place to Stay in Telluride';
  };

  // Generate appropriate description
  const getDescription = () => {
    if (description) return description;
    if (hotelName) return 'Check availability and compare rates from top booking sites';
    return 'Search and compare hundreds of properties with real-time availability';
  };

  // Generate appropriate CTA text
  const getCtaText = () => {
    if (hotelName) return 'Check Availability & Rates';
    if (filter || location) return 'Browse Places to Stay';
    return 'Search Places to Stay';
  };

  const link = buildLink();
  const widgetTitle = getTitle();
  const widgetDescription = getDescription();
  const ctaText = getCtaText();

  // Compact variant for inline placement
  if (variant === 'compact') {
    return (
      <a
        href={link}
        className="group block my-6 p-5 border-2 border-primary-300 rounded-xl bg-white hover:border-primary-500 hover:shadow-xl transition-all duration-300"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
              {hotelName ? (
                <MapPin className="w-6 h-6 text-white" />
              ) : (
                <Search className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-lg text-neutral-900 group-hover:text-primary-700 transition-colors line-clamp-1">
                {widgetTitle}
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="px-6 py-2.5 bg-primary-600 !text-white rounded-xl font-semibold text-sm group-hover:bg-primary-700 transition-colors shadow-md whitespace-nowrap">
              {hotelName ? 'View Rates →' : 'Search →'}
            </div>
          </div>
        </div>
      </a>
    );
  }

  // Featured variant for prominent placement
  if (variant === 'featured') {
    return (
      <Card className="my-8 border-2 border-primary-400 shadow-xl bg-white hover:shadow-2xl hover:border-primary-500 transition-all duration-300 group">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            {/* Icon Section */}
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                {hotelName ? (
                  <MapPin className="w-8 h-8 text-white" />
                ) : (
                  <Calendar className="w-8 h-8 text-white" />
                )}
              </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 text-center lg:text-left min-w-0">
              <h3 className="text-2xl font-bold text-neutral-900 mb-3 leading-tight">
                {widgetTitle}
              </h3>
              <p className="text-neutral-700 text-base mb-5 leading-relaxed max-w-2xl">
                {widgetDescription}
              </p>
              
              {/* Feature List */}
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start text-sm text-neutral-600">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary-600 flex-shrink-0" />
                  <span className="font-medium">Real-time pricing</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary-600 flex-shrink-0" />
                  <span className="font-medium">Instant confirmation</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="flex-shrink-0 w-full lg:w-auto">
              <a 
                href={link}
                className="inline-flex items-center justify-center w-full lg:w-auto bg-primary-600 hover:bg-primary-700 !text-white font-bold px-8 py-3.5 text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group/button"
              >
                <span>{ctaText}</span>
                <svg 
                  className="ml-2 w-5 h-5 group-hover/button:translate-x-1 transition-transform duration-200 !text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant - clean and professional
  return (
    <Card className="my-6 border-2 border-primary-300 hover:border-primary-500 hover:shadow-xl transition-all duration-300 bg-white group">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
              {hotelName ? (
                <MapPin className="w-7 h-7 text-white" />
              ) : (
                <Search className="w-7 h-7 text-white" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-neutral-900 mb-2 leading-tight">
              {widgetTitle}
            </h3>
            <p className="text-neutral-700 text-sm font-medium leading-relaxed">
              {widgetDescription}
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex-shrink-0 w-full sm:w-auto">
            <a
              href={link}
              className="inline-flex items-center justify-center w-full sm:w-auto bg-primary-600 hover:bg-primary-700 !text-white font-semibold px-6 py-2.5 text-sm rounded-xl transition-colors shadow-md hover:shadow-lg duration-200 group/button"
            >
              <span>{ctaText}</span>
              <svg 
                className="ml-2 w-4 h-4 group-hover/button:translate-x-1 transition-transform duration-200 !text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
