import { useEffect, useState } from 'react';
import type { WeatherData } from '@/lib/liteapi/weather';
import { getWeatherIcon, getWeatherDescription, isSnowConditions } from '@/lib/liteapi/weather';
import { format, addDays } from 'date-fns';
import { Calendar, MapPin, Wind, Droplets, Cloud } from 'lucide-react';

interface CurrentConditionsProps {
  checkIn?: string;
  checkOut?: string;
}

export function CurrentConditions({ checkIn, checkOut }: CurrentConditionsProps = {}) {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: string; end: string } | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Use provided dates or default to 2 days out for 10 days
        const nowUTC = new Date();
        let startDate: string;
        let endDate: string;

        if (checkIn && checkOut) {
          // Use provided dates from search widget
          startDate = checkIn;
          endDate = checkOut;
          setSelectedDateRange({ start: checkIn, end: checkOut });
        } else {
          // Default: Start 2 days out, show 10-day forecast
          const twoDaysOut = format(addDays(new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), nowUTC.getUTCDate())), 2), 'yyyy-MM-dd');
          const twelveDaysOut = format(addDays(new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), nowUTC.getUTCDate())), 12), 'yyyy-MM-dd');
          startDate = twoDaysOut;
          endDate = twelveDaysOut;
          setSelectedDateRange({ start: twoDaysOut, end: twelveDaysOut });
        }
        
        console.log('[CurrentConditions] Fetching weather:', { startDate, endDate });
        const response = await fetch(
          `/api/weather/forecast?startDate=${startDate}&endDate=${endDate}&units=imperial`
        );
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('[CurrentConditions] API error:', response.status, errorData);
          throw new Error(`Weather API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[CurrentConditions] Weather data received:', data);
        setWeatherData(data.weatherData || []);
      } catch (err) {
        console.error('[CurrentConditions] Error fetching current conditions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [checkIn, checkOut]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-3xl p-8 lg:p-12">
        <div className="flex items-center justify-center gap-3 py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
          <span className="text-sky-900 font-semibold text-lg">Loading Telluride weather forecast...</span>
        </div>
      </div>
    );
  }

  if (!weatherData.length) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-8 lg:p-12">
        <p className="text-yellow-900 text-center">Weather data unavailable at this time</p>
      </div>
    );
  }

  // Check for detailed weather data structure
  if (!weatherData[0]?.detailedWeatherData?.daily) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-8 lg:p-12">
        <p className="text-red-900 font-semibold mb-2 text-center">Unable to load weather data</p>
      </div>
    );
  }

  // Get all available daily forecasts
  const dailyForecasts = weatherData[0].detailedWeatherData.daily;
  const allDays = dailyForecasts.slice(0, 10);
  
  if (!allDays.length) return null;

  const firstDay = allDays[0];
  const icon = getWeatherIcon(firstDay);
  const description = getWeatherDescription(firstDay);
  
  // Check for snow conditions
  const snowDays = allDays.filter(w => isSnowConditions(w));
  const hasSnow = snowDays.length > 0;

  const handleSearchHotels = () => {
    if (selectedDateRange) {
      const params = new URLSearchParams({
        location: 'Telluride',
        checkIn: selectedDateRange.start,
        checkOut: selectedDateRange.end,
        adults: '2',
      });
      window.location.href = `/lodging?${params.toString()}`;
    } else {
      window.location.href = '/lodging';
    }
  };

  return (
    <div className="space-y-8">
      {/* Main Hero Card */}
      <div className={`relative overflow-hidden rounded-2xl shadow-xl ${hasSnow ? 'bg-gradient-to-br from-blue-600 to-blue-400' : 'bg-gradient-to-br from-sky-500 to-blue-500'}`}>
        <div className="relative z-10 p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-white/90 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">Telluride, Colorado</span>
              </div>
              {selectedDateRange && (
                <div className="text-white/80 text-xs">
                  {format(new Date(selectedDateRange.start), 'MMM d')} - {format(new Date(selectedDateRange.end), 'MMM d, yyyy')}
                </div>
              )}
            </div>
            {hasSnow && (
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                <span className="text-lg">❄️</span>
                <span className="text-white text-sm font-semibold">{snowDays.length} Snow Days</span>
              </div>
            )}
          </div>

          {/* Current Conditions */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-6xl lg:text-7xl font-bold text-white">{Math.round(firstDay.temp.day)}°</span>
                <span className="text-3xl text-white/70">F</span>
              </div>
              <p className="text-lg text-white/90 mb-3">{description}</p>
              <div className="flex items-center gap-4 text-sm text-white/80">
                <span>H: {Math.round(firstDay.temp.max)}°</span>
                <span>L: {Math.round(firstDay.temp.min)}°</span>
                {firstDay.wind_speed && firstDay.wind_speed > 5 && (
                  <span className="flex items-center gap-1">
                    <Wind className="w-3 h-3" />
                    {Math.round(firstDay.wind_speed)} mph
                  </span>
                )}
                {firstDay.pop && firstDay.pop >= 0.3 && (
                  <span className="flex items-center gap-1">
                    <Droplets className="w-3 h-3" />
                    {Math.round(firstDay.pop * 100)}%
                  </span>
                )}
              </div>
            </div>
            <div className="text-8xl lg:text-9xl">{icon}</div>
          </div>
        </div>

        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
      </div>

      {/* 10-Day Forecast */}
      <div>
        <h3 className="text-xl font-bold text-neutral-900 mb-4">10-Day Forecast</h3>
        <div className="grid grid-cols-5 lg:grid-cols-10 gap-2 lg:gap-3">
          {allDays.map((weather, index) => {
            const weatherIcon = getWeatherIcon(weather);
            const date = new Date(weather.date);
            const isSnowDay = isSnowConditions(weather);
            const showPrecip = weather.pop && weather.pop >= 0.3;
            
            return (
              <div 
                key={weather.date} 
                className={`relative p-3 lg:p-4 rounded-xl text-center transition-all ${
                  index === 0
                    ? 'bg-sky-500 text-white ring-2 ring-sky-400 shadow-lg' 
                    : isSnowDay 
                    ? 'bg-blue-50 hover:bg-blue-100 border border-blue-200' 
                    : 'bg-neutral-50 hover:bg-neutral-100 border border-neutral-200'
                }`}
              >
                <div className={`text-xs font-semibold mb-1 ${index === 0 ? 'text-white' : 'text-neutral-600'}`}>
                  {format(date, 'EEE')}
                </div>
                <div className={`text-xs mb-2 ${index === 0 ? 'text-white/80' : 'text-neutral-500'}`}>
                  {format(date, 'MMM d')}
                </div>
                <div className="text-3xl lg:text-4xl mb-2">{weatherIcon}</div>
                <div className="space-y-0.5">
                  <div className={`text-base lg:text-lg font-bold ${index === 0 ? 'text-white' : 'text-neutral-900'}`}>
                    {Math.round(weather.temp.max)}°
                  </div>
                  <div className={`text-xs ${index === 0 ? 'text-white/70' : 'text-neutral-500'}`}>
                    {Math.round(weather.temp.min)}°
                  </div>
                </div>
                {showPrecip && (
                  <div className={`text-xs mt-1 flex items-center justify-center gap-0.5 ${index === 0 ? 'text-white/80' : 'text-sky-600'}`}>
                    <Droplets className="w-3 h-3" />
                    <span>{Math.round(weather.pop * 100)}%</span>
                  </div>
                )}
                {isSnowDay && index !== 0 && (
                  <div className="absolute -top-1 -right-1 text-sm">❄️</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Call to Action */}
      <button
        onClick={handleSearchHotels}
        className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
      >
        <Calendar className="w-5 h-5" />
        {selectedDateRange ? 'Book Hotels for These Dates' : 'Search Available Hotels'}
      </button>
    </div>
  );
}

