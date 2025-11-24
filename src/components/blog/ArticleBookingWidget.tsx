import { Calendar, MapPin, Search, TrendingUp, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
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
  // Build the link based on props
  const buildLink = () => {
    if (hotelId) {
      return `/places-to-stay/${hotelId}`;
    }
    
    const defaultCheckIn = format(addDays(new Date(), 7), 'yyyy-MM-dd');
    const defaultCheckOut = format(addDays(new Date(), 14), 'yyyy-MM-dd');
    
    const params = new URLSearchParams();
    
    if (location) params.set('location', location);
    if (filter) params.set('filter', filter);
    params.set('checkin', checkIn || defaultCheckIn);
    params.set('checkout', checkOut || defaultCheckOut);
    if (guests) params.set('guests', guests.toString());
    if (nights) params.set('nights', nights.toString());
    if (maxPrice) params.set('maxPrice', maxPrice.toString());
    
    const queryString = params.toString();
    return queryString ? `/places-to-stay?${queryString}` : '/places-to-stay';
  };

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
    return 'Find Your Perfect Place to Stay';
  };

  const getDescription = () => {
    if (description) return description;
    if (hotelName) return 'Check availability and compare rates';
    return 'Search properties with real-time availability';
  };

  const getCtaText = () => {
    if (hotelName) return 'Check Availability';
    if (filter || location) return 'Browse Properties';
    return 'Search Now';
  };

  const link = buildLink();
  const widgetTitle = getTitle();
  const widgetDescription = getDescription();
  const ctaText = getCtaText();

  // Compact variant - minimal, inline-friendly
  if (variant === 'compact') {
    return (
      <a
        href={link}
        className="not-prose group flex items-center justify-between gap-4 my-6 p-4 bg-slate-50 border-2 border-slate-200 rounded-xl hover:border-slate-400 hover:bg-white hover:shadow-lg transition-all duration-300"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            {hotelName ? (
              <MapPin className="w-5 h-5 text-white" />
            ) : (
              <Search className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-slate-900 group-hover:text-slate-700 transition-colors line-clamp-1">
              {widgetTitle}
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1 text-sm font-semibold text-slate-700 group-hover:text-slate-900">
          {hotelName ? 'View Rates' : 'Search'}
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </a>
    );
  }

  // Featured variant - prominent, full-width with gradient
  if (variant === 'featured') {
    return (
      <div className="not-prose my-10 rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8">
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center">
                {hotelName ? (
                  <MapPin className="w-8 h-8 text-white" />
                ) : (
                  <Sparkles className="w-8 h-8 text-white" />
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 text-center lg:text-left min-w-0">
              <h3 className="text-2xl font-bold text-white mb-2">
                {widgetTitle}
              </h3>
              <p className="text-slate-300 text-base mb-4 max-w-xl">
                {widgetDescription}
              </p>
              
              {/* Features */}
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start text-sm text-slate-400">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Real-time pricing</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Instant confirmation</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex-shrink-0 w-full lg:w-auto">
              <a 
                href={link}
                className="inline-flex items-center justify-center w-full lg:w-auto bg-white hover:bg-slate-100 text-slate-900 font-bold px-8 py-4 text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <span>{ctaText}</span>
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default variant - clean card style
  return (
    <div className="not-prose my-8">
      <a
        href={link}
        className="group flex flex-col sm:flex-row gap-4 items-start sm:items-center p-5 bg-white border-2 border-slate-200 rounded-xl hover:border-slate-400 hover:shadow-xl transition-all duration-300"
      >
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            {hotelName ? (
              <MapPin className="w-6 h-6 text-white" />
            ) : (
              <Search className="w-6 h-6 text-white" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-slate-700 transition-colors mb-1">
            {widgetTitle}
          </h3>
          <p className="text-sm text-slate-600">
            {widgetDescription}
          </p>
        </div>

        {/* CTA */}
        <div className="flex-shrink-0 w-full sm:w-auto">
          <span className="inline-flex items-center justify-center w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm">
            {ctaText}
            <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </a>
    </div>
  );
}
