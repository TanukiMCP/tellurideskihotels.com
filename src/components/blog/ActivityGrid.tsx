'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Compass, Star, Clock, ChevronRight, Sparkles, MapPin } from 'lucide-react';
import type { ViatorProductSummary } from '@/lib/viator/types';
import { getViatorImageUrl } from '@/lib/image-optimization';

interface ActivityGridProps {
  /** Filter by category */
  category?: string;
  /** Number of activities to display (1, 2, or 3) */
  limit?: number;
  /** Optional title */
  title?: string;
  /** Maximum price to filter activities */
  maxPrice?: number;
  /** Minimum price to filter activities */
  minPrice?: number;
}

// Single Activity Showcase - Full width, rich content
function SingleActivityShowcase({ activity }: { activity: ViatorProductSummary }) {
  const price = activity.pricing?.summary?.fromPrice;
  const rating = activity.reviews?.combinedAverageRating;
  const reviewCount = activity.reviews?.totalReviews;
  const duration = activity.duration?.fixedDurationInMinutes;
  // Use high-quality image (minimum 1920px width for best quality in blog showcase)
  const imageUrl = getViatorImageUrl(activity.images?.[0] || {}, 1920);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${minutes} min`;
  };

  return (
    <a
      href={activity.productUrl || `/things-to-do/${activity.productCode}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <Card className="overflow-hidden rounded-xl border border-neutral-200/60 hover:shadow-2xl transition-all duration-300">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image Section */}
          <div className="relative h-[300px] md:h-[400px] overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={activity.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Compass className="w-16 h-16 text-neutral-300" />
              </div>
            )}
            
            {/* Popular Badge */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-accent-500 text-white shadow-lg">
              <Sparkles className="w-4 h-4" />
              Featured
            </div>

            {/* Price Badge */}
            {price && (
              <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur px-4 py-2 rounded-lg shadow-lg">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm text-neutral-500">from</span>
                  <span className="text-2xl font-bold text-neutral-900">{formatPrice(price)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-6 md:p-8 flex flex-col justify-center">
            <h3 className="text-2xl font-bold text-neutral-900 mb-3 group-hover:text-primary-700 transition-colors">
              {activity.title}
            </h3>

            {/* Meta info */}
            <div className="flex flex-wrap gap-4 mb-4 text-sm text-neutral-600">
              {rating && (
                <div className="flex items-center gap-1.5">
                  <Star className="w-5 h-5 fill-accent-400 text-accent-400" />
                  <span className="font-semibold">{rating.toFixed(1)}</span>
                  {reviewCount && (
                    <span className="text-neutral-400">({reviewCount.toLocaleString()} reviews)</span>
                  )}
                </div>
              )}
              {duration && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-5 h-5 text-neutral-400" />
                  <span>{formatDuration(duration)}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {activity.description && (
              <p className="text-neutral-600 mb-6 line-clamp-3">
                {activity.description}
              </p>
            )}

            {/* Features */}
            <div className="flex flex-wrap gap-2 mb-6">
              {activity.bookingInfo?.confirmationType === 'INSTANT' && (
                <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                  Instant Confirmation
                </span>
              )}
              {activity.flags?.isFreeCancellation && (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  Free Cancellation
                </span>
              )}
            </div>

            {/* CTA */}
            <div className="inline-flex items-center gap-2 text-primary-700 font-semibold group-hover:text-primary-800 transition-colors">
              View Details & Book
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </Card>
    </a>
  );
}

// Activity Card - For 2 or 3 column layouts
function ActivityCard({ activity, featured = false }: { activity: ViatorProductSummary; featured?: boolean }) {
  const price = activity.pricing?.summary?.fromPrice;
  const rating = activity.reviews?.combinedAverageRating;
  const reviewCount = activity.reviews?.totalReviews;
  const duration = activity.duration?.fixedDurationInMinutes;
  const imageUrl = activity.images?.[0]?.variants?.find(v => v.width >= 400)?.url || 
                   activity.images?.[0]?.variants?.[0]?.url;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <a
      href={activity.productUrl || `/things-to-do/${activity.productCode}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative bg-white rounded-xl border border-neutral-200 overflow-hidden hover:border-primary-400 hover:shadow-xl transition-all duration-300"
    >
      {/* Featured Badge */}
      {featured && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-accent-500 text-white shadow-lg">
          <Sparkles className="w-3 h-3" />
          Popular
        </div>
      )}

      {/* Image */}
      <div className="relative h-44 bg-neutral-100 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={activity.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Compass className="w-12 h-12 text-neutral-300" />
          </div>
        )}
        
        {/* Price overlay */}
        {price && (
          <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-lg">
            <div className="flex items-baseline gap-0.5">
              <span className="text-xs text-neutral-500">from</span>
              <span className="font-bold text-neutral-900">{formatPrice(price)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-bold text-neutral-900 text-base leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-primary-700 transition-colors">
          {activity.title}
        </h3>

        {/* Meta info */}
        <div className="flex flex-wrap gap-3 text-xs text-neutral-600">
          {rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-accent-400 text-accent-400" />
              <span className="font-semibold">{rating.toFixed(1)}</span>
              {reviewCount && (
                <span className="text-neutral-400">({reviewCount})</span>
              )}
            </div>
          )}
          {duration && (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>{duration >= 60 ? `${Math.round(duration / 60)}h` : `${duration}m`}</span>
            </div>
          )}
        </div>

        {/* Description snippet */}
        {activity.description && (
          <p className="text-xs text-neutral-500 line-clamp-2">
            {activity.description}
          </p>
        )}

        {/* CTA */}
        <div className="pt-3 border-t border-neutral-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">
              {activity.bookingInfo?.confirmationType === 'INSTANT' && (
                <span className="text-primary-600 font-medium">Instant confirmation</span>
              )}
            </span>
            <span className="text-sm font-semibold text-primary-700 group-hover:text-primary-800 flex items-center gap-1 transition-colors">
              Book Now <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

export function ActivityGrid({ 
  category,
  limit = 3,
  title = 'Things to Do in Telluride',
  maxPrice,
  minPrice,
}: ActivityGridProps) {
  const [activities, setActivities] = useState<ViatorProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
  }, [category, limit, maxPrice, minPrice]);

  async function fetchActivities() {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        destination: 'Telluride',
        limit: limit.toString(),
      });

      if (category) {
        params.set('category', category);
      }
      if (maxPrice) {
        params.set('maxPrice', maxPrice.toString());
      }
      if (minPrice) {
        params.set('minPrice', minPrice.toString());
      }
      
      const response = await fetch(`/api/viator/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to load activities');
      }
      
      const data = await response.json();
      setActivities(data.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }

  const getCategoryLabel = (cat?: string) => {
    const labels: Record<string, string> = {
      'skiing': 'Skiing & Snowboarding',
      'hiking': 'Hiking & Nature',
      'dining': 'Food & Drink',
      'events': 'Events & Entertainment',
      'family': 'Family Activities',
      'nightlife': 'Nightlife & Après-Ski',
      'tours': 'Tours & Sightseeing',
      'adventure': 'Adventure Sports',
    };
    return cat ? labels[cat] || cat : 'All Activities';
  };

  // Determine display mode based on number of activities
  const displayMode = activities.length === 1 ? 'single' : activities.length === 2 ? 'double' : 'triple';

  if (loading) {
    return (
      <div className="my-12 not-prose">
        <div className="border border-neutral-200 rounded-xl p-8 bg-neutral-50">
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-neutral-600">Loading activities...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || activities.length === 0) {
    return (
      <div className="my-12 not-prose">
        <div className="border border-neutral-200 rounded-xl p-8 bg-neutral-50 text-center">
          <Compass className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-600 mb-4">
            {error || 'No activities available for this category right now.'}
          </p>
          <a
            href="/things-to-do"
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Browse All Activities
            <ChevronRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="my-12 not-prose">
      {title && (
        <h3 className="text-2xl font-bold text-neutral-900 mb-8">{title}</h3>
      )}

      {/* Single Activity Mode - Full width showcase */}
      {displayMode === 'single' && activities[0] && (
        <SingleActivityShowcase activity={activities[0]} />
      )}

      {/* Double Activity Mode - 2 column split */}
      {displayMode === 'double' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activities.map((activity, index) => (
            <ActivityCard 
              key={activity.productCode} 
              activity={activity} 
              featured={index === 0}
            />
          ))}
        </div>
      )}

      {/* Triple Activity Mode - 3 column split */}
      {displayMode === 'triple' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.slice(0, 3).map((activity, index) => (
            <ActivityCard 
              key={activity.productCode} 
              activity={activity} 
              featured={index === 0}
            />
          ))}
        </div>
      )}

      {/* Footer CTA */}
      <div className="mt-8 text-center">
        <a
          href={`/things-to-do${category ? `?category=${category}` : ''}`}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-md hover:shadow-lg"
        >
          Explore All {getCategoryLabel(category)}
          <ChevronRight className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
}

export default ActivityGrid;

