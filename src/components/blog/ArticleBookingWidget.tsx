import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calendar, MapPin, Search, TrendingUp } from 'lucide-react';

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
}

export function ArticleBookingWidget({
  title,
  description,
  hotelId,
  hotelName,
  location,
  filter,
  variant = 'default',
}: ArticleBookingWidgetProps) {
  // Build the link based on props
  const buildLink = () => {
    if (hotelId) {
      return `/lodging/${hotelId}`;
    }
    
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (filter) params.set('filter', filter);
    
    const queryString = params.toString();
    return queryString ? `/lodging?${queryString}` : '/lodging';
  };

  // Generate appropriate title based on context
  const getTitle = () => {
    if (title) return title;
    if (hotelName) return `Book ${hotelName}`;
    if (filter) {
      const filterLabels: Record<string, string> = {
        'ski-in-ski-out': 'Ski-In/Ski-Out Hotels',
        'luxury': 'Luxury Hotels',
        'budget': 'Budget-Friendly Hotels',
        'family-friendly': 'Family-Friendly Hotels',
      };
      return `Browse ${filterLabels[filter] || 'Hotels'}`;
    }
    if (location) {
      const locationLabels: Record<string, string> = {
        'mountain-village': 'Mountain Village Hotels',
        'downtown': 'Downtown Telluride Hotels',
      };
      return `Browse ${locationLabels[location] || 'Hotels'}`;
    }
    return 'Find Your Perfect Telluride Hotel';
  };

  // Generate appropriate description
  const getDescription = () => {
    if (description) return description;
    if (hotelName) return 'Check availability and compare rates from top booking sites';
    return 'Search and compare hundreds of hotels with real-time availability';
  };

  // Generate appropriate CTA text
  const getCtaText = () => {
    if (hotelName) return 'Check Availability & Rates';
    if (filter || location) return 'Browse Hotels';
    return 'Search Hotels';
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
        className="block my-6 p-4 border-2 border-primary-200 rounded-lg bg-gradient-to-r from-primary-50 to-blue-50 hover:border-primary-400 hover:shadow-lg transition-all duration-300 group"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              {hotelName ? <MapPin className="w-5 h-5 text-white" /> : <Search className="w-5 h-5 text-white" />}
            </div>
            <div>
              <div className="font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors">
                {widgetTitle}
              </div>
              {variant !== 'compact' && (
                <div className="text-sm text-neutral-600 mt-0.5">
                  {widgetDescription}
                </div>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="px-4 py-2 bg-primary-600 text-white rounded-md font-semibold group-hover:bg-primary-700 transition-colors">
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
      <Card className="my-8 border-2 border-primary-300 shadow-xl bg-gradient-to-br from-white via-primary-50 to-blue-50">
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
              <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                {widgetTitle}
              </h3>
              <p className="text-neutral-700 text-lg mb-4">
                {widgetDescription}
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start text-sm text-neutral-600">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-primary-600" />
                  <span>Real-time pricing</span>
                </div>
                <span className="text-neutral-300">•</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-primary-600" />
                  <span>Instant confirmation</span>
                </div>
                <span className="text-neutral-300">•</span>
                <span>Best rate guarantee</span>
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
    <Card className="my-6 border-2 border-primary-200 hover:border-primary-400 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-primary-50">
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
            <p className="text-neutral-600 text-sm">
              {widgetDescription}
            </p>
          </div>
          <div className="flex-shrink-0 w-full sm:w-auto">
            <a
              href={link}
              className="inline-flex items-center justify-center w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              {ctaText}
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

