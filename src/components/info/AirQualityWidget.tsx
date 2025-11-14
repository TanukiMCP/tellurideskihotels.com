/**
 * Air Quality Widget
 * Displays current air quality for Telluride area
 * Note: Telluride typically has excellent air quality year-round
 */

import { useEffect, useState } from 'react';

interface AirQualityData {
  aqi: number;
  category: 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  color: string;
  recommendation: string;
}

function getAQICategory(aqi: number): AirQualityData {
  if (aqi <= 50) {
    return {
      aqi,
      category: 'Good',
      color: 'from-green-500 to-green-600',
      recommendation: 'Air quality is excellent. Perfect for outdoor activities!',
    };
  } else if (aqi <= 100) {
    return {
      aqi,
      category: 'Moderate',
      color: 'from-yellow-500 to-yellow-600',
      recommendation: 'Air quality is acceptable for most people.',
    };
  } else if (aqi <= 150) {
    return {
      aqi,
      category: 'Unhealthy for Sensitive Groups',
      color: 'from-orange-500 to-orange-600',
      recommendation: 'Sensitive groups should limit prolonged outdoor exertion.',
    };
  } else if (aqi <= 200) {
    return {
      aqi,
      category: 'Unhealthy',
      color: 'from-red-500 to-red-600',
      recommendation: 'Everyone should limit prolonged outdoor exertion.',
    };
  } else if (aqi <= 300) {
    return {
      aqi,
      category: 'Very Unhealthy',
      color: 'from-purple-500 to-purple-600',
      recommendation: 'Health alert: everyone may experience health effects.',
    };
  } else {
    return {
      aqi,
      category: 'Hazardous',
      color: 'from-red-700 to-red-900',
      recommendation: 'Health warnings of emergency conditions.',
    };
  }
}

export function AirQualityWidget() {
  const [loading, setLoading] = useState(true);
  const [airQuality, setAirQuality] = useState<AirQualityData>(getAQICategory(35)); // Default value
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAirQuality = async () => {
      try {
        const response = await fetch('/api/air-quality');
        
        if (!response.ok) {
          throw new Error('Failed to fetch air quality data');
        }

        const data = await response.json();
        
        if (data.aqi !== null && data.aqi !== undefined) {
          setAirQuality(getAQICategory(data.aqi));
        } else {
          // Fallback to typical Telluride AQI if data unavailable
          setAirQuality(getAQICategory(35));
        }
      } catch (err) {
        console.error('[AirQualityWidget] Error fetching air quality:', err);
        setError('Unable to load current data');
        // Use typical Telluride AQI as fallback
        setAirQuality(getAQICategory(35));
      } finally {
        setLoading(false);
      }
    };

    fetchAirQuality();
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-green-50 via-white to-green-50 rounded-2xl p-6 border border-green-200 shadow-card">
        <div className="animate-pulse">
          <div className="h-6 bg-green-200 rounded w-1/2 mb-4"></div>
          <div className="h-12 bg-green-200 rounded w-24 mb-4"></div>
          <div className="h-4 bg-green-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary-50 rounded-2xl p-6 border border-primary-200 shadow-card hover:shadow-card-hover transition-all duration-300 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${airQuality.color.replace('from-', 'bg-').replace(' to-green-600', '').replace(' to-yellow-600', '').replace(' to-orange-600', '').replace(' to-red-600', '').replace(' to-purple-600', '').replace(' to-red-900', '')} flex items-center justify-center shadow-card`}>
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-900">Air Quality</h3>
            <p className="text-sm text-neutral-600">Current Conditions</p>
          </div>
        </div>
      </div>

      {/* AQI Display */}
      <div className="text-center mb-6 flex-1 flex flex-col justify-center">
        <div className={`inline-flex items-center justify-center w-40 h-40 rounded-full ${airQuality.color.replace('from-', 'bg-').replace(' to-green-600', '').replace(' to-yellow-600', '').replace(' to-orange-600', '').replace(' to-red-600', '').replace(' to-purple-600', '').replace(' to-red-900', '')} shadow-card mb-4`}>
          <div className="text-center text-white">
            <div className="text-5xl font-bold mb-1">{airQuality.aqi}</div>
            <div className="text-sm font-semibold uppercase tracking-wide">AQI</div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="inline-block px-6 py-3 bg-white rounded-lg border border-primary-200 shadow-sm">
            <div className="text-xl font-bold text-neutral-900">{airQuality.category}</div>
          </div>
          <p className="text-base text-neutral-700 max-w-sm mx-auto font-medium leading-relaxed">
            {airQuality.recommendation}
          </p>
        </div>
      </div>

      {/* AQI Scale Reference */}
      <div className="space-y-3 pt-6 border-t border-primary-200 mt-auto">
        <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wide mb-4">AQI Scale</h4>
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 flex-shrink-0"></div>
            <span className="text-neutral-700 font-medium">0-50: Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500 flex-shrink-0"></div>
            <span className="text-neutral-700 font-medium">51-100: Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500 flex-shrink-0"></div>
            <span className="text-neutral-700 font-medium">101-150: Sensitive</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0"></div>
            <span className="text-neutral-700 font-medium">151+: Unhealthy</span>
          </div>
        </div>

        {/* Error Message Only */}
        {error && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-900 font-medium">
              <span className="font-bold">Note:</span> {error}. Showing typical Telluride AQI.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

