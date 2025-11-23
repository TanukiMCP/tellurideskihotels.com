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

  return (
    <div className="my-8">
      {title && (
        <h3 className="text-2xl font-bold text-neutral-900 mb-6">{title}</h3>
      )}
      {activities.length === 0 ? (
        <div className="text-center py-12 border-2 border-neutral-200 rounded-lg bg-neutral-50">
          <p className="text-neutral-600 mb-2">No activities available at this time</p>
          <a
            href="/things-to-do"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            Browse All Activities →
          </a>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.map((activity) => (
          <ActivityCard
            key={activity.productCode}
            activity={activity}
          />
        ))}
      </div>
      )}
      {activities.length > 0 && (
      <div className="mt-6 text-center">
        <a
          href={`/things-to-do${category ? `?category=${category}` : ''}`}
          className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 !text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          Explore All Activities
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
      )}
    </div>
  );
}

