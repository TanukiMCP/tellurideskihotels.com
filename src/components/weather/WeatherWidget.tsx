import { useState, useEffect } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import type { WeatherDay } from '@/lib/open-meteo/weather';
import { getWeatherIcon, getWeatherDescription } from '@/lib/open-meteo/weather';

interface WeatherWidgetProps {
  startDate: string;
  endDate: string;
  title?: string;
  compact?: boolean;
}

export function WeatherWidget({ startDate, endDate, title = 'Weather Forecast', compact = false }: WeatherWidgetProps) {
  const [weatherData, setWeatherData] = useState<WeatherDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        console.log('[WeatherWidget] Fetching weather from Open-Meteo:', { startDate, endDate });
        
        const response = await fetch('/api/weather/open-meteo');
        
        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[WeatherWidget] Weather data received:', data);
        
        // Filter weather data to only show dates in the range
        const filteredData = (data.weatherData || []).filter((day: WeatherDay) => {
          return day.date >= startDate && day.date <= endDate;
        });
        
        console.log('[WeatherWidget] Filtered weather data:', {
          startDate,
          endDate,
          totalDays: data.weatherData?.length || 0,
          filteredDays: filteredData.length,
          dates: filteredData.map((d: WeatherDay) => d.date),
        });
        
        setWeatherData(filteredData);
      } catch (err) {
        console.error('[WeatherWidget] Error fetching weather:', err);
        setError(err instanceof Error ? err.message : 'Failed to load weather');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-center gap-2 py-6">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-sky-600"></div>
          <span className="text-sky-900 font-medium text-sm">Loading weather...</span>
        </div>
      </div>
    );
  }

  if (error || !weatherData.length) {
    return (
      <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-4 shadow-sm">
        <h3 className="text-base font-bold text-sky-900 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
          {title}
        </h3>
        <p className="text-sm text-neutral-600">Weather data unavailable</p>
      </div>
    );
  }

  const isShortStay = weatherData.length <= 3;

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-4 shadow-sm">
        <h3 className="text-base font-bold text-sky-900 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
          {title}
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
          {weatherData.slice(0, 7).map((weather) => {
            const date = parseISO(weather.date);
            const description = getWeatherDescription(weather.weatherCode);
            const icon = getWeatherIcon(weather.weatherCode);
            
            return (
              <div key={weather.date} className="text-center bg-white rounded-lg p-3 border border-sky-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-xs font-bold text-sky-700 mb-2">
                  {format(date, 'EEE')}
                </div>
                <div className="text-[10px] text-neutral-600 mb-2">
                  {format(date, 'MMM d')}
                </div>
                <div className="mb-2 text-3xl" title={description}>
                  {icon}
                </div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="text-lg font-bold text-neutral-900">
                    {Math.round(weather.temp.max)}°
                  </div>
                  <div className="text-xs text-neutral-500">
                    {Math.round(weather.temp.min)}°
                  </div>
                </div>
                {weather.precipProbability >= 30 && (
                  <div className="text-[10px] text-sky-600 flex items-center justify-center gap-0.5">
                    💧 {Math.round(weather.precipProbability)}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Full (non-compact) view
  return (
    <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-3xl p-6 lg:p-8 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-sky-900 flex items-center gap-3">
          <svg className="w-8 h-8 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
          {title}
        </h3>
        <span className="text-sm text-neutral-600 font-medium">
          {weatherData.length} {weatherData.length === 1 ? 'day' : 'days'}
        </span>
      </div>
      <div className={`grid gap-4 ${
        isShortStay 
          ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' 
          : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7'
      }`}>
        {weatherData.map((weather) => {
          const description = getWeatherDescription(weather.weatherCode);
          const icon = getWeatherIcon(weather.weatherCode);
          const date = parseISO(weather.date);
          
          return (
            <div key={weather.date} className={`bg-white rounded-xl ${isShortStay ? 'p-6' : 'p-4'} text-center shadow-md hover:shadow-lg transition-shadow border border-neutral-100`}>
              <div className={`${isShortStay ? 'text-lg' : 'text-sm'} font-bold text-sky-700 mb-2`}>
                {format(date, 'EEEE')}
              </div>
              <div className={`${isShortStay ? 'text-base' : 'text-xs'} text-neutral-600 mb-3`}>
                {format(date, 'MMMM d')}
              </div>
              <div className={`mb-3 ${isShortStay ? 'text-6xl' : 'text-5xl'}`} title={description}>
                {icon}
              </div>
              <div className={`${isShortStay ? 'text-sm' : 'text-xs'} text-neutral-700 mb-3 font-medium`}>
                {description}
              </div>
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className={`${isShortStay ? 'text-3xl' : 'text-2xl'} font-bold text-neutral-900`}>
                  {Math.round(weather.temp.max)}°
                </div>
                <div className={`${isShortStay ? 'text-xl' : 'text-lg'} text-neutral-500`}>
                  {Math.round(weather.temp.min)}°
                </div>
              </div>
              <div className="space-y-1 text-xs text-neutral-600">
                {weather.precipProbability >= 30 && (
                  <div className="flex items-center justify-center gap-1">
                    <span>💧</span>
                    <span>{Math.round(weather.precipProbability)}% chance</span>
                  </div>
                )}
                {weather.precipitation > 0 && (
                  <div className="flex items-center justify-center gap-1">
                    <span>🌧️</span>
                    <span>{weather.precipitation.toFixed(2)}" precip</span>
                  </div>
                )}
                {weather.windSpeed > 0 && (
                  <div className="flex items-center justify-center gap-1">
                    <span>💨</span>
                    <span>{Math.round(weather.windSpeed)} mph</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
