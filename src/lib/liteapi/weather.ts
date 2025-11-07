import { liteAPIClient } from './client';
import { TELLURIDE_CENTER } from '@/lib/mapbox-utils';

// Actual liteAPI weather response structure
export interface DailyWeatherData {
  date: string;
  temp: {
    day: number;
    min: number;
    max: number;
    night: number;
    eve: number;
    morn: number;
  };
  feels_like: {
    day: number;
    night: number;
    eve: number;
    morn: number;
  };
  pressure: number;
  humidity: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number;
  clouds: number;
  pop: number; // Probability of precipitation (0-1)
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  summary?: string;
}

export interface DetailedWeatherData {
  lat: number;
  lon: number;
  timezone: string;
  timezone_offset: number;
  daily: DailyWeatherData[];
}

export interface WeatherData {
  detailedWeatherData: DetailedWeatherData;
}

export interface WeatherResponse {
  weatherData: WeatherData[];
}

export interface WeatherParams {
  latitude?: number;
  longitude?: number;
  startDate: string;
  endDate: string;
  units?: 'metric' | 'imperial';
}

export async function getWeather(params: WeatherParams): Promise<WeatherResponse> {
  const {
    latitude = TELLURIDE_CENTER[1], // 37.9375
    longitude = TELLURIDE_CENTER[0], // -107.8123
    startDate,
    endDate,
    units = 'imperial',
  } = params;

  console.log('[Weather API] Fetching weather:', {
    latitude,
    longitude,
    startDate,
    endDate,
    units,
  });

  const searchParams = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    startDate,
    endDate,
    units,
  });

  const endpoint = `/data/weather?${searchParams.toString()}`;
  console.log('[Weather API] Full endpoint:', endpoint);
  
  const response = await liteAPIClient<WeatherResponse>(endpoint);
  console.log('[Weather API] Response received:', response);
  
  return response;
}

export function isSnowConditions(weather: DailyWeatherData): boolean {
  return weather.temp.max <= 32 && weather.pop >= 0.5;
}

export function getWeatherIcon(weather: DailyWeatherData): string {
  const { pop, clouds, temp } = weather;
  
  if (pop >= 0.5) {
    return temp.max <= 32 ? '❄️' : '🌧️';
  }
  
  if (clouds >= 70) {
    return '☁️';
  }
  
  if (clouds >= 30) {
    return '⛅';
  }
  
  return '☀️';
}

export function getWeatherDescription(weather: DailyWeatherData): string {
  const { pop, clouds, temp } = weather;
  
  if (pop >= 0.5 && temp.max <= 32) {
    return 'Snow expected';
  }
  
  if (pop >= 0.5) {
    return 'Rain expected';
  }
  
  if (clouds >= 70) {
    return 'Cloudy';
  }
  
  if (clouds >= 30) {
    return 'Partly cloudy';
  }
  
  return 'Clear';
}

export function shouldHighlightIndoorAmenities(weatherData: WeatherData[]): boolean {
  if (!weatherData.length || !weatherData[0].detailedWeatherData?.daily) return false;
  
  const daily = weatherData[0].detailedWeatherData.daily;
  const avgPrecipitation = daily.reduce((sum, w) => sum + w.pop, 0) / daily.length;
  const avgCloudCover = daily.reduce((sum, w) => sum + w.clouds, 0) / daily.length;
  
  return avgPrecipitation >= 0.4 || avgCloudCover >= 70;
}

export function shouldHighlightOutdoorAmenities(weatherData: WeatherData[]): boolean {
  if (!weatherData.length || !weatherData[0].detailedWeatherData?.daily) return false;
  
  const daily = weatherData[0].detailedWeatherData.daily;
  const avgPrecipitation = daily.reduce((sum, w) => sum + w.pop, 0) / daily.length;
  const avgCloudCover = daily.reduce((sum, w) => sum + w.clouds, 0) / daily.length;
  
  return avgPrecipitation < 0.3 && avgCloudCover < 50;
}

export function shouldHighlightHeatedAmenities(weatherData: WeatherData[]): boolean {
  if (!weatherData.length || !weatherData[0].detailedWeatherData?.daily) return false;
  
  const daily = weatherData[0].detailedWeatherData.daily;
  const avgMinTemp = daily.reduce((sum, w) => sum + w.temp.min, 0) / daily.length;
  
  return avgMinTemp <= 15;
}

export function getPackingRecommendations(weatherData: WeatherData[]): string[] {
  if (!weatherData.length || !weatherData[0].detailedWeatherData?.daily) return [];
  
  const daily = weatherData[0].detailedWeatherData.daily;
  const recommendations: string[] = [];
  const avgMinTemp = daily.reduce((sum, w) => sum + w.temp.min, 0) / daily.length;
  const avgMaxTemp = daily.reduce((sum, w) => sum + w.temp.max, 0) / daily.length;
  const maxPrecipitation = Math.max(...daily.map(w => w.pop));
  const maxWindSpeed = Math.max(...daily.map(w => w.wind_speed));
  const hasSnow = daily.some(w => isSnowConditions(w));
  
  if (avgMinTemp <= 10) {
    recommendations.push('Pack heavy thermal layers and insulated gear');
  } else if (avgMinTemp <= 25) {
    recommendations.push('Bring warm base layers and mid-weight insulation');
  }
  
  if (maxPrecipitation >= 0.5) {
    recommendations.push('Waterproof outer layers essential');
  }
  
  if (hasSnow) {
    recommendations.push('Quality goggles and face protection recommended');
  }
  
  if (maxWindSpeed >= 20) {
    recommendations.push('Wind-resistant gear and face protection advised');
  }
  
  if (avgMaxTemp >= 35) {
    recommendations.push('Consider lighter layers for afternoon skiing');
  }
  
  return recommendations.slice(0, 5);
}

