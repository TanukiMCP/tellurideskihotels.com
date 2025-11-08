/**
 * Ski Conditions Widget
 * Displays live ski conditions from SnoCountry API
 */

import { useEffect, useState } from 'react';
import type { SkiConditions } from '@/lib/snocountry/types';
import { getTimeSinceUpdate, formatSnowDepth } from '@/lib/snocountry/client';

interface SkiConditionsWidgetProps {
  initialConditions?: SkiConditions | null;
}

export function SkiConditionsWidget({ initialConditions }: SkiConditionsWidgetProps) {
  const [conditions, setConditions] = useState<SkiConditions | null>(initialConditions || null);
  const [loading, setLoading] = useState(!initialConditions);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialConditions) return;

    const fetchConditions = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/ski-conditions');
        
        if (!response.ok) {
          throw new Error('Failed to load ski conditions');
        }

        const data = await response.json();
        setConditions(data);
      } catch (err) {
        console.error('Error fetching ski conditions:', err);
        setError('Unable to load current conditions');
      } finally {
        setLoading(false);
      }
    };

    fetchConditions();
  }, [initialConditions]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-2xl p-6 border border-sky-200 shadow-card">
        <div className="animate-pulse">
          <div className="h-6 bg-sky-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-sky-200 rounded"></div>
            <div className="h-4 bg-sky-200 rounded w-5/6"></div>
            <div className="h-4 bg-sky-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !conditions) {
    return (
      <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-2xl p-6 border border-neutral-200 shadow-card">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-neutral-600">Conditions temporarily unavailable</p>
        </div>
      </div>
    );
  }

  const { conditions: weather, trails, lifts, terrainParks, timestamp } = conditions;
  const hasNewSnow = weather.newSnow24hr > 0;

  return (
    <div className="bg-gradient-to-br from-sky-50 via-white to-sky-50 rounded-2xl p-6 border border-sky-200 shadow-card hover:shadow-card-hover transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-card">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-900">Ski Conditions</h3>
            <p className="text-sm text-neutral-600">Telluride Resort</p>
          </div>
        </div>
        {hasNewSnow && (
          <div className="bg-accent-500 text-white px-3 py-1.5 rounded-lg font-bold text-sm shadow-card animate-pulse">
            Fresh Snow! ❄️
          </div>
        )}
      </div>

      {/* Snow Report */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-white rounded-xl border border-sky-100 shadow-sm">
          <div className="text-3xl font-bold text-sky-600 mb-1">{weather.newSnow24hr}"</div>
          <div className="text-xs text-neutral-600 font-medium">24hr Snow</div>
        </div>
        <div className="text-center p-4 bg-white rounded-xl border border-sky-100 shadow-sm">
          <div className="text-3xl font-bold text-sky-600 mb-1">{weather.newSnow48hr}"</div>
          <div className="text-xs text-neutral-600 font-medium">48hr Snow</div>
        </div>
        <div className="text-center p-4 bg-white rounded-xl border border-primary-100 shadow-sm">
          <div className="text-3xl font-bold text-primary-600 mb-1">{weather.baseDepthMin}"</div>
          <div className="text-xs text-neutral-600 font-medium">Base Depth</div>
        </div>
        <div className="text-center p-4 bg-white rounded-xl border border-primary-100 shadow-sm">
          <div className="text-3xl font-bold text-primary-600 mb-1">{weather.baseDepthMax}"</div>
          <div className="text-xs text-neutral-600 font-medium">Summit Depth</div>
        </div>
      </div>

      {/* Trails & Lifts */}
      <div className="space-y-4 mb-6">
        {/* Trails */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="font-semibold text-neutral-900">Trails</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary-600">{trails.open}</span>
              <span className="text-sm text-neutral-600">/ {trails.total}</span>
              <span className="ml-2 bg-primary-100 text-primary-700 px-2 py-1 rounded-md text-sm font-semibold">
                {trails.percentOpen}%
              </span>
            </div>
          </div>
          <div className="h-3 bg-neutral-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
              style={{ width: `${trails.percentOpen}%` }}
            />
          </div>
        </div>

        {/* Lifts */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span className="font-semibold text-neutral-900">Lifts</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-accent-600">{lifts.open}</span>
              <span className="text-sm text-neutral-600">/ {lifts.total}</span>
              <span className="ml-2 bg-accent-100 text-accent-700 px-2 py-1 rounded-md text-sm font-semibold">
                {lifts.percentOpen}%
              </span>
            </div>
          </div>
          <div className="h-3 bg-neutral-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-accent-500 to-accent-600 transition-all duration-500"
              style={{ width: `${lifts.percentOpen}%` }}
            />
          </div>
        </div>

        {/* Terrain Parks */}
        {terrainParks.total > 0 && (
          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-neutral-100">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
              </svg>
              <span className="font-semibold text-neutral-900">Terrain Parks</span>
            </div>
            <span className="text-lg font-bold text-secondary-600">{terrainParks.open} / {terrainParks.total}</span>
          </div>
        )}
      </div>

      {/* Conditions & Temperature */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-white rounded-xl border border-neutral-100">
          <div className="text-xs text-neutral-600 font-medium mb-1">Surface</div>
          <div className="text-sm font-bold text-neutral-900">{weather.surfaceCondition}</div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-neutral-100">
          <div className="text-xs text-neutral-600 font-medium mb-1">Temperature</div>
          <div className="text-sm font-bold text-neutral-900">{weather.temperatureLow}° / {weather.temperatureHigh}°F</div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center pt-4 border-t border-neutral-200">
        <p className="text-xs text-neutral-500">
          Updated {getTimeSinceUpdate(new Date(timestamp))}
        </p>
      </div>
    </div>
  );
}

