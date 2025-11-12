import { useEffect, useState } from 'react';
import type { WeatherDay } from '@/lib/open-meteo/weather';
import { getWeatherDescription, isSnowConditions } from '@/lib/open-meteo/weather';
import { format } from 'date-fns';
import { Calendar, MapPin, Wind, Droplets, CloudSnow, Sun, CloudSun, Cloud, CloudFog, CloudRain, CloudDrizzle, CloudLightning } from 'lucide-react';

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
  const description = getWeatherDescription(firstDay.weatherCode);
  
  // Check for snow conditions
  const snowDays = allDays.filter(w => isSnowConditions(w.weatherCode, w.precipitation));
  const hasSnow = snowDays.length > 0;
  
  // Get weather icon component
  const getWeatherIcon = (code: number, className: string = "w-12 h-12") => {
    if (code === 0) return <Sun className={className} />;
    if (code <= 3) return <CloudSun className={className} />;
    if (code <= 48) return <CloudFog className={className} />;
    if (code <= 55) return <CloudDrizzle className={className} />;
    if (code <= 67) return <CloudRain className={className} />;
    if (code <= 77 || (code >= 85 && code <= 86)) return <CloudSnow className={className} />;
    if (code <= 82) return <CloudRain className={className} />;
    if (code <= 99) return <CloudLightning className={className} />;
    return <Cloud className={className} />;
  };

  const handleSearchHotels = () => {
    if (selectedDateRange) {
      const params = new URLSearchParams({
        location: 'Telluride',
        checkIn: selectedDateRange.start,
        checkOut: selectedDateRange.end,
        adults: '2',
      });
      window.location.href = `/places-to-stay?${params.toString()}`;
    } else {
      window.location.href = '/places-to-stay';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-sky-50 to-white p-6 border-b border-neutral-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Telluride, Colorado</h3>
              {selectedDateRange && (
                <p className="text-xs text-neutral-600">
                  {format(new Date(selectedDateRange.start), 'MMM d')} - {format(new Date(selectedDateRange.end), 'MMM d, yyyy')}
                </p>
              )}
            </div>
          </div>
          {hasSnow && (
            <div className="bg-sky-100 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
              <CloudSnow className="w-4 h-4 text-sky-600" />
              <span className="text-sky-900 text-sm font-semibold">{snowDays.length} Snow Days</span>
            </div>
          )}
        </div>

        {/* Current Conditions */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-6xl font-bold text-neutral-900">{Math.round(firstDay.temp.day)}°</span>
              <span className="text-2xl text-neutral-600">F</span>
            </div>
            <p className="text-lg text-neutral-700 mb-3 font-medium">{description}</p>
            <div className="flex items-center gap-4 text-sm text-neutral-600">
              <span className="font-medium">H: {Math.round(firstDay.temp.max)}°</span>
              <span className="font-medium">L: {Math.round(firstDay.temp.min)}°</span>
              {firstDay.windSpeed && firstDay.windSpeed > 5 && (
                <span className="flex items-center gap-1">
                  <Wind className="w-4 h-4" />
                  {Math.round(firstDay.windSpeed)} mph
                </span>
              )}
              {firstDay.precipProbability >= 0.3 && (
                <span className="flex items-center gap-1">
                  <Droplets className="w-4 h-4" />
                  {Math.round(firstDay.precipProbability * 100)}%
                </span>
              )}
            </div>
          </div>
          <div className="text-sky-600">
            {getWeatherIcon(firstDay.weatherCode, "w-24 h-24")}
          </div>
        </div>
      </div>

      {/* 10-Day Forecast */}
      <div className="p-6">
        <h3 className="text-lg font-bold text-neutral-900 mb-4">10-Day Forecast</h3>
        <div className="grid grid-cols-5 lg:grid-cols-10 gap-3">
          {allDays.map((weather, index) => {
            const date = new Date(weather.date);
            const isSnowDay = isSnowConditions(weather.weatherCode, weather.precipitation);
            const showPrecip = weather.precipProbability >= 0.3;
            
            return (
              <div 
                key={weather.date} 
                className={`relative p-3 rounded-xl text-center transition-all ${
                  index === 0
                    ? 'bg-sky-50 border-2 border-sky-200' 
                    : 'bg-neutral-50 border border-neutral-200 hover:border-sky-200 hover:bg-sky-50'
                }`}
              >
                <div className="text-xs font-semibold text-neutral-700 mb-1">
                  {format(date, 'EEE')}
                </div>
                <div className="text-xs text-neutral-500 mb-2">
                  {format(date, 'MMM d')}
                </div>
                <div className="flex justify-center mb-2 text-sky-600">
                  {getWeatherIcon(weather.weatherCode, "w-8 h-8")}
                </div>
                {isSnowDay && (
                  <div className="absolute top-2 right-2">
                    <CloudSnow className="w-3 h-3 text-sky-600" />
                  </div>
                )}
                <div className="space-y-0.5">
                  <div className="text-base font-bold text-neutral-900">
                    {Math.round(weather.temp.max)}°
                  </div>
                  <div className="text-xs text-neutral-500">
                    {Math.round(weather.temp.min)}°
                  </div>
                </div>
                {showPrecip && (
                  <div className="text-xs mt-1 flex items-center justify-center gap-0.5 text-sky-600">
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
      <div className="p-6 bg-neutral-50 border-t border-neutral-200">
        <button
          onClick={handleSearchHotels}
          className="w-full bg-primary-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          <Calendar className="w-5 h-5" />
          {selectedDateRange ? 'Book Hotels for These Dates' : 'Search Available Hotels'}
        </button>
      </div>
    </div>
  );
}

