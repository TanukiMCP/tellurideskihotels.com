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
        const today = format(new Date(), 'yyyy-MM-dd');
        const threeDaysOut = format(addDays(new Date(), 3), 'yyyy-MM-dd');
        
        console.log('[CurrentConditions] Fetching weather:', { today, threeDaysOut });
        const response = await fetch(
          `/api/weather/forecast?startDate=${today}&endDate=${threeDaysOut}&units=imperial`
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
          hasDetailedWeatherData: !!data.weatherData?.[0]?.detailedWeatherData,
          hasDaily: !!data.weatherData?.[0]?.detailedWeatherData?.daily,
          dailyLength: data.weatherData?.[0]?.detailedWeatherData?.daily?.length,
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

  if (loading) {
    console.log('[CurrentConditions] Still loading...');
    return null;
  }

  if (!weatherData.length) {
    console.warn('[CurrentConditions] No weather data available');
    return null;
  }

  if (!weatherData[0]?.detailedWeatherData?.daily) {
    console.warn('[CurrentConditions] Weather data structure invalid:', {
      hasWeatherData: !!weatherData[0],
      hasDetailedWeatherData: !!weatherData[0]?.detailedWeatherData,
      hasDaily: !!weatherData[0]?.detailedWeatherData?.daily,
      weatherData: weatherData[0],
    });
    return null;
  }

  const dailyData = weatherData[0].detailedWeatherData.daily;
  const today = dailyData[0];
  const upcoming = dailyData.slice(1, 4);
  
  if (!today) return null;

  const icon = getWeatherIcon(today);
  const description = getWeatherDescription(today);
  const hasSnow = isSnowConditions(today);

  return (
    <div className={`${hasSnow ? 'bg-gradient-to-br from-blue-600 to-sky-500' : 'bg-gradient-to-br from-sky-500 to-blue-400'} rounded-2xl p-6 text-white shadow-card`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white/90 mb-1">Current Telluride Conditions</h3>
          <p className="text-3xl font-bold">{Math.round(today.temp.day)}°F</p>
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
              <div className="text-sm font-semibold">{Math.round(weather.temp.max)}°</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

