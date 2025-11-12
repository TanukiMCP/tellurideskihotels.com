import { useEffect, useState } from 'react';
import { Snowflake } from 'lucide-react';
import type { WeatherDay } from '@/lib/open-meteo/weather';
import { isSnowConditions } from '@/lib/open-meteo/weather';

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
        console.log('[SnowAlertBadge] Checking snow conditions:', { checkIn, checkOut });
        const response = await fetch('/api/weather/open-meteo');
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('[SnowAlertBadge] API error:', response.status, errorData);
          throw new Error(`Weather API error: ${response.status}`);
        }
        
        const data = await response.json();
        const weatherData: WeatherDay[] = data.weatherData || [];
        
        // Filter to only check weather within the date range
        const filteredWeather = weatherData.filter(day => 
          day.date >= checkIn && day.date <= checkOut
        );
        
        // Check if any day has snow conditions
        const snowExpected = filteredWeather.some(day => 
          isSnowConditions(day.weatherCode, day.precipitation)
        );
        
        console.log('[SnowAlertBadge] Snow check result:', { 
          snowExpected, 
          totalDays: weatherData.length, 
          filteredDays: filteredWeather.length,
          dates: filteredWeather.map(d => d.date),
        });
        setHasSnow(snowExpected);
      } catch (err) {
        console.error('[SnowAlertBadge] Error checking snow conditions:', err);
      } finally {
        setLoading(false);
      }
    };

    if (checkIn && checkOut) {
      fetchWeather();
    } else {
      console.warn('[SnowAlertBadge] Missing dates:', { checkIn, checkOut });
      setLoading(false);
    }
  }, [checkIn, checkOut]);

  if (loading || !hasSnow) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-700 px-3 py-1.5 rounded-md text-xs font-medium border border-sky-200">
      <Snowflake className="w-3.5 h-3.5" />
      <span>Snow expected during stay</span>
    </div>
  );
}
