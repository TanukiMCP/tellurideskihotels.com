import { useEffect, useState } from 'react';
import type { WeatherData, DetailedDaily } from '@/lib/liteapi/weather';
import { getWeatherDescription } from '@/lib/liteapi/weather';
import { format } from 'date-fns';

// Professional weather icons using SVG
function WeatherIcon({ weather, className = "w-12 h-12" }: { weather: DetailedDaily; className?: string }) {
  const mainWeather = weather.weather[0]?.main;
  const iconClass = `${className} text-sky-600`;
  
  switch (mainWeather) {
    case 'Snow':
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l-1.5 1.5L12 5l1.5-1.5L12 2zM4.929 4.929l-1.415 1.414L5.5 8.328l1.414-1.415-1.985-1.984zM19.071 4.929l-1.985 1.984L18.5 8.328l1.986-1.985-1.415-1.414zM12 6c-3.314 0-6 2.686-6 6s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm-8 5v2h2.025v-2H4zm15.975 0v2H22v-2h-2.025zM7.5 15.672l-1.415 1.414 1.986 1.985 1.414-1.415-1.985-1.984zM16.5 15.672l-1.986 1.984 1.415 1.415 1.985-1.985-1.414-1.414zM12 19l-1.5 1.5L12 22l1.5-1.5L12 19z"/>
        </svg>
      );
    case 'Rain':
    case 'Drizzle':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 19v2m4-4v4m4-6v6" />
        </svg>
      );
    case 'Clouds':
      return weather.clouds >= 70 ? (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      ) : (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          <circle cx="17" cy="8" r="3" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
        </svg>
      );
    case 'Clear':
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 17.5a5.5 5.5 0 100-11 5.5 5.5 0 000 11zM12 2a1 1 0 011 1v2a1 1 0 01-2 0V3a1 1 0 011-1zM3 12a1 1 0 011-1h2a1 1 0 010 2H4a1 1 0 01-1-1zM18 12a1 1 0 011-1h2a1 1 0 010 2h-2a1 1 0 01-1-1zM12 18a1 1 0 011 1v2a1 1 0 01-2 0v-2a1 1 0 011-1zM5.636 5.636a1 1 0 011.414 0l1.415 1.414a1 1 0 11-1.415 1.414L5.636 7.05a1 1 0 010-1.414zM16.95 16.95a1 1 0 011.414 0l1.415 1.414a1 1 0 01-1.415 1.414l-1.414-1.414a1 1 0 010-1.414zM16.95 7.05a1 1 0 011.414-1.414l1.415 1.414a1 1 0 01-1.415 1.414L16.95 7.05zM5.636 18.364a1 1 0 011.414-1.414l1.415 1.414a1 1 0 01-1.415 1.414l-1.414-1.414z"/>
        </svg>
      );
    case 'Thunderstorm':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10l-3 6h4l-3 6" />
        </svg>
      );
    case 'Mist':
    case 'Fog':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8h18M3 12h18M3 16h18" />
        </svg>
      );
    default:
      return weather.clouds >= 50 ? (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      ) : (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 17.5a5.5 5.5 0 100-11 5.5 5.5 0 000 11zM12 2a1 1 0 011 1v2a1 1 0 01-2 0V3a1 1 0 011-1zM3 12a1 1 0 011-1h2a1 1 0 010 2H4a1 1 0 01-1-1zM18 12a1 1 0 011-1h2a1 1 0 010 2h-2a1 1 0 01-1-1zM12 18a1 1 0 011 1v2a1 1 0 01-2 0v-2a1 1 0 011-1z"/>
        </svg>
      );
  }
}

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
          hasDetailedWeatherData: !!data.weatherData?.[0]?.detailedWeatherData,
          hasDaily: !!data.weatherData?.[0]?.detailedWeatherData?.daily,
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
  // Debug each weatherData item
  console.log('[WeatherWidget] Raw weatherData items:', weatherData.map((w, idx) => ({
    index: idx,
    hasDetailed: !!w.detailedWeatherData,
    hasDaily: !!w.detailedWeatherData?.daily,
    dailyLength: w.detailedWeatherData?.daily?.length || 0,
    dailyDates: w.detailedWeatherData?.daily?.map(d => d.date) || [],
  })));
  
  // LiteAPI bug: Returns 7 weatherData items but only the first has data
  // Use only the first item which contains the actual weather data
  const firstWeatherData = weatherData.find(w => w.detailedWeatherData?.daily?.length > 0);
  const dailyData = firstWeatherData?.detailedWeatherData?.daily || [];
  
  console.log('[WeatherWidget] Extracted daily data:', {
    weatherDataCount: weatherData.length,
    foundValidData: !!firstWeatherData,
    dailyDataCount: dailyData.length,
    allDates: dailyData.map(d => d.date),
  });
  
  // If we still don't have enough days, log the issue
  if (dailyData.length < 7) {
    console.warn('[WeatherWidget] Expected 7+ days of weather data but got:', dailyData.length);
  }

  // Handle short stays (1-3 days) differently
  const isShortStay = dailyData.length <= 3;

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-4 shadow-sm">
        <h3 className="text-base font-bold text-sky-900 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
          {title}
        </h3>
        {dailyData.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
            {dailyData.slice(0, 7).map((weather, index) => {
              try {
                const date = new Date(weather.date);
                const description = getWeatherDescription(weather);
                
                return (
                  <div key={`${weather.date}-${index}`} className="text-center bg-white rounded-lg p-3 border border-sky-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-xs font-bold text-sky-700 mb-2">
                      {format(date, 'EEE')}
                    </div>
                    <div className="text-[10px] text-neutral-600 mb-2">
                      {format(date, 'MMM d')}
                    </div>
                    <div className="mb-2 flex justify-center">
                      <WeatherIcon weather={weather} className="w-10 h-10" />
                    </div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <div className="text-lg font-bold text-neutral-900">
                        {Math.round(weather.temp?.max || 0)}°
                      </div>
                      <div className="text-xs text-neutral-500">
                        {Math.round(weather.temp?.min || 0)}°
                      </div>
                    </div>
                    {(weather.pop || 0) >= 0.3 && (
                      <div className="text-[10px] text-sky-600 flex items-center justify-center gap-0.5">
                        💧 {Math.round((weather.pop || 0) * 100)}%
                      </div>
                    )}
                  </div>
                );
              } catch (err) {
                console.error('[WeatherWidget] Error rendering day:', weather, err);
                return null;
              }
            })}
          </div>
        ) : (
          <p className="text-sm text-neutral-600">Weather data unavailable</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-2xl p-8 shadow-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-sky-600 flex items-center justify-center shadow-md">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-neutral-900">{title}</h3>
      </div>
      <div className={`grid gap-4 ${
        isShortStay 
          ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' 
          : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7'
      }`}>
        {dailyData.map((weather) => {
          const description = getWeatherDescription(weather);
          const date = new Date(weather.date);
          
          return (
            <div key={weather.date} className={`bg-white rounded-xl ${isShortStay ? 'p-6' : 'p-4'} text-center shadow-md hover:shadow-lg transition-shadow border border-neutral-100`}>
              <div className={`${isShortStay ? 'text-base' : 'text-sm'} font-bold text-neutral-700 mb-3`}>
                {format(date, isShortStay ? 'EEEE, MMM d' : 'EEE, MMM d')}
              </div>
              <div className="mb-3 flex justify-center">
                <WeatherIcon weather={weather} className={isShortStay ? 'w-16 h-16' : 'w-12 h-12'} />
              </div>
              <div className={`${isShortStay ? 'text-sm' : 'text-xs'} text-neutral-600 mb-3 capitalize`}>{description}</div>
              <div className="flex justify-center items-center gap-2 mb-3">
                <span className={`${isShortStay ? 'text-2xl' : 'text-xl'} font-bold text-neutral-900`}>
                  {Math.round(weather.temp.max)}°
                </span>
                <span className={`${isShortStay ? 'text-base' : 'text-sm'} text-neutral-500`}>
                  {Math.round(weather.temp.min)}°
                </span>
              </div>
              <div className="space-y-1">
                {(weather.pop || 0) >= 0.3 && (
                  <div className={`${isShortStay ? 'text-sm' : 'text-xs'} text-sky-600 flex items-center justify-center gap-1`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    {Math.round((weather.pop || 0) * 100)}% precip
                  </div>
                )}
                {(weather.wind_speed || 0) >= 15 && (
                  <div className={`${isShortStay ? 'text-sm' : 'text-xs'} text-neutral-500 flex items-center justify-center gap-1`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    Wind {Math.round(weather.wind_speed || 0)} mph
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

