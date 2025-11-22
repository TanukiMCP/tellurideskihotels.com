import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calendar, MapPin, Search, TrendingUp } from 'lucide-react';
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
        className="block my-6 p-4 border-2 border-primary-300 rounded-lg bg-white hover:border-primary-500 hover:shadow-lg transition-all duration-300 group"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              {hotelName ? <MapPin className="w-5 h-5 text-white" /> : <Search className="w-5 h-5 text-white" />}
            </div>
            <div>
              <div className="font-bold text-neutral-900 group-hover:text-primary-700 transition-colors">
                {widgetTitle}
              </div>
              {variant !== 'compact' && (
                <div className="text-sm text-neutral-700 mt-0.5">
                  {widgetDescription}
                </div>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="px-5 py-2.5 bg-primary-600 text-white rounded-lg font-bold group-hover:bg-primary-700 transition-colors shadow-md">
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
      <Card className="my-8 border-2 border-primary-400 shadow-xl bg-white">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
                {hotelName ? (
                  <MapPin className="w-10 h-10 text-white" />
                ) : (
                  <Calendar className="w-10 h-10 text-white" />
                )}
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-extrabold text-neutral-900 mb-2">
                {widgetTitle}
              </h3>
              <p className="text-neutral-800 text-lg mb-4 font-medium">
                {widgetDescription}
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start text-sm text-neutral-700 font-medium">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-primary-600" />
                  <span>Real-time pricing</span>
                </div>
                <span className="text-neutral-400">•</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-primary-600" />
                  <span>Instant confirmation</span>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <a 
                href={link}
                className="inline-flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
              >
                {ctaText}
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className="my-6 border-2 border-primary-300 hover:border-primary-500 hover:shadow-lg transition-all duration-300 bg-white">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
              {hotelName ? (
                <MapPin className="w-6 h-6 text-white" />
              ) : (
                <Search className="w-6 h-6 text-white" />
              )}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-neutral-900 mb-1">
              {widgetTitle}
            </h3>
            <p className="text-neutral-700 text-sm font-medium">
              {widgetDescription}
            </p>
          </div>
          <div className="flex-shrink-0 w-full sm:w-auto">
            <a
              href={link}
              className="inline-flex items-center justify-center w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-3 rounded-lg transition-colors shadow-md"
            >
              {ctaText}
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

