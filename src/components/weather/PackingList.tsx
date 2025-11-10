import { useEffect, useState } from 'react';
import { Backpack, CheckCircle2 } from 'lucide-react';
import type { WeatherDay } from '@/lib/open-meteo/weather';
import { getPackingRecommendations } from '@/lib/open-meteo/weather';

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
        const response = await fetch('/api/weather/open-meteo');
        
        if (!response.ok) throw new Error('Failed to fetch weather');
        
        const data = await response.json();
        const weatherData: WeatherDay[] = data.weatherData || [];
        
        // Filter to only check weather within the date range
        const filteredWeather = weatherData.filter(day => 
          day.date >= checkIn && day.date <= checkOut
        );
        
        const packingTips = getPackingRecommendations(filteredWeather);
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
          <Backpack className="w-5 h-5 text-sky-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-sky-900 mb-1">Packing Recommendations</h3>
          <p className="text-sm text-sky-700">Based on the weather forecast for your stay</p>
        </div>
      </div>
      
      <ul className="space-y-2">
        {recommendations.map((rec, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-neutral-700">
            <CheckCircle2 className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
            <span>{rec}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
