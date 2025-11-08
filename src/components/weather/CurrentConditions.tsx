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

  // Get all available daily forecasts (up to 10 days)
  const dailyForecasts = weatherData[0].detailedWeatherData.daily;
  const today = dailyForecasts[0];
  const upcoming = dailyForecasts.slice(1, 10); // Show up to 10 days total
  
  if (!today) return null;

  const icon = getWeatherIcon(today);
  const description = getWeatherDescription(today);
  const hasSnow = isSnowConditions(today);
  
  // Check if any upcoming days have snow
  const hasUpcomingSnow = upcoming.some(w => isSnowConditions(w));
  const snowDays = upcoming.filter(w => isSnowConditions(w)).length;

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
    <div className="space-y-6">
      {/* Main Weather Card */}
      <div className={`${hasSnow ? 'bg-gradient-to-br from-blue-600 via-blue-500 to-sky-500' : 'bg-gradient-to-br from-sky-500 via-blue-400 to-blue-500'} rounded-3xl p-8 lg:p-12 text-white shadow-elevated`}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-white/80" />
              <h2 className="text-xl font-bold text-white">Telluride Weather Forecast</h2>
            </div>
            {selectedDateRange && (
              <div className="flex items-center gap-2 text-white/80 text-sm mb-4">
                <Calendar className="w-4 h-4" />
                <span>
                  {format(new Date(selectedDateRange.start), 'MMM d')} - {format(new Date(selectedDateRange.end), 'MMM d, yyyy')}
                </span>
              </div>
            )}
            <div className="flex items-baseline gap-3 mb-2">
              <p className="text-5xl lg:text-6xl font-bold">{Math.round(today.temp.day)}°F</p>
              <div className="text-7xl lg:text-8xl">{icon}</div>
            </div>
            <p className="text-xl text-white/90 mb-4">{description}</p>
            
            {/* Weather Stats */}
            <div className="flex flex-wrap gap-4 text-sm text-white/80 mb-6">
              <div className="flex items-center gap-1.5">
                <Droplets className="w-4 h-4" />
                <span>High: {Math.round(today.temp.max)}°</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>Low: {Math.round(today.temp.min)}°</span>
              </div>
              {today.pop && today.pop > 0 && (
                <div className="flex items-center gap-1.5">
                  <Cloud className="w-4 h-4" />
                  <span>{Math.round(today.pop * 100)}% precip</span>
                </div>
              )}
              {today.wind_speed && (
                <div className="flex items-center gap-1.5">
                  <Wind className="w-4 h-4" />
                  <span>{Math.round(today.wind_speed)} mph</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Snow Alert */}
        {(hasSnow || hasUpcomingSnow) && (
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">❄️</span>
              <div>
                <span className="font-semibold block">Fresh Snow Expected!</span>
                {snowDays > 0 && (
                  <span className="text-sm text-white/90">{snowDays} day{snowDays !== 1 ? 's' : ''} with snow in forecast</span>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Call to Action */}
        <button
          onClick={handleSearchHotels}
          className="w-full bg-white text-sky-600 font-bold py-4 px-6 rounded-xl hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <Calendar className="w-5 h-5" />
          {selectedDateRange ? 'Book Hotels for These Dates' : 'Search Hotels'}
        </button>
      </div>

      {/* Extended Forecast */}
      <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-card border border-neutral-200">
        <h3 className="text-2xl font-bold text-neutral-900 mb-6">10-Day Forecast</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-4">
          {[today, ...upcoming].slice(0, 10).map((weather) => {
            const weatherIcon = getWeatherIcon(weather);
            const date = new Date(weather.date);
            const isSnowDay = isSnowConditions(weather);
            const isToday = weather === today;
            
            return (
              <div 
                key={weather.date} 
                className={`text-center p-4 rounded-xl border-2 transition-all ${
                  isToday 
                    ? 'bg-sky-50 border-sky-300 shadow-md' 
                    : isSnowDay 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className={`text-xs font-semibold mb-2 ${isToday ? 'text-sky-700' : 'text-neutral-600'}`}>
                  {isToday ? 'Today' : format(date, 'EEE')}
                </div>
                <div className="text-xs text-neutral-500 mb-2">{format(date, 'MMM d')}</div>
                <div className="text-4xl mb-2">{weatherIcon}</div>
                {isSnowDay && (
                  <div className="text-xs text-blue-600 font-semibold mb-1">❄️ Snow</div>
                )}
                <div className="space-y-1">
                  <div className="text-lg font-bold text-neutral-900">
                    {Math.round(weather.temp.max)}°
                  </div>
                  <div className="text-sm text-neutral-500">
                    {Math.round(weather.temp.min)}°
                  </div>
                </div>
                {weather.pop && weather.pop >= 0.3 && (
                  <div className="text-xs text-sky-600 mt-1">
                    {Math.round(weather.pop * 100)}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

