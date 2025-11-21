/**
 * Air Quality Widget
 * Displays current air quality for Telluride area
 * Redesigned with enhanced visual hierarchy and cleaner layout
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
      color: '#8BA888', // Light sage
      recommendation: 'Air quality is excellent today. Perfect conditions for skiing, hiking, and all outdoor activities. Enjoy the fresh mountain air!',
    };
  } else if (aqi <= 100) {
    return {
      aqi,
      category: 'Moderate',
      color: '#F4C430', // Yellow
      recommendation: 'Air quality is acceptable for most people.',
    };
  } else if (aqi <= 150) {
    return {
      aqi,
      category: 'Unhealthy for Sensitive Groups',
      color: '#E8924F', // Orange
      recommendation: 'Sensitive groups should limit prolonged outdoor exertion.',
    };
  } else if (aqi <= 200) {
    return {
      aqi,
      category: 'Unhealthy',
      color: '#D14343', // Red
      recommendation: 'Everyone should limit prolonged outdoor exertion.',
    };
  } else if (aqi <= 300) {
    return {
      aqi,
      category: 'Very Unhealthy',
      color: '#A855F7', // Purple
      recommendation: 'Health alert: everyone may experience health effects.',
    };
  } else {
    return {
      aqi,
      category: 'Hazardous',
      color: '#991B1B', // Dark red
      recommendation: 'Health warnings of emergency conditions.',
    };
  }
}

export function AirQualityWidget() {
  const [loading, setLoading] = useState(true);
  const [airQuality, setAirQuality] = useState<AirQualityData>(getAQICategory(40)); // Default value
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('2 hours ago');

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
          setAirQuality(getAQICategory(40));
        }
      } catch (err) {
        console.error('[AirQualityWidget] Error fetching air quality:', err);
        setError('Unable to load current data');
        // Use typical Telluride AQI as fallback
        setAirQuality(getAQICategory(40));
      } finally {
        setLoading(false);
      }
    };

    fetchAirQuality();
  }, []);

  if (loading) {
    return (
      <article className="bg-white rounded-2xl p-8 border border-[#E8E8E8] shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        <div className="animate-pulse">
          <div className="h-6 bg-[#E8F2ED] rounded w-1/2 mb-4"></div>
          <div className="h-40 bg-[#E8F2ED] rounded w-full mb-4"></div>
          <div className="h-4 bg-[#E8F2ED] rounded w-3/4"></div>
        </div>
      </article>
    );
  }

  return (
    <article className="bg-white rounded-2xl p-8 border border-[#E8E8E8] shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 rounded-xl bg-[#E8F2ED] flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-[#2D5F4F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-[#2C2C2C] mb-1">Air Quality</h3>
          <p className="text-sm font-medium text-[#666]">Current Conditions</p>
        </div>
      </div>

      {/* AQI Display */}
      <div className="text-center mb-6 flex-1 flex flex-col justify-center">
        {/* Large AQI Circle */}
        <div 
          className="inline-flex items-center justify-center w-40 h-40 rounded-full mb-4 mx-auto shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
          style={{
            background: `linear-gradient(135deg, ${airQuality.color} 0%, ${airQuality.color}dd 100%)`
          }}
        >
          <div className="text-center text-white">
            <div className="text-[64px] font-bold mb-1 leading-none">{airQuality.aqi}</div>
            <div className="text-base font-semibold uppercase tracking-[2px]">AQI</div>
          </div>
        </div>

        {/* Quality Rating */}
        <div className="text-2xl font-semibold text-[#2C2C2C] mb-4">{airQuality.category}</div>

        {/* Description */}
        <p className="text-[15px] text-[#666] leading-relaxed max-w-[280px] mx-auto mb-4">
          {airQuality.recommendation}
        </p>

        {/* Last Updated */}
        <div className="flex items-center justify-center gap-2 text-[13px] text-[#999] mb-4">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Updated {lastUpdated}</span>
        </div>
      </div>

      {/* AQI Scale Legend */}
      <div className="pt-6 border-t border-[#E8E8E8] mt-auto">
        <h4 className="text-xs font-semibold text-[#666] uppercase tracking-wide mb-4">AQI SCALE</h4>
        
        {/* Horizontal Bar Option */}
        <div className="mb-4">
          <div className="flex h-2 rounded-full overflow-hidden mb-3">
            <div className="w-1/4 bg-[#8BA888]"></div>
            <div className="w-1/4 bg-[#F4C430]"></div>
            <div className="w-1/4 bg-[#E8924F]"></div>
            <div className="w-1/4 bg-[#D14343]"></div>
          </div>
          <div className="flex text-[11px] text-[#666]">
            <div className="w-1/4 text-center">0-50<br />Good</div>
            <div className="w-1/4 text-center">51-100<br />Moderate</div>
            <div className="w-1/4 text-center">101-150<br />Sensitive</div>
            <div className="w-1/4 text-center">151+<br />Unhealthy</div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-[#FFF8E1] border border-[#FFE082] rounded-lg mb-4">
            <p className="text-xs text-[#F57C00] font-medium">
              <span className="font-bold">Note:</span> {error}. Showing typical Telluride AQI.
            </p>
          </div>
        )}

        {/* Learn More Link */}
        <a
          href="/mountain-conditions"
          className="block text-center text-sm text-[#2D5F4F] hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-[#2D5F4F] focus:ring-offset-2 rounded"
        >
          Learn more about air quality →
        </a>
      </div>
    </article>
  );
}
