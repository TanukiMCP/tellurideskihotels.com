'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ActivityCard } from '@/components/activities/ActivityCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Compass, AlertCircle } from 'lucide-react';
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

  if (loading) {
    return (
      <Card className="my-12 not-prose border-2 border-primary-200">
        <CardContent className="py-12">
          <div className="flex justify-center items-center">
            <LoadingSpinner size="lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="my-12 not-prose border-2 border-primary-200">
        <CardContent className="py-8">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900 mb-1">Unable to Load Activities</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="my-12 not-prose border-2 border-primary-200">
        <CardHeader className="bg-gradient-to-r from-primary-50 to-primary-100 border-b border-primary-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center shadow-md">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-neutral-900">{title}</CardTitle>
              <p className="text-neutral-600 mt-1 text-sm">
                Explore activities and experiences
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-neutral-600 mb-4">No activities available at this time</p>
            <a
              href="/things-to-do"
              className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              Browse All Activities
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="my-12 not-prose border-2 border-primary-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary-50 to-primary-100 border-b border-primary-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center shadow-md">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-neutral-900">{title}</CardTitle>
              <p className="text-neutral-600 mt-1 text-sm">
                {activities.length} {activities.length === 1 ? 'activity' : 'activities'} available
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Activity Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.slice(0, limit).map((activity) => (
            <ActivityCard
              key={activity.productCode}
              activity={activity}
            />
          ))}
        </div>

        {/* CTA to see more */}
        <div className="mt-8 pt-6 border-t border-neutral-200 text-center">
          <a
            href={`/things-to-do${category ? `?category=${category}` : ''}`}
            className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3.5 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            Explore All Activities
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
