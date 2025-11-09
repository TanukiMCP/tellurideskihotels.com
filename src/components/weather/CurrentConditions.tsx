import { useEffect, useState } from 'react';
import type { WeatherDay } from '@/lib/open-meteo/weather';
import { getWeatherIcon, getWeatherDescription, isSnowConditions } from '@/lib/open-meteo/weather';
import { format } from 'date-fns';
import { Calendar, MapPin, Wind, Droplets } from 'lucide-react';

interface CurrentConditionsProps {
  checkIn?: string;
  checkOut?: string;
}

export function CurrentConditions({ checkIn, checkOut }: CurrentConditionsProps = {}) {
  const [weatherData, setWeatherData] = useState<WeatherDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: string; end: string } | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        console.log('[CurrentConditions] Fetching weather from Open-Meteo');
        const response = await fetch('/api/weather/open-meteo');
        
        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[CurrentConditions] Weather data received:', data);
        setWeatherData(data.weatherData || []);
        
        // Set date range for booking button
        if (checkIn && checkOut) {
          setSelectedDateRange({ start: checkIn, end: checkOut });
        } else if (data.weatherData && data.weatherData.length >= 2) {
          // Default: first day to last day of forecast
          setSelectedDateRange({ 
            start: data.weatherData[0].date, 
            end: data.weatherData[data.weatherData.length - 1].date 
          });
        }
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
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 lg:p-12">
        <p className="text-yellow-900 text-center">Weather data unavailable at this time</p>
      </div>
    );
  }

  const allDays = weatherData.slice(0, 10);
  const firstDay = allDays[0];
  const icon = getWeatherIcon(firstDay.weatherCode);
  const description = getWeatherDescription(firstDay.weatherCode);
  
  // Check for snow conditions
  const snowDays = allDays.filter(w => isSnowConditions(w.weatherCode, w.precipitation));
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
    <div className={`relative overflow-hidden rounded-2xl shadow-xl ${hasSnow ? 'bg-gradient-to-br from-blue-600 to-blue-400' : 'bg-gradient-to-br from-sky-500 to-blue-500'}`}>
      {/* Header */}
      <div className="relative z-10 p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
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
              {firstDay.windSpeed && firstDay.windSpeed > 5 && (
                <span className="flex items-center gap-1">
                  <Wind className="w-3 h-3" />
                  {Math.round(firstDay.windSpeed)} mph
                </span>
              )}
              {firstDay.precipProbability >= 0.3 && (
                <span className="flex items-center gap-1">
                  <Droplets className="w-3 h-3" />
                  {Math.round(firstDay.precipProbability * 100)}%
                </span>
              )}
            </div>
          </div>
          <div className="text-8xl lg:text-9xl">{icon}</div>
        </div>

        {/* 10-Day Forecast */}
        <div className="border-t border-white/20 pt-6">
          <h3 className="text-lg font-semibold text-white mb-4">10-Day Forecast</h3>
          <div className="grid grid-cols-5 lg:grid-cols-10 gap-2 lg:gap-3">
            {allDays.map((weather, index) => {
              const weatherIcon = getWeatherIcon(weather.weatherCode);
              const date = new Date(weather.date);
              const isSnowDay = isSnowConditions(weather.weatherCode, weather.precipitation);
              const showPrecip = weather.precipProbability >= 0.3;
              
              return (
                <div 
                  key={weather.date} 
                  className={`relative p-3 rounded-lg text-center transition-all ${
                    index === 0
                      ? 'bg-white/25 backdrop-blur-sm ring-1 ring-white/40' 
                      : 'bg-white/10 backdrop-blur-sm hover:bg-white/20'
                  }`}
                >
                  <div className="text-xs font-medium text-white/90 mb-1">
                    {format(date, 'EEE')}
                  </div>
                  <div className="text-xs text-white/70 mb-2">
                    {format(date, 'MMM d')}
                  </div>
                  <div className="text-3xl mb-2">{weatherIcon}</div>
                  {isSnowDay && (
                    <div className="absolute top-1 right-1 text-sm">❄️</div>
                  )}
                  <div className="space-y-0.5">
                    <div className="text-base font-bold text-white">
                      {Math.round(weather.temp.max)}°
                    </div>
                    <div className="text-xs text-white/70">
                      {Math.round(weather.temp.min)}°
                    </div>
                  </div>
                  {showPrecip && (
                    <div className="text-xs mt-1 flex items-center justify-center gap-0.5 text-white/80">
                      <Droplets className="w-3 h-3" />
                      <span>{Math.round(weather.precipProbability * 100)}%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 pt-6 border-t border-white/20">
          <button
            onClick={handleSearchHotels}
            className="w-full bg-white text-primary-600 font-bold py-4 px-6 rounded-xl hover:bg-white/95 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            {selectedDateRange ? 'Book Hotels for These Dates' : 'Search Available Hotels'}
          </button>
        </div>
      </div>

      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
    </div>
  );
}

