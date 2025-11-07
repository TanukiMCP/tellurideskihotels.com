import { useEffect, useState } from 'react';
import type { WeatherData } from '@/lib/liteapi/weather';
import { getPackingRecommendations } from '@/lib/liteapi/weather';

interface PackingListProps {
  checkIn: string;
  checkOut: string;
}

export function PackingList({ checkIn, checkOut }: PackingListProps) {
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `/api/weather/forecast?startDate=${checkIn}&endDate=${checkOut}&units=imperial`
        );
        
        if (!response.ok) throw new Error('Failed to fetch weather');
        
        const data = await response.json();
        const weatherData: WeatherData[] = data.weatherData || [];
        
        const packingTips = getPackingRecommendations(weatherData);
        setRecommendations(packingTips);
      } catch (err) {
        console.error('Error fetching packing recommendations:', err);
      } finally {
        setLoading(false);
      }
    };

    if (checkIn && checkOut) {
      fetchWeather();
    }
  }, [checkIn, checkOut]);

  if (loading || !recommendations.length) {
    return null;
  }

  return (
    <div className="bg-sky-50 border border-sky-200 rounded-xl p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
          <span className="text-xl">🎒</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-sky-900 mb-1">Packing Recommendations</h3>
          <p className="text-sm text-sky-700">Based on the weather forecast for your stay</p>
        </div>
      </div>
      
      <ul className="space-y-2">
        {recommendations.map((rec, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-neutral-700">
            <svg className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{rec}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

