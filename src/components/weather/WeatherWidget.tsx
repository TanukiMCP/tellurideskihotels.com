import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Cloud, CloudRain, CloudSnow, CloudFog, Sun, CloudSun, CloudDrizzle, CloudLightning, Droplets, Wind } from 'lucide-react';
import type { WeatherDay } from '@/lib/open-meteo/weather';
import { getWeatherIconType, getWeatherDescription } from '@/lib/open-meteo/weather';

interface WeatherWidgetProps {
  startDate: string;
  endDate: string;
  title?: string;
  compact?: boolean;
}

function WeatherIcon({ code, className = "w-12 h-12" }: { code: number; className?: string }) {
  const type = getWeatherIconType(code);
  const iconClass = `${className} text-primary-600`;
  
  switch (type) {
    case 'clear':
      return <Sun className={iconClass} />;
    case 'partly-cloudy':
      return <CloudSun className={iconClass} />;
    case 'cloudy':
      return <Cloud className={iconClass} />;
    case 'fog':
      return <CloudFog className={iconClass} />;
    case 'rain':
      return code <= 55 ? <CloudDrizzle className={iconClass} /> : <CloudRain className={iconClass} />;
    case 'snow':
      return <CloudSnow className={iconClass} />;
    case 'thunderstorm':
      return <CloudLightning className={iconClass} />;
    default:
      return <Cloud className={iconClass} />;
  }
}

export function WeatherWidget({ startDate, endDate, title = 'Weather Forecast', compact = false }: WeatherWidgetProps) {
  const [weatherData, setWeatherData] = useState<WeatherDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        console.log('[WeatherWidget] Fetching weather from Open-Meteo:', { startDate, endDate });
        
        // Pass date parameters to API
        const url = new URL('/api/weather/open-meteo', window.location.origin);
        url.searchParams.set('startDate', startDate);
        url.searchParams.set('endDate', endDate);
        
        const response = await fetch(url.toString());
        
        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[WeatherWidget] Weather data received:', data);
        
        // Filter weather data to only show dates in the user's stay range
        const filteredData = (data.weatherData || []).filter((day: WeatherDay) => {
          return day.date >= startDate && day.date <= endDate;
        });
        
        console.log('[WeatherWidget] Filtered weather for stay dates:', {
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
      <div className="bg-gradient-to-br from-primary-50 to-emerald-50 border border-primary-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-center gap-2 py-6">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
          <span className="text-neutral-900 font-medium text-sm">Loading weather...</span>
        </div>
      </div>
    );
  }

  if (error || !weatherData.length) {
    return (
      <div className="bg-gradient-to-br from-primary-50 to-emerald-50 border border-primary-200 rounded-xl p-4 shadow-sm">
        <h3 className="text-base font-bold text-neutral-900 mb-2 flex items-center gap-2">
          <Cloud className="w-5 h-5 text-primary-600" />
          {title}
        </h3>
        <p className="text-sm text-neutral-600">Weather data unavailable</p>
      </div>
    );
  }

  const isShortStay = weatherData.length <= 3;

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-primary-50 to-emerald-50 border border-primary-200 rounded-xl p-4 shadow-sm">
        <h3 className="text-base font-bold text-neutral-900 mb-3 flex items-center gap-2">
          <Cloud className="w-5 h-5 text-primary-600" />
          {title}
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
          {weatherData.slice(0, 7).map((weather) => {
            const date = parseISO(weather.date);
            
            return (
              <div key={weather.date} className="text-center bg-white rounded-lg p-3 border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-xs font-bold text-primary-700 mb-2">
                  {format(date, 'EEE')}
                </div>
                <div className="text-[10px] text-neutral-600 mb-2">
                  {format(date, 'MMM d')}
                </div>
                <div className="mb-2 flex justify-center">
                  <WeatherIcon code={weather.weatherCode} className="w-8 h-8" />
                </div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="text-lg font-bold text-neutral-900">
                    {Math.round(weather.temp.max)}°
                  </div>
                  <div className="text-xs text-neutral-500">
                    {Math.round(weather.temp.min)}°
                  </div>
                </div>
                {weather.precipProbability >= 0.3 && (
                  <div className="text-[10px] text-primary-600 flex items-center justify-center gap-0.5">
                    <Droplets className="w-3 h-3" />
                    {Math.round(weather.precipProbability * 100)}%
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
    <div className="bg-gradient-to-br from-primary-50 to-emerald-50 border border-primary-200 rounded-3xl p-6 lg:p-8 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
          <Cloud className="w-8 h-8 text-primary-600" />
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
          const date = parseISO(weather.date);
          
          return (
            <div key={weather.date} className={`bg-white rounded-xl ${isShortStay ? 'p-6' : 'p-4'} text-center shadow-md hover:shadow-lg transition-shadow border border-neutral-100`}>
              <div className={`${isShortStay ? 'text-lg' : 'text-sm'} font-bold text-primary-700 mb-2`}>
                {format(date, 'EEEE')}
              </div>
              <div className={`${isShortStay ? 'text-base' : 'text-xs'} text-neutral-600 mb-3`}>
                {format(date, 'MMMM d')}
              </div>
              <div className="mb-3 flex justify-center">
                <WeatherIcon code={weather.weatherCode} className={isShortStay ? 'w-16 h-16' : 'w-12 h-12'} />
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
                {weather.precipProbability >= 0.3 && (
                  <div className="flex items-center justify-center gap-1">
                    <Droplets className="w-4 h-4" />
                    <span>{Math.round(weather.precipProbability * 100)}% chance</span>
                  </div>
                )}
                {weather.precipitation > 0 && (
                  <div className="flex items-center justify-center gap-1">
                    <CloudRain className="w-4 h-4" />
                    <span>{weather.precipitation.toFixed(2)}" precip</span>
                  </div>
                )}
                {weather.windSpeed > 0 && (
                  <div className="flex items-center justify-center gap-1">
                    <Wind className="w-4 h-4" />
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
