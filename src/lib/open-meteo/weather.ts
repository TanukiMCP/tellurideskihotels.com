// Open-Meteo Weather API - Free, no API key required
// https://open-meteo.com/

const TELLURIDE_COORDS = {
  latitude: 37.9375,
  longitude: -107.8123,
};

export interface OpenMeteoResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
    precipitation_probability_max: number[];
    windspeed_10m_max: number[];
    precipitation_sum: number[];
  };
  current_weather?: {
    temperature: number;
    windspeed: number;
    weathercode: number;
    time: string;
  };
}

export interface WeatherDay {
  date: string;
  temp: {
    max: number;
    min: number;
    day: number;
  };
  weatherCode: number;
  precipProbability: number;
  windSpeed: number;
  precipitation: number;
}

// WMO Weather interpretation codes
// https://open-meteo.com/en/docs
export function getWeatherIcon(code: number): string {
  if (code === 0) return '☀️'; // Clear sky
  if (code <= 3) return '⛅'; // Partly cloudy
  if (code <= 48) return '🌫️'; // Fog
  if (code <= 67) return '🌧️'; // Rain
  if (code <= 77) return '❄️'; // Snow
  if (code <= 82) return '🌧️'; // Rain showers
  if (code <= 86) return '❄️'; // Snow showers
  if (code <= 99) return '⛈️'; // Thunderstorm
  return '☁️';
}

export function getWeatherDescription(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code <= 48) return 'Foggy';
  if (code === 51 || code === 53 || code === 55) return 'Drizzle';
  if (code === 61 || code === 63 || code === 65) return 'Rain';
  if (code === 71 || code === 73 || code === 75) return 'Snow';
  if (code === 77) return 'Snow grains';
  if (code === 80 || code === 81 || code === 82) return 'Rain showers';
  if (code === 85 || code === 86) return 'Snow showers';
  if (code === 95) return 'Thunderstorm';
  if (code === 96 || code === 99) return 'Thunderstorm with hail';
  return 'Partly cloudy';
}

export function isSnowConditions(code: number, precipitation: number): boolean {
  // Snow codes: 71-77, 85-86
  const isSnowCode = (code >= 71 && code <= 77) || (code >= 85 && code <= 86);
  return isSnowCode || precipitation > 0.1;
}

export async function getWeather(days: number = 10): Promise<WeatherDay[]> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', TELLURIDE_COORDS.latitude.toString());
  url.searchParams.set('longitude', TELLURIDE_COORDS.longitude.toString());
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max,windspeed_10m_max,precipitation_sum');
  url.searchParams.set('temperature_unit', 'fahrenheit');
  url.searchParams.set('windspeed_unit', 'mph');
  url.searchParams.set('precipitation_unit', 'inch');
  url.searchParams.set('timezone', 'America/Denver');
  url.searchParams.set('forecast_days', Math.min(days, 16).toString()); // Max 16 days

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status}`);
  }

  const data: OpenMeteoResponse = await response.json();

  // Transform to our format
  const weatherDays: WeatherDay[] = [];
  for (let i = 0; i < data.daily.time.length; i++) {
    const maxTemp = data.daily.temperature_2m_max[i];
    const minTemp = data.daily.temperature_2m_min[i];
    
    weatherDays.push({
      date: data.daily.time[i],
      temp: {
        max: maxTemp,
        min: minTemp,
        day: (maxTemp + minTemp) / 2, // Average for "current" temp
      },
      weatherCode: data.daily.weathercode[i],
      precipProbability: data.daily.precipitation_probability_max[i] / 100, // Convert to 0-1
      windSpeed: data.daily.windspeed_10m_max[i],
      precipitation: data.daily.precipitation_sum[i],
    });
  }

  return weatherDays;
}

