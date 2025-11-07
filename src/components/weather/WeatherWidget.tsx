import { useEffect, useState } from 'react';
import type { WeatherData } from '@/lib/liteapi/weather';
import { getWeatherIcon, getWeatherDescription } from '@/lib/liteapi/weather';
import { format } from 'date-fns';

interface WeatherWidgetProps {
  startDate: string;
  endDate: string;
  title?: string;
  compact?: boolean;
}

export function WeatherWidget({ startDate, endDate, title = 'Weather Forecast', compact = false }: WeatherWidgetProps) {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        console.log('[WeatherWidget] Fetching weather:', { startDate, endDate });
        const response = await fetch(
          `/api/weather/forecast?startDate=${startDate}&endDate=${endDate}&units=imperial`
        );
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('[WeatherWidget] API error:', response.status, errorData);
          throw new Error(`Weather API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[WeatherWidget] Weather data received:', data);
        console.log('[WeatherWidget] Data structure:', {
          hasWeatherData: !!data.weatherData,
          weatherDataLength: data.weatherData?.length,
          firstItem: data.weatherData?.[0],
          hasDailyWeather: !!data.weatherData?.[0]?.dailyWeather,
        });
        setWeatherData(data.weatherData || []);
      } catch (err) {
        console.error('[WeatherWidget] Error fetching weather:', err);
        setError('Unable to load weather data');
      } finally {
        setLoading(false);
      }
    };

    if (startDate && endDate) {
      fetchWeather();
    } else {
      console.warn('[WeatherWidget] Missing dates:', { startDate, endDate });
      setLoading(false);
    }
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className={`bg-sky-50 border border-sky-200 rounded-xl ${compact ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-sky-600"></div>
          <span className="text-sm text-sky-700">Loading weather...</span>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('[WeatherWidget] Error state:', error);
    return null;
  }

  if (!weatherData.length) {
    console.warn('[WeatherWidget] No weather data available');
    return null;
  }

  // Extract daily weather data from each item
  const dailyData = weatherData.map(w => w.dailyWeather).filter(Boolean);

  if (compact) {
    return (
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-sky-900 mb-3">{title}</h3>
        <div className="flex gap-2 overflow-x-auto">
          {dailyData.slice(0, 7).map((weather) => {
            const icon = getWeatherIcon(weather);
            const date = new Date(weather.date);
            
            return (
              <div key={weather.date} className="flex-shrink-0 text-center min-w-[70px]">
                <div className="text-xs text-sky-700 mb-1">
                  {format(date, 'EEE')}
                </div>
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-sm font-semibold text-sky-900">
                  {Math.round(weather.temperature.max)}°
                </div>
                <div className="text-xs text-sky-600">
                  {Math.round(weather.temperature.min)}°
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-2xl p-6 shadow-card">
      <h3 className="text-lg font-bold text-sky-900 mb-4">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {dailyData.map((weather) => {
          const icon = getWeatherIcon(weather);
          const description = getWeatherDescription(weather);
          const date = new Date(weather.date);
          
          return (
            <div key={weather.date} className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-sm font-semibold text-neutral-700 mb-2">
                {format(date, 'MMM d')}
              </div>
              <div className="text-4xl mb-2">{icon}</div>
              <div className="text-xs text-neutral-600 mb-2">{description}</div>
              <div className="flex justify-center items-center gap-2 mb-2">
                <span className="text-lg font-bold text-neutral-900">
                  {Math.round(weather.temperature.max)}°
                </span>
                <span className="text-sm text-neutral-500">
                  {Math.round(weather.temperature.min)}°
                </span>
              </div>
              {weather.precipitation.total >= 0.3 && (
                <div className="text-xs text-sky-600">
                  {Math.round(weather.precipitation.total * 100)}% precip
                </div>
              )}
              {weather.wind.max.speed >= 15 && (
                <div className="text-xs text-neutral-500">
                  Wind {Math.round(weather.wind.max.speed)} mph
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

