/**
 * HotelProximityBadge Component
 * Shows proximity information for hotels near ski trails/lifts
 */
import React from 'react';

interface HotelProximityBadgeProps {
  distanceMeters: number;
  trailName?: string;
  trailType?: 'trail' | 'lift';
  compact?: boolean;
}

export default function HotelProximityBadge({
  distanceMeters,
  trailName,
  trailType = 'lift',
  compact = false
}: HotelProximityBadgeProps) {
  // Format distance
  const formatDistance = (meters: number): string => {
    if (meters < 100) {
      return `${Math.round(meters)}m`;
    } else if (meters < 1000) {
      return `${Math.round(meters / 10) * 10}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  };

  // Determine distance category and color
  const getDistanceColor = (meters: number): string => {
    if (meters < 200) return 'bg-green-500 text-white';
    if (meters < 500) return 'bg-blue-500 text-white';
    if (meters < 1000) return 'bg-amber-500 text-white';
    return 'bg-gray-500 text-white';
  };

  const getDistanceLabel = (meters: number): string => {
    if (meters < 200) return 'Ski-in/Ski-out';
    if (meters < 500) return 'Very Close';
    if (meters < 1000) return 'Walking Distance';
    return 'Nearby';
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getDistanceColor(distanceMeters)}`}>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>{formatDistance(distanceMeters)}</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-2 border border-gray-200">
      <div className="flex items-center gap-2 mb-1">
        {trailType === 'lift' ? (
          <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        )}
        <span className="text-xs font-semibold text-gray-700">
          {trailName || (trailType === 'lift' ? 'Nearest Lift' : 'Nearest Trail')}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getDistanceColor(distanceMeters)}`}>
          {formatDistance(distanceMeters)}
        </span>
        <span className="text-xs text-gray-500">
          {getDistanceLabel(distanceMeters)}
        </span>
      </div>
    </div>
  );
}

