import { useEffect, useState } from 'react';
import type { WeatherData } from '@/lib/liteapi/weather';
import { isSnowConditions } from '@/lib/liteapi/weather';

interface SnowAlertBadgeProps {
  checkIn: string;
  checkOut: string;
}

export function SnowAlertBadge({ checkIn, checkOut }: SnowAlertBadgeProps) {
  const [hasSnow, setHasSnow] = useState(false);
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
        
        const snowExpected = weatherData.some(w => isSnowConditions(w.dailyWeather));
        setHasSnow(snowExpected);
      } catch (err) {
        console.error('Error checking snow conditions:', err);
      } finally {
        setLoading(false);
      }
    };

    if (checkIn && checkOut) {
      fetchWeather();
    }
  }, [checkIn, checkOut]);

  if (loading || !hasSnow) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-sky-400 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm animate-pulse">
      <span className="text-sm">❄️</span>
      <span>Fresh Snow Expected!</span>
    </div>
  );
}

