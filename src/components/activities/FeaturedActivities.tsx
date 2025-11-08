/**
 * Featured Activities Component
 * Displays featured Viator activities on the homepage
 */

import { useEffect, useState } from 'react';
import type { ViatorProduct } from '@/lib/viator/types';
import { ActivityCard } from './ActivityCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface FeaturedActivitiesProps {
  limit?: number;
  initialActivities?: ViatorProduct[];
}

export function FeaturedActivities({ 
  limit = 6,
  initialActivities = []
}: FeaturedActivitiesProps) {
  const [activities, setActivities] = useState<ViatorProduct[]>(initialActivities);
  const [loading, setLoading] = useState(initialActivities.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we have initial activities, don't fetch
    if (initialActivities.length > 0) {
      return;
    }

    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/viator/featured?limit=${limit}`);
        
        if (!response.ok) {
          throw new Error('Failed to load activities');
        }

        const data = await response.json();
        setActivities(data.activities || []);
      } catch (err) {
        console.error('Error fetching featured activities:', err);
        setError('Unable to load activities at this time');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [limit, initialActivities.length]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
          <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-neutral-600 text-lg">{error}</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
          <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-neutral-600 text-lg">No activities available at the moment</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {activities.map((activity) => (
        <ActivityCard key={activity.productCode} activity={activity} />
      ))}
    </div>
  );
}

