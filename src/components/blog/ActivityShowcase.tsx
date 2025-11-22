import { useState, useEffect } from 'react';
import { ActivityCard } from '@/components/activities/ActivityCard';
import type { ViatorProductSummary } from '@/lib/viator/types';

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

  useEffect(() => {
    async function fetchActivities() {
      try {
        const params = new URLSearchParams({
          destination: 'Telluride',
          limit: limit.toString(),
        });

        if (category) {
          params.set('category', category);
        }
        
        const response = await fetch(`/api/viator/search?${params.toString()}`);
        
        if (!response.ok) {
          return; // Silently fail, render nothing
        }
        
        const data = await response.json();
        setActivities(data.products || []);
      } catch (err) {
        // Silently fail, render nothing
        console.error('[ActivityShowcase] Error fetching activities:', err);
      }
    }

    fetchActivities();
  }, [category, limit]);

  // Render nothing if no activities available
  if (activities.length === 0) {
    return null;
  }

  return (
    <div className="my-8">
      {title && (
        <h3 className="text-2xl font-bold text-neutral-900 mb-6">{title}</h3>
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
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
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

