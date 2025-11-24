'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Compass, Star, Clock, Users, DollarSign, ChevronRight, Sparkles } from 'lucide-react';
import type { ViatorProductSummary } from '@/lib/viator/types';

interface ActivityShowcaseProps {
  category?: string;
  limit?: number;
  title?: string;
}

export function ActivityShowcase({ 
  category,
  limit = 3,
  title = 'Things to Do in Telluride'
}: ActivityShowcaseProps) {
  const [activities, setActivities] = useState<ViatorProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
  }, [category, limit]);

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

  const formatPrice = (price: number | undefined) => {
    if (!price) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

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

  if (loading) {
    return (
      <Card className="my-12 not-prose border-0 shadow-xl bg-gradient-to-br from-slate-50 to-slate-100">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-slate-600">Discovering activities...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="my-12 not-prose border-0 shadow-xl bg-gradient-to-br from-slate-50 to-slate-100">
        <CardContent className="py-12">
          <div className="text-center">
            <Compass className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">Unable to load activities right now.</p>
            <a
              href="/things-to-do"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Browse All Activities
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="my-12 not-prose border-0 shadow-xl bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
              <Compass className="w-7 h-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">{title}</CardTitle>
              <p className="text-slate-300 mt-1 text-sm">{getCategoryLabel(category)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-slate-600 mb-6">No activities available for this category right now.</p>
            <a
              href="/things-to-do"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors shadow-lg hover:shadow-xl"
            >
              Explore All Activities
              <ChevronRight className="w-5 h-5" />
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="my-12 not-prose border-0 shadow-xl bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white pb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
              <Compass className="w-7 h-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">{title}</CardTitle>
              <p className="text-slate-300 mt-1 text-sm">
                {activities.length} {getCategoryLabel(category).toLowerCase()} experiences
              </p>
            </div>
          </div>
          <a
            href={`/things-to-do${category ? `?category=${category}` : ''}`}
            className="text-sm text-slate-300 hover:text-white transition-colors flex items-center gap-1"
          >
            View all <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Activity Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {activities.slice(0, limit).map((activity, index) => {
            const price = activity.pricing?.summary?.fromPrice;
            const rating = activity.reviews?.combinedAverageRating;
            const reviewCount = activity.reviews?.totalReviews;
            const duration = activity.duration?.fixedDurationInMinutes;
            const imageUrl = activity.images?.[0]?.variants?.find(v => v.width >= 300)?.url || activity.images?.[0]?.variants?.[0]?.url;
            
            return (
              <a
                key={activity.productCode}
                href={activity.productUrl || `/things-to-do/${activity.productCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-white rounded-2xl border-2 border-slate-200 overflow-hidden hover:border-slate-400 hover:shadow-xl transition-all duration-300"
              >
                {/* Popular Badge */}
                {index === 0 && (
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-lg">
                    <Sparkles className="w-3 h-3" />
                    Popular
                  </div>
                )}

                {/* Image */}
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={activity.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Compass className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                  
                  {/* Price overlay */}
                  {price && (
                    <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-lg">
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-xs text-slate-500">from</span>
                        <span className="font-bold text-slate-900">{formatPrice(price)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Title */}
                  <h3 className="font-bold text-slate-900 text-base leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-slate-700 transition-colors">
                    {activity.title}
                  </h3>

                  {/* Meta info */}
                  <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                    {rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-semibold">{rating.toFixed(1)}</span>
                        {reviewCount && (
                          <span className="text-slate-400">({reviewCount})</span>
                        )}
                      </div>
                    )}
                    {duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{duration >= 60 ? `${Math.round(duration / 60)}h` : `${duration}m`}</span>
                      </div>
                    )}
                  </div>

                  {/* Description snippet */}
                  {activity.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {activity.description}
                    </p>
                  )}

                  {/* CTA */}
                  <div className="pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {activity.bookingInfo?.confirmationType === 'INSTANT' && (
                          <span className="text-emerald-600 font-medium">Instant confirmation</span>
                        )}
                      </span>
                      <span className="text-sm font-semibold text-slate-800 group-hover:text-slate-900 flex items-center gap-1 transition-colors">
                        Book Now <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Footer CTA */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
          <a
            href={`/things-to-do${category ? `?category=${category}` : ''}`}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors shadow-lg hover:shadow-xl"
          >
            Explore All {getCategoryLabel(category)} 
            <ChevronRight className="w-5 h-5" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
