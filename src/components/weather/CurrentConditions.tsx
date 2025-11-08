import { useEffect, useState } from 'react';
import type { WeatherData } from '@/lib/liteapi/weather';
import { getWeatherIcon, getWeatherDescription, isSnowConditions } from '@/lib/liteapi/weather';
import { format, addDays } from 'date-fns';

export function CurrentConditions() {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Use UTC dates to match server timezone (liteAPI server is in UTC)
        // This ensures "today" from the server's perspective
        const now = new Date();
        const todayUTC = format(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())), 'yyyy-MM-dd');
        const threeDaysOutUTC = format(addDays(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())), 3), 'yyyy-MM-dd');
        
        console.log('[CurrentConditions] Fetching weather:', { today: todayUTC, threeDaysOut: threeDaysOutUTC });
        const response = await fetch(
          `/api/weather/forecast?startDate=${todayUTC}&endDate=${threeDaysOutUTC}&units=imperial`
        );
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('[CurrentConditions] API error:', response.status, errorData);
          throw new Error(`Weather API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[CurrentConditions] Weather data received:', data);
        console.log('[CurrentConditions] Data structure:', {
          hasWeatherData: !!data.weatherData,
          weatherDataLength: data.weatherData?.length,
          firstItem: data.weatherData?.[0],
          hasDailyWeather: !!data.weatherData?.[0]?.dailyWeather,
        });
        setWeatherData(data.weatherData || []);
      } catch (err) {
        console.error('[CurrentConditions] Error fetching current conditions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  // TEMPORARY: Show loading state instead of hiding
  if (loading) {
    console.log('[CurrentConditions] Still loading...');
    return (
      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-600"></div>
          <span className="text-sky-900 font-semibold">Loading Telluride weather...</span>
        </div>
      </div>
    );
  }

  // TEMPORARY: Show error instead of hiding
  if (!weatherData.length) {
    console.warn('[CurrentConditions] No weather data available');
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
        <p className="text-yellow-900">Weather data unavailable</p>
      </div>
    );
  }

  // TEMPORARY: Show detailed error
  if (!weatherData[0]?.dailyWeather) {
    console.warn('[CurrentConditions] Weather data structure invalid:', {
      hasWeatherData: !!weatherData[0],
      hasDailyWeather: !!weatherData[0]?.dailyWeather,
      weatherData: weatherData[0],
    });
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <p className="text-red-900 font-semibold mb-2">Weather Data Structure Error</p>
        <pre className="text-xs text-red-700 overflow-auto">{JSON.stringify(weatherData[0], null, 2)}</pre>
      </div>
    );
  }

  // Get today and next 3 days from the array
  const today = weatherData[0].dailyWeather;
  const upcoming = weatherData.slice(1, 4).map(w => w.dailyWeather);
  
  if (!today) return null;

  const icon = getWeatherIcon(today);
  const description = getWeatherDescription(today);
  const hasSnow = isSnowConditions(today);

  return (
    <div className={`${hasSnow ? 'bg-gradient-to-br from-blue-600 to-sky-500' : 'bg-gradient-to-br from-sky-500 to-blue-400'} rounded-2xl p-6 text-white shadow-card`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white/90 mb-1">Current Telluride Conditions</h3>
          <p className="text-3xl font-bold">{Math.round(today.temperature.afternoon)}°F</p>
        </div>
        <div className="text-6xl">{icon}</div>
      </div>
      
      <p className="text-lg text-white/90 mb-4">{description}</p>
      
      {hasSnow && (
        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 mb-4 inline-block">
          <span className="text-sm font-semibold">❄️ Fresh Snow Expected!</span>
        </div>
      )}
      
      <div className="flex gap-3 pt-4 border-t border-white/20">
        {upcoming.map((weather) => {
          const weatherIcon = getWeatherIcon(weather);
          const date = new Date(weather.date);
          
          return (
            <div key={weather.date} className="flex-1 text-center">
              <div className="text-xs text-white/80 mb-1">{format(date, 'EEE')}</div>
              <div className="text-2xl mb-1">{weatherIcon}</div>
              <div className="text-sm font-semibold">{Math.round(weather.temperature.max)}°</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

