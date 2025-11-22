'use client';

import { useState, useEffect } from 'react';
import { ActivityCard } from '@/components/activities/ActivityCard';
import type { ViatorProductSummary } from '@/lib/viator/types';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface ActivityShowcaseProps {
  category?: string;
  limit?: number;
  title?: string;
}

export function ActivityShowcase({ 
  category,
  limit = 3,
  title
}: ActivityShowcaseProps) {
  const [activities, setActivities] = useState<ViatorProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
        const products = data.products || [];
        
        // Sort by review count/rating (best first)
        products.sort((a: ViatorProductSummary, b: ViatorProductSummary) => {
          const aReviews = a.reviews?.totalReviews || 0;
          const bReviews = b.reviews?.totalReviews || 0;
          if (bReviews !== aReviews) return bReviews - aReviews;
          const aRating = a.reviews?.combinedAverageRating || 0;
          const bRating = b.reviews?.combinedAverageRating || 0;
          return bRating - aRating;
        });
        
        setActivities(products.slice(0, limit));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load activities');
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, [category, limit]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 my-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || activities.length === 0) {
    return (
      <div className="my-8 p-6 bg-neutral-50 border border-neutral-200 rounded-lg">
        <p className="text-neutral-600 text-center">
          {error || 'No activities available at this time.'}
        </p>
      </div>
    );
  }

  return (
    <div className="my-8">
      {title && (
        <h3 className="text-2xl font-bold text-neutral-900 mb-6 font-serif">{title}</h3>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.map((activity) => (
          <ActivityCard
            key={activity.productCode}
            activity={activity}
          />
        ))}
      </div>
      <div className="mt-6 text-center">
        <a
          href="/things-to-do"
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
        >
          Explore All Activities
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
}
